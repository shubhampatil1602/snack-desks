import { authIsRequired } from "@/actions/user";
import {
  getActiveWindowWithMenu,
  getUserActiveOrder,
} from "@/modules/orders/queries";
import { prisma } from "@/lib/db";
import { NoActiveWindow } from "./_components/NoActiveWindow";
import { OrdersClient } from "./_components/OrdersClient";
import { WindowBanner } from "./_components/WindowBanner";
import { ClearCartOnMount } from "./_components/ClearCartOnMount";

export default async function OrdersPage() {
  console.time("UserOrdersPage");
  const session = await authIsRequired();

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) return null;

  const activeWindowData = await getActiveWindowWithMenu(member.organizationId);

  const existingOrder = activeWindowData
    ? await getUserActiveOrder(activeWindowData.window.id, session.user.id)
    : null;

  if (!activeWindowData) {
    return (
      <>
        <ClearCartOnMount />
        <NoActiveWindow />;
      </>
    );
  }

  console.timeEnd("UserOrdersPage");

  return (
    <div className='px-4 space-y-6'>
      <div className='w-full'>
        <WindowBanner
          endsAt={activeWindowData.window.endsAt}
          label={activeWindowData.window.label}
        />
        <OrdersClient
          windowId={activeWindowData.window.id}
          menuItems={activeWindowData.menuItems}
          existingOrder={existingOrder}
        />
      </div>
    </div>
  );
}
