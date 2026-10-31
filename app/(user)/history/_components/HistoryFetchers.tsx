import { getUserOrderHistory } from "@/modules/orders/user-history-queries";
import { UserHistoryTable } from "./UserHistoryTable";

export async function UserHistoryFetcher({
  organizationId,
  userId,
  period,
}: {
  organizationId: string;
  userId: string;
  period: string;
}) {
  const orders = await getUserOrderHistory(organizationId, userId, period);
  return <UserHistoryTable orders={orders} />;
}
