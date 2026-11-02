import { prisma } from "@/lib/db";
import { SPIN_EXCLUDED_USER_IDS } from "@/lib/constants";

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

  let candidates: SpinCandidate[] = [];

  if (window.winnerUserId) {
    // Late-spin: Re-spin between current winner and all late orders
    const lateParticipants = await prisma.order.findMany({
      where: {
        windowId,
        status: { not: "cancelled" },
        createdByAdmin: true,
        ...(window.lastSpunAt ? { createdAt: { gt: window.lastSpunAt } } : {}),
      },
      distinct: ["userId"],
      select: { user: { select: { id: true, name: true } } },
    });

    if (lateParticipants.length === 0) {
      return { ok: false, error: "No late orders to spin" };
    }

    const currentWinner = await prisma.user.findUnique({
      where: { id: window.winnerUserId },
      select: { id: true, name: true },
    });

    candidates = lateParticipants.map((p) => p.user);
    if (currentWinner && !candidates.some((u) => u.id === currentWinner.id)) {
      candidates.push(currentWinner);
    }
  } else {
    // Initial spin
    const participants = await prisma.order.findMany({
      where: {
        windowId,
        status: { not: "cancelled" },
      },
      distinct: ["userId"],
      select: {
        user: { select: { id: true, name: true } },
      },
    });

    if (participants.length === 0) {
      return { ok: false, error: "No participants found" };
    }

    candidates = participants.map((p) => p.user);
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
