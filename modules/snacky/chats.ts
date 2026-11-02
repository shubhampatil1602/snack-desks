import type { UIMessage } from "ai";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

// chats are deleted 24 hours after they start
export const CHAT_TTL_MS = 24 * 60 * 60 * 1000;

function cutoff() {
  return new Date(Date.now() - CHAT_TTL_MS);
}

type Owner = { userId: string; organizationId: string };

export type SnackyChatSummary = { id: string; title: string; createdAt: Date };

/**
 * Deletes every org's chats that are over 24 hours old. Runs on each Snacky
 * request and page load, so old chats go as soon as anyone uses Snacky, and
 * an expired chat can't be written into again under its old start time.
 */
export async function deleteExpiredSnackyChats() {
  await prisma.snackyChat.deleteMany({ where: { createdAt: { lt: cutoff() } } });
}

/** The admin's chats from the last 24 hours, newest first. */
export async function listSnackyChats(owner: Owner): Promise<SnackyChatSummary[]> {
  await deleteExpiredSnackyChats();
  return prisma.snackyChat.findMany({
    where: { ...owner, createdAt: { gte: cutoff() } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });
}

export async function getSnackyChat(id: string, owner: Owner) {
  const chat = await prisma.snackyChat.findFirst({
    where: { id, ...owner, createdAt: { gte: cutoff() } },
    select: { id: true, title: true, messages: true },
  });
  if (!chat) return null;
  return { ...chat, messages: chat.messages as unknown as UIMessage[] };
}

export async function saveSnackyChat(
  id: string,
  owner: Owner,
  title: string,
  messages: UIMessage[],
) {
  const json = messages as unknown as Prisma.InputJsonValue;
  // the chat id comes from the browser: only ever update one of this admin's
  await prisma.snackyChat.upsert({
    where: { id },
    create: { id, ...owner, title, messages: json },
    update: { messages: json },
  });
}

export async function chatBelongsToSomeoneElse(id: string, owner: Owner) {
  const chat = await prisma.snackyChat.findUnique({
    where: { id },
    select: { userId: true, organizationId: true },
  });
  return (
    chat !== null &&
    (chat.userId !== owner.userId || chat.organizationId !== owner.organizationId)
  );
}

export async function deleteSnackyChat(id: string, owner: Owner) {
  await prisma.snackyChat.deleteMany({ where: { id, ...owner } });
}
