"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/use-pagination";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UsersTableProps = {
  inviteCode: string;
  members: {
    id: string;
    createdAt: Date;
    user: {
      name: string;
      email: string;
    };
  }[];
};

export function UsersTable({ inviteCode, members }: UsersTableProps) {
  const [copied, setCopied] = useState(false);

  const pagination = usePagination({
    data: members,
    itemsPerPage: 10,
  });

  async function copyInviteCode() {
    await navigator.clipboard.writeText(inviteCode);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div className='space-y-6'>
      {/* Invite Code */}
      <div className='border bg-muted/30 p-4'>
        <p className='text-xs text-muted-foreground mb-1'>
          Invite teammates using this code
        </p>

        <div className='flex items-center gap-2'>
          <span className='font-mono font-medium tracking-widest'>
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

      {/* Users Table */}
      <div className='border'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pagination.paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className='text-center text-muted-foreground py-8'
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              pagination.paginatedData.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className='font-medium'>
                    {member.user.name}
                  </TableCell>

                  <TableCell className='text-muted-foreground'>
                    {member.user.email}
                  </TableCell>

                  <TableCell className='text-sm text-muted-foreground'>
                    {new Date(member.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <DataPagination {...pagination} />
      </div>
    </div>
  );
}
