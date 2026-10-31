import { Client, Pool } from "pg";
import { SnackDeskEvent } from "@/types/sse";

const CHANNEL = "snackdesk_events";
const connectionString = process.env.PG_NOTIFY_URL;

// separate pool only for publishing - not for queries
const notifyPool = new Pool({
  connectionString,
  max: 5,
});

export async function notify(event: SnackDeskEvent) {
  const client = await notifyPool.connect();

  try {
    await client.query("SELECT pg_notify($1, $2)", [
      CHANNEL,
      JSON.stringify(event),
    ]);
  } finally {
    client.release();
  }
}

type Listener = (event: SnackDeskEvent) => void;

const listeners = new Set<Listener>();
let listening: Promise<Client> | null = null;

// One LISTEN connection per server instance, shared by every open SSE
// stream. The first subscriber opens it and the last one to leave closes it.
function startListening(): Promise<Client> {
  if (listening) return listening;

  const client = new Client({ connectionString });

  const ready = (async () => {
    client.on("notification", (msg) => {
      if (!msg.payload) return;
      let event: SnackDeskEvent;
      try {
        event = JSON.parse(msg.payload);
      } catch {
        return; // ignore malformed payloads
      }
      listeners.forEach((listener) => listener(event));
    });

    // dropped connection: forget it so the next subscriber reconnects
    const forget = () => {
      if (listening === ready) listening = null;
    };
    client.on("error", () => {
      forget();
      client.end().catch(() => {});
    });
    client.on("end", forget);

    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
    return client;
  })();

  listening = ready;
  ready.catch(() => {
    if (listening === ready) listening = null;
    client.end().catch(() => {});
  });

  return ready;
}

/** Calls listener for every event; resolves to an unsubscribe function. */
export async function subscribe(listener: Listener): Promise<() => void> {
  listeners.add(listener);

  try {
    await startListening();
  } catch (error) {
    listeners.delete(listener);
    throw error;
  }

  let subscribed = true;
  return () => {
    if (!subscribed) return;
    subscribed = false;
    listeners.delete(listener);

    if (listeners.size > 0 || !listening) return;
    const closing = listening;
    listening = null;
    closing.then((client) => client.end()).catch(() => {});
  };
}
