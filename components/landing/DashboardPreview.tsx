import Image from "next/image";

export function DashboardPreview() {
  return (
    <section id='dashboard' className='relative mx-auto max-w-7xl px-6 pb-16'>
      <div className='overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 shadow-sm dark:border-zinc-800 dark:from-slate-950 dark:via-zinc-900 dark:to-slate-900 dark:shadow-xl'>
        <div className='relative overflow-hidden rounded-xl border border-slate-200 bg-background shadow-2xl dark:border-zinc-800 dark:bg-zinc-950'>
          <Image
            src='/dashboard-preview.png'
            alt='SnackDesk Dashboard'
            width={1600}
            height={900}
            priority
            className='h-auto w-full dark:hidden'
          />

          <Image
            src='/dashboard-preview-dark.png'
            alt='SnackDesk Dashboard'
            width={1600}
            height={900}
            priority
            className='hidden h-auto w-full dark:block'
          />
        </div>
      </div>
    </section>
  );
}
