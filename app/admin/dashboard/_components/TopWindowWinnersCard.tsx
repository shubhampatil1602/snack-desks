import Link from "next/link";
import { ArrowRight, Crown, Trophy } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TopWindowWinner = {
  userId: string;
  name: string;
  wins: number;
  rank: number;
};

type TopWindowWinnersCardProps = {
  winners: TopWindowWinner[];
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Visual color themes for ranks 1 through 5 (clean flat/subtle tones without glow)
const RANK_THEMES: Record<
  number,
  {
    ring: string;
    bg: string;
    avatarText: string;
    badge: string;
    winsBadge: string;
    size: string;
    textSize: string;
    elevation: string;
  }
> = {
  1: {
    ring: "border border-amber-400 dark:border-amber-500",
    bg: "bg-amber-100/80 dark:bg-amber-950/40",
    avatarText: "text-amber-800 dark:text-amber-300",
    badge: "bg-amber-500 text-black",
    winsBadge:
      "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    size: "size-20 sm:size-24",
    textSize: "text-lg sm:text-xl",
    elevation: "-translate-y-2 sm:-translate-y-3",
  },
  2: {
    ring: "border border-indigo-400 dark:border-indigo-500",
    bg: "bg-indigo-100/80 dark:bg-indigo-950/40",
    avatarText: "text-indigo-800 dark:text-indigo-300",
    badge: "bg-indigo-500 text-white",
    winsBadge:
      "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
    size: "size-16 sm:size-20",
    textSize: "text-base sm:text-lg",
    elevation: "translate-y-0",
  },
  3: {
    ring: "border border-rose-400 dark:border-rose-500",
    bg: "bg-rose-100/80 dark:bg-rose-950/40",
    avatarText: "text-rose-800 dark:text-rose-300",
    badge: "bg-rose-500 text-white",
    winsBadge:
      "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    size: "size-16 sm:size-20",
    textSize: "text-base sm:text-lg",
    elevation: "translate-y-0",
  },
  4: {
    ring: "border border-emerald-400 dark:border-emerald-500",
    bg: "bg-emerald-100/80 dark:bg-emerald-950/40",
    avatarText: "text-emerald-800 dark:text-emerald-300",
    badge: "bg-emerald-500 text-white",
    winsBadge:
      "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    size: "size-14 sm:size-16",
    textSize: "text-sm sm:text-base",
    elevation: "translate-y-2 sm:translate-y-2",
  },
  5: {
    ring: "border border-cyan-400 dark:border-cyan-500",
    bg: "bg-cyan-100/80 dark:bg-cyan-950/40",
    avatarText: "text-cyan-800 dark:text-cyan-300",
    badge: "bg-cyan-500 text-white",
    winsBadge:
      "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800",
    size: "size-14 sm:size-16",
    textSize: "text-sm sm:text-base",
    elevation: "translate-y-2 sm:translate-y-2",
  },
};

/**
 * Organizes winners so #1 is in the center, flanked symmetrically by other winners
 */
function organizeWinnersForDisplay(
  winners: TopWindowWinner[],
): TopWindowWinner[] {
  const top = winners.slice(0, 5);
  if (top.length <= 1) return top;
  if (top.length === 2) return [top[1], top[0]];
  if (top.length === 3) return [top[1], top[0], top[2]];
  if (top.length === 4) return [top[3], top[1], top[0], top[2]];
  // 5 winners: #4, #2, #1, #3, #5
  return [top[3], top[1], top[0], top[2], top[4]];
}

export function TopWindowWinnersCard({ winners }: TopWindowWinnersCardProps) {
  const displayWinners = organizeWinnersForDisplay(winners);

  return (
    <Card size='sm' className='justify-between'>
      <CardHeader>
        <CardTitle>Most Order Window Winners</CardTitle>
        <CardAction>
          <Link
            href='/admin/users'
            className='inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground'
          >
            View all users
            <ArrowRight className='h-3.5 w-3.5' />
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent>
        {winners.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <Trophy className='size-10 text-muted-foreground/30 mb-2 stroke-[1.5]' />
            <p className='text-sm text-muted-foreground'>
              No spin winners in this period yet
            </p>
          </div>
        ) : (
          <div className='flex items-end justify-center gap-3 sm:gap-5 min-h-[190px] py-4 px-1 overflow-x-auto'>
            {displayWinners.map((winner) => {
              const theme = RANK_THEMES[winner.rank] ?? RANK_THEMES[5];
              const isFirst = winner.rank === 1;

              return (
                <div
                  key={winner.userId}
                  className={`flex flex-col items-center gap-2 text-center ${theme.elevation}`}
                >
                  {/* Clean Colored Circle without glow or hover effect */}
                  <div
                    className={`relative rounded-full flex flex-col items-center justify-center p-1.5 ${theme.size} ${theme.ring} ${theme.bg}`}
                  >
                    {/* Crown for #1 */}
                    {isFirst && (
                      <Crown className='absolute -top-5 size-5 text-amber-500' />
                    )}

                    {/* Rank Pill Badge */}
                    <span
                      className={`absolute -bottom-2.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold leading-none ${theme.badge}`}
                    >
                      #{winner.rank}
                    </span>

                    {/* Initials in Circle Center */}
                    <span
                      className={`font-black tracking-tight ${theme.textSize} ${theme.avatarText}`}
                    >
                      {initials(winner.name)}
                    </span>
                  </div>

                  {/* User Name & Wins Below Circle */}
                  <div className='flex flex-col items-center mt-1'>
                    <p
                      title={winner.name}
                      className='text-xs font-semibold text-foreground truncate max-w-[70px] sm:max-w-[90px] leading-tight'
                    >
                      {winner.name}
                    </p>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded border mt-1 whitespace-nowrap ${theme.winsBadge}`}
                    >
                      {winner.wins} {winner.wins === 1 ? "win" : "wins"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
