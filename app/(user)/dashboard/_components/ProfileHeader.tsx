"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Building2, CalendarDays, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { SplitMasterBadge } from "./SplitMasterBadge";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  member: {
    createdAt: Date;
    organization?: {
      name: string;
      inviteCode?: string;
    } | null;
  };
  splitMasterWins: number;
}

export function ProfileHeader({
  user,
  member,
  splitMasterWins,
}: ProfileHeaderProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!member.organization?.inviteCode) return;
    await navigator.clipboard.writeText(member.organization.inviteCode);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <Card size='sm'>
      <CardContent className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
        <div className='flex items-center gap-3'>
          <div className='hidden h-16 w-16 rounded-full bg-primary/10 sm:flex items-center justify-center'>
            <User className='h-8 w-8 text-primary' />
          </div>
          <div>
            <h1 className='text-2xl font-heading tracking-wide'>{user.name}</h1>
            <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <Mail className='h-4 w-4 opacity-70' />
                <span>{user.email}</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-muted-foreground/40 hidden sm:inline px-1'>
                  •
                </span>
                <Building2 className='h-4 w-4 opacity-70' />
                <span>{member.organization?.name || "Your Org"}</span>
              </div>
              {member.organization?.inviteCode && (
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground/40 hidden sm:inline px-1'>
                    •
                  </span>
                  <span className='font-mono font-medium tracking-widest text-sm text-foreground'>
                    {member.organization.inviteCode}
                  </span>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6 -ml-1'
                    onClick={copyCode}
                  >
                    {copied ? (
                      <Check className='h-3.5 w-3.5 text-green-600' />
                    ) : (
                      <Copy className='h-3.5 w-3.5 text-muted-foreground hover:text-foreground' />
                    )}
                  </Button>
                </div>
              )}

              <div className='flex items-center gap-2'>
                <span className='text-muted-foreground/40 hidden sm:inline px-1'>
                  •
                </span>
                <CalendarDays className='h-4 w-4 opacity-70' />
                <span>Member since {format(member.createdAt, "MMM yyyy")}</span>
              </div>
            </div>
          </div>
        </div>

        <SplitMasterBadge wins={splitMasterWins} />
      </CardContent>
    </Card>
  );
}
