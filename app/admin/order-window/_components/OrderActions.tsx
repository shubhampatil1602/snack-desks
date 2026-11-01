"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/actions/orders";
import { useTransition } from "react";
import { AdminEditOrderDialog } from "@/app/admin/history/_components/AdminEditOrderDialog";
import type { MenuItem } from "@/types/menu";

type OrderItem = {
  menuItemId: string;
  quantity: number;
  menuItem: {
    name: string;
    price: string;
    shop?: {
      isGroupOrderEnabled?: boolean;
      [key: string]: any;
    } | null;
  };
  splits?: {
    userId: string;
    user: {
      id?: string;
      name: string;
      email?: string;
      [key: string]: any;
    };
  }[];
};

type OrderActionsProps = {
  orderId: string;
  status: string;
  userName?: string;
  userId?: string;
  items?: OrderItem[];
  menuItems?: MenuItem[];
};

export function OrderActions({
  orderId,
  status,
  userName,
  userId,
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
      userId={userId}
      items={items}
      menuItems={menuItems}
      triggerVariant='outline'
      disabled={editDisabled}
    />
  );

  const approve = (
    <Button size='sm' onClick={() => updateStatus("approved")} disabled={pending}>
      Approve
    </Button>
  );
  const reject = (
    <Button
      size='sm'
      variant='outline'
      onClick={() => updateStatus("rejected")}
      disabled={pending}
    >
      Reject
    </Button>
  );
  const markPending = (
    <Button
      size='sm'
      variant={status === "approved" ? "ghost" : "outline"}
      onClick={() => updateStatus("pending")}
      disabled={pending}
    >
      Mark Pending
    </Button>
  );

  if (status === "pending") {
    return (
      <div className='flex flex-wrap items-center justify-end gap-2'>
        {approve}
        {reject}
        {editDialog}
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className='flex flex-wrap items-center justify-end gap-2'>
        {markPending}
        {reject}
        {editDialog}
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className='flex flex-wrap items-center justify-end gap-2'>
        {markPending}
        {approve}
        {editDialog}
      </div>
    );
  }

  return null;
}
