import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type TopEmployee = {
  userId: string;
  name: string;
  orders: number;
  spent: number;
  rank: number;
};

type TopEmployeesCardProps = {
  employees: TopEmployee[];
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
    "bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700",
    "bg-yellow-100 text-yellow-900 border-2 border-yellow-400 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-700",
    "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700",
  ],

  block: ["h-[72px]", "h-[130px]", "h-[56px]"],

  blockBg: [
    "bg-slate-100/70 border border-slate-200 dark:bg-slate-900/30 dark:border-slate-800",
    "bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800",
    "bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-800",
  ],

  rankColor: [
    "text-slate-600 dark:text-slate-400",
    "text-yellow-700 dark:text-yellow-400",
    "text-rose-700 dark:text-rose-400",
  ],
};

export function TopEmployeesCard({ employees }: TopEmployeesCardProps) {
  const top3 = employees.slice(0, 3);

  return (
    <Card size='sm' className='justify-between'>
      <CardHeader>
        <CardTitle>Most Active Employees</CardTitle>
      </CardHeader>

      <CardContent>
        {employees.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No employee activity yet
          </p>
        ) : (
          <>
            {/* Podium */}
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
                          {formatCurrency(emp.spent)}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
