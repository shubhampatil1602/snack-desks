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
    };
  }[];
};
export function UsersTable({ organization, members }: UsersTableProps) {
  const pagination = usePagination({
    data: members,
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

      {/* Users Table */}
      <div className='border'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
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
