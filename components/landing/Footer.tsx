import Link from "next/link";

export function Footer() {
  return (
    <footer className='border-t' id='footer'>
      <div className='mx-auto max-w-7xl px-6 py-12'>
        <div className='grid gap-8 md:grid-cols-3'>
          {/* Brand */}
          <div>
            <div className='flex items-center gap-2'>
              <div className='h-5 w-5 rounded-sm bg-primary' />

              <span className='font-semibold'>SnackDesk</span>
            </div>

            <p className='mt-3 text-sm text-muted-foreground'>
              Office snack ordering platform for modern teams.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className='font-medium'>Links</h4>

            <div className='mt-3 flex flex-col gap-2 text-sm text-muted-foreground'>
              <Link href='#features'>Features</Link>
              <Link href='#dashboard'>Dashboard</Link>
              <Link href='#rankings'>Rankings</Link>
              <Link href='#contact'>Contact</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className='font-medium'>Contact</h4>

            <a
              href='mailto:shubhamspatilnbr@gmail.com'
              className='mt-3 block text-sm text-muted-foreground hover:text-foreground'
            >
              shubhamspatilnbr@gmail.com
            </a>
          </div>
        </div>

        <div className='mt-10 border-t pt-6 text-sm text-muted-foreground'>
          © 2026 SnackDesk. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
