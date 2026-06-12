import Link from "next/link";

import { ArrowRight } from "lucide-react";
import type { RecentOrganization } from "@/types/org";
import { OrgTable } from "../../manage-org/_components/OrgTable";

interface RecentOrgsTableProps {
  data: RecentOrganization[];
}

export function RecentOrgsTable({ data }: RecentOrgsTableProps) {
  return (
    <>
      <OrgTable data={data.slice(0, 5)} showPagination={false} />
      <div className='border-t px-4 py-3'>
        <Link
          href='/super-admin/manage-org'
          className='text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1'
        >
          View all organizations
          <ArrowRight className='h-3.5 w-3.5' />
        </Link>
      </div>
    </>
  );
}
