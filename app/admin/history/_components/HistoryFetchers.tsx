import { getOrganizationOrderHistoryGroupedByWindow } from "@/modules/orders/admin-history-queries";
import { getMenuItems } from "@/modules/menu/queries";
import { AdminWindowHistory } from "./AdminWindowHistory";

interface AdminWindowHistoryFetcherProps {
  organizationId: string;
  period: string;
  periodLabel: string;
}

export async function AdminWindowHistoryFetcher({
  organizationId,
  period,
  periodLabel,
}: AdminWindowHistoryFetcherProps) {
  const [windows, menuItems] = await Promise.all([
    getOrganizationOrderHistoryGroupedByWindow(organizationId, period),
    getMenuItems(organizationId),
  ]);

  return (
    <AdminWindowHistory
      windows={windows}
      menuItems={menuItems}
      globalPeriodLabel={periodLabel}
    />
  );
}
