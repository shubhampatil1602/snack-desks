import { Pool } from "pg";
import { SnackDeskEvent } from "@/types/sse";

// separate pool only for pub/sub - not for queries
export const notifyPool = new Pool({
  // connectionString: process.env.DATABASE_URL,
  connectionString: process.env.PG_NOTIFY_URL,
  max: 10,
});

export async function notify(event: SnackDeskEvent) {
  console.log("PUBLISHING", event.type);

  const client = await notifyPool.connect();

  try {
    await client.query("SELECT pg_notify($1, $2)", [
      "snackdesk_events",
      JSON.stringify(event),
    ]);
  } finally {
    client.release();
  }
}
