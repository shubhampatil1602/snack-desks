import { Skeleton } from "@/components/ui/skeleton";

export function MenuTableSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2 flex-wrap'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-9 w-24' />
        ))}
      </div>

      <div className='relative max-w-sm'>
        <Skeleton className='h-10 w-full' />
      </div>

      <div className='border'>
        <div className='divide-y flex flex-col'>
          <div className='h-12 bg-muted/50 animate-pulse'></div>
          <div className='h-12 bg-muted/50 animate-pulse'></div>
          <div className='h-12 bg-muted/50 animate-pulse'></div>
          <div className='h-12 bg-muted/50 animate-pulse'></div>
          <div className='h-12 bg-muted/50 animate-pulse'></div>
        </div>
      </div>

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
