import { prisma } from "@/lib/db";
import { SPIN_EXCLUDED_USER_IDS } from "@/lib/constants";
import type { Prisma } from "@/lib/generated/prisma/client";

export type SpinCandidate = { id: string; name: string };
export type SittingOut = SpinCandidate & { reason: string };

export type SpinDraw =
  | { ok: false; error: string }
  | {
      ok: true;
      window: { winnerUserId: string | null; originalWinnerUserId: string | null };
      eligible: SpinCandidate[];
      // eligible plus excluded users who ordered: their names go round on
      // the wheel too, but the winner is only ever drawn from eligible
      onWheel: SpinCandidate[];
      sittingOut: SittingOut[];
    };

// Relaxes the rules only when nobody is left, so a window always gets a winner:
// 1. not excluded and not the previous window's winner
// 2. not excluded (the previous winner may win again)
// 3. anyone who ordered (excluded users win only if they're the only ones)
function pickEligible(
  candidates: SpinCandidate[],
  previousWinnerId: string | null,
) {
  const notExcluded = candidates.filter(
    (user) => !SPIN_EXCLUDED_USER_IDS.includes(user.id),
  );
  const notPreviousWinner = notExcluded.filter(
    (user) => user.id !== previousWinnerId,
  );

  if (notPreviousWinner.length > 0) return notPreviousWinner;
  if (notExcluded.length > 0) return notExcluded;
  return candidates;
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
 * Callers must have checked that the admin belongs to organizationId.
 */
export async function getSpinDraw(
  windowId: string,
  organizationId: string,
): Promise<SpinDraw> {
  const window = await prisma.orderWindow.findFirst({
    where: { id: windowId, organizationId },
    select: {
      winnerUserId: true,
      originalWinnerUserId: true,
      lastSpunAt: true,
    },
  });

  if (!window) return { ok: false, error: "Order window not found" };

  let previousWinnerId: string | null = null;
  try {
    const previousWindow = await prisma.orderWindow.findFirst({
      where: {
        organizationId,
        id: { not: windowId },
        winnerUserId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: { winnerUserId: true },
    });
    previousWinnerId = previousWindow?.winnerUserId ?? null;
  } catch (e) {
    console.error("Failed to fetch previous winner", e);
  }

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

  const eligible = pickEligible(candidates, previousWinnerId);
  // only the last winner is named; excluded users are quietly left off
  const sittingOut = candidates
    .filter(
      (user) =>
        !eligible.some((e) => e.id === user.id) &&
        !SPIN_EXCLUDED_USER_IDS.includes(user.id),
    )
    .map((user) => ({ ...user, reason: "won the last window" }));
  const onWheel = candidates.filter(
    (user) =>
      eligible.some((e) => e.id === user.id) ||
      SPIN_EXCLUDED_USER_IDS.includes(user.id),
  );

  return {
    ok: true,
    window: {
      winnerUserId: window.winnerUserId,
      originalWinnerUserId: window.originalWinnerUserId,
    },
    eligible,
    onWheel,
    sittingOut,
  };
}
