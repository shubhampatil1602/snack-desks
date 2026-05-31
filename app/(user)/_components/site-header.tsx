"use client";

import { DynamicBreadcrumb } from "@/components/ui/dynamic-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Suspense } from "react";
import { CartButton } from "./cart-button";

export function SiteHeader() {
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
        <div className='ml-auto'>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
