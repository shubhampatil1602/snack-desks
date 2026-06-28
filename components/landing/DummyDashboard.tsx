"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  IconChefHat,
  IconMenuOrder,
  IconGraph,
  IconHelp,
  IconSettings,
  IconUsersGroup,
  IconChartBar,
  IconHistory,
} from "@tabler/icons-react";
import { Logo } from "@/components/logo";

export function DummyDashboard() {
  const statsConfig = [
    {
      title: "Today's Revenue",
      value: "₹369.00",
      color: "from-chart-1 to-chart-1/80",
    },
    {
      title: "This Month Revenue",
      value: "₹5,231.89",
      color: "from-chart-2 to-chart-2/80",
    },
    {
      title: "All Time Revenue",
      value: "₹12,500.00",
      color: "from-chart-3 to-chart-3/80",
    },
    {
      title: "This Month Orders",
      value: "272",
      color: "from-chart-4 to-chart-4/80",
    },
    {
      title: "Approved Orders",
      value: "265",
      color: "from-chart-5 to-chart-5/80",
    },
    {
      title: "Average Order Value",
      value: "₹19.20",
      color: "from-primary to-primary/80",
    },
  ];

  return (
    <div className='flex h-[800px] w-full bg-background text-foreground overflow-hidden'>
      {/* Sidebar - Matching AppSidebar */}
      <div className='w-64 border-r border-border bg-sidebar hidden md:flex flex-col shrink-0'>
        <div className='flex h-12 items-center px-4 mt-2'>
          <div className='flex items-center gap-2 px-2 text-sidebar-foreground'>
            <Logo />
            <span className='text-base font-semibold tracking-tight'>
              SnackDesk.
            </span>
          </div>
        </div>

        <div className='px-3 py-4 flex-1'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2 px-3 py-2 bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium'>
              <IconGraph className='w-4 h-4' />
              Dashboard
            </div>
            <div className='flex items-center gap-2 px-3 py-2 text-sidebar-foreground/70 text-sm font-medium'>
              <IconMenuOrder className='w-4 h-4' />
              Order Window
            </div>
            <div className='flex items-center gap-2 px-3 py-2 text-sidebar-foreground/70 text-sm font-medium'>
              <IconChefHat className='w-4 h-4' />
              Menus
            </div>
            <div className='flex items-center gap-2 px-3 py-2 text-sidebar-foreground/70 text-sm font-medium'>
              <IconUsersGroup className='w-4 h-4' />
              Users
            </div>
            <div className='flex items-center gap-2 px-3 py-2 text-sidebar-foreground/70 text-sm font-medium'>
              <IconChartBar className='w-4 h-4' />
              Rankings
            </div>
            <div className='flex items-center gap-2 px-3 py-2 text-sidebar-foreground/70 text-sm font-medium'>
              <IconHistory className='w-4 h-4' />
              History
            </div>
          </div>
        </div>

        <div className='p-4 mt-auto'>
          <div className='flex items-center gap-2 px-3 py-2 text-sidebar-foreground/70 text-sm font-medium'>
            <IconSettings className='w-4 h-4' />
            Settings
          </div>
          <div className='flex items-center gap-2 px-3 py-2 text-sidebar-foreground/70 text-sm font-medium'>
            <IconHelp className='w-4 h-4' />
            Get Help
          </div>
        </div>

        {/* User Profile */}
        <div className='p-4 border-t border-border flex items-center gap-3 bg-sidebar'>
          <div className='w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs'>
            AD
          </div>
          <div className='flex flex-col text-sm truncate'>
            <span className='font-semibold text-sidebar-foreground truncate'>
              Admin User
            </span>
            <span className='text-xs text-sidebar-foreground/70 truncate'>
              admin@snackdesk.com
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col min-w-0 bg-background overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
        {/* Header */}
        <header className='h-12 border-b border-border flex items-center px-4 shrink-0 bg-background'>
          <div className='flex gap-2 items-center text-sm text-muted-foreground'>
            <span className='text-foreground font-medium'>Admin</span>
            <span>/</span>
            <span>Dashboard</span>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className='p-4 md:p-6 space-y-6'>
          <div className='flex items-start justify-between gap-4 flex-wrap'>
            <div className='mb-3'>
              <h1 className='text-2xl font-heading tracking-wide'>
                Hello, Admin User
              </h1>
              <p className='text-sm text-muted-foreground mt-1'>
                Here&apos;s what&apos;s happening across your organization.
              </p>
            </div>

            {/* Fake Period Picker */}
            <div className='flex items-center gap-1 border border-border p-1 bg-background text-sm shadow-sm'>
              <div className='px-3 py-1.5 bg-muted text-foreground font-medium shadow-sm'>
                This Month
              </div>
              <div className='px-3 py-1.5 text-muted-foreground'>Today</div>
              <div className='px-3 py-1.5 text-muted-foreground'>All Time</div>
            </div>
          </div>

          {/* Active Window Card Mock */}
          <div className='border border-border bg-card relative overflow-hidden'>
            {/* Dark mode friendly diagonal grid */}
            <div
              className='absolute inset-0 z-0'
              style={{
                backgroundImage: `
                  repeating-linear-gradient(45deg, var(--color-border) 0, var(--color-border) 1px, transparent 1px, transparent 20px),
                  repeating-linear-gradient(-45deg, var(--color-border) 0, var(--color-border) 1px, transparent 1px, transparent 20px)
                `,
                backgroundSize: "40px 40px",
                opacity: 0.2,
              }}
            />
            <div className='relative z-10 p-4 sm:p-6'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='flex items-center gap-3'>
                  <h2 className='text-xl font-semibold'>Evening Snacks</h2>
                  <Badge className='bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400 border-green-200 dark:border-green-800 px-1.5 py-1'>
                    ● Active
                  </Badge>
                </div>
                <Button size='sm' className='pointer-events-none'>
                  View Orders
                </Button>
              </div>

              <div className='flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-6'>
                <div>
                  <p className='text-sm text-muted-foreground'>Opened at</p>
                  <p className='font-medium'>04:30 PM</p>
                </div>
                <div className='text-left sm:text-center'>
                  <p className='text-3xl font-mono font-bold text-red-500'>
                    00:45:12
                  </p>
                  <p className='text-xs text-muted-foreground'>remaining</p>
                </div>
                <div className='flex gap-6 sm:gap-8'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Orders</p>
                    <p className='text-xl font-bold sm:text-center'>42</p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Approved</p>
                    <p className='text-xl font-bold sm:text-center'>38</p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Pending</p>
                    <p className='text-xl font-bold sm:text-center'>4</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {statsConfig.map((stat, idx) => (
              <Card
                key={idx}
                className='relative overflow-hidden py-3 px-3 border border-border/50 shadow-none'
              >
                <div className='p-2.5'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-muted-foreground'>
                        {stat.title}
                      </p>
                      <p className='text-2xl font-bold tracking-tight mt-0.5'>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Top Selling Items (Mock) */}
          <div className='grid gap-4 lg:grid-cols-2 pb-6'>
            <Card size='sm' className='border border-border/50 shadow-none'>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {[
                    { name: "Samosa", quantity: 145 },
                    { name: "Vada Pav", quantity: 98 },
                    { name: "Masala Chai", quantity: 87 },
                    { name: "Cold Coffee", quantity: 42 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className='mb-1.5 flex items-center justify-between'>
                        <span className='font-medium text-sm'>{item.name}</span>
                        <span className='text-xs text-muted-foreground'>
                          {item.quantity} sold
                        </span>
                      </div>
                      <Progress
                        value={(item.quantity / 145) * 100}
                        className='h-2'
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card size='sm' className='border border-border/50 shadow-none'>
              <CardHeader>
                <CardTitle>Top Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {[
                    { name: "Vikas Mali", orders: 24, spent: "₹1,240" },
                    { name: "Shubham Yadav", orders: 18, spent: "₹950" },
                    { name: "Shubham Patil", orders: 15, spent: "₹780" },
                    { name: "Parth Vaidh", orders: 12, spent: "₹620" },
                  ].map((emp, i) => (
                    <div key={i} className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 bg-primary/10 text-primary flex items-center justify-center text-xs font-medium'>
                          {emp.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className='font-medium text-sm'>{emp.name}</span>
                      </div>
                      <div className='flex flex-col items-end'>
                        <span className='font-medium text-sm'>{emp.spent}</span>
                        <span className='text-muted-foreground text-xs'>
                          {emp.orders} orders
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
