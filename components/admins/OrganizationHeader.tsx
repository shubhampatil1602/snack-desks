"use client";

import { useState } from "react";
import { Building2, Check, Copy } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  name: string;
  slug: string;
  inviteCode: string;
  createdAt: Date;
  memberCount: number;
};

export function OrganizationHeader({
  name,
  slug,
  inviteCode,
  createdAt,
  memberCount,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div className='border bg-muted/30 p-5 space-y-4'>
      <Alert>
        <Building2 className='size-5' />

        <AlertTitle className='font-heading tracking-wider text-lg'>
          {name}

          <Badge variant='secondary' className='ml-2'>
            ({memberCount} members)
          </Badge>
        </AlertTitle>

        <AlertDescription className='font-mono text-xs'>
          {slug}
        </AlertDescription>
      </Alert>

      <div className='flex items-center gap-4 pt-1'>
        <div>
          <p className='text-xs text-muted-foreground mb-1'>Invite Code</p>

          <div className='flex items-center gap-2'>
            <span className='font-mono font-medium tracking-widest text-sm'>
              {inviteCode}
            </span>

            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={copyCode}
            >
              {copied ? (
                <Check className='h-3.5 w-3.5 text-green-600' />
              ) : (
                <Copy className='h-3.5 w-3.5' />
              )}
            </Button>
          </div>
        </div>

        <div className='border-l pl-4'>
          <p className='text-xs text-muted-foreground mb-1'>Created</p>

          <p className='text-sm'>
            {new Date(createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
