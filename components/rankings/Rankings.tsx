"use client";

import { EmployeeRanking } from "@/modules/rankings/queries";
import { usePagination } from "@/hooks/use-pagination";
import { DataPagination } from "@/components/ui/data-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RankingsProps = {
  rankings: EmployeeRanking[];
  mode: "admin" | "user";
  currentUserId?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const PODIUM_ORDER = [1, 0, 2] as const;
const PODIUM_RANKS = [2, 1, 3] as const;

const podiumStyles = {
  avatar: [
    "bg-muted text-muted-foreground border border-border",
    "bg-amber-100 text-amber-800 border-2 border-amber-400",
    "bg-orange-100 text-orange-800 border border-orange-300",
  ],
  block: ["h-[72px]", "h-[130px]", "h-[56px]"],
  blockBg: [
    "bg-muted/60",
    "bg-amber-50 border border-amber-200",
    "bg-orange-50 border border-orange-200",
  ],
  rankColor: ["text-muted-foreground", "text-amber-700", "text-orange-700"],
};

export function Rankings({ rankings, mode, currentUserId }: RankingsProps) {
  const top3 = rankings.slice(0, 3);
  const currentUser = rankings.find((u) => u.userId === currentUserId);

  const top4To10 = rankings.slice(3, 10); // Positions 4-10
  const remainingRankings = rankings.slice(10); // Positions 11+

  const paginationData = remainingRankings;

  const pagination = usePagination({
    data: paginationData,
    itemsPerPage: 10,
  });

  return (
    <div className='space-y-6'>
      <Card size='sm'>
        <CardHeader>
          <CardTitle>Rich 10</CardTitle>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No rankings available yet.
            </p>
          ) : (
            <div className='space-y-3'>
              {/* Podium Section */}
              <div className='flex items-end justify-center gap-3'>
                {PODIUM_ORDER.map((empIdx, colIdx) => {
                  const emp = top3[empIdx];
                  if (!emp) return null;

                  const rank = PODIUM_RANKS[colIdx];

                  return (
                    <div
                      key={emp.userId}
                      className='flex flex-col items-center gap-2 w-[120px]'
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold ${podiumStyles.avatar[colIdx]}`}
                      >
                        {initials(emp.name)}
                      </div>

                      <p className='text-xs font-medium text-center leading-tight'>
                        {emp.name}
                        {emp.userId === currentUserId && " (You)"}
                      </p>

                      <p className='text-xs text-muted-foreground'>
                        {emp.orders} orders
                      </p>

                      <div
                        className={`w-full rounded-t flex flex-col items-center justify-center ${podiumStyles.block[colIdx]} ${podiumStyles.blockBg[colIdx]}`}
                      >
                        <span
                          className={`text-lg font-semibold ${podiumStyles.rankColor[colIdx]}`}
                        >
                          #{rank}
                        </span>
                        <p className='text-xs'>
                          All time:{" "}
                          <span className='font-semibold pl-1'>
                            ₹{emp.spent.toFixed(0)}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Positions 4-10 */}
              {top4To10.map((user) => (
                <div
                  key={user.userId}
                  className='flex items-center justify-between border-b pb-2 last:border-0'
                >
                  <div className='flex items-center gap-3'>
                    <span className='text-sm text-muted-foreground w-8'>
                      #{user.rank}
                    </span>

                    <span className='font-medium'>
                      {user.name}
                      {user.userId === currentUserId && " (You)"}
                    </span>
                  </div>

                  <span className='text-sm text-muted-foreground'>
                    {user.orders} orders
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Rank - Only show if user is outside top 10 */}
      {mode === "user" && currentUser && currentUser.rank > 10 && (
        <Card size='sm'>
          <CardHeader>
            <CardTitle>Your Rank</CardTitle>
          </CardHeader>

          <CardContent>
            <div className='flex items-center justify-between rounded-lg border p-4'>
              <div>
                <p className='font-medium'>{currentUser.name}</p>

                <p className='text-sm text-muted-foreground'>
                  Rank #{currentUser.rank}
                </p>
              </div>

              <span className='font-semibold'>{currentUser.orders} orders</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard List - Only show if there are rankings beyond top 10 */}
      {remainingRankings.length > 0 && (
        <Card size='sm'>
          <CardHeader>
            <CardTitle>
              {mode === "admin" ? "All Rankings" : "More Rankings"}
            </CardTitle>
          </CardHeader>

          <CardContent className='space-y-2'>
            {pagination.paginatedData.map((user) => (
              <div
                key={user.userId}
                className='flex items-center justify-between border-b pb-2 last:border-0'
              >
                <div className='flex items-center gap-3'>
                  <span className='text-sm text-muted-foreground w-8'>
                    #{user.rank}
                  </span>

                  <span className='font-medium'>
                    {user.name}
                    {user.userId === currentUserId && " (You)"}
                  </span>
                </div>

                <span className='text-sm text-muted-foreground'>
                  {user.orders} orders
                </span>
              </div>
            ))}
          </CardContent>

          <DataPagination {...pagination} />
        </Card>
      )}
    </div>
  );
}
