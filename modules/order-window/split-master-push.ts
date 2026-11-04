import { prisma } from "@/lib/db";
import { pushToUsers } from "@/lib/push";
import { windowParticipants } from "@/modules/order-window/spin-draw";

// A window has a new split master (spin, respin, or their late order put them
// back): they hear they pay the shop, everyone else in the window who to pay
export async function pushSplitMaster(windowId: string, winnerId: string) {
  const [window, participants] = await Promise.all([
    prisma.orderWindow.findUnique({ where: { id: windowId }, select: { label: true } }),
    windowParticipants(windowId),
  ]);
  if (!window) return;

  const name = participants.find((user) => user.id === winnerId)?.name ?? "Someone";
  // a respin's alert replaces the earlier one
  const tag = `spin-${windowId}`;

  await Promise.all([
    pushToUsers([winnerId], {
      title: "🎉 You're the split master",
      body: `You pay the ${window.label} bill. Pay the shop, then tap "I paid the bill" in History.`,
      url: "/history",
      tag,
    }),
    pushToUsers(
      participants.filter((user) => user.id !== winnerId).map((user) => user.id),
      {
        title: `🎯 ${name} is the split master`,
        body: `${name} pays the ${window.label} bill. Pay them your share.`,
        url: "/history",
        tag,
      },
    ),
  ]);
}
