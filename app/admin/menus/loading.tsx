import { MenuTableSkeleton } from "./_components/MenuSkeletons";

export default function MenusLoading() {
  return (
    <div className='px-4 w-full'>
      <h1 className='text-2xl font-heading tracking-wide'>Menus</h1>

      <div className='flex items-center justify-between mb-6'>
        <div>
          <div className='h-5 w-64 bg-muted animate-pulse mt-1' />
        </div>
        <div className='space-x-3 flex'>
          <div className='h-9 sm:w-28 bg-primary/20 animate-pulse' />
          <div className='h-9 sm:w-32 bg-muted animate-pulse' />
          <div className='h-9 sm:w-28 bg-muted animate-pulse' />
        </div>
      </div>

      <MenuTableSkeleton />
    </div>
  );
}
