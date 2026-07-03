import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function OrderWindowSkeleton() {
  return (
    <div className='w-full space-y-6 animate-in fade-in duration-500'>
      {/* Banner Skeleton */}
      <Skeleton className='h-[120px] w-full rounded-none' />

      {/* Main Content Layout */}
      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Menu Items Grid Skeleton */}
        <div className='flex-1'>
          {/* Categories Tab Skeleton */}
          <div className='flex items-center gap-2 mb-6 overflow-x-auto pb-2'>
            <Skeleton className='h-8 w-24 shrink-0 rounded-none' />
            <Skeleton className='h-8 w-20 shrink-0 rounded-none' />
            <Skeleton className='h-8 w-28 shrink-0 rounded-none' />
            <Skeleton className='h-8 w-24 shrink-0 rounded-none' />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 gap-4'>
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className='rounded-none h-40 animate-pulse'></Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
