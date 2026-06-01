"use client";

import { useState, useEffect } from "react";
import { MenuGrid } from "./MenuGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCartSubtotal, useCartStore } from "@/store/cart-store";
import { useRouter } from "next/navigation";
import { useSSE } from "@/hooks/use-sse";
import { sendNotification } from "@/hooks/use-notification-permission";
import type {
  ActiveWindowWithMenu,
  UserActiveOrder,
} from "@/modules/orders/queries";
import { toast } from "sonner";
import { ORDER_STATUS } from "@/lib/constants";

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

  useSSE({
    onWindowClosed: () => {
      sendNotification(`🍱 Order window is closed!`, "Thanks.");
      clearCart();
      router.refresh();
    },

    onOrderStatusChanged: (payload) => {
      if (payload.status === ORDER_STATUS.APPROVED) {
        toast.success("Your order has been approved");
      }

      if (payload.status === ORDER_STATUS.REJECTED) {
        toast.error("Your order has been rejected");
      }

      router.refresh();
    },
  });
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const loadExistingOrder = useCartStore((state) => state.loadExistingOrder);
  const setWindowId = useCartStore((state) => state.setWindowId);
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.menuCategory.name === selectedCategory;

    return matchesSearch && matchesCategory;
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
    if (!existingOrder) return;

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
  }, [existingOrder, loadExistingOrder]);

  return (
    <div className='space-y-6 w-full mt-6'>
      <Input
        placeholder='Search items...'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className='flex w-full justify-between'>
        <div className='flex flex-wrap gap-2'>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size='sm'
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        <div className='border px-3 py-2'>
          <span className='text-xs text-muted-foreground mr-2'>
            Current Total
          </span>

          <span className='font-medium'>₹{subtotal}</span>
        </div>
      </div>

      <MenuGrid items={filteredItems} />
    </div>
  );
}
