"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteOrderWindowAction } from "@/actions/delete-order-window";

import { Button } from "@/components/ui/button";
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

type DeleteOrderWindowButtonProps = {
  windowId: string;
  windowLabel: string;
};

export function DeleteOrderWindowButton({
  windowId,
  windowLabel,
}: DeleteOrderWindowButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    try {
      setLoading(true);

      const result = await deleteOrderWindowAction(windowId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Order window deleted");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant='delete'
          size='icon-sm'
          disabled={loading}
          className='text-muted-foreground hover:text-destructive'
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete
            <span className='font-bold'>{windowLabel}</span>?
          </AlertDialogTitle>

          <AlertDialogDescription>
            This will permanently delete the order window and all orders placed
            within it. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}

            {loading ? "Deleting..." : "Delete Window"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
