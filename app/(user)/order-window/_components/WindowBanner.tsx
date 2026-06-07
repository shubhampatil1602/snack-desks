import { CountdownTimer } from "./CountdownTimer";

type Props = {
  label: string;
  endsAt: string | Date | null;
  serverNow: number;
};

export function WindowBanner({ label, endsAt, serverNow }: Props) {
  return (
    <div className='relative overflow-hidden bg-card px-4 py-4 shadow'>
      {/* Paper Texture */}
      <div
        className='absolute inset-0 z-0 dark:hidden'
        style={{
          backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0),
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)
        `,
          backgroundSize: "8px 8px, 32px 32px, 32px 32px",
        }}
      />

      {/* Dark Texture */}
      <div
        className='absolute inset-0 z-0 hidden dark:block'
        style={{
          backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0),
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)
        `,
          backgroundSize: "8px 8px, 32px 32px, 32px 32px",
        }}
      />

      <div className='relative z-10'>
        {/* Top row */}
        <div className='mb-2 flex items-start justify-between'>
          <div>
            <h1 className='font-heading text-2xl leading-none tracking-wide text-foreground'>
              Active Order Window
            </h1>

            <p className='mt-1 font-heading italic uppercase tracking-wider text-muted-foreground'>
              {label}
            </p>
          </div>

          <div className='flex items-center gap-2 text-right'>
            <CountdownTimer endsAt={endsAt} serverNow={serverNow} />
          </div>
        </div>

        {/* Tagline */}
        <div className='bg-zinc-900 p-3 dark:bg-zinc-900/90 dark:border dark:border-zinc-700'>
          <p className='text-lg leading-relaxed text-zinc-100'>
            Chal bhidu, nasta order karle chal... apna pet apna sagga hai, baki
            sab moh-maaya hai!
          </p>
        </div>
      </div>
    </div>
  );
}
