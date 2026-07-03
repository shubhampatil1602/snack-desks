import { getUserOrderHistory } from "@/modules/orders/user-history-queries";
import { UserHistoryTable } from "./UserHistoryTable";

export async function UserHistoryFetcher({
  userId,
  period,
}: {
  userId: string;
  period: string;
}) {
  const orders = await getUserOrderHistory(userId, period);
  return <UserHistoryTable orders={orders} />;
}
