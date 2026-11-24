import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  getRunsLeaderboard,
  istDay,
  istDayRange,
  lockRunsLeaderboard,
  topRunnerIds,
} from "@/modules/strava/leaderboard";

export type SpinCandidate = { id: string; name: string };

export type SpinDraw =
  | { ok: false; error: string }
  | {
      ok: true;
      window: { winnerUserId: string | null; originalWinnerUserId: string | null };
      // the names on the wheel; the split master is drawn from these
      eligible: SpinCandidate[];
      // the Top Runner(s) left off the wheel; empty when nobody else was
      // left to draw, so they went back on it
      sittingOut: SpinCandidate[];
      // the IST day they were fastest on, as "23 Nov"; null for today
      fastestOn: string | null;
    };

// The Top Runner (best run score on the day's Runs Leaderboard among these
// people, all of them if tied) sits out, unless that would leave nobody.
// Nobody ran: everyone can be drawn. See ADR 0001.
function pickEligible(candidates: SpinCandidate[], topRunners: string[]) {
  const eligible = candidates.filter((user) => !topRunners.includes(user.id));
  return eligible.length > 0 ? eligible : candidates;
}

type WindowOrder = {
  status: string;
  user: SpinCandidate;
  items: { replacementApplied: boolean; splits: { user: SpinCandidate }[] }[];
};

// Everyone in these orders: whoever placed each one, plus anyone sharing one
// of its items (shares don't get an order of their own). Cancelled orders and
// swapped-out items don't count.
export function participantsOf(orders: WindowOrder[]) {
  const people = new Map<string, SpinCandidate>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    people.set(order.user.id, { id: order.user.id, name: order.user.name });
    for (const item of order.items) {
      if (item.replacementApplied) continue;
      for (const { user } of item.splits) {
        people.set(user.id, { id: user.id, name: user.name });
      }
    }
  }
  return [...people.values()];
}

async function orderParticipants(where: Prisma.OrderWhereInput) {
  const orders = await prisma.order.findMany({
    where,
    select: {
      status: true,
      user: { select: { id: true, name: true } },
      items: {
        select: {
          replacementApplied: true,
          splits: { select: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });
  return participantsOf(orders);
}

/** Everyone still in the window: its orders' owners and the people sharing their items. */
export function windowParticipants(windowId: string) {
  return orderParticipants({ windowId, status: { not: "cancelled" } });
}

/**
 * Who can win this window's spin, and who sits out and why. The spin action
 * and the spin dialog both use it, so the names shown are the names drawn.
 * Only the spin itself (`lock`) locks the day's Runs Leaderboard; the dialog
 * previews it. Callers must have checked that the admin belongs to
 * organizationId.
 */
export async function getSpinDraw(
  windowId: string,
  organizationId: string,
  { lock = false }: { lock?: boolean } = {},
): Promise<SpinDraw> {
  const window = await prisma.orderWindow.findFirst({
    where: { id: windowId, organizationId },
    select: {
      winnerUserId: true,
      originalWinnerUserId: true,
      lastSpunAt: true,
      startsAt: true,
    },
  });

  if (!window) return { ok: false, error: "Order window not found" };

  const participants = await windowParticipants(windowId);
  // the winner was taken off the window (order cancelled, or removed from a
  // share) after the spin: spin everyone again
  const winnerLeft =
    !!window.winnerUserId &&
    !participants.some((user) => user.id === window.winnerUserId);

  let candidates: SpinCandidate[] = [];

  if (window.winnerUserId && !winnerLeft) {
    // Late-spin: Re-spin between current winner and all late orders
    const lateParticipants = await orderParticipants({
      windowId,
      status: { not: "cancelled" },
      createdByAdmin: true,
      ...(window.lastSpunAt ? { createdAt: { gt: window.lastSpunAt } } : {}),
    });

    if (lateParticipants.length === 0) {
      return { ok: false, error: "No late orders to spin" };
    }

    const currentWinner = participants.find(
      (user) => user.id === window.winnerUserId,
    );

    candidates = lateParticipants;
    if (currentWinner && !candidates.some((u) => u.id === currentWinner.id)) {
      candidates.push(currentWinner);
    }
  } else {
    // Initial spin, or a fresh one after the winner left
    if (participants.length === 0) {
      return { ok: false, error: "No participants found" };
    }

    candidates = participants;
  }

  // the reward lasts the whole IST day the window opened on
  const day = istDay(window.startsAt);
  const leaderboard = lock
    ? await lockRunsLeaderboard(organizationId, day)
    : await getRunsLeaderboard(organizationId, day);
  // best runner in the whole window, even when a late spin only draws
  // among the late orders
  const topRunners = topRunnerIds(
    leaderboard,
    participants.map((user) => user.id),
  );

  const eligible = pickEligible(candidates, topRunners);
  return {
    ok: true,
    window: {
      winnerUserId: window.winnerUserId,
      originalWinnerUserId: window.originalWinnerUserId,
    },
    eligible,
    sittingOut: candidates.filter(
      (user) => !eligible.some((e) => e.id === user.id),
    ),
    fastestOn:
      day === istDay()
        ? null
        : istDayRange(day).start.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            timeZone: "Asia/Kolkata",
          }),
  };
}
