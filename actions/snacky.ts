"use server";

import { generateText, Output } from "ai";
import { z } from "zod";
import { formatInTimeZone } from "date-fns-tz";

import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { SNACKY_VOICE, snackyModel, snackyNow } from "@/lib/snacky";
import { refreshSnackySummary, type SnackySummary } from "@/modules/snacky/summary";
import { draftSnackyOrder, type SnackyOrderDraft } from "@/modules/snacky/order-draft";
import {
  deleteSnackyChat,
  getSnackyChat,
  listSnackyChats,
  type SnackyChatSummary,
} from "@/modules/snacky/chats";
import {
  describeHabits,
  describeShopMenus,
  getShopMenus,
  getWindowHabits,
  TAGLINE_EXAMPLES,
  TAGLINE_FOOD_RULE,
} from "@/modules/snacky/window-habits";
import { authIsRequired, getCurrentMember, requireAdmin } from "./user";

type Result<T> = { success: true; data: T } | { success: false; error: string };

function owner(member: { userId: string; organizationId: string }) {
  return { userId: member.userId, organizationId: member.organizationId };
}

const suggestionSchema = z.object({
  label: z.string().describe("Window label, 1 to 3 words, at most 25 characters"),
  tagline: z.string().describe("One fun line for the users' banner, at most 100 characters"),
  shops: z.array(z.string()).describe("Shop names exactly as listed, usually that window's usual shops"),
});

// what the window is for at this hour (IST), with lines in the office's own
// Hinglish style for Snacky to riff on
function mealFor(hour: number) {
  if (hour >= 9 && hour < 11) {
    return `a morning nasta (breakfast) window. Labels like: Nasta, Breakfast, Morning Nasta.
Taglines like: "Nasta order karlo", "Garma garam samose mangalo", "Samosa, vada pav ho jaaye, chacha vaste gona nasta..",
"Samosa: The ultimate shape of happiness.", "All you need is sambhogsa", "Team Vada Pav vs. Team Samosa?",
"Weather forecast: 100% chance of Vada Pav", "Chai without Vada Pav? That's a crime"`;
  }
  if (hour >= 11 && hour < 15) {
    return `a lunch window. Labels like: Lunch, Lunch Time.
Taglines like: "Chaas mangalo", "Khaane ke saath thoda chakhna ho jaaye", "Lunch ke saath chaas toh banta hai"`;
  }
  return `a chai and snacks window. Labels like: Chai, Evening Chai, Chai Nasta.
Taglines like: "Chai without Vada Pav? That's a crime", "Chai pe charcha, samose pe kharcha", "Weather forecast: 100% chance of Vada Pav"`;
}

/**
 * A label and tagline for a new order window, from the time and past
 * windows. With forShopIds (picked in the Suggest menu) it's for those
 * shops; otherwise Snacky picks the usual shops for this time of day.
 */
export async function suggestWindowNameAction(current?: {
  // the tagline on screen, so the next one is different
  tagline?: string;
  forShopIds?: string[];
}): Promise<Result<{ label: string; tagline: string; shopIds: string[] }>> {
  const { member } = await requireAdmin();

  const limit = await checkRateLimit(`snacky:window-name:${member.userId}`, 10, 60_000);
  if (!limit.success) {
    return { success: false, error: `Snacky needs a breather. Try again in ${limit.retryAfterSec}s.` };
  }

  const [habits, shops, menus] = await Promise.all([
    getWindowHabits(member.organizationId),
    prisma.shop.findMany({
      where: { organizationId: member.organizationId },
      select: { id: true, name: true },
    }),
    getShopMenus(member.organizationId),
  ]);
  const hour = Number(formatInTimeZone(new Date(), "Asia/Kolkata", "H"));

  // only this org's shops, whatever ids the browser sent
  const forShops = shops.filter((shop) => current?.forShopIds?.includes(shop.id));
  const shownMenus =
    forShops.length > 0
      ? new Map([...menus].filter(([name]) => forShops.some((shop) => shop.name === name)))
      : menus;

  const task =
    forShops.length > 0
      ? `This window is for ${forShops.map((shop) => shop.name).join(", ")}: return exactly ${forShops.length > 1 ? "those shops" : "that shop"}, use the label of a usual window with ${forShops.length > 1 ? "them" : "it"} if there is one (else a sensible new one for this time of day), and write the tagline about their food only.`
      : "Pick the usual window that fits this time of day best (else a sensible new one) and use its label spelling and usual shops.";

  try {
    const { output } = await generateText({
      model: snackyModel,
      output: Output.object({ schema: suggestionSchema }),
      // a new line each time the admin asks again
      temperature: 1.2,
      system: SNACKY_VOICE,
      prompt: `It is ${snackyNow()}. An admin in a Mumbai-style office is opening ${mealFor(hour)}
This org's usual windows, most used first:
${describeHabits(habits)}
Shop menus (what each shop sells, with the admin's note about it in brackets):
${describeShopMenus(shownMenus)}

${task}
Write a fresh tagline in the same fun Hinglish (Hindi in English letters) style, about that shop's food, like ${TAGLINE_EXAMPLES.map((t) => `"${t}"`).join(", ")}. Don't reuse a recent tagline word for word. ${TAGLINE_FOOD_RULE}
The example lines above only show the style: their dishes don't count unless the shop sells them.
${current?.tagline ? `Don't repeat this tagline: "${current.tagline.slice(0, 120)}".` : ""} At most one emoji.`,
    });

    const wanted = output.shops.map((name) => name.trim().toLowerCase());
    return {
      success: true,
      data: {
        label: output.label.trim().slice(0, 25),
        tagline: output.tagline.trim().slice(0, 120),
        shopIds:
          forShops.length > 0
            ? forShops.map((shop) => shop.id)
            : shops.filter((shop) => wanted.includes(shop.name.toLowerCase())).map((shop) => shop.id),
      },
    };
  } catch (error) {
    console.error("Snacky window name failed", error);
    return { success: false, error: "Snacky couldn't think of a name just now" };
  }
}

