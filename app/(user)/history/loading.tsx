import { UserHistorySkeleton } from "./_components/HistorySkeletons";

export default function UserHistoryLoading() {
  return (
    <div className='px-4 space-y-6 animate-in fade-in duration-500'>
      <div className='flex justify-between items-center pb-4 border-b flex-wrap gap-4'>
        <div>
          <div className='h-8 w-40 bg-muted animate-pulse mb-2' />
          <div className='h-4 w-64 bg-muted/60 animate-pulse' />
        </div>
        <div className='flex items-center gap-3'>
          <div className='h-10 w-40 bg-primary/20 animate-pulse border' />
          <div className='h-10 w-28 bg-muted/20 animate-pulse border' />
        </div>
      </div>

      <UserHistorySkeleton />
    </div>
  );
}
