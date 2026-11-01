import { getTodaysWindows } from "@/modules/order-window/queries";
import { getActiveWindowWithMenu } from "@/modules/orders/queries";
import { getShops } from "@/modules/menu/queries";
import { getLiveOrders } from "@/modules/orders/admin-queries";
import { ActiveWindowCard } from "./ActiveWindowCard";
import { AddOrderOnBehalfDialog } from "./AddOrderOnBehalfDialog";
import { CreateWindowForm } from "./CreateWindowForm";
import { TodaysWindowsList } from "./TodaysWindowsList";
import { LiveOrders } from "./LiveOrders";
import { LiveOrdersSSE } from "./LiveOrdersSSE";
import { summarizeOrders } from "./live-orders-view";

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

  if (!activeWindow) {
    return (
      <>
        <CreateWindowForm shops={shops} />
        <h2 className='text-sm font-medium mb-3'>Recent Windows</h2>
        <TodaysWindowsList windows={todaysWindows} />
      </>
    );
  }

  const summary = summarizeOrders(liveOrders);
  const earlierWindows = todaysWindows.filter((w) => w.id !== activeWindow.id);

  return (
    <>
      <ActiveWindowCard
        window={activeWindow}
        serverNow={serverNow}
        orderCount={summary.count}
        bill={summary.bill}
        action={
          <AddOrderOnBehalfDialog
            windowId={activeWindow.id}
            windowLabel={activeWindow.label}
            menuItems={menuItems}
          />
        }
      />

      <LiveOrdersSSE renderedAt={serverNow} />
      <LiveOrders
        orders={liveOrders}
        windowId={activeWindow.id}
        windowLabel={activeWindow.label}
        menuItems={menuItems}
      />

      {earlierWindows.length > 0 && (
        <section className='space-y-3'>
          <h2 className='text-sm font-medium'>Earlier today</h2>
          <TodaysWindowsList windows={earlierWindows} />
        </section>
      )}
    </>
  );
}
