"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { updateAdminOrderAction } from "@/actions/orders";
import { useRouter } from "next/navigation";

type MenuItem = {
  id: string;
  name: string;
  price: string;
};

type OrderItem = {
  menuItemId: string;
  quantity: number;
  menuItem: {
    name: string;
    price: string;
  };
};

type Props = {
  orderId: string;
  userName: string;
  items: OrderItem[];
  menuItems: MenuItem[];
};

export function AdminEditOrderDialog({
  orderId,
  userName,
  items,
  menuItems,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [pending, startTransition] = useTransition();

  const [orderItems, setOrderItems] = useState(
    items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      name: item.menuItem.name,
      price: item.menuItem.price,
    })),
  );

  const router = useRouter();

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
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  }

  function decrement(menuItemId: string) {
    setHasChanges(true);
    setOrderItems((prev) =>
      prev.flatMap((item) => {
        if (item.menuItemId !== menuItemId) {
          return item;
        }

        if (item.quantity === 1) {
          return [];
        }

        return {
          ...item,
          quantity: item.quantity - 1,
        };
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
        price: item.price,
      },
    ]);

    setSearch("");
  }

  const total = orderItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  function handleSave() {
    startTransition(async () => {
      const result = await updateAdminOrderAction(
        orderId,
        orderItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (orderItems.length === 0) {
        toast.info("Order cancelled");
      } else {
        toast.success("Order updated");
      }
      setOpen(false);
      router.refresh();
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setHasChanges(false);
    if (nextOpen) {
      setOrderItems(
        items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          name: item.menuItem.name,
          price: item.menuItem.price,
        })),
      );
    }

    setOpen(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline'>
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Edit Order - {userName}</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 h-140 overflow-scroll relative'>
          <Input
            placeholder='Search menu items...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <div className='border rounded-md divide-y max-h-48 overflow-y-auto'>
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className='w-full flex justify-between p-3 text-left hover:bg-muted'
                  onClick={() => addItem(item)}
                >
                  <span>{item.name}</span>
                  <span>₹{item.price}</span>
                </button>
              ))}
            </div>
          )}

          <div className='space-y-3 pb-24'>
            {orderItems.map((item) => (
              <div
                key={item.menuItemId}
                className='flex items-center justify-between border p-3'
              >
                <div>
                  <p className='font-medium'>{item.name}</p>
                  <p className='text-xs text-muted-foreground'>₹{item.price}</p>
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    size='icon'
                    variant='outline'
                    onClick={() => decrement(item.menuItemId)}
                  >
                    -
                  </Button>

                  <span className='w-8 text-center'>{item.quantity}</span>

                  <Button
                    size='icon'
                    variant='outline'
                    onClick={() => increment(item.menuItemId)}
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className='space-y-3 w-full fixed left-0 p-6 pt-0 bottom-0 bg-card'>
            <div className='border-t pt-4 flex items-center justify-between'>
              <span className='font-medium'>Total</span>

              <span className='font-semibold'>₹{total.toFixed(2)}</span>
            </div>

            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Cancel
              </Button>

              <Button onClick={handleSave} disabled={!hasChanges || pending}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
