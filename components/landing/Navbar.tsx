import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Session } from "@/lib/auth/auth";
import { ModeToggle } from "../theme/theme-button";
import { Logo } from "../logo";
import { GET_STARTED_MAILTO } from "./links";

type LandingNavbarProps = {
  session: Session | null;
};

export function LandingNavbar({ session }: LandingNavbarProps) {
  return (
    <header className='sticky top-0 z-50 border-b bg-background/60 backdrop-blur'>
      <div className='mx-auto flex h-14 max-w-7xl items-center justify-between px-6'>
        {/* Left */}
        <div className='flex items-center gap-8'>
          <Link href='/' className='flex items-center gap-2'>
            <Logo />
            <span className='text-base font-semibold'>SnackDesk.</span>
          </Link>

          <nav className='hidden items-center gap-6 text-sm text-muted-foreground md:flex'>
            <Link
              href='#how-it-works'
              className='transition-colors hover:text-foreground'
            >
              How it works
            </Link>

            <Link
              href='#features'
              className='transition-colors hover:text-foreground'
            >
              Features
            </Link>

            <Link
              href='#footer'
              className='transition-colors hover:text-foreground'
            >
              Contact
            </Link>
          </nav>
        </div>

        {/* Right */}
        <div className='flex items-center gap-2'>
          <ModeToggle />

          {session ? (
            session.user.role === "admin" ? (
              <Button asChild size='sm'>
                <Link href='/admin/dashboard'>Dashboard</Link>
              </Button>
            ) : session.user.role === "super_admin" ? (
              <Button asChild size='sm'>
                <Link href='/super-admin/dashboard'>Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size='sm'>
                <Link href='/dashboard'>Dashboard</Link>
              </Button>
            )
          ) : (
            <>
              <Button asChild size='sm' variant='ghost'>
                <Link href='/login'>Log in</Link>
              </Button>
              <Button asChild size='sm' className='hidden sm:inline-flex'>
                <Link href={GET_STARTED_MAILTO}>Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
