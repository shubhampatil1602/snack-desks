import { authIsRequired } from "@/actions/user";
import { UserHistoryTable } from "./_components/UserHistoryTable";
import { getUserOrderHistory } from "@/modules/orders/user-history-queries";
import { PaymentQR } from "@/components/payment-qr";
import { getActiveWindowWithMenu } from "@/modules/orders/queries";
import { CartSync } from "../_components/cart-sync";
import { prisma } from "@/lib/db";

export default async function OrderHistoryPage() {
  const session = await authIsRequired();

  const orders = await getUserOrderHistory(session.user.id);

  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
    },
  });
  if (!member) return null;
  const activeWindow = await getActiveWindowWithMenu(member.organizationId);

  return (
    <div className='px-4 space-y-6'>
      <CartSync hasActiveWindow={!!activeWindow} />
      <div className='flex justify-between items-center pb-4 border-b'>
        <div>
          <h1 className='text-2xl font-heading tracking-wide'>Order History</h1>

          <p className='text-sm text-muted-foreground mt-1'>
            View your previous orders
          </p>
        </div>

        <PaymentQR />
      </div>
      <UserHistoryTable orders={orders} />
    </div>
  );
}
