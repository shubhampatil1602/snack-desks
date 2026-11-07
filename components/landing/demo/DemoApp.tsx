"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  IconChartBar,
  IconChefHat,
  IconGraph,
  IconHelp,
  IconHistory,
  IconMenuOrder,
  IconSettings,
  IconSparkles,
  IconUsersGroup,
} from "@tabler/icons-react";

import { Logo } from "@/components/logo";
import { Rankings } from "@/components/rankings/Rankings";
import { cn } from "@/lib/utils";
import { DemoAdminOrders } from "./DemoAdminOrders";
import { DemoAskSnacky } from "./DemoAskSnacky";
import { DemoDashboard } from "./DemoDashboard";
import { DemoHistory } from "./DemoHistory";
import { DemoOrderWindow } from "./DemoOrderWindow";
import { DemoUserDashboard } from "./DemoUserDashboard";
import { DemoUserHistory } from "./DemoUserHistory";
import { rankings, SAMPLE_PERIOD, USER_ID } from "./sample-data";

type Role = "admin" | "user";
type Screen = "dashboard" | "ask" | "order" | "rankings" | "history";
type NavItem = { title: string; icon: typeof IconGraph; screen?: Screen };

const ROLES: { role: Role; label: string; about: string; name: string; initials: string; email: string }[] = [
  {
    role: "admin",
    label: "Admin",
    about: "Runs the windows, menus and bills",
    name: "Meera Nair",
    initials: "MN",
    email: "meera@yourcompany.com",
  },
  {
    role: "user",
    label: "User",
    about: "Orders, shares and pays",
    name: "Riya Shah",
    initials: "RS",
    email: "riya@yourcompany.com",
  },
];

// the same sections each role has in the app; Menus and Users don't open here
const NAV: Record<Role, NavItem[]> = {
  admin: [
    { screen: "dashboard", title: "Dashboard", icon: IconGraph },
    { screen: "ask", title: "Ask Snacky", icon: IconSparkles },
    { screen: "order", title: "Order Window", icon: IconMenuOrder },
    { title: "Menus", icon: IconChefHat },
    { title: "Users", icon: IconUsersGroup },
    { screen: "rankings", title: "Rankings", icon: IconChartBar },
    { screen: "history", title: "History", icon: IconHistory },
  ],
  user: [
    { screen: "dashboard", title: "Dashboard", icon: IconGraph },
    { screen: "order", title: "Order Window", icon: IconMenuOrder },
    { screen: "rankings", title: "Rankings", icon: IconChartBar },
    { screen: "history", title: "History", icon: IconHistory },
  ],
};

const FOOT_NAV = [
  { title: "Settings", icon: IconSettings },
  { title: "Get Help", icon: IconHelp },
];

const NAV_ITEM =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-sidebar-foreground/70";

function DemoRankings({ role }: { role: Role }) {
  return (
    <div className='space-y-6 px-4 py-5'>
      <div>
        <p className='font-heading text-2xl'>{role === "admin" ? "Employee Rankings" : "Team Rankings"}</p>
        <p className='text-sm text-muted-foreground'>
          Most active employees based on approved orders in {SAMPLE_PERIOD}.
        </p>
      </div>
      <Rankings rankings={rankings} mode={role} currentUserId={role === "user" ? USER_ID : undefined} />
    </div>
  );
}

