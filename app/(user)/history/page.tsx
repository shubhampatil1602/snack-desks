import { authIsRequired } from "@/actions/user";
import { UserHistoryTable } from "./_components/UserHistoryTable";
import { getUserOrderHistory } from "@/modules/orders/user-history-queries";

export default async function OrderHistoryPage() {
  console.time("UserOrderHistory");
  const session = await authIsRequired();

  const orders = await getUserOrderHistory(session.user.id);

  console.timeEnd("UserOrderHistory");

  return (
    <div className='px-4 space-y-6'>
      <div>
        <h1 className='text-2xl font-heading tracking-wide'>Order History</h1>

        <p className='text-sm text-muted-foreground mt-1'>
          View your previous orders
        </p>
      </div>

      <UserHistoryTable orders={orders} />
    </div>
  );
}
