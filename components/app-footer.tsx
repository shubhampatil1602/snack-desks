import Link from "next/link";

export function AppFooter() {
  return (
    <footer className='mt-auto pt-8 pb-3 border-t text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3 px-6'>
      <div className='flex items-center gap-1.5'>
        <span className='font-semibold text-foreground/80 tracking-tight'>
          SnackDesk
        </span>
        <span>•</span>
        <span>© 2026</span>
      </div>
      <div className='flex items-center gap-4 text-muted-foreground'>
        <Link href='/terms' className='hover:text-foreground transition-colors'>
          Terms
        </Link>
        <Link
          href='/privacy'
          className='hover:text-foreground transition-colors'
        >
          Privacy
        </Link>
        <Link
          href='mailto:shubhamspatilnbr@gmail.com'
          className='hover:text-foreground transition-colors'
        >
          Support
        </Link>
      </div>
    </footer>
  );
}
