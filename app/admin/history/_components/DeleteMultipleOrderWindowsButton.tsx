"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteMultipleOrderWindowsAction } from "@/actions/delete-order-window";

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

type Props = {
  selectedIds: Set<string>;
  onClearSelection: () => void;
};

export function DeleteMultipleOrderWindowsButton({
  selectedIds,
  onClearSelection,
}: Props) {
  const [loading, setLoading] = useState(false);
  const count = selectedIds.size;

  async function handleDelete() {
    try {
      setLoading(true);

      const result = await deleteMultipleOrderWindowsAction(
        Array.from(selectedIds),
      );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`${count} order window${count > 1 ? "s" : ""} deleted`);
      onClearSelection();
    } finally {
      setLoading(false);
    }
  }

  if (count === 0) return null;

  return (
    <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300'>
      <div className='bg-background/80 backdrop-blur-md border shadow-lg rounded-full px-4 py-3 flex items-center gap-4'>
        <div className='text-sm font-medium whitespace-nowrap'>
          {count} window{count > 1 ? "s" : ""} selected
        </div>

        <div className='h-4 w-px bg-border' />

        <Button
          variant='ghost'
          size='sm'
          onClick={onClearSelection}
          className='rounded-full'
        >
          Clear
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant='delete'
              size='sm'
              className='rounded-full gap-2'
              disabled={loading}
            >
              {loading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Trash2 className='h-4 w-4' />
              )}
              Delete {count}
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {count} Order Windows?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {count} order window
                {count > 1 ? "s" : ""} and all orders placed within them. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={loading}>
                {loading ? "Deleting..." : "Yes, Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
