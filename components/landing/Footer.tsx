import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandX,
  IconInnerShadowTop,
} from "@tabler/icons-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className='border-t relative overflow-hidden' id='footer'>
      {/* Balanced bottom gradient */}
      <div className='absolute bottom-0 left-0 right-0 h-[200px] bg-linear-to-t from-emerald-500/8 via-emerald-500/3 to-transparent pointer-events-none' />

      {/* Gentle center glow */}
      <div className='absolute bottom-0 left-1/2 -translate-x-1/2 h-[150px] w-[400px] rounded-full bg-emerald-500/12 blur-[120px] pointer-events-none' />

      <div className='mx-auto max-w-7xl px-6 py-12 relative z-10'>
        <div className='grid gap-8 md:grid-cols-3'>
          {/* Brand */}
          <div>
            <div className='flex items-center gap-1'>
              <IconInnerShadowTop className='size-5!' />
              <span className='text-base font-semibold'>SnackDesk.</span>
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
              <Link href='mailto:your-email@gmail.com?subject=SnackDesk Inquiry'>
                Contact
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className='font-medium'>Contact</h4>

            <Link
              href='mailto:shubhamspatilnbr@gmail.com'
              className='mt-3 block text-sm text-muted-foreground hover:text-foreground'
            >
              shubhamspatilnbr@gmail.com
            </Link>
            <Link
              href='https://www.shubhamspatil.me/'
              target='_blank'
              className='block text-sm text-muted-foreground hover:text-foreground'
            >
              shubhamspatil.me
            </Link>
            <div className='flex space-x-2 mt-2'>
              <Link
                href='https://github.com/shubhampatil1602'
                target='_blank'
                className='block text-sm text-muted-foreground hover:text-foreground'
              >
                <IconBrandGithub stroke={2} size={20} />
              </Link>
              <Link
                href='https://www.linkedin.com/in/shubhmpatil/'
                target='_blank'
                className='block text-sm text-muted-foreground hover:text-foreground'
              >
                <IconBrandLinkedin stroke={2} size={20} />
              </Link>
              <Link
                href='https://x.com/shubhamsp1602'
                target='_blank'
                className='block text-sm text-muted-foreground hover:text-foreground'
              >
                <IconBrandX stroke={2} size={20} />
              </Link>
            </div>
          </div>
        </div>

        <div className='mt-10 border-t pt-6 text-sm text-muted-foreground'>
          © 2026 SnackDesk. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
