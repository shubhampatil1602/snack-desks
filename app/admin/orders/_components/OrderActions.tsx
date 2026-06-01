"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/actions/orders";
import { useTransition } from "react";
import { IconCheck } from "@tabler/icons-react";
import { X } from "lucide-react";

type OrderActionsProps = {
  orderId: string;
  status: string;
};

export function OrderActions({ orderId, status }: OrderActionsProps) {
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

  if (status === "pending") {
    return (
      <div className='flex gap-2'>
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
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className='flex gap-2'>
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
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className='flex gap-2'>
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
      </div>
    );
  }

  return null;
}
