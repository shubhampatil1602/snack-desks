import { RankingSkeleton } from "./_components/RankingSkeletons";

export default function RankingsLoading() {
  return (
    <div className='space-y-6 px-4 w-full'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-2xl font-heading'>Employee Rankings</h1>
          <p className='text-sm text-muted-foreground'>
            Most active employees based on approved orders in ...
          </p>
        </div>

        <div className='h-10 w-[120px] bg-muted animate-pulse' />
      </div>

      <RankingSkeleton />
    </div>
  );
}
