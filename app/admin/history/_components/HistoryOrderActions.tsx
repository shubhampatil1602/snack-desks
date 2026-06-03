"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateOrderStatusAction } from "@/actions/orders";

type Props = {
  orderId: string;
  status: string;
};

export function HistoryOrderActions({ orderId, status }: Props) {
  const [pending, startTransition] = useTransition();

  function updateStatus(nextStatus: "approved" | "rejected") {
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, nextStatus);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Order marked as ${nextStatus}`);
    });
  }

  if (status === "approved") {
    return (
      <Button
        size='sm'
        variant='outline'
        disabled={pending}
        onClick={() => updateStatus("rejected")}
      >
        Reject
      </Button>
    );
  }

  if (status === "rejected") {
    return (
      <Button
        size='sm'
        disabled={pending}
        onClick={() => updateStatus("approved")}
      >
        Approve
      </Button>
    );
  }

  return null;
}
