import { UserRankingSkeleton } from "./_components/RankingSkeletons";

export default function UserRankingsLoading() {
  return (
    <div className='px-4 space-y-6 animate-in fade-in duration-500'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-2xl font-heading'>Rankings</h1>
          <div className='h-4 w-64 bg-muted/60 animate-pulse mt-1' />
        </div>
        <div className='h-10 w-[150px] bg-muted/20 animate-pulse border' />
      </div>

      <UserRankingSkeleton />
    </div>
  );
}