// A working copy of the app with a sample office loaded, for the landing page,
// seen as the admin or as an employee. Nothing in it reaches the server. It
// starts as a complete window, the height of the dashboard's top cards, so
// nothing is cut off and there's nothing to scroll past. On a desktop it keeps
// that height once opened further and scrolls inside; on a phone it just grows
// with the page.
export function DemoApp({ className }: { className?: string }) {
  const [role, setRole] = useState<Role>("admin");
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [opened, setOpened] = useState<string[]>([]);
  const [fullDashboards, setFullDashboards] = useState<Role[]>([]);
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  function lockHeight() {
    if (!lockedHeight && rootRef.current) setLockedHeight(Math.max(rootRef.current.offsetHeight, 720));
  }

  function showFullDashboard() {
    lockHeight();
    setFullDashboards((current) => [...current, role]);
    requestAnimationFrame(() => scrollerRef.current?.scrollBy({ top: 320, behavior: "smooth" }));
  }

  function go(nextRole: Role, next: Screen) {
    lockHeight();
    setRole(nextRole);
    setScreen(next);
    const key = `${nextRole}:${next}`;
    setOpened((current) => (current.includes(key) ? current : [...current, key]));
    scrollerRef.current?.scrollTo({ top: 0 });
  }

  // stays on the same section if the other role has it
  function switchRole(next: Role) {
    if (next !== role) go(next, NAV[next].some((item) => item.screen === screen) ? screen : "dashboard");
  }

  const person = ROLES.find((item) => item.role === role)!;
  const nav = NAV[role];
  const fullDashboard = fullDashboards.includes(role);
  const panels: Record<string, ReactNode> = {
    "admin:ask": <DemoAskSnacky />,
    "admin:order": <DemoAdminOrders />,
    "admin:rankings": <DemoRankings role='admin' />,
    "admin:history": <DemoHistory />,
    "user:order": <DemoOrderWindow />,
    "user:rankings": <DemoRankings role='user' />,
    "user:history": <DemoUserHistory />,
  };

  const title = nav.find((item) => item.screen === screen)?.title;

  return (
    <div
      ref={rootRef}
      role='region'
      aria-label='Sample SnackDesk app. All names and numbers are made up.'
      style={lockedHeight ? ({ "--demo-height": `${lockedHeight}px` } as CSSProperties) : undefined}
      className={cn(
        "@container/app relative flex flex-col border bg-background text-left text-foreground lg:h-(--demo-height)",
        className,
      )}
    >
      <div className='flex shrink-0 items-center gap-3 border-b bg-muted/40 px-3 py-2'>
        <span id='demo-view-label' className='text-xs font-medium text-muted-foreground'>
          View as
        </span>
        <div role='group' aria-labelledby='demo-view-label' className='flex border bg-background p-0.5'>
          {ROLES.map((item) => (
            <button
              key={item.role}
              type='button'
              aria-pressed={item.role === role}
              onClick={() => switchRole(item.role)}
              className={cn(
                "cursor-pointer px-4 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                item.role === role && "bg-primary text-primary-foreground hover:text-primary-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className='ml-auto hidden truncate text-xs text-muted-foreground @lg/app:block'>
          {person.name.split(" ")[0]}: {person.about.toLowerCase()}
        </span>
      </div>

      <div className='flex min-h-0 flex-1'>
      <aside className='hidden w-52 shrink-0 flex-col @5xl/app:w-64 border-r bg-sidebar text-sidebar-foreground @[45.5rem]/app:flex'>
        <div className='mt-2 flex h-12 items-center gap-2 px-4 @5xl/app:px-6'>
          <Logo />
          <span className='text-base font-semibold tracking-tight'>SnackDesk.</span>
        </div>
        <nav aria-label='Sample app sections' className='flex-1 space-y-1 px-3 py-4'>
          {nav.map((item) => {
            const target = item.screen;
            return (
              <button
                key={item.title}
                type='button'
                disabled={!target}
                aria-current={target === screen ? "page" : undefined}
                onClick={() => target && go(role, target)}
                className={cn(
                  NAV_ITEM,
                  target && "cursor-pointer hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  target === screen && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <item.icon className='h-4 w-4' />
                {item.title}
              </button>
            );
          })}
        </nav>
        <div className='space-y-1 px-3 pb-3'>
          {FOOT_NAV.map((item) => (
            <div key={item.title} className={NAV_ITEM}>
              <item.icon className='h-4 w-4' />
              {item.title}
            </div>
          ))}
        </div>
        <div className='flex items-center gap-3 border-t p-4'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-xs font-semibold text-primary-foreground'>
            {person.initials}
          </div>
          <div className='flex min-w-0 flex-col text-sm'>
            <span className='truncate font-semibold'>{person.name}</span>
            <span className='truncate text-xs text-sidebar-foreground/70'>{person.email}</span>
          </div>
        </div>
      </aside>

      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='flex h-12 shrink-0 items-center gap-2 border-b px-4 text-sm text-muted-foreground lg:px-6'>
          <span className='font-medium text-foreground'>{person.label}</span>
          <span>/</span>
          <span>{title}</span>
          {role === "admin" && (
            <span className='ml-auto hidden items-center gap-3 @[45.5rem]/app:flex'>
              <span className='text-xs'>Invite Code:</span>
              <span className='text-sm font-medium tracking-widest text-foreground'>CHAI42</span>
            </span>
          )}
        </header>

        {/* no sidebar on a narrow window, so the same sections become tabs */}
        <nav aria-label='Sample app sections' className='flex shrink-0 gap-1 overflow-x-auto border-b px-2 py-1.5 @[45.5rem]/app:hidden'>
          {nav.map((item) => {
            const target = item.screen;
            return target ? (
              <button
                key={item.title}
                type='button'
                aria-current={target === screen ? "page" : undefined}
                onClick={() => go(role, target)}
                className={cn(
                  "shrink-0 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground",
                  target === screen && "bg-muted text-foreground",
                )}
              >
                {item.title}
              </button>
            ) : null;
          })}
        </nav>

        <div
          ref={scrollerRef}
          className='min-h-0 flex-1 [scrollbar-width:none] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden'
        >
          {/* unmounted when hidden: Recharts can't measure a hidden container */}
          {screen === "dashboard" &&
            (role === "admin" ? (
              <DemoDashboard full={fullDashboard} onViewOrders={() => go("admin", "order")} />
            ) : (
              <DemoUserDashboard full={fullDashboard} />
            ))}
          {Object.entries(panels).map(
            ([key, panel]) =>
              opened.includes(key) && (
                <div key={key} className={cn(key !== `${role}:${screen}` && "hidden", "min-h-full")}>
                  {panel}
                </div>
              ),
          )}
        </div>

        {screen === "dashboard" && !fullDashboard && (
          <button
            type='button'
            onClick={showFullDashboard}
            className='flex shrink-0 cursor-pointer items-center justify-center gap-1.5 border-t bg-card py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
          >
            Show charts, rankings and more
            <ChevronDown className='h-3.5 w-3.5' />
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
