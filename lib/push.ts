import webpush from "web-push";

import { prisma } from "@/lib/db";

// Web push: browser notifications that arrive even with no SnackDesk tab open.
// Each send is one HTTPS request to the browser's push service (Google,
// Mozilla, Apple); nothing stays connected, unlike SSE.

export type PushMessage = {
  title: string;
  body: string;
  // page to open when the notification is tapped
  url: string;
  // a newer notification with the same tag replaces the older one
  tag?: string;
};

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const configured = !!publicKey && !!privateKey;

if (configured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "https://snackdesk.shubhamspatil.me",
    publicKey,
    privateKey,
  );
}

// Sends to every browser these users turned notifications on in. Never
// throws: a failed push mustn't fail the action that caused it.
export async function pushToUsers(userIds: string[], message: PushMessage) {
  if (!configured || userIds.length === 0) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: [...new Set(userIds)] } },
  });

  const gone: string[] = [];
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(message),
          { TTL: 60 * 60 },
        );
      } catch (error) {
        // 404 / 410: the browser unsubscribed or the subscription expired
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.push(subscription.id);
        else console.error("[push] send failed", status ?? error);
      }
    }),
  );

  if (gone.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  }
}

// Everyone in an org, or only its members with these roles
export async function pushToOrg(
  organizationId: string,
  message: PushMessage,
  { roles, exceptUserIds = [] }: { roles?: string[]; exceptUserIds?: string[] } = {},
) {
  const members = await prisma.member.findMany({
    where: {
      organizationId,
      ...(roles && { role: { in: roles } }),
      ...(exceptUserIds.length > 0 && { userId: { notIn: exceptUserIds } }),
    },
    select: { userId: true },
  });
  await pushToUsers(
    members.map((member) => member.userId),
    message,
  );
}
