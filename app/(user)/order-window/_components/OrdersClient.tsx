"use client";

import { useState, useEffect, useMemo } from "react";
import { MenuGrid } from "./MenuGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartSubtotal, useCartStore } from "@/store/cart-store";
import { useRouter } from "next/navigation";
import { OrderStatusChangedPayload } from "@/types/sse";
import { sendNotification } from "@/hooks/use-notification-permission";
import type {
  ActiveWindowWithMenu,
  UserActiveOrder,
} from "@/modules/orders/queries";
import { toast } from "sonner";
import { ORDER_STATUS } from "@/lib/constants";
import { useSSEEvent } from "@/providers/sse-provider";
import { X } from "lucide-react";

type OrdersClientProps = {
  menuItems: NonNullable<ActiveWindowWithMenu>["menuItems"];
  existingOrder: UserActiveOrder;
  windowId: string;
};

export function OrdersClient({
  menuItems,
  existingOrder,
  windowId,
}: OrdersClientProps) {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);

  useSSEEvent("window_closed", () => {
    sendNotification(`🍱 Order window is closed!`, "Thanks.");
    clearCart();
    router.refresh();
  });

  useSSEEvent<OrderStatusChangedPayload>("order_status_changed", (payload) => {
    if (payload.status === ORDER_STATUS.APPROVED)
      toast.success("Your order has been approved");
    if (payload.status === ORDER_STATUS.REJECTED)
      toast.error("Your order has been rejected");
    router.refresh();
  });

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedShop, setSelectedShop] = useState("all");

  const loadExistingOrder = useCartStore((state) => state.loadExistingOrder);
  const setWindowId = useCartStore((state) => state.setWindowId);

  // Get unique shops from menu items (excluding null/undefined)
  const shops = useMemo(() => {
    const shopSet = new Set<string>();
    menuItems.forEach((item) => {
      if (item.shop?.name) {
        shopSet.add(item.shop.name);
      }
    });
    return ["all", ...Array.from(shopSet)];
  }, [menuItems]);

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.menuCategory.name === selectedCategory;

    const matchesShop =
      selectedShop === "all" || item.shop?.name === selectedShop;

    return matchesSearch && matchesCategory && matchesShop;
  });

  const categories = [
    "all",
    ...new Set(menuItems.map((item) => item.menuCategory.name)),
  ];

  const subtotal = useCartSubtotal();

  useEffect(() => {
    setWindowId(windowId);
  }, [windowId, setWindowId]);

  useEffect(() => {
    if (!existingOrder) {
      clearCart();
      return;
    }

    loadExistingOrder({
      orderId: existingOrder.id,
      status: existingOrder.status,
      items: existingOrder.items.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price.toString(),
        quantity: item.quantity,
      })),
    });
  }, [existingOrder, loadExistingOrder, clearCart]);

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedShop("all");
  };

  // Check if any filter is active
  const hasActiveFilters =
    search || selectedCategory !== "all" || selectedShop !== "all";

  return (
    <div className='space-y-6 w-full mt-6'>
      {/* Results Count & Total */}
      <div className='flex w-full justify-between items-center'>
        <p className='text-sm text-muted-foreground'>
          Showing {filteredItems.length} item
          {filteredItems.length !== 1 ? "s" : ""}
        </p>
        <div className='border px-3 py-2'>
          <span className='text-xs text-muted-foreground mr-2'>
            Current Total
          </span>
          <span className='font-medium'>₹{subtotal}</span>
        </div>
      </div>
      {/* Search Bar */}
      <div className='relative border-2 px-3'>
        <Input
          placeholder='Search items...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pr-10 border-none'
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
          >
            <X className='h-4 w-4' />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className='flex justify-between gap-4'>
        {/* Category Filters */}
        <div className='flex flex-wrap gap-2'>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size='sm'
              onClick={() => setSelectedCategory(category)}
            >
              {category === "all" ? "All" : category}
            </Button>
          ))}
        </div>

        {/* Shop Filter Dropdown */}
        {shops.length > 1 && (
          <div className='flex items-center gap-2'>
            <Select
              value={selectedShop}
              onValueChange={(value) => setSelectedShop(value)}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Select shop' />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop} value={shop}>
                    {shop === "all" ? "All Shops" : shop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearFilters}
                className='text-muted-foreground w-fit'
              >
                <X className='h-3 w-3 mr-1' />
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      <MenuGrid items={filteredItems} />
    </div>
  );
}
