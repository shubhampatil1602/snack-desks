import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function UserRankingSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Rich 10 Card */}
      <Card size='sm'>
        <CardHeader>
          <CardTitle>Rich 10</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {/* Podium Section Skeleton */}
            <div className='flex items-end justify-center gap-3'>
              {/* 2nd Place */}
              <div className='flex flex-col items-center gap-2 w-[120px]'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-3 w-12' />
                <div className='w-full h-[72px] rounded-t bg-slate-100/70 dark:bg-slate-900/30 flex flex-col items-center justify-center gap-1'>
                  <Skeleton className='h-6 w-8' />
                  <Skeleton className='h-3 w-16' />
                </div>
              </div>

              {/* 1st Place */}
              <div className='flex flex-col items-center gap-2 w-[120px]'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-3 w-12' />
                <div className='w-full h-[130px] rounded-t bg-yellow-50 dark:bg-yellow-950/20 flex flex-col items-center justify-center gap-1'>
                  <Skeleton className='h-6 w-8' />
                  <Skeleton className='h-3 w-16' />
                </div>
              </div>

              {/* 3rd Place */}
              <div className='flex flex-col items-center gap-2 w-[120px]'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-3 w-12' />
                <div className='w-full h-[56px] rounded-t bg-rose-50 dark:bg-rose-950/20 flex flex-col items-center justify-center gap-1'>
                  <Skeleton className='h-6 w-8' />
                  <Skeleton className='h-3 w-16' />
                </div>
              </div>
            </div>

            {/* Positions 4-10 Skeleton */}
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className='flex items-center justify-between border-b pb-2 last:border-0'
              >
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-4 w-8' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <div className='flex justify-center items-center gap-2'>
                  <Skeleton className='h-3 w-12' />
                  <span className='text-muted-foreground text-xs'>·</span>
                  <Skeleton className='h-3 w-20' />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
