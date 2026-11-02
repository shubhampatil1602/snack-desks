import type { Metadata } from "next";
import { requireAdmin } from "@/actions/user";
import { prisma } from "@/lib/db";
import { getSnackyChat, listSnackyChats } from "@/modules/snacky/chats";
import { getWindowHabits } from "@/modules/snacky/window-habits";
import { AskSnacky } from "./_components/AskSnacky";

export const metadata: Metadata = {
  title: "Ask Snacky",
  description: "Ask about your organisation's orders, spend, people and menu in plain words.",
};

export default async function AskSnackyPage({
  searchParams,
}: {
  searchParams: Promise<{ chat?: string }>;
}) {
  const { member } = await requireAdmin();
  const owner = { userId: member.userId, organizationId: member.organizationId };
  const { chat: chatId } = await searchParams;

  const [chats, chat, shops, habits] = await Promise.all([
    listSnackyChats(owner),
    chatId ? getSnackyChat(chatId, owner) : null,
    prisma.shop.findMany({
      where: { organizationId: member.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getWindowHabits(member.organizationId, 4),
  ]);

  // the org's usual windows, ready to open in one tap
  const windowStarters = habits.map((habit) => {
    const tagline = habit.taglines[0];
    const shopsPart = habit.shops.length ? ` with ${habit.shops.join(", ")}` : "";
    return {
      label: habit.label,
      shops: habit.shops,
      tagline,
      prompt: `Open a ${habit.label} window${shopsPart}${tagline ? `: "${tagline}"` : " and a fun tagline"}`,
    };
  });

  return (
    <div className='px-4'>
      <AskSnacky
        initialChats={chats}
        initialChat={chat}
        shops={shops}
        windowStarters={windowStarters}
      />
    </div>
  );
}
