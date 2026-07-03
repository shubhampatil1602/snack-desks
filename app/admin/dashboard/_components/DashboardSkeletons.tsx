import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ActiveWindowSkeleton() {
  return (
    <Card>
      <CardContent className='px-6'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-9 w-32 bg-primary/20' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsSkeleton() {
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

export function TopItemsSkeleton() {
  return (
    <Card size='sm'>
      <CardHeader>
        <CardTitle>Top Selling Items</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='space-y-1'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-16' />
              </div>
            </div>
            <Skeleton className='h-4 w-12' />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TopEmployeesSkeleton() {
  return (
    <Card size='sm' className='justify-between'>
      <CardHeader>
        <CardTitle>Most Active Employees</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex items-end justify-center gap-3 h-[180px]'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='flex flex-col items-center gap-2 w-[130px]'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-3 w-12' />
              <Skeleton
                className={`w-full rounded-t ${i === 1 ? "h-[130px]" : i === 0 ? "h-[72px]" : "h-[56px]"}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function HeatmapSkeleton() {
  return (
    <Card size='sm'>
      <CardHeader>
        <CardTitle>Organization Activity</CardTitle>
        <Skeleton className='h-3 w-48 mt-1.5' />
      </CardHeader>
      <CardContent>
        <Skeleton className='h-[180px] w-full rounded-md' />
      </CardContent>
    </Card>
  );
}

export function RecentWindowsSkeleton() {
  return (
    <Card size='sm'>
      <CardHeader>
        <CardTitle>Recent Order Windows</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='flex items-center justify-between'>
              <div className='space-y-1.5'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-48' />
              </div>
              <Skeleton className='h-8 w-20 rounded-md' />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
