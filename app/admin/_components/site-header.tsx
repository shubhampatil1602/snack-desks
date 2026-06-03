"use client";

import { Button } from "@/components/ui/button";
import { DynamicBreadcrumb } from "@/components/ui/dynamic-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Check, Copy } from "lucide-react";
import { Suspense, useState } from "react";

export function SiteHeader({ inviteCode }: { inviteCode: string | undefined }) {
  const [copied, setCopied] = useState(false);
  async function copyInviteCode() {
    await navigator.clipboard.writeText(inviteCode!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mx-2 data-[orientation=vertical]:h-9'
        />
        <Suspense fallback={null}>
          <DynamicBreadcrumb />
        </Suspense>
        <div className='ml-auto flex justify-center items-center gap-3'>
          <p className='text-xs text-muted-foreground'>Invite Code:</p>
          <div className='flex items-center gap-2'>
            <span className='font-medium tracking-widest text-sm'>
              {inviteCode}
            </span>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={copyInviteCode}
            >
              {copied ? (
                <Check className='h-3.5 w-3.5 text-green-600' />
              ) : (
                <Copy className='h-3.5 w-3.5' />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
