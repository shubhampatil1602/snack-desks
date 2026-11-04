"use server";

import { nanoid } from "nanoid";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { authIsRequired } from "./user";

// The browser's push subscription, saved when the user turns notifications
// on in this browser and removed when they turn them off

const subscriptionSchema = z.object({
  endpoint: z.url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

export type PushSubscriptionInput = z.infer<typeof subscriptionSchema>;

export async function savePushSubscriptionAction(input: PushSubscriptionInput) {
  const session = await authIsRequired();
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid subscription" };

  const { endpoint, keys } = parsed.data;
  // a browser belongs to whoever signed in on it last
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { id: nanoid(), userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth },
  });
  return { success: true as const };
}

export async function deletePushSubscriptionAction(endpoint: string) {
  const session = await authIsRequired();
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });
  return { success: true as const };
}
