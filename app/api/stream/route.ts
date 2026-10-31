import { subscribe } from "@/lib/sse/pg-notify";
import { authSession } from "@/actions/user";
import { prisma } from "@/lib/db";

// Always dynamic: it reads the session, and Cache Components runs it on Node.js
export const maxDuration = 300;

const HEARTBEAT_MS = 55 * 1000;
// close before maxDuration so the client reconnects cleanly
const STREAM_LIFETIME_MS = 4 * 60 * 1000;

export async function GET(request: Request) {
  // auth check
  const session = await authSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // get user's org, preferring the session's active org
  const activeOrganizationId = session.session.activeOrganizationId;
  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
      ...(activeOrganizationId ? { organizationId: activeOrganizationId } : {}),
    },
  });

  if (!member) {
    return new Response("No organization found", { status: 403 });
  }

  const orgId = member.organizationId;
  const encoder = new TextEncoder();

  let close = () => {};

  // set up SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let unsubscribe: (() => void) | undefined;
      const timers: {
        heartbeat?: ReturnType<typeof setInterval>;
        lifetime?: ReturnType<typeof setTimeout>;
      } = {};

      // safe to call more than once, from any of the exits below
      close = () => {
        if (closed) return;
        closed = true;
        clearInterval(timers.heartbeat);
        clearTimeout(timers.lifetime);
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      const send = (event: string, data: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        } catch {
          close();
        }
      };

      request.signal.addEventListener("abort", () => close());

      send("connected", `{"status":"ok"}`);

      try {
        unsubscribe = await subscribe((event) => {
          if (event.orgId !== orgId) return; // only this org's events
          send(event.type, JSON.stringify(event.payload));
        });
      } catch {
        close();
        return;
      }

      // client left while we were subscribing
      if (closed) {
        unsubscribe();
        return;
      }

      timers.heartbeat = setInterval(() => send("heartbeat", "{}"), HEARTBEAT_MS);
      timers.lifetime = setTimeout(() => close(), STREAM_LIFETIME_MS);
    },
    cancel() {
      close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
