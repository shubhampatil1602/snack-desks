"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/types/menu";
import { Spinner } from "@/components/ui/spinner";

type OrderItemState = {
  menuItemId: string;
  quantity: number;
  name: string;
  price: string;
};

type Props = {
  menuItems: MenuItem[];
  initialItems?: OrderItemState[];
  onSave: (items: { menuItemId: string; quantity: number }[]) => void;
  onCancel: () => void;
  saveLabel?: string;
  isPending?: boolean;
  canSave?: boolean;
  children?: React.ReactNode;
};

export function OrderItemsForm({
  menuItems,
  initialItems = [],
  onSave,
  onCancel,
  saveLabel = "Save Changes",
  isPending = false,
  canSave = true,
  children,
}: Props) {
  const [search, setSearch] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItemState[]>(initialItems);
  const [hasChanges, setHasChanges] = useState(false);

  const filteredItems = useMemo(() => {
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) &&
        !orderItems.some((orderItem) => orderItem.menuItemId === item.id),
    );
  }, [menuItems, orderItems, search]);

  function increment(menuItemId: string) {
    setHasChanges(true);
    setOrderItems((prev) =>
      prev.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decrement(menuItemId: string) {
    setHasChanges(true);
    setOrderItems((prev) =>
      prev.flatMap((item) => {
        if (item.menuItemId !== menuItemId) return item;
        if (item.quantity === 1) return [];
        return { ...item, quantity: item.quantity - 1 };
      }),
    );
  }

  function addItem(item: MenuItem) {
    setHasChanges(true);
    setOrderItems((prev) => [
      ...prev,
      {
        menuItemId: item.id,
        quantity: 1,
        name: item.name,
        price: item.price.toString(),
      },
    ]);
    setSearch("");
  }

  const total = orderItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  const isSaveEnabled =
    canSave && (initialItems.length === 0 ? orderItems.length > 0 : hasChanges) && !isPending;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {children}

        <div className="space-y-2">
          <label className="text-sm font-medium">Add Items</label>
          <Input
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isPending}
          />

          {search && (
            <div className="border divide-y max-h-48 overflow-y-auto mt-2">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className="w-full flex justify-between p-3 text-left hover:bg-muted text-sm"
                  onClick={() => addItem(item)}
                  type="button"
                >
                  <span>{item.name}</span>
                  <span>{formatCurrency(item.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 pb-4">
          {orderItems.map((item) => (
            <div
              key={item.menuItemId}
              className="flex items-center justify-between border p-3"
            >
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => decrement(item.menuItemId)}
                  disabled={isPending}
                  type="button"
                >
                  -
                </Button>

                <span className="w-6 text-center text-sm">{item.quantity}</span>

                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => increment(item.menuItemId)}
                  disabled={isPending}
                  type="button"
                >
                  +
                </Button>
              </div>
            </div>
          ))}
          
          {orderItems.length === 0 && (
            <div className="text-center p-6 border border-dashed text-muted-foreground text-sm">
              No items added yet. Search and add items above.
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t bg-card mt-auto space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Total</span>
          <span className="font-semibold text-lg">{formatCurrency(total)}</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isPending} type="button">
            Cancel
          </Button>
          <Button onClick={() => onSave(orderItems.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })))} disabled={!isSaveEnabled} type="button">
            {isPending && <Spinner className="mr-2" />}
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
