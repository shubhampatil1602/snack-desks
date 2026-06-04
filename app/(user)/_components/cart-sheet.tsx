"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

import { useCartStore, useCartSubtotal } from "@/store/cart-store";
import { X, Plus, Minus } from "lucide-react";
import {
  placeOrderAction,
  updateOrderAction,
  cancelOrderAction,
} from "@/actions/orders";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { hasCartChanged } from "@/lib/cart";
import { ORDER_STATUS } from "@/lib/constants";
import { useTransition, useState } from "react";
import { Loader2 } from "lucide-react";

type CartSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const [cancelling, setCancelling] = useState(false);
  const [placing, startPlacing] = useTransition();
  const [updating, startUpdating] = useTransition();
  const items = useCartStore((state) => state.items);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const windowId = useCartStore((state) => state.windowId);
  const hasPlacedOrder = useCartStore((state) => state.hasPlacedOrder);
  const orderId = useCartStore((state) => state.orderId);
  const savedItems = useCartStore((state) => state.savedItems);
  const orderStatus = useCartStore((state) => state.orderStatus);

  const router = useRouter();
  const subtotal = useCartSubtotal();

  const isMutating = placing || updating || cancelling;

  function handlePlaceOrder() {
    startPlacing(async () => {
      if (!windowId) {
        toast.error("Order window not found");
        return;
      }

      const result = await placeOrderAction({
        windowId,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Order placed");
      router.refresh();
    });
  }
  function handleUpdateOrder() {
    startUpdating(async () => {
      if (!orderId) {
        toast.error("Order not found");
        return;
      }

      if (!hasChanges) {
        toast.info("No changes to update");
        return;
      }

      const result = await updateOrderAction(
        orderId,
        items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Order updated");
      router.refresh();
    });
  }
  async function handleCancelOrder() {
    if (!orderId) {
      toast.error("Order not found");
      return;
    }

    try {
      setCancelling(true);

      const result = await cancelOrderAction(orderId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Order cancelled");

      clearCart();

      onOpenChange(false);

      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  }

  const hasChanges = hasCartChanged(items, savedItems);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className='w-full h-full'
        style={{ width: "100%", maxWidth: "50vw" }}
      >
        <div className='flex h-full flex-col'>
          <div className='border-b shrink-0'>
            <SheetHeader>
              <SheetTitle>Shopping Cart</SheetTitle>
            </SheetHeader>
          </div>

          {/* Scrollable items container with Table */}
          <div className='flex-1 overflow-y-auto min-h-0'>
            {items.length === 0 ? (
              <p className='text-sm text-muted-foreground p-4 text-center'>
                Your cart is empty
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className='text-center'>Quantity</TableHead>
                    <TableHead className='text-right'>Price</TableHead>
                    <TableHead className='text-center'>Cancel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.menuItemId}>
                      <TableCell className='font-medium'>{item.name}</TableCell>
                      <TableCell className='text-center'>
                        <div className='flex items-center justify-center gap-2'>
                          <Button
                            variant='outline'
                            size='icon'
                            className='h-8 w-8'
                            onClick={() => decrement(item.menuItemId)}
                            disabled={isMutating}
                          >
                            <Minus className='h-3 w-3' />
                          </Button>
                          <span className='w-8 text-center'>
                            {item.quantity}
                          </span>
                          <Button
                            variant='outline'
                            size='icon'
                            className='h-8 w-8'
                            onClick={() => increment(item.menuItemId)}
                            disabled={isMutating}
                          >
                            <Plus className='h-3 w-3' />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        ₹{Number(item.price) * item.quantity}
                      </TableCell>
                      <TableCell className='text-center'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8'
                          onClick={() => removeItem(item.menuItemId)}
                          disabled={isMutating}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Fixed footer */}
          <div className='shrink-0 border-t'>
            <div className='flex items-center justify-between px-6 py-4'>
              <span className='text-lg font-semibold'>Subtotal</span>
              <span className='text-lg font-semibold'>₹{subtotal}</span>
            </div>
            <div className='px-3 pb-4'>
              {!hasPlacedOrder ? (
                <Button
                  className='w-full'
                  onClick={handlePlaceOrder}
                  disabled={items.length === 0 || placing}
                  size='lg'
                >
                  {placing && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  {placing ? "Placing..." : "Place Order"}
                </Button>
              ) : orderStatus === ORDER_STATUS.PENDING ? (
                <div className='flex justify-between gap-3'>
                  <Button
                    onClick={handleUpdateOrder}
                    disabled={!hasChanges || updating}
                    className='flex-1'
                  >
                    {updating && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    {updating ? "Updating..." : "Update Order"}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant='outline'
                        className='flex-1'
                        disabled={cancelling}
                      >
                        {cancelling && (
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        )}
                        {cancelling ? "Cancelling..." : "Cancel Order"}
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this order?</AlertDialogTitle>

                        <AlertDialogDescription>
                          Your order will be removed from the active order
                          window. You can place a new order again while the
                          order window remains active.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Order</AlertDialogCancel>

                        <AlertDialogAction
                          onClick={handleCancelOrder}
                          className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          disabled={cancelling}
                        >
                          {cancelling ? "Cancelling..." : "Cancel Order"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className='border p-3 text-center'>
                  Order Status: {orderStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
