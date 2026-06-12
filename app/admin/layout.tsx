import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import { SiteHeader } from "./_components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAdmin } from "@/actions/user";
import { prisma } from "@/lib/db";
import { SSEProvider } from "@/providers/sse-provider";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { member, session } = await requireAdmin();

  const organization = await prisma.organization.findUnique({
    where: {
      id: member.organizationId,
    },
    select: {
      inviteCode: true,
      realtimeEnabled: true,
    },
  });

  return (
    <SSEProvider enabled={organization?.realtimeEnabled}>
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
            <SiteHeader inviteCode={organization?.inviteCode} />
            <div className='flex flex-1 flex-col'>
              <div className='@container/main flex flex-1 flex-col gap-2'>
                <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-5 h-full px-3'>
                  {children}
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </SSEProvider>
  );
}
