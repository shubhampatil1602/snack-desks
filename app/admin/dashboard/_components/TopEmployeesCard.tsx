import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TopEmployee = {
  userId: string;
  name: string;
  orders: number;
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

export function TopEmployeesCard({ employees }: TopEmployeesCardProps) {
  const top3 = employees.slice(0, 3);
  const rest = employees.slice(3);

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
                    className='flex flex-col items-center gap-2 w-[110px]'
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold ${podiumStyles.avatar[colIdx]}`}
                    >
                      {initials(emp.name)}
                    </div>

                    <p className='text-xs font-medium text-center leading-tight line-clamp-2'>
                      {emp.name}
                    </p>

                    <p className='text-xs text-muted-foreground'>
                      {emp.orders} orders
                    </p>

                    <div
                      className={`w-full rounded-t flex items-center justify-center ${podiumStyles.block[colIdx]} ${podiumStyles.blockBg[colIdx]}`}
                    >
                      <span
                        className={`text-lg font-semibold ${podiumStyles.rankColor[colIdx]}`}
                      >
                        #{rank}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4th+ */}
            {/* {rest.length > 0 && (
              <div className='border-t pt-3 space-y-2'>
                {rest.map((emp, i) => (
                  <div key={emp.userId} className='flex items-center gap-2'>
                    <span className='text-xs text-muted-foreground w-6 text-right'>
                      #{i + 4}
                    </span>
                    <span className='text-sm font-medium flex-1'>
                      {emp.name}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {emp.orders} orders
                    </span>
                  </div>
                ))}
              </div>
            )} */}
          </>
        )}
      </CardContent>
    </Card>
  );
}
