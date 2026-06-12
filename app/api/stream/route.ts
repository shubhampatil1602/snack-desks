import { notifyPool } from "@/lib/sse/pg-notify";
import { authSession } from "@/actions/user";
import { prisma } from "@/lib/db";

export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // auth check
  const session = await authSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // get user's org
  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return new Response("No organization found", { status: 403 });
  }

  const orgId = member.organizationId;
  const encoder = new TextEncoder();

  console.log(`[SSE CONNECTED] user=${session.user.id} org=${orgId}`);

  // set up SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      // send initial connected event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: {"status":"ok"}\n\n`),
      );

      // dedicated pg client for LISTEN
      const pgClient = await notifyPool.connect();

      try {
        await pgClient.query("LISTEN snackdesk_events");

        // forward org-scoped events to this client
        pgClient.on("notification", (msg) => {
          if (!msg.payload) return;
          console.log("RECEIVED", msg.payload);
          try {
            const event = JSON.parse(msg.payload);
            if (event.orgId !== orgId) return; // only this org's events
            controller.enqueue(
              encoder.encode(
                `event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`,
              ),
            );
          } catch {
            // ignore malformed payloads
          }
        });

        // heartbeat every 30s to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(`event: heartbeat\ndata: {}\n\n`),
            );
          } catch {
            clearInterval(heartbeat);
          }
        }, 55000);

        const gracefulClose = setTimeout(
          () => {
            console.log(
              `[SSE GRACEFUL CLOSE] user=${session.user.id} org=${orgId}`,
            );

            try {
              clearInterval(heartbeat);

              pgClient
                .query("UNLISTEN snackdesk_events")
                .finally(() => pgClient.release());

              controller.close();
            } catch {
              // ignore
            }
          },
          4 * 60 * 1000,
        ); // 4 minutes

        // cleanup on client disconnect
        request.signal.addEventListener("abort", () => {
          console.log(
            `[SSE DISCONNECTED] user=${session.user.id} org=${orgId}`,
          );

          clearInterval(heartbeat);
          clearTimeout(gracefulClose);

          pgClient
            .query("UNLISTEN snackdesk_events")
            .finally(() => pgClient.release());
          controller.close();
        });
      } catch {
        pgClient.release();
        controller.close();
      }
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
