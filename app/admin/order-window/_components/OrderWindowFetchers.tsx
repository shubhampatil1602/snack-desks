import { getTodaysWindows } from "@/modules/order-window/queries";
import { getActiveWindowWithMenu } from "@/modules/orders/queries";
import { getShops } from "@/modules/menu/queries";
import { getLiveOrders } from "@/modules/orders/admin-queries";
import { ActiveWindowCard } from "./ActiveWindowCard";
import { CreateWindowForm } from "./CreateWindowForm";
import { TodaysWindowsList } from "./TodaysWindowsList";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs";
import { LiveOrdersTable } from "./LiveOrdersTable";
import { LiveOrdersSSE } from "./LiveOrdersSSE";

export async function OrderWindowContentFetcher({ organizationId }: { organizationId: string }) {
  const [activeWindowData, todaysWindows, shops] = await Promise.all([
    getActiveWindowWithMenu(organizationId),
    getTodaysWindows(organizationId),
    getShops(organizationId),
  ]);

  const activeWindow = activeWindowData?.window ?? null;
  const menuItems = activeWindowData?.menuItems ?? [];
  const liveOrders = activeWindow ? await getLiveOrders(activeWindow.id) : [];
  const serverNow = new Date().getTime();

  return (
    <>
      {activeWindow ? (
        <>
          <ActiveWindowCard
            window={activeWindow}
            serverNow={serverNow}
          />
          <Tabs defaultValue='active-orders'>
            <TabsList className='w-full mb-1'>
              <TabsTrigger value='active-orders'>Active Orders</TabsTrigger>
              <TabsTrigger value='recent-windows'>Recent Windows</TabsTrigger>
            </TabsList>

            <TabsContent value='active-orders'>
              <LiveOrdersSSE />
              <LiveOrdersTable
                orders={liveOrders}
                windowId={activeWindow.id}
                windowLabel={activeWindow.label}
                menuItems={menuItems}
              />
            </TabsContent>

            <TabsContent value='recent-windows'>
              <TodaysWindowsList windows={todaysWindows} />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <>
          <CreateWindowForm shops={shops} />
          <h2 className='text-sm font-medium mb-3'>Recent Windows</h2>
          <TodaysWindowsList windows={todaysWindows} />
        </>
      )}
    </>
  );
}
