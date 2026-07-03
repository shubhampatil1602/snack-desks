import {
  ActiveWindowSkeleton,
  HeatmapSkeleton,
  RecentWindowsSkeleton,
  StatsSkeleton,
  TopEmployeesSkeleton,
  TopItemsSkeleton,
} from "./_components/DashboardSkeletons";

export default function DashboardLoading() {
  return (
    <div className='space-y-3 px-4 w-full'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div className='mb-3'>
          <h1 className='text-2xl font-heading tracking-wide'>Hello, ...</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Here&apos;s what&apos;s happening across your organization.
          </p>
        </div>

        {/* Placeholder for the PeriodPicker to keep layout stable */}
        <div className='h-10 w-[240px] bg-muted animate-pulse rounded-md' />
      </div>

      <ActiveWindowSkeleton />
      <StatsSkeleton />

      <div className='grid gap-3 lg:grid-cols-2'>
        <TopItemsSkeleton />
        <TopEmployeesSkeleton />
      </div>

      <HeatmapSkeleton />
      <RecentWindowsSkeleton />
    </div>
  );
}
