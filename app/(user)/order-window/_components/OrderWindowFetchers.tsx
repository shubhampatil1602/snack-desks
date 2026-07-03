import { getActiveWindowWithMenu, getUserActiveOrder } from "@/modules/orders/queries";
import { NoActiveWindow } from "./NoActiveWindow";
import { OrdersClient } from "./OrdersClient";
import { WindowBanner } from "./WindowBanner";
import { ClearCartOnMount } from "./ClearCartOnMount";

export async function OrderWindowFetcher({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const activeWindowData = await getActiveWindowWithMenu(organizationId);

  const existingOrder = activeWindowData
    ? await getUserActiveOrder(activeWindowData.window.id, userId)
    : null;

  if (!activeWindowData) {
    return (
      <>
        <ClearCartOnMount />
        <NoActiveWindow />
      </>
    );
  }
  
  const serverNow = new Date().getTime();

  return (
    <div className='w-full'>
      <WindowBanner
        endsAt={activeWindowData.window.endsAt}
        label={activeWindowData.window.label}
        serverNow={serverNow}
      />
      <OrdersClient
        windowId={activeWindowData.window.id}
        menuItems={activeWindowData.menuItems}
        existingOrder={existingOrder}
      />
    </div>
  );
}
