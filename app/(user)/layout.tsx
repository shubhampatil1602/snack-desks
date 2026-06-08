import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import { SiteHeader } from "./_components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authIsRequired } from "@/actions/user";
import { prisma } from "@/lib/db";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await authIsRequired();
  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (!member) return null;
  const activeWindow = await prisma.orderWindow.findFirst({
    where: {
      organizationId: member.organizationId,
      status: "active",
    },
    select: {
      id: true,
      label: true,
      endsAt: true,
    },
  });

  return (
    <div>
      <TooltipProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant='inset' session={session} />
          <SidebarInset>
            <SiteHeader activeWindow={activeWindow} />
            <div className='flex flex-1 flex-col bg-for'>
              <div className='@container/main flex flex-1 flex-col gap-2'>
                <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-5 h-full px-3'>
                  {children}
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}
