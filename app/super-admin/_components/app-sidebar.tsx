"use client";

import * as React from "react";
import {
  IconCirclePlusFilled,
  IconDashboard,
  IconGraph,
  IconHelp,
  IconInnerShadowTop,
  IconSettings,
} from "@tabler/icons-react";

import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/auth-clients";
import Link from "next/link";
import { Session } from "@/lib/auth/auth";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/super-admin/dashboard",
      icon: IconGraph,
    },
    {
      title: "Create Organization",
      url: "/super-admin/create-org",
      icon: IconCirclePlusFilled,
    },
    {
      title: "Manage Organizations",
      url: "/super-admin/manage-org",
      icon: IconDashboard,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: Session;
}

export function AppSidebar({ session, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className='data-[slot=sidebar-menu-button]:p-1.5!'
            >
              <Link href='/super-admin/dashboard'>
                <IconInnerShadowTop className='size-5!' />
                <span className='text-base font-semibold'>Snack Desk.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        {session?.user && (
          <NavUser
            user={{
              name: session.user.name,
              email: session.user.email,
              avatar: session.user.image ?? "",
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
