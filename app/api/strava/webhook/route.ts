import { NextResponse, after } from "next/server";

import { prisma } from "@/lib/db";
import { refreshPortfolio } from "@/modules/strava/portfolio";
import {
  checkStillAuthorized,
  refreshActivity,
  removeStravaData,
} from "@/modules/strava/sync";

// Strava's push subscription (one for the whole app). Create it once with:
//   curl -X POST https://www.strava.com/api/v3/push_subscriptions \
//     -F client_id=... -F client_secret=... \
//     -F callback_url=https://<host>/api/strava/webhook \
//     -F verify_token=$STRAVA_WEBHOOK_VERIFY_TOKEN

// Strava checks the callback URL when the subscription is created
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const expected = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

  if (
    params.get("hub.mode") !== "subscribe" ||
    !expected ||
    params.get("hub.verify_token") !== expected
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return NextResponse.json({ "hub.challenge": params.get("hub.challenge") });
}

type WebhookEvent = {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  owner_id: number;
  subscription_id: number;
  updates?: Record<string, string>;
};

// Strava doesn't sign these, so an event is only a hint: we fetch the
// activity (or check the token) from Strava ourselves before changing
// anything. Strava wants a 200 within 2 seconds, so the work runs after.
export async function POST(request: Request) {
  let event: WebhookEvent;
  try {
    event = await request.json();
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const subscriptionId = process.env.STRAVA_WEBHOOK_SUBSCRIPTION_ID;
  if (subscriptionId && String(event.subscription_id) !== subscriptionId) {
    return new NextResponse("Unknown subscription", { status: 403 });
  }

  after(async () => {
    if (typeof event.owner_id !== "number") return;
    const connection = await prisma.stravaConnection.findUnique({
      where: { athleteId: BigInt(event.owner_id) },
      select: { userId: true },
    });
    if (!connection) return;

    if (event.object_type === "activity" && typeof event.object_id === "number") {
      await Promise.all([
        refreshActivity(connection.userId, event.object_id),
        refreshPortfolio(event.owner_id),
      ]);
      return;
    }

    // they removed SnackDesk from their Strava settings
    if (event.object_type === "athlete" && event.updates?.authorized === "false") {
      const stillAuthorized = await checkStillAuthorized(connection.userId);
      if (!stillAuthorized) {
        await removeStravaData(connection.userId);
        await refreshPortfolio(event.owner_id);
      }
    }
  });

  return NextResponse.json({ ok: true });
}
