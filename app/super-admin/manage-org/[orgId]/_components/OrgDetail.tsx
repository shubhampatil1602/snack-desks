"use client";

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

import { usePagination } from "@/hooks/use-pagination";
import { DataPagination } from "@/components/ui/data-pagination";
import { DeleteUserButton } from "@/components/admins/DeleteUserButton";
import { OrganizationHeader } from "@/components/admins/OrganizationHeader";

interface OrgDetailProps {
  org: NonNullable<OrganizationDetail>;
}

export function OrgDetail({ org }: OrgDetailProps) {
  const pagination = usePagination({ data: org.members, itemsPerPage: 10 });

  return (
    <div className='space-y-6'>
      {/* Org header */}
      <OrganizationHeader
        createdAt={org.createdAt}
        inviteCode={org.inviteCode}
        memberCount={org._count.members}
        name={org.name}
        slug={org.slug}
      />

      {/* Members table */}
      <div className='border'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
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
                    variant={member.role === "owner" ? "default" : "secondary"}
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
                <TableCell>
                  <DeleteUserButton
                    userId={member.user.id}
                    userName={member.user.name}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DataPagination {...pagination} />
      </div>
    </div>
  );
}