/** Writes Snacky's dashboard summary for the period afresh and saves it. */
export async function refreshSnackySummaryAction(
  period: string,
): Promise<Result<SnackySummary>> {
  const { member } = await requireAdmin();
  if (!/^(all|\d{4}|\d{4}-\d{2})$/.test(period)) {
    return { success: false, error: "Unknown period" };
  }

  const limit = await checkRateLimit(`snacky:summary:${member.userId}`, 6, 60_000);
  if (!limit.success) {
    return { success: false, error: `Snacky needs a breather. Try again in ${limit.retryAfterSec}s.` };
  }

  try {
    return { success: true, data: await refreshSnackySummary(member.organizationId, period) };
  } catch (error) {
    console.error("Snacky summary failed", error);
    return { success: false, error: "Snacky couldn't write the summary just now" };
  }
}

/** Writes the signed-in person's own roast for the period afresh and saves it. */
export async function refreshMySnackySummaryAction(
  period: string,
): Promise<Result<SnackySummary>> {
  await authIsRequired();
  const member = await getCurrentMember();
  if (!member) return { success: false, error: "Organization not found" };
  if (!/^(all|\d{4}|\d{4}-\d{2})$/.test(period)) {
    return { success: false, error: "Unknown period" };
  }

  const limit = await checkRateLimit(`snacky:my-summary:${member.userId}`, 6, 60_000);
  if (!limit.success) {
    return { success: false, error: `Snacky needs a breather. Try again in ${limit.retryAfterSec}s.` };
  }

  try {
    return {
      success: true,
      data: await refreshSnackySummary(member.organizationId, period, { userId: member.userId }),
    };
  } catch (error) {
    console.error("Snacky personal summary failed", error);
    return { success: false, error: "Snacky couldn't write your roast just now" };
  }
}

/** A cart draft from what the person typed; they place the order themselves. */
export async function snackyOrderDraftAction(
  windowId: string,
  text: string,
): Promise<Result<SnackyOrderDraft>> {
  await authIsRequired();
  const member = await getCurrentMember();
  if (!member) return { success: false, error: "Organization not found" };

  const message = text.trim();
  if (!message) return { success: false, error: "Tell Snacky what you'd like" };
  if (message.length > 300) return { success: false, error: "Keep it under 300 characters" };

  const limit = await checkRateLimit(`snacky:order:${member.userId}`, 8, 60_000);
  if (!limit.success) {
    return { success: false, error: `Snacky needs a breather. Try again in ${limit.retryAfterSec}s.` };
  }

  try {
    const draft = await draftSnackyOrder({
      organizationId: member.organizationId,
      userId: member.userId,
      windowId,
      text: message,
    });
    if ("error" in draft) return { success: false, error: draft.error };
    return { success: true, data: draft };
  } catch (error) {
    console.error("Snacky order draft failed", error);
    return { success: false, error: "Snacky couldn't read that just now. Try again?" };
  }
}

/** The window as it is in the database, for Snacky's delete card. */
export async function getWindowToDeleteAction(windowId: string): Promise<
  Result<{ label: string; opened: string; status: string; orders: number; people: number }>
> {
  const { member } = await requireAdmin();
  const window = await prisma.orderWindow.findFirst({
    where: { id: windowId, organizationId: member.organizationId },
    select: {
      label: true,
      status: true,
      createdAt: true,
      orders: { where: { status: { not: "cancelled" } }, select: { userId: true } },
    },
  });
  if (!window) return { success: false, error: "That window doesn't exist (any more)" };
  return {
    success: true,
    data: {
      label: window.label,
      opened: formatInTimeZone(window.createdAt, "Asia/Kolkata", "EEE d MMM yyyy, h:mm a"),
      status: window.status,
      orders: window.orders.length,
      people: new Set(window.orders.map((order) => order.userId)).size,
    },
  };
}

export async function listSnackyChatsAction(): Promise<SnackyChatSummary[]> {
  const { member } = await requireAdmin();
  return listSnackyChats(owner(member));
}

export async function getSnackyChatAction(id: string) {
  const { member } = await requireAdmin();
  return getSnackyChat(id, owner(member));
}

export async function deleteSnackyChatAction(id: string) {
  const { member } = await requireAdmin();
  await deleteSnackyChat(id, owner(member));
}
