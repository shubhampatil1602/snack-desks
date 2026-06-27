"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateAdminOrderAction } from "@/actions/orders";
import { useRouter } from "next/navigation";
import { OrderItemsForm } from "./OrderItemsForm";
import { MenuItem } from "@/types/menu";

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
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const initialItems = items.map((item) => ({
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    name: item.menuItem.name,
    price: item.menuItem.price,
  }));

  function handleSave(updatedItems: { menuItemId: string; quantity: number }[]) {
    startTransition(async () => {
      const result = await updateAdminOrderAction(orderId, updatedItems);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (updatedItems.length === 0) {
        toast.info("Order cancelled");
      } else {
        toast.success("Order updated");
      }
      setOpen(false);
      router.refresh();
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size='sm' variant='summary'>
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0'>
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Edit Order - {userName}</DialogTitle>
        </DialogHeader>

        {open && (
          <OrderItemsForm
            menuItems={menuItems}
            initialItems={initialItems}
            onSave={handleSave}
            onCancel={() => setOpen(false)}
            isPending={pending}
            saveLabel="Save Changes"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
