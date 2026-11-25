"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";
import Link from "next/link";

// map raw path segments to readable labels
const segmentLabels: Record<string, string> = {
  // super admin
  "super-admin": "Super Admin",
  "manage-org": "Manage Organizations",
  "create-org": "Create Organization",

  // admin
  admin: "Admin",
  menu: "Menu Management",
  "order-window": "Order Window",
  "live-orders": "Live Orders",
  users: "User Management",
  history: "History",
  rankings: "Spend Rankings",

  // user
  orders: "Orders",
  profile: "Profile",

  // shared
  dashboard: "Dashboard",
};
export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // split path into segments, remove empty strings
  const segments = pathname.split("/").filter(Boolean);

  // build cumulative hrefs
  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");

    // check if this segment looks like an ID (not a readable word)
    const isId = segment.length > 15 || /^[a-z0-9_-]{20,}$/i.test(segment);

    // if it's an ID, try to get readable name from searchParams
    const label = isId
      ? (searchParams.get("name") ?? segment)
      : (segmentLabels[segment] ?? segment);

    return { href, label, isId };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
