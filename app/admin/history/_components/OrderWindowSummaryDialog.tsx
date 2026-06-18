"use client";

import { useState } from "react";
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
      order.items.map((item) => item.menuItem.shop?.name || "Unassigned"),
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
      };
    }
    const shop = getShopBreakdown(selectedShop);
    if (!shop) {
      return {
        breakdown: [],
        total: 0,
        title: selectedShop,
        shopName: selectedShop,
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

    return `${header}\n\nTotal: ₹${total.toFixed(2)}\n\nItem Breakdown:\n${items}`;
  }

  async function copyCurrent() {
    const date = new Date(window.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const text = formatSummary(
      `${window.label} Window`,
      date,
      currentData.breakdown,
      currentData.total,
      currentData.shopName,
    );

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
                ₹{currentData.total.toFixed(2)}
              </p>
            </div>
            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Orders</p>
              <p className='text-xl font-semibold'>{window.orders.length}</p>
            </div>
            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Approved</p>
              <p className='text-xl font-semibold text-green-600'>
                {approvedOrders.length}
              </p>
            </div>
            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Rejected</p>
              <p className='text-xl font-semibold text-red-600'>
                {rejectedOrders.length}
              </p>
            </div>
            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Cancelled</p>
              <p className='text-xl font-semibold text-yellow-600'>
                {cancelledOrders.length}
              </p>
            </div>
          </div>

          {/* Item Breakdown with Copy Button */}
          <div className='space-y-2 border-t pt-4 max-h-120 overflow-y-auto'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-3'>
                <h4 className='font-medium'>Item Breakdown</h4>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handleCopy(copyCurrent, "current")}
                className='gap-2'
              >
                {copiedTab === "current" ? (
                  <>
                    <Check className='h-3.5 w-3.5 text-green-500' />
                    <span className='text-green-500'>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className='h-3.5 w-3.5' />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {currentData.breakdown.length > 0 ? (
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
                      ₹{value.total.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className='flex justify-between text-sm font-medium pt-2 border-t'>
                  <span>Total</span>
                  <span>₹{currentData.total.toFixed(2)}</span>
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
