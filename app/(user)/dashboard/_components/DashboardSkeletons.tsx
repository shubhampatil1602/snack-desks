import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserStatsSkeleton() {
  return (
    <div className='grid gap-3 sm:grid-cols-3'>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent>
            <Skeleton className='h-3 w-32 mb-1' />
            <Skeleton className='h-4.5 w-24' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function UserRankSkeleton() {
  return (
    <Card size='sm'>
      <CardHeader>
        <CardTitle>Your Rank In Your Org.</CardTitle>
      </CardHeader>

      <CardContent>
        <div className='space-y-6'>
          {/* Rank display with trophy icon */}
          <div className='flex items-center gap-4'>
            <Skeleton className='h-16 w-16 rounded-full' />

            <div>
              <Skeleton className='h-4 w-24 mb-1' />
              <Skeleton className='h-10 w-16' />
            </div>
          </div>

          {/* Motivational message */}
          <Skeleton className='h-5 w-64' />

          {/* Stats grid */}
          <div className='grid grid-cols-2 mt-20 gap-4'>
            <div>
              <Skeleton className='h-4 w-24 mb-2' />
              <Skeleton className='h-7 w-32' />
            </div>

            <div>
              <Skeleton className='h-4 w-16 mb-2' />
              <Skeleton className='h-7 w-20' />
            </div>
          </div>

          {/* Button */}
          <Skeleton className='h-10 w-full bg-primary/20' />
        </div>
      </CardContent>
    </Card>
  );
}

export function UserRecentOrdersSkeleton() {
  return (
    <Card size='sm'>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className='flex items-center justify-between pb-3 border-b last:border-0 last:pb-0'
            >
              <div className='space-y-1.5'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-5 w-20' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <Skeleton className='h-3 w-32' />
              </div>
              <Skeleton className='h-5 w-16' />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function UserFavoriteItemsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-5 w-40 mb-2' />
        <Skeleton className='h-4 w-48' />
      </CardHeader>
      <CardContent>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className='flex flex-col items-center p-4 border bg-muted/20'
            >
              <div className='relative w-16 h-16 mb-4'>
                <Skeleton className='h-full w-full rounded-none' />
              </div>
              <Skeleton className='h-4 w-24 mb-2' />
              <Skeleton className='h-3 w-16 mb-4' />
              <Skeleton className='h-5 w-20' />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function UserHeatmapSkeleton() {
  return (
    <Card className='mb-3'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div>
            <Skeleton className='h-5 w-40 mb-1' />
            <Skeleton className='h-3 w-48' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-32' />
            <Skeleton className='h-8 w-8' />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto pb-4'>
          <Skeleton className='h-[160px] w-full min-w-[600px] mt-4' />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className='border bg-card p-5 mb-3 shadow-sm overflow-hidden relative'>
      <div className='flex flex-col md:flex-row gap-6 md:items-center'>
        <Skeleton className='h-16 w-16 rounded-full' />
        <div className='flex-1 space-y-3'>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-4 w-40' />
        </div>
      </div>
    </div>
  );
}
