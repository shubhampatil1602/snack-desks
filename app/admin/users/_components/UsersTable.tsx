"use client";

import { useMemo, useState } from "react";
import { Search, Trophy } from "lucide-react";
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
import { OrganizationHeader } from "@/components/admins/OrganizationHeader";
import {
  SortableTableHead,
  useColumnSort,
} from "@/components/ui/sortable-table-head";
import { DeleteUserButton } from "@/components/admins/DeleteUserButton";
import { GenerateResetTokenDialog } from "@/components/admins/GenerateResetTokenDialog";
import { ResetTokenCountdown } from "@/components/admins/ResetTokenCountdown";
import { cn } from "@/lib/utils";
import { SplitSummarySwitch } from "./SplitSummarySwitch";

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
    canViewGlobalSplit: boolean;
    orderWindowWins: number;
    user: {
      id: string;
      name: string;
      email: string;
      passwordResetExpiry: Date | null;
    };
  }[];
};
type Member = UsersTableProps["members"][number];
type UsersSortKey = "name" | "wins" | "joined";
type MemberFilter = "all" | "fullBill";

const SORT_VALUE: Record<UsersSortKey, (member: Member) => string | number> = {
  name: (member) => member.user.name.toLowerCase(),
  wins: (member) => member.orderWindowWins,
  joined: (member) => new Date(member.createdAt).getTime(),
};

const FULL_BILL_HINT =
  "Lets this person see the whole window's bill in their history, even when someone else is split master";

function formatJoined(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function UsersTable({ organization, members }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MemberFilter>("all");
  const { sort, toggleSort } = useColumnSort<UsersSortKey>();

  const counts: Record<MemberFilter, number> = {
    all: members.length,
    fullBill: members.filter((member) => member.canViewGlobalSplit).length,
  };

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = members.filter(
      (member) =>
        (filter === "all" || member.canViewGlobalSplit) &&
        (!query ||
          member.user.name.toLowerCase().includes(query) ||
          member.user.email.toLowerCase().includes(query)),
    );
    if (!sort) return filtered;

    const value = SORT_VALUE[sort.key];
    return [...filtered].sort((a, b) => {
      const delta = value(a) < value(b) ? -1 : value(a) > value(b) ? 1 : 0;
      return sort.desc ? -delta : delta;
    });
  }, [members, search, filter, sort]);

  const pagination = usePagination({
    data: visibleMembers,
    itemsPerPage: 10,
  });

  return (
    <div className='space-y-4'>
      <OrganizationHeader
        createdAt={organization.createdAt}
        inviteCode={organization.inviteCode}
        memberCount={organization.memberCount}
        name={organization.name}
        slug={organization.slug}
      />

      <div className='flex flex-wrap items-center gap-2'>
        <div
          role='group'
          aria-label='Show members'
          className='inline-flex h-8 divide-x border bg-card'
        >
          {(
            [
              { value: "all", label: "All" },
              { value: "fullBill", label: "Sees full bill" },
            ] as const
          ).map(({ value, label }) => {
            const selected = filter === value;
            return (
              <button
                key={value}
                type='button'
                aria-pressed={selected}
                onClick={() => setFilter(value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
                <span className='tabular-nums opacity-75'>{counts[value]}</span>
              </button>
            );
          })}
        </div>
        <label className='flex h-8 w-full items-center gap-2 border bg-card px-2.5 focus-within:border-ring sm:w-60'>
          <Search className='size-3.5 shrink-0 text-muted-foreground' />
          <input
            type='search'
            placeholder='Search name or email'
            aria-label='Search name or email'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
          />
        </label>
      </div>

      <div className='border bg-card'>
        {/* wide screens: a table */}
        <Table className='hidden md:table'>
          <TableHeader className='bg-muted'>
            <TableRow>
              <SortableTableHead
                label='Name'
                sortKey='name'
                sort={sort}
                onSort={toggleSort}
              />
              <SortableTableHead
                label='Wins'
                sortKey='wins'
                sort={sort}
                onSort={toggleSort}
                className='text-right'
              />
              <TableHead>
                <span title={FULL_BILL_HINT} className='cursor-help'>
                  Sees full bill
                </span>
              </TableHead>
              <SortableTableHead
                label='Joined'
                sortKey='joined'
                sort={sort}
                onSort={toggleSort}
              />
              <TableHead>Reset token</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pagination.paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='py-8 text-center text-muted-foreground'
                >
                  No members match
                </TableCell>
              </TableRow>
            ) : (
              pagination.paginatedData.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className='py-2'>
                    <div className='font-medium'>{member.user.name}</div>
                    <div className='text-xs text-muted-foreground'>
                      {member.user.email}
                    </div>
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {member.orderWindowWins}
                  </TableCell>
                  <TableCell>
                    <SplitSummarySwitch
                      memberId={member.id}
                      userName={member.user.name}
                      checked={member.canViewGlobalSplit}
                    />
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground tabular-nums'>
                    {formatJoined(member.createdAt)}
                  </TableCell>
                  <TableCell>
                    <ResetToken member={member} />
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

        {/* phones: a list */}
        <ul className='divide-y md:hidden'>
          {pagination.paginatedData.length === 0 && (
            <li className='py-8 text-center text-sm text-muted-foreground'>
              No members match
            </li>
          )}
          {pagination.paginatedData.map((member) => (
            <li key={member.id} className='space-y-2 px-3 py-2.5'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0 text-xs text-muted-foreground tabular-nums'>
                  <p className='truncate text-sm font-medium text-foreground'>
                    {member.user.name}
                  </p>
                  <p className='truncate'>{member.user.email}</p>
                  <p className='flex items-center gap-x-3'>
                    <span className='inline-flex items-center gap-1'>
                      <Trophy className='size-3 text-primary' />
                      {member.orderWindowWins}{" "}
                      {member.orderWindowWins === 1 ? "win" : "wins"}
                    </span>
                    <span>Joined {formatJoined(member.createdAt)}</span>
                  </p>
                </div>
                <SplitSummarySwitch
                  memberId={member.id}
                  userName={member.user.name}
                  checked={member.canViewGlobalSplit}
                />
              </div>
              <div className='flex items-center justify-between gap-3'>
                <ResetToken member={member} />
                <DeleteUserButton
                  userId={member.user.id}
                  userName={member.user.name}
                />
              </div>
            </li>
          ))}
        </ul>

        <DataPagination {...pagination} />
      </div>
    </div>
  );
}

// a running countdown while a reset code is live, else the button to make one
function ResetToken({ member }: { member: Member }) {
  const expiry = member.user.passwordResetExpiry;
  if (expiry && new Date(expiry) > new Date()) {
    return <ResetTokenCountdown expiresAt={expiry} />;
  }
  return <GenerateResetTokenDialog userId={member.user.id} />;
}
