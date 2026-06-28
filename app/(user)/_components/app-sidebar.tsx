"use client";

import * as React from "react";
import {
  IconMenuOrder,
  IconGraph,
  IconSettings,
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

import Link from "next/link";
import { Session } from "@/lib/auth/auth";
import { Logo } from "@/components/logo";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconGraph,
    },
    {
      title: "Order Window",
      url: "/order-window",
      icon: IconMenuOrder,
    },
    {
      title: "Rankings",
      url: "/rankings",
      icon: IconChartBar,
    },
    {
      title: "History",
      url: "/history",
      icon: IconHistory,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
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
              <Link href='/'>
                <Logo />
                <span className='text-base font-semibold'>SnackDesk.</span>
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
