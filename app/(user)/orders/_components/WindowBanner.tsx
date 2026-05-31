import { CountdownTimer } from "./CountdownTimer";

type Props = {
  label: string;
  endsAt: string | Date | null;
};

export function WindowBanner({ label, endsAt }: Props) {
  return (
    <div className='relative border shadow bg-white px-4 py-4'>
      {/* Top row */}
      <div className='flex items-start justify-between mb-2'>
        <div>
          <h1 className='font-heading text-2xl tracking-wide leading-none text-black'>
            Active Order Window
          </h1>
          <p className='uppercase font-heading italic tracking-wider text-neutral-500 mt-1'>
            {label}
          </p>
        </div>
        <div className='flex items-center gap-2 text-right'>
          <CountdownTimer endsAt={endsAt} />
        </div>
      </div>

      {/* <hr className='border-t-[1.5px] border-black my-3.5' /> */}

      {/* Tagline */}
      <div className='bg-black p-3'>
        <p className='font-mon tracking-wides italic text-lg text-white leading-relaxed'>
          Chal bhidu, nasta order karle chal... apna pet apna sagga hai, baki
          sab moh-maaya hai re baba!
        </p>
      </div>
    </div>
  );
}
