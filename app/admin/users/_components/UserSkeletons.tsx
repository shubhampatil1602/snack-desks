import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function UsersTableSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Org Info Card */}
      <div className='border bg-muted/30 p-5 space-y-4'>
        <div className='flex items-start gap-3'>
          <Skeleton className='h-5 w-5 mt-1' />
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-7 w-40' />
              <Skeleton className='h-5 w-24' />
            </div>
            <Skeleton className='h-4 w-48 mt-1' />
          </div>
        </div>

        <div className='flex items-center gap-4 pt-1'>
          <div>
            <Skeleton className='h-3 w-20 mb-1' />
            <div className='flex items-center gap-2'>
              <Skeleton className='h-5 w-32' />
              <Skeleton className='h-7 w-7' />
            </div>
          </div>

          <div className='border-l pl-4'>
            <Skeleton className='h-3 w-16 mb-1' />
            <Skeleton className='h-5 w-28' />
          </div>
        </div>
      </div>

      {/* Search and Table Card */}

      <div>
        {/* Search Input */}
        <div className='mb-4'>
          <Skeleton className='w-full h-8 pl-8' />
        </div>

        {/* Users Table */}
        <div className='border overflow-x-auto'>
          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className='flex border-b last:border-0 h-[60px]'
            ></Skeleton>
          ))}
        </div>

        {/* Pagination */}
        <div className='flex items-center justify-between pt-4 border-t mt-4'>
          <Skeleton className='h-4 w-24' />
          <div className='flex gap-2'>
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-8' />
          </div>
        </div>
      </div>
    </div>
  );
}
