import { cn } from "@/lib/utils";

export function Loading() {
  return (
    <div className='grid grid-cols-2 gap-3'>
      <Skeleton className='h-[150px]' />
      <Skeleton className='h-[150px]' />
      <Skeleton className='h-[150px]' />
      <Skeleton className='h-[150px]' />
    </div>
  );
}

function Skeleton({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot='skeleton'
      className={cn("bg-muted animate-pulse block rounded-none", className)}
      {...props}
    />
  );
}
