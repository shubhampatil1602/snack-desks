import { cn } from "@/lib/utils";
import { ShopBreakdownInfo } from "@/components/orders/ShopBreakdownInfo";
import { Skeleton } from "@/components/ui/skeleton";

export type Stat = {
  label: string;
  value: string;
  note: string;
  breakdown?: Record<string, number>;
  dim?: boolean;
};

// a titled strip of three numbers; stacked rows on narrow phones
export function StatGroup({ title, stats }: { title: string; stats: Stat[] }) {
  return (
    <section className='border bg-card'>
      <h2 className='border-b px-4 py-2.5 text-xs font-semibold text-muted-foreground'>
        {title}
      </h2>
      <div className='grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className='flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 px-4 py-3 sm:block sm:space-y-0.5 sm:py-3.5'
          >
            <p className='text-xs text-muted-foreground'>{stat.label}</p>
            <div className='flex items-center gap-1.5 sm:mt-0.5'>
              <p
                className={cn(
                  "whitespace-nowrap text-xl font-semibold tracking-tight tabular-nums sm:text-2xl",
                  stat.dim && "text-muted-foreground",
                )}
              >
                {stat.value}
              </p>
              {stat.breakdown && Object.keys(stat.breakdown).length > 0 && (
                <ShopBreakdownInfo breakdown={stat.breakdown} />
              )}
            </div>
            <p className='basis-full text-xs text-muted-foreground'>
              {stat.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StatGroupsSkeleton() {
  return (
    <div className='grid gap-3 lg:grid-cols-2'>
      {Array.from({ length: 2 }).map((_, group) => (
        <div key={group} className='border bg-card'>
          <div className='border-b px-4 py-2.5'>
            <Skeleton className='h-3 w-20' />
          </div>
          <div className='grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='space-y-2 px-4 py-3.5'>
                <Skeleton className='h-3 w-14' />
                <Skeleton className='h-6 w-28' />
                <Skeleton className='h-3 w-20' />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
