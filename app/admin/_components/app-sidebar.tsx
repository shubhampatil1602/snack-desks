"use client";

import * as React from "react";
import {
  IconChefHat,
  IconMenuOrder,
  IconGraph,
  IconHelp,
  IconInnerShadowTop,
  IconSettings,
  IconUsersGroup,
  IconChartBar,
  IconHistory,
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

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconGraph,
    },
    {
      title: "Orders",
      url: "/admin/orders",
      icon: IconMenuOrder,
    },
    {
      title: "Menus",
      url: "/admin/menus",
      icon: IconChefHat,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: IconUsersGroup,
    },
    {
      title: "Rankings",
      url: "/admin/rankings",
      icon: IconChartBar,
    },
    {
      title: "History",
      url: "/admin/history",
      icon: IconHistory,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className='data-[slot=sidebar-menu-button]:p-1.5!'
            >
              <Link href='/'>
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
