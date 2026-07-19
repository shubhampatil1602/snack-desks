"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateOrderStatusAction } from "@/actions/orders";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  orderId: string;
  status: string;
};

export function HistoryOrderActions({ orderId, status }: Props) {
  const [pending, startTransition] = useTransition();

  function updateStatus(nextStatus: "approved" | "rejected" | "cancelled") {
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, nextStatus);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Order marked as ${nextStatus}`);
    });
  }

  if (status === "approved" || status === "pending") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size='sm' variant='delete' disabled={pending}>
            Cancel
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently cancel this order. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={(e) => {
                e.preventDefault(); // Prevent dialog from closing immediately if we want to wait for transition
                updateStatus("cancelled");
              }}
              disabled={pending}
            >
              {pending ? "Cancelling..." : "Yes, cancel order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
