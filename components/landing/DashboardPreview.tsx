"use client";
import { useTheme } from "next-themes";
import Image from "next/image";

export function DashboardPreview() {
  const { theme } = useTheme();
  return (
    <section id='dashboard' className='relative mx-auto max-w-7xl px-6 pb-16'>
      <div className='overflow-hidden rounded border border-slate-200 dark:border-zinc-800 bg-linear-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-zinc-900 dark:to-slate-900 p-6 shadow-sm dark:shadow-xl'>
        <div className=''>
          {/* Dashboard Image */}
          <div className='relative'>
            <div className='overflow-hidden rounded border border-slate-200 dark:border-zinc-800 bg-background dark:bg-zinc-950 shadow-2xl'>
              <Image
                src={
                  theme === "dark"
                    ? "/dashboard-preview-dark.png"
                    : "/dashboard-preview.png"
                }
                alt='SnackDesk Dashboard'
                width={1600}
                height={900}
                className='h-auto w-full'
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
