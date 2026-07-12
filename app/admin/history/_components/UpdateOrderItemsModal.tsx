import { useState, useEffect } from "react";
import { Trash2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";
import { bulkUpdateOrderItemAction } from "@/actions/orders";
import { BreakdownItemData } from "./types";

type UpdateOrderItemsModalProps = {
  windowId: string;
  deletingItem: { name: string; data: BreakdownItemData } | null;
  onClose: () => void;
};

export function UpdateOrderItemsModal({
  windowId,
  deletingItem,
  onClose,
}: UpdateOrderItemsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [updates, setUpdates] = useState<Record<string, { quantity: number }>>({});
  const [prevDeletingItem, setPrevDeletingItem] = useState(deletingItem);

  if (deletingItem !== prevDeletingItem) {
    setPrevDeletingItem(deletingItem);
    if (deletingItem) {
      const initial: Record<string, { quantity: number }> = {};
      deletingItem.data.users.forEach((u) => {
        initial[u.orderId] = { quantity: u.quantity };
      });
      setUpdates(initial);
    } else {
      setUpdates({});
    }
  }

  const hasChanges = deletingItem
    ? Object.entries(updates).some(([orderId, v]) => {
        const originalUser = deletingItem.data.users.find(
          (u) => u.orderId === orderId,
        );
        return originalUser && v.quantity !== originalUser.quantity;
      })
    : false;

  async function handleDeleteConfirm() {
    if (!deletingItem) return;
    setIsDeleting(true);

    const payloadUpdates = Object.entries(updates)
      .filter(([orderId, v]) => {
        const originalUser = deletingItem.data.users.find(
          (u) => u.orderId === orderId,
        );
        return originalUser && v.quantity !== originalUser.quantity;
      })
      .map(([orderId, v]) => ({ orderId, newQuantity: v.quantity }));

    if (payloadUpdates.length === 0) {
      setIsDeleting(false);
      onClose();
      return;
    }

    try {
      const res = await bulkUpdateOrderItemAction(
        windowId,
        deletingItem.data.menuItemId,
        payloadUpdates,
      );
      if (res.success) {
        toast.success(`Updated orders for ${deletingItem.name}.`);
        onClose();
      } else {
        toast.error(res.error || "Failed to update item.");
      }
    } catch {
      toast.error("An error occurred while updating the item.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog
      open={!!deletingItem}
      onOpenChange={(open) => !open && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update {deletingItem?.name}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              Select users to update or remove <strong>{deletingItem?.name}</strong>{" "}
              from their orders. (Total quantity: {deletingItem?.data.quantity})
              <br />
              <br />
              <strong>
                Users affected ({deletingItem?.data.users.length}):
              </strong>
              <Button
                variant='outline'
                size='sm'
                className='w-full mt-3 mb-1'
                onClick={() => {
                  setUpdates((prev) => {
                    const newUpdates = { ...prev };
                    Object.keys(newUpdates).forEach((key) => {
                      newUpdates[key].quantity = 0;
                    });
                    return newUpdates;
                  });
                }}
              >
                <Trash2 className='w-4 h-4 mr-2 text-muted-foreground' />
                Make all 0
              </Button>
              <div className='max-h-60 overflow-y-auto mt-2 border p-2 bg-muted/50 text-foreground space-y-3 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
                {deletingItem?.data.users.map((u) => {
                  const updateState = updates[u.orderId];
                  if (!updateState) return null;

                  return (
                    <div
                      key={u.orderId}
                      className='flex items-center justify-between text-sm px-1 py-0.5'
                    >
                      <div className='flex items-center gap-2'>
                        <span
                          className={`font-medium transition-colors ${updateState.quantity === 0 ? "line-through text-muted-foreground opacity-70" : ""}`}
                        >
                          {u.name}
                        </span>
                        <span
                          className={`text-muted-foreground text-xs ${updateState.quantity === 0 ? "opacity-70" : ""}`}
                        >
                          ({u.quantity})
                        </span>
                      </div>
                      <div className='flex items-center gap-3 mr-1'>
                        <Button
                          variant='outline'
                          size='icon'
                          className='h-6 w-6 rounded-md'
                          disabled={updateState.quantity <= 0}
                          onClick={() => {
                            setUpdates((prev) => ({
                              ...prev,
                              [u.orderId]: {
                                ...prev[u.orderId],
                                quantity: updateState.quantity - 1,
                              },
                            }));
                          }}
                        >
                          <Minus className='h-3 w-3' />
                        </Button>
                        <span className='w-3 text-center text-sm font-medium'>
                          {updateState.quantity}
                        </span>
                        <Button
                          variant='outline'
                          size='icon'
                          className='h-6 w-6 rounded-md'
                          disabled={updateState.quantity >= u.quantity}
                          onClick={() => {
                            setUpdates((prev) => ({
                              ...prev,
                              [u.orderId]: {
                                ...prev[u.orderId],
                                quantity: updateState.quantity + 1,
                              },
                            }));
                          }}
                        >
                          <Plus className='h-3 w-3' />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDeleteConfirm();
            }}
            disabled={isDeleting || !hasChanges}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isDeleting ? "Updating..." : "Update orders"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
