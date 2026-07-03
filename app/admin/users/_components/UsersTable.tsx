"use client";

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
import { DeleteUserButton } from "@/components/admins/DeleteUserButton";
import { OrganizationHeader } from "@/components/admins/OrganizationHeader";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ResetTokenCountdown } from "@/components/admins/ResetTokenCountdown";
import { GenerateResetTokenDialog } from "@/components/admins/GenerateResetTokenDialog";

type UsersTableProps = {
  organization: {
    name: string;
    slug: string;
    inviteCode: string;
    createdAt: Date;
    memberCount: number;
  };
  members: {
    id: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      email: string;
      passwordResetExpiry: Date | null;
    };
  }[];
};
export function UsersTable({ organization, members }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const filteredMembers = members.filter((member) => {
    const query = search.toLowerCase();

    return (
      member.user.name.toLowerCase().includes(query) ||
      member.user.email.toLowerCase().includes(query)
    );
  });
  const pagination = usePagination({
    data: filteredMembers,
    itemsPerPage: 10,
  });

  return (
    <div className='space-y-6'>
      {/* Invite Code */}
      <OrganizationHeader
        createdAt={organization.createdAt}
        inviteCode={organization.inviteCode}
        memberCount={organization.memberCount}
        name={organization.name}
        slug={organization.slug}
      />

      <div className='relative'>
        <Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
        <Input
          placeholder='Search employee...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full pl-8 h-8 text-sm'
        />
      </div>

      {/* Users Table */}
      <div className='border overflow-x-auto'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Reset Token</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pagination.paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
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

                  <TableCell>
                    {member.user.passwordResetExpiry &&
                    new Date(member.user.passwordResetExpiry) > new Date() ? (
                      <ResetTokenCountdown
                        expiresAt={member.user.passwordResetExpiry}
                      />
                    ) : (
                      <GenerateResetTokenDialog userId={member.user.id} />
                    )}
                  </TableCell>

                  <TableCell>
                    <DeleteUserButton
                      userId={member.user.id}
                      userName={member.user.name}
                    />
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
