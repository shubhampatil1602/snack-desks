import {
  getActiveWindowWithMenu,
  getUserActiveOrder,
  getUserReorderHistory,
} from "@/modules/orders/queries";
import { getUserFavouriteMenuItemIds } from "@/modules/menu/queries";
import { buildRepeatOrder } from "@/modules/orders/reorder";
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

  if (!activeWindowData) {
    return (
      <>
        <ClearCartOnMount />
        <NoActiveWindow />
      </>
    );
  }
  
  const [existingOrder, reorderHistory, favouriteMenuItemIds] =
    await Promise.all([
      getUserActiveOrder(activeWindowData.window.id, userId),
      getUserReorderHistory(organizationId, userId),
      getUserFavouriteMenuItemIds(organizationId, userId),
    ]);
  const repeatOrder = buildRepeatOrder(reorderHistory, activeWindowData);

  const serverNow = new Date().getTime();

  return (
    <div className='w-full'>
      <WindowBanner
        windowId={activeWindowData.window.id}
        endsAt={activeWindowData.window.endsAt}
        label={activeWindowData.window.label}
        tagline={activeWindowData.window.tagline}
        serverNow={serverNow}
        repeatOrder={repeatOrder}
      />
      <OrdersClient
        windowId={activeWindowData.window.id}
        menuItems={activeWindowData.menuItems}
        existingOrder={existingOrder}
        favouriteMenuItemIds={favouriteMenuItemIds}
      />
    </div>
  );
}
