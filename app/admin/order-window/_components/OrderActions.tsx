"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/actions/orders";
import { useTransition } from "react";
import { IconCheck } from "@tabler/icons-react";
import { X } from "lucide-react";
import { AdminEditOrderDialog } from "@/app/admin/history/_components/AdminEditOrderDialog";
import type { MenuItem } from "@/types/menu";

type OrderItem = {
  menuItemId: string;
  quantity: number;
  menuItem: {
    name: string;
    price: string;
  };
};

type OrderActionsProps = {
  orderId: string;
  status: string;
  userName?: string;
  items?: OrderItem[];
  menuItems?: MenuItem[];
};

export function OrderActions({
  orderId,
  status,
  userName,
  items,
  menuItems,
}: OrderActionsProps) {
  const [pending, startTransition] = useTransition();

  function updateStatus(nextStatus: "approved" | "rejected" | "pending") {
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, nextStatus);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Order marked as ${nextStatus}`);
    });
  }

  const isRejected = status === "rejected";
  const editDisabled = pending || isRejected;

  const editDialog = menuItems && userName && items && (
    <AdminEditOrderDialog
      orderId={orderId}
      userName={userName}
      items={items}
      menuItems={menuItems}
      triggerVariant='outline'
      disabled={editDisabled}
    />
  );

  if (status === "pending") {
    return (
      <div className='flex items-center gap-2'>
        <Button
          size='sm'
          onClick={() => updateStatus("approved")}
          disabled={pending}
        >
          <IconCheck stroke={2} />
        </Button>

        <Button
          size='sm'
          variant='outline'
          onClick={() => updateStatus("rejected")}
          disabled={pending}
        >
          <X />
        </Button>

        {editDialog}
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className='flex items-center gap-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={() => updateStatus("pending")}
          disabled={pending}
        >
          Mark Pending
        </Button>

        <Button
          size='sm'
          variant='outline'
          onClick={() => updateStatus("rejected")}
          disabled={pending}
        >
          <X />
        </Button>

        {editDialog}
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className='flex items-center gap-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={() => updateStatus("pending")}
          disabled={pending}
        >
          Mark Pending
        </Button>

        <Button
          size='sm'
          onClick={() => updateStatus("approved")}
          disabled={pending}
        >
          <IconCheck stroke={2} />
        </Button>

        {editDialog}
      </div>
    );
  }

  return null;
}
