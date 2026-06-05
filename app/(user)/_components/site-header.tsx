"use client";

import { DynamicBreadcrumb } from "@/components/ui/dynamic-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Suspense } from "react";
import { CartButton } from "./cart-button";
import { LiveUserSSE } from "./live-user-sse";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ModeToggle } from "@/components/theme/theme-button";

type SiteHeaderProps = {
  activeWindow: {
    id: string;
    label: string;
    endsAt: Date | null;
  } | null;
};

export function SiteHeader({ activeWindow }: SiteHeaderProps) {
  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mx-2 data-[orientation=vertical]:h-9'
        />
        <Suspense fallback={null}>
          <DynamicBreadcrumb />
        </Suspense>

        <div className='ml-auto flex items-center gap-2'>
          <ModeToggle />
          {activeWindow && (
            <div className='relative inline-block'>
              <Button size='sm' variant='outline'>
                <Link href='/order-window'>{activeWindow.label}</Link>
              </Button>
              <span className='absolute -top-1 -right-1 flex h-3 w-3'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                <span className='relative inline-flex rounded-full h-3 w-3 bg-emerald-500'></span>
              </span>
            </div>
          )}

          <LiveUserSSE />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
