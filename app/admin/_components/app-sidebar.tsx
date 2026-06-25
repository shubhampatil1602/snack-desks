"use client";

import * as React from "react";
import {
  IconChefHat,
  IconMenuOrder,
  IconGraph,
  IconHelp,
  IconSettings,
  IconUsersGroup,
  IconChartBar,
  IconHistory,
  IconBrain,
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
    // {
    //   title: "Ask SnackDesk",
    //   url: "/admin/ask-snackdesk",
    //   icon: IconBrain,
    // },
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconGraph,
    },
    {
      title: "Order Window",
      url: "/admin/order-window",
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
