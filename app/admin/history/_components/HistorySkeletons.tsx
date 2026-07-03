import { Skeleton } from "@/components/ui/skeleton";

export function AdminWindowHistorySkeleton() {
  return (
    <div className='space-y-4'>
      {/* Filters Placeholder */}
      <div className='flex items-center gap-3'>
        <Skeleton className='h-9 w-32' />
        <Skeleton className='h-9 w-32' />
        <Skeleton className='h-9 w-32' />
      </div>

      <div className='flex items-center justify-between gap-2 my-3'>
        <div className='flex gap-3'>
          <Skeleton className='h-10 w-24' />
          <Skeleton className='h-10 w-56' />
          <Skeleton className='h-10 w-48' />
        </div>
        <Skeleton className='h-8 w-[150px]' />
      </div>

      {/* Windows List Placeholder */}
      <div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='border my-3'>
            <Skeleton className='h-12 w-full' />
          </div>
        ))}
      </div>

      {/* Pagination Placeholder */}
      <div className='flex items-center justify-between'>
        <Skeleton className='h-4 w-48' />
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-24' />
        </div>
      </div>
    </div>
  );
}
