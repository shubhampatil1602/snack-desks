"use client";

import * as React from "react";
import {
  IconCirclePlusFilled,
  IconDashboard,
  IconGraph,
  IconHelp,
  IconSettings,
} from "@tabler/icons-react";

import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import { HelpDialog } from "@/components/shell/help-dialog";
import { SettingsDialog } from "@/components/shell/settings-dialog";
import { openShellDialog } from "@/store/shell-dialog-store";
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
      onClick: () => openShellDialog("settings"),
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
      onClick: () => openShellDialog("help"),
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
          <>
            <NavUser
              user={{
                name: session.user.name,
                email: session.user.email,
                avatar: session.user.image ?? "",
              }}
            />
            <SettingsDialog
              user={{
                name: session.user.name,
                email: session.user.email,
                avatar: session.user.image,
              }}
            />
            <HelpDialog role='super-admin' />
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
