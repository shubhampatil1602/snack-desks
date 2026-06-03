import Image from "next/image";

export function DashboardPreview() {
  return (
    <section id='dashboard' className='relative mx-auto max-w-7xl px-6 pb-16'>
      <div className='overflow-hidden rounded border bg-linear-to-br from-slate-50 via-white to-blue-50 p-6 shadow-sm'>
        <div className=''>
          {/* Dashboard Image */}
          <div className='relative'>
            <div className='overflow-hidden rounded border bg-background shadow-2xl'>
              <Image
                src='/dashboard-preview.png'
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
