"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Copy, FileText, Check } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

type OrderWindowSummaryDialogProps = {
  window: AdminWindowHistoryType[number];
  trigger?: React.ReactNode;
};

type ShopBreakdown = {
  shopName: string;
  total: number;
  items: Map<string, { quantity: number; total: number }>;
  orderCount: number;
};

export function OrderWindowSummaryDialog({
  window,
  trigger,
}: OrderWindowSummaryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<string>("all");

  // Calculations for approved orders
  const approvedOrders = window.orders.filter((o) => o.status === "approved");
  const rejectedOrders = window.orders.filter((o) => o.status === "rejected");
  const cancelledOrders = window.orders.filter((o) => o.status === "cancelled");

  // Combined breakdown (all shops)
  const combinedBreakdown = new Map<
    string,
    { quantity: number; total: number }
  >();
  let combinedTotal = 0;

  // Shop-specific breakdown
  const shopsMap = new Map<string, ShopBreakdown>();

  for (const order of approvedOrders) {
    for (const item of order.items) {
      if (item.replacementApplied) continue;
      const itemName = item.menuItem.name;
      const itemPrice = Number(item.menuItem.price);
      const itemTotal = itemPrice * item.quantity;
      const shopName = item.menuItem.shop?.name || "Unassigned";

      // Combined breakdown
      const existing = combinedBreakdown.get(itemName);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total += itemTotal;
      } else {
        combinedBreakdown.set(itemName, {
          quantity: item.quantity,
          total: itemTotal,
        });
      }
      combinedTotal += itemTotal;

      // Shop-specific breakdown
      if (!shopsMap.has(shopName)) {
        shopsMap.set(shopName, {
          shopName,
          total: 0,
          items: new Map(),
          orderCount: 0,
        });
      }

      const shop = shopsMap.get(shopName)!;
      shop.total += itemTotal;

      const shopItem = shop.items.get(itemName);
      if (shopItem) {
        shopItem.quantity += item.quantity;
        shopItem.total += itemTotal;
      } else {
        shop.items.set(itemName, {
          quantity: item.quantity,
          total: itemTotal,
        });
      }
    }
  }

  // Count orders per shop
  for (const order of approvedOrders) {
    const shopNames = new Set(
      order.items
        .filter((item) => !item.replacementApplied)
        .map((item) => item.menuItem.shop?.name || "Unassigned"),
    );
    for (const shopName of shopNames) {
      const shop = shopsMap.get(shopName);
      if (shop) {
        shop.orderCount += 1;
      }
    }
  }

  // Sort breakdowns by quantity (highest first)
  const sortedCombined = Array.from(combinedBreakdown.entries()).sort(
    (a, b) => b[1].quantity - a[1].quantity,
  );

  const sortedShops = Array.from(shopsMap.values()).sort(
    (a, b) => b.total - a.total,
  );

  // Get breakdown for a specific shop
  function getShopBreakdown(shopName: string) {
    return sortedShops.find((s) => s.shopName === shopName);
  }

  // Get current breakdown based on selected shop
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
    const shop = getShopBreakdown(selectedShop);
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
      approvedCount: shop.orderCount,
      rejectedCount: 0,
      cancelledCount: 0,
      itemCount: shop.items.size,
    };
  };

  const currentData = getCurrentBreakdown();

  // Copy functions with visual feedback
  async function handleCopy(copyFn: () => Promise<void>, tabId: string) {
    await copyFn();
    setCopiedTab(tabId);
    setTimeout(() => {
      setCopiedTab(null);
    }, 2000);
  }

  // Copy functions
  function formatSummary(
    title: string,
    date: string,
    breakdown: [string, { quantity: number; total: number }][],
    total: number,
    shopName?: string,
  ) {
    const header = shopName
      ? `${title} - ${shopName} (${date})`
      : `${title} (${date})`;

    const items = breakdown
      .map(([name, value]) => `  ${name} × ${value.quantity}`)
      .join("\n");

    return `${header}\n\nTotal: ${formatCurrency(total)}\n\nItem Breakdown:\n${items}`;
  }

  // Format combined summary with shop grouping and bold formatting
  function formatCombinedSummary(
    title: string,
    date: string,
    shops: ShopBreakdown[],
    total: number,
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
        .map(([name, value]) => `  ${name} × ${value.quantity}`)
        .join("\n");
    }

    return text;
  }

  async function copyCurrent() {
    const date = new Date(window.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    let text;
    if (selectedShop === "all") {
      // Use grouped format for combined
      text = formatCombinedSummary(
        `${window.label} Window`,
        date,
        sortedShops,
        combinedTotal,
      );
    } else {
      // Use regular format for individual shop
      text = formatSummary(
        `${window.label} Window`,
        date,
        currentData.breakdown,
        currentData.total,
        currentData.shopName,
      );
    }

    await navigator.clipboard.writeText(text);
  }

  const date = new Date(window.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Build shop options
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
          <p className='text-sm font-normal text-muted-foreground'>{date}</p>
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
          {/* Stats Grid */}
          <div className='grid grid-cols-6 gap-3'>
            <div className='col-span-2'>
              <p className='text-xs text-muted-foreground'>Total</p>
              <p className='text-xl font-semibold'>
                {formatCurrency(currentData.total)}
              </p>
            </div>
            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Orders</p>
              <p className='text-xl font-semibold'>{currentData.orderCount}</p>
            </div>
            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Approved</p>
              <p className='text-xl font-semibold text-green-600'>
                {currentData.approvedCount}
              </p>
            </div>
            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Rejected</p>
              <p className='text-xl font-semibold text-red-600'>
                {currentData.rejectedCount}
              </p>
            </div>
            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Cancelled</p>
              <p className='text-xl font-semibold text-yellow-600'>
                {currentData.cancelledCount}
              </p>
            </div>
          </div>

          {/* Item Breakdown with Copy Button */}
          <div className='space-y-2 border-t pt-2 max-h-120 overflow-y-auto'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-3'>
                <h4 className='font-medium'>Item Breakdown</h4>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handleCopy(copyCurrent, "current")}
                className='gap-2 text-xs px-1 py-0.5'
              >
                {copiedTab === "current" ? (
                  <>
                    <Check className='size-3 text-green-500' />
                    <span className='text-green-500'>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className='size-3' />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {selectedShop === "all" ? (
              // Show grouped by shop in UI too
              sortedShops.map((shop) => (
                <div
                  key={shop.shopName}
                  className='space-y-1 border-t pt-2 first:border-t-0 first:pt-0'
                >
                  <div className='flex justify-between items-center'>
                    <Badge className='bg-primary/10 text-primary border-0 px-1.5 py-0.5 text-xs font-medium'>
                      {shop.shopName}
                    </Badge>
                    <Badge className='bg-primary/10 text-primary border-0 px-1.5 py-0.5 text-xs font-medium'>
                      {formatCurrency(shop.total)}
                    </Badge>
                  </div>
                  {Array.from(shop.items.entries())
                    .sort((a, b) => b[1].quantity - a[1].quantity)
                    .map(([name, value]) => (
                      <div
                        key={name}
                        className='flex justify-between text-sm items-center'
                      >
                        <span className='text-muted-foreground'>
                          {name} × {value.quantity}
                        </span>
                        <span className='font-medium'>
                          {formatCurrency(value.total)}
                        </span>
                      </div>
                    ))}
                </div>
              ))
            ) : currentData.breakdown.length > 0 ? (
              <>
                {currentData.breakdown.map(([name, value]) => (
                  <div
                    key={name}
                    className='flex justify-between text-sm items-center'
                  >
                    <span className='text-muted-foreground'>
                      {name} × {value.quantity}
                    </span>
                    <span className='font-medium'>
                      {formatCurrency(value.total)}
                    </span>
                  </div>
                ))}
                <div className='flex justify-between text-sm font-semibold pt-2 border-t'>
                  <span>Total</span>
                  <span>{formatCurrency(currentData.total)}</span>
                </div>
              </>
            ) : (
              <p className='text-sm text-muted-foreground text-center py-4'>
                No approved orders to display
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
