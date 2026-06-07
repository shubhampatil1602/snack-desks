import { requireAdmin } from "@/actions/user";
import {
  getActiveWindow,
  getTodaysWindows,
} from "@/modules/order-window/queries";
import { prisma } from "@/lib/db";
import { ActiveWindowCard } from "./_components/ActiveWindowCard";
import { CreateWindowForm } from "./_components/CreateWindowForm";
import { TodaysWindowsList } from "./_components/TodaysWindowsList";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs";
import { getLiveOrders } from "@/modules/orders/admin-queries";
import { LiveOrdersTable } from "./_components/LiveOrdersTable";
import { LiveOrdersSSE } from "./_components/LiveOrdersSSE";

export default async function AdminOrderWindowPage() {
  const { session } = await requireAdmin();

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  const [activeWindow, todaysWindows] = member
    ? await Promise.all([
        getActiveWindow(member.organizationId),
        getTodaysWindows(member.organizationId),
      ])
    : [null, []];

  const liveOrders = activeWindow ? await getLiveOrders(activeWindow.id) : [];
  const serverNow = new Date().getTime();

  return (
    <div className='px-4 space-y-6'>
      <div>
        <h1 className='text-2xl font-heading tracking-wide'>Orders</h1>
        <p className='text-sm text-muted-foreground mt-1'>
          Manage order windows and live orders
        </p>
      </div>

      {/* active window or create form */}
      {activeWindow ? (
        <>
          <ActiveWindowCard window={activeWindow} serverNow={serverNow} />
          <Tabs defaultValue='active-orders'>
            <TabsList className='w-full mb-1'>
              <TabsTrigger value='active-orders'>Active Orders</TabsTrigger>

              <TabsTrigger value='recent-windows'>Recent Windows</TabsTrigger>
            </TabsList>

            <TabsContent value='active-orders'>
              <LiveOrdersSSE />
              <LiveOrdersTable orders={liveOrders} />
            </TabsContent>

            <TabsContent value='recent-windows'>
              <TodaysWindowsList windows={todaysWindows} />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <>
          <CreateWindowForm />
          <h2 className='text-sm font-medium mb-3'>Recent Windows</h2>
          <TodaysWindowsList windows={todaysWindows} />
        </>
      )}
    </div>
  );
}
