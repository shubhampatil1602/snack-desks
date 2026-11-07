import Link from "next/link";

const LINKS = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "mailto:shubhamspatilnbr@gmail.com?subject=SnackDesk Inquiry", label: "Contact" },
];

export function Footer() {
  return (
    <footer id='footer' className='mt-20 border-t text-sm text-muted-foreground lg:mt-28'>
      <div className='mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-4 sm:px-6'>
        <p>© 2026 SnackDesk. Names and numbers in the sample office are made up.</p>
        <nav aria-label='Footer' className='flex flex-wrap gap-x-5'>
          {LINKS.map((link) => (
            <Link key={link.label} href={link.href} className='py-2 transition-colors hover:text-foreground'>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
