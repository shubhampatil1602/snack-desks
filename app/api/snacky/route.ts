import {
  convertToModelMessages,
  createIdGenerator,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  type Tool,
  type UIMessage,
} from "ai";
import { formatInTimeZone } from "date-fns-tz";
import { getCurrentMember } from "@/actions/user";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { snackyModel } from "@/lib/snacky";
import { snackySystemPrompt, withKnownTools } from "@/modules/snacky/ask";
import { getShopMenus, getWindowHabits } from "@/modules/snacky/window-habits";
import { snackyDataTools } from "@/modules/snacky/data-tools";
import {
  chatBelongsToSomeoneElse,
  deleteExpiredSnackyChats,
  getSnackyChat,
  saveSnackyChat,
} from "@/modules/snacky/chats";

// Ask Snacky: admins ask about their org's data in plain words. The page
// sends the chat id and the newest message; the rest is read from the saved
// chat (kept 24 hours).

// the last few turns are enough for follow-ups, and keep each call cheap
const HISTORY = 12;
const MAX_QUESTION = 500;
const messageId = createIdGenerator({ prefix: "msg", size: 16 });

export async function POST(req: Request) {
  const member = await getCurrentMember();
  if (!member || (member.role !== "admin" && member.role !== "owner")) {
    return new Response("Only admins can ask Snacky", { status: 403 });
  }
  const owner = { userId: member.userId, organizationId: member.organizationId };

  const limit = await checkRateLimit(`snacky:ask:${member.userId}`, 20, 60_000);
  if (!limit.success) {
    return new Response(
      `Snacky needs a breather. Try again in ${limit.retryAfterSec}s.`,
      { status: 429 },
    );
  }

  const { id, message }: { id: string; message: UIMessage } = await req.json();
  if (typeof id !== "string" || !/^[\w-]{8,40}$/.test(id) || !message) {
    return new Response("Bad request", { status: 400 });
  }
  await deleteExpiredSnackyChats();
  if (await chatBelongsToSomeoneElse(id, owner)) {
    return new Response("Chat not found", { status: 404 });
  }

  const saved = await getSnackyChat(id, owner);
  const history = saved?.messages ?? [];
  let messages: UIMessage[];
  if (message.role === "user") {
    const text = message.parts.find((part) => part.type === "text")?.text ?? "";
    if (!text.trim() || text.length > MAX_QUESTION) {
      return new Response("Keep the question under 500 characters", { status: 400 });
    }
    messages = [...history, message];
  } else if (message.role === "assistant" && history.at(-1)?.id === message.id) {
    // the admin confirmed or cancelled a window: Snacky's last message comes
    // back with the outcome filled in
    messages = [...history.slice(0, -1), message];
  } else {
    return new Response("That message doesn't belong to this chat", { status: 400 });
  }

  const [shops, openWindow, habits, menus] = await Promise.all([
    prisma.shop.findMany({
      where: { organizationId: member.organizationId },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    prisma.orderWindow.findFirst({
      where: { organizationId: member.organizationId, status: "active" },
      select: {
        id: true,
        label: true,
        createdAt: true,
        endsAt: true,
        orders: { select: { status: true } },
      },
    }),
    getWindowHabits(member.organizationId),
    getShopMenus(member.organizationId),
  ]);
  const tools = snackyDataTools(
    member.organizationId,
    shops.map((shop) => shop.name),
  );

  // only the incoming message needs checking: the rest was saved by us
  const valid = await safeValidateUIMessages({
    messages: [message],
    tools: tools as Record<string, Tool<unknown, unknown>>,
  });
  if (!valid.success) {
    console.warn("Ask Snacky got a malformed message", valid.error);
    return new Response("Snacky couldn't read that message. Try again.", { status: 400 });
  }

  const title =
    saved?.title ??
    (messages.find((m) => m.role === "user")?.parts.find((p) => p.type === "text")?.text ?? "Chat")
      .trim()
      .slice(0, 60);

  const pending = openWindow?.orders.filter((o) => o.status === "pending").length ?? 0;
  const state = openWindow
    ? `- Open order window: "${openWindow.label}" (id ${openWindow.id}), opened ${formatInTimeZone(openWindow.createdAt, "Asia/Kolkata", "EEE h:mm a")}${
        openWindow.endsAt
          ? `, closes by itself at ${formatInTimeZone(openWindow.endsAt, "Asia/Kolkata", "h:mm a")}`
          : ", no timer"
      }, ${openWindow.orders.length} orders so far (${pending} pending)`
    : "- No order window is open right now.";

  const result = streamText({
    model: snackyModel,
    system: snackySystemPrompt(state, shops.map((shop) => shop.name), habits, menus),
    messages: await convertToModelMessages(withKnownTools(messages.slice(-HISTORY), tools), {
      tools,
      ignoreIncompleteToolCalls: true,
    }),
    tools,
    stopWhen: stepCountIs(6),
  });

  // finish (and save) even if the admin leaves the page mid-answer
  result.consumeStream();

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: messageId,
    onFinish: async ({ messages: all }) => {
      await saveSnackyChat(id, owner, title, all);
    },
    onError: (error) => {
      console.error("Ask Snacky failed", error);
      return "Snacky couldn't answer that just now. Try again in a bit.";
    },
  });
}
