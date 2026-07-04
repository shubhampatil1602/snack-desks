import {
  UserStatsSkeleton,
  UserRankSkeleton,
  UserRecentOrdersSkeleton,
  UserHeatmapSkeleton,
  UserFavoriteItemsSkeleton,
  ProfileHeaderSkeleton,
} from "./_components/DashboardSkeletons";

export default function DashboardLoading() {
  return (
    <div className='space-y-3 px-4 animate-in fade-in duration-500'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div className='mb-3'>
          <h1 className='text-2xl font-heading tracking-wide'>Dashboard</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Your personal activity and statistics
          </p>
        </div>
      </div>

      <ProfileHeaderSkeleton />
      <UserStatsSkeleton />

      <div className='grid gap-3 lg:grid-cols-2'>
        <UserRankSkeleton />
        <UserRecentOrdersSkeleton />
      </div>

      <UserHeatmapSkeleton />
      <UserFavoriteItemsSkeleton />
    </div>
  );
}
