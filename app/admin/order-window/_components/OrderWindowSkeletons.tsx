import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function OrderWindowContentSkeleton() {
  return (
    <div className='space-y-6'>
      <Card className='border-primary/20 bg-primary/5'>
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-24 bg-primary/20' />
              <Skeleton className='h-8 w-48 bg-primary/20' />
            </div>

            <Skeleton className='h-10 w-32 bg-primary/20' />
          </div>
        </CardContent>
      </Card>

      <div className='w-full'>
        <div className='flex space-x-1 mb-4'>
          <Skeleton className='h-9 w-full' />
          <Skeleton className='h-9 w-full' />
        </div>

        <div className='border mt-4'>
          <div className='bg-muted/50 p-6 border-b'></div>
          <div className='divide-y'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='p-3 flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='space-y-1'>
                    <Skeleton className='h-4 w-32' />
                    <Skeleton className='h-3 w-16' />
                  </div>
                </div>
                <Skeleton className='h-6 w-20  -full' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
