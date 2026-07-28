"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AdminWindowHistory as AdminWindowHistoryType } from "@/modules/orders/admin-history-queries";
import { BreakdownItemData, ShopBreakdown } from "./types";
import { OrderStatsSummary } from "./OrderStatsSummary";
import { ItemBreakdownList } from "./ItemBreakdownList";
import { UpdateOrderItemsModal } from "./UpdateOrderItemsModal";

type OrderWindowSummaryDialogProps = {
  window: AdminWindowHistoryType[number];
  trigger?: React.ReactNode;
  isUserView?: boolean;
};

export function OrderWindowSummaryDialog({
  window,
  trigger,
  isUserView,
}: OrderWindowSummaryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<string>("all");
  const [deletingItem, setDeletingItem] = useState<{
    name: string;
    data: BreakdownItemData;
  } | null>(null);

  // Calculations for approved orders
  const approvedOrders = window.orders.filter((o) => o.status === "approved");
  const rejectedOrders = window.orders.filter((o) => o.status === "rejected");
  const cancelledOrders = window.orders.filter((o) => o.status === "cancelled");

  // Combined breakdown (all shops)
  const combinedBreakdown = new Map<string, BreakdownItemData>();
  let combinedTotal = 0;

  // Shop-specific breakdown
  const shopsMap = new Map<string, ShopBreakdown>();

  type AltItem = { itemName: string; quantity: number; userName: string };
  const mergeAlternatives = (target: AltItem[] | undefined, source: AltItem[]) => {
    if (source.length === 0) return target;
    return [...(target || []), ...source];
  };

  for (const order of approvedOrders) {
    for (const item of order.items) {
      if (item.replacementApplied) continue;

      const itemName = item.menuItem.name;
      const itemTotal = item.quantity * Number(item.menuItem.price);
      const shopName = item.menuItem.shop?.name || "Unknown";

      const itemAlternatives: AltItem[] = [];
      if (item.replacementPreferences) {
        for (const pref of item.replacementPreferences) {
          itemAlternatives.push({
            itemName: pref.menuItem.name,
            quantity: pref.quantity,
            userName: order.user.name,
          });
        }
      }

      // 1. Combined Map Update
      const existing = combinedBreakdown.get(itemName);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total += itemTotal;
        existing.alternatives = mergeAlternatives(existing.alternatives, itemAlternatives);
        const userEntry = existing.users.find((u) => u.userId === order.userId);
        if (userEntry) userEntry.quantity += item.quantity;
        else
          existing.users.push({
            orderId: order.id,
            userId: order.userId,
            name: order.user.name,
            quantity: item.quantity,
          });
      } else {
        combinedBreakdown.set(itemName, {
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          total: itemTotal,
          alternatives: itemAlternatives.length > 0 ? itemAlternatives : undefined,
          users: [
            {
              orderId: order.id,
              userId: order.userId,
              name: order.user.name,
              quantity: item.quantity,
            },
          ],
        });
      }
      combinedTotal += itemTotal;

      // 2. Shop Map Update
      if (!shopsMap.has(shopName)) {
        shopsMap.set(shopName, {
          shopName,
          total: 0,
          items: new Map(),
          orderCount: 0,
        });
      }
      const shop = shopsMap.get(shopName)!;
      const shopItem = shop.items.get(itemName);
      if (shopItem) {
        shopItem.quantity += item.quantity;
        shopItem.total += itemTotal;
        shopItem.alternatives = mergeAlternatives(shopItem.alternatives, itemAlternatives);
        const userEntry = shopItem.users.find((u) => u.userId === order.userId);
        if (userEntry) userEntry.quantity += item.quantity;
        else
          shopItem.users.push({
            orderId: order.id,
            userId: order.userId,
            name: order.user.name,
            quantity: item.quantity,
          });
      } else {
        shop.items.set(itemName, {
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          total: itemTotal,
          alternatives: itemAlternatives.length > 0 ? itemAlternatives : undefined,
          users: [
            {
              orderId: order.id,
              userId: order.userId,
              name: order.user.name,
              quantity: item.quantity,
            },
          ],
        });
      }
      shop.total += itemTotal;
    }
  }

  // Count unique orders per shop
  for (const shop of shopsMap.values()) {
    const uniqueOrders = new Set();
    for (const order of approvedOrders) {
      if (
        order.items.some((item) => item.menuItem.shop?.name === shop.shopName)
      ) {
        uniqueOrders.add(order.id);
      }
    }
    shop.orderCount = uniqueOrders.size;
  }

  // Sort breakdowns by quantity (highest first)
  const sortedCombined = Array.from(combinedBreakdown.entries()).sort(
    (a, b) => b[1].quantity - a[1].quantity,
  );

  const sortedShops = Array.from(shopsMap.values()).sort(
    (a, b) => b.total - a.total,
  );

  const getCurrentBreakdown = () => {
    if (selectedShop === "all") {
      return {
        breakdown: sortedCombined,
        total: combinedTotal,
        title: "Combined",
        shopName: undefined,
        orderCount: window.orders.length,
        approvedCount: approvedOrders.length,
        rejectedCount: rejectedOrders.length,
        cancelledCount: cancelledOrders.length,
      };
    }
    const shop = sortedShops.find((s) => s.shopName === selectedShop);
    if (!shop) {
      return {
        breakdown: [],
        total: 0,
        title: selectedShop,
        shopName: selectedShop,
        orderCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        cancelledCount: 0,
      };
    }
    const sortedItems = Array.from(shop.items.entries()).sort(
      (a, b) => b[1].quantity - a[1].quantity,
    );
    return {
      breakdown: sortedItems,
      total: shop.total,
      title: shop.shopName,
      shopName: shop.shopName,
      orderCount: shop.orderCount,
      approvedCount: window.orders.filter(
        (o) =>
          o.status === "approved" &&
          o.items.some((i) => i.menuItem.shop?.name === shop.shopName),
      ).length,
      rejectedCount: window.orders.filter(
        (o) =>
          o.status === "rejected" &&
          o.items.some((i) => i.menuItem.shop?.name === shop.shopName),
      ).length,
      cancelledCount: window.orders.filter(
        (o) =>
          o.status === "cancelled" &&
          o.items.some((i) => i.menuItem.shop?.name === shop.shopName),
      ).length,
    };
  };

  const currentData = getCurrentBreakdown();

  // Format combined summary with shop grouping and bold formatting
  function formatCombinedSummary(
    title: string,
    date: string,
    shops: ShopBreakdown[],
    total: number,
    includeAlternatives: boolean,
  ) {
    let text = `${title} (${date})\n\n`;
    text += `Total: ${formatCurrency(total)}\n\n`;
    text += "Item Breakdown:\n";

    for (const shop of shops) {
      const sortedItems = Array.from(shop.items.entries()).sort(
        (a, b) => b[1].quantity - a[1].quantity,
      );
      text += `\n*${shop.shopName}* (${formatCurrency(shop.total)})\n`;
      text += sortedItems
        .map(([name, value]) => {
          let line = `  ${name} × ${value.quantity}`;
          if (includeAlternatives && value.alternatives && value.alternatives.length > 0) {
            const altLines = value.alternatives.map(alt => `    ↳ [${alt.userName}] Alt: ${alt.quantity} × ${alt.itemName}`).join("\n");
            line += `\n${altLines}`;
          }
          return line;
        })
        .join("\n");
    }
    return text;
  }

  function formatSummary(
    title: string,
    date: string,
    breakdown: [string, BreakdownItemData][],
    total: number,
    includeAlternatives: boolean,
    shopName?: string,
  ) {
    const header = shopName
      ? `${title} - ${shopName} (${date})`
      : `${title} (${date})`;

    const items = breakdown
      .map(([name, value]) => {
        let line = `  ${name} × ${value.quantity}`;
        if (includeAlternatives && value.alternatives && value.alternatives.length > 0) {
          const altLines = value.alternatives.map(alt => `    ↳ [${alt.userName}] Alt: ${alt.quantity} × ${alt.itemName}`).join("\n");
          line += `\n${altLines}`;
        }
        return line;
      })
      .join("\n");

    return `${header}\n\nTotal: ${formatCurrency(total)}\n\nItem Breakdown:\n${items}`;
  }

  async function copyCurrent(includeAlternatives: boolean = true) {
    const displayDate = new Date(window.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    let text;
    if (selectedShop === "all") {
      text = formatCombinedSummary(
        `${window.label} Window`,
        displayDate,
        sortedShops,
        combinedTotal,
        includeAlternatives
      );
    } else {
      text = formatSummary(
        `${window.label} Window`,
        displayDate,
        currentData.breakdown,
        currentData.total,
        includeAlternatives,
        currentData.shopName,
      );
    }
    await navigator.clipboard.writeText(text);
  }

  const displayDate = new Date(window.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const shopOptions = [
    { id: "all", label: "All Shops" },
    ...sortedShops.map((shop) => ({
      id: shop.shopName,
      label: shop.shopName,
    })),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='summary' size='sm'>
            <FileText className='mr-2 h-3.5 w-3.5' />
            Summary
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>{window.label} Window Summary</DialogTitle>
          <p className='text-sm font-normal text-muted-foreground'>
            {displayDate}
          </p>
        </DialogHeader>

        {/* Shop Selector */}
        <div className='flex items-center gap-2 w-full border px-3'>
          <Select value={selectedShop} onValueChange={setSelectedShop}>
            <SelectTrigger className='w-full border-none'>
              <SelectValue placeholder='Select shop' />
            </SelectTrigger>
            <SelectContent>
              {shopOptions.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-4'>
          <OrderStatsSummary
            stats={{
              total: currentData.total,
              orderCount: currentData.orderCount,
              approvedCount: currentData.approvedCount,
              rejectedCount: currentData.rejectedCount,
              cancelledCount: currentData.cancelledCount,
            }}
          />

          {selectedShop === "all" ? (
            <ItemBreakdownList
              groups={sortedShops.map((shop) => ({
                shopName: shop.shopName,
                total: shop.total,
                items: Array.from(shop.items.entries()).sort(
                  (a, b) => b[1].quantity - a[1].quantity,
                ),
              }))}
              onCopy={copyCurrent}
              onDeleteItem={!isUserView ? setDeletingItem : undefined}
            />
          ) : (
            <ItemBreakdownList
              items={currentData.breakdown}
              onCopy={copyCurrent}
              onDeleteItem={!isUserView ? setDeletingItem : undefined}
            />
          )}
        </div>
      </DialogContent>

      {/* Delete/Update Modal */}
      {!isUserView && (
        <UpdateOrderItemsModal
          windowId={window.id}
          deletingItem={deletingItem}
          onClose={() => setDeletingItem(null)}
        />
      )}
    </Dialog>
  );
}
