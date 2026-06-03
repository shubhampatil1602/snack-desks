"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrganizationDetail } from "@/types/org";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building2 } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { DataPagination } from "@/components/ui/data-pagination";

interface OrgDetailProps {
  org: NonNullable<OrganizationDetail>;
}

export function OrgDetail({ org }: OrgDetailProps) {
  const [copied, setCopied] = useState(false);

  const pagination = usePagination({ data: org.members, itemsPerPage: 10 });

  async function copyInviteCode() {
    await navigator.clipboard.writeText(org.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className='space-y-6'>
      {/* Org header */}
      <div className='border bg-muted/30 p-5 space-y-4'>
        <Alert>
          <Building2 className='size-5' />
          <AlertTitle className='font-heading tracking-wider text-lg'>
            {org.name}
            <Badge variant='secondary' className='ml-2'>
              ({org._count.members} members)
            </Badge>
          </AlertTitle>
          <AlertDescription className='font-mono text-xs'>
            {org.slug}
          </AlertDescription>
        </Alert>

        <div className='flex items-center gap-4 pt-1 border-'>
          <div>
            <p className='text-xs text-muted-foreground mb-1'>Invite Code</p>
            <div className='flex items-center gap-2'>
              <span className='font-mono font-medium tracking-widest text-sm'>
                {org.inviteCode}
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

          <div className='border-l pl-4'>
            <p className='text-xs text-muted-foreground mb-1'>Created</p>
            <p className='text-sm'>
              {new Date(org.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Members table */}
      <div>
        <h2 className='text-sm font-medium mb-3'>Members</h2>
        <div className='border'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedData.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className='font-medium'>
                    {member.user.name}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {member.user.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.role === "owner" ? "default" : "secondary"
                      }
                    >
                      {member.role === "owner" ? "Admin" : "Member"}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {new Date(member.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DataPagination {...pagination} />
        </div>
      </div>
    </div>
  );
}
