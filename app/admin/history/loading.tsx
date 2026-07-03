import { AdminWindowHistorySkeleton } from "./_components/HistorySkeletons";

export default function HistoryLoading() {
  return (
    <div className='px-4 space-y-6'>
      <div className='flex justify-between items-center pb-4 border-b'>
        <div>
          <h1 className='text-2xl font-heading tracking-wide'>Order History</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            View history of your organization orders in...
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {/* Skeletons for buttons and PeriodPicker to match layout */}
          <div className='h-10 w-[140px] bg-primary/20 animate-pulse' />
          <div className='h-10 w-[120px] bg-primary/20 animate-pulse' />
          <div className='h-10 w-[240px] bg-muted animate-pulse' />
        </div>
      </div>

      <AdminWindowHistorySkeleton />
    </div>
  );
}
