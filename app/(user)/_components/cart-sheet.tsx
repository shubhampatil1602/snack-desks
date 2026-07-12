"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { QuantityInput } from "./QuantityInput";
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useCartStore,
  useCartSubtotal,
  type CartItem,
} from "@/store/cart-store";
import {
  X,
  Plus,
  Minus,
  Trash,
  Loader2,
  ArrowLeftRight,
  Search,
} from "lucide-react";
import {
  placeOrderAction,
  updateOrderAction,
  cancelOrderAction,
  getActiveMenuItemsAction,
} from "@/actions/orders";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { hasCartChanged } from "@/lib/cart";
import { ORDER_STATUS } from "@/lib/constants";
import { useTransition, useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";

type CartSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export interface ActiveMenuItem {
  id: string;
  name: string;
  price: string;
  unit: string | null;
  menuCategoryName: string;
  shopName: string | null;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const [cancelling, setCancelling] = useState(false);
  const [placing, startPlacing] = useTransition();
  const [updating, startUpdating] = useTransition();
  const [activeMenuItems, setActiveMenuItems] = useState<ActiveMenuItem[]>([]);

  useEffect(() => {
    if (open) {
      getActiveMenuItemsAction().then((result) => {
        if (result.success && result.items) {
          setActiveMenuItems(result.items);
        }
      });
    }
  }, [open]);

  const items = useCartStore((state) => state.items);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const setQuantity = useCartStore((state) => state.setQuantity);
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
          replacements: item.replacements?.map((rep) => ({
            menuItemId: rep.menuItemId,
            quantity: rep.quantity,
          })),
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
          replacements: item.replacements?.map((rep) => ({
            menuItemId: rep.menuItemId,
            quantity: rep.quantity,
          })),
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
      <SheetContent>
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
                    <TableHead className='text-center'>Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.menuItemId} className='border-b'>
                      <TableCell className='font-medium py-3'>
                        <div className='flex flex-col gap-0.5'>
                          <span className='font-semibold text-sm'>
                            {item.name}
                          </span>
                          <ManageAlternativesDialog
                            originalItem={item}
                            activeMenuItems={activeMenuItems}
                            isMutating={isMutating}
                          />
                        </div>
                      </TableCell>
                      <TableCell className='text-center'>
                        <div className='flex items-center justify-center gap-2'>
                          <Button
                            variant='outline'
                            size='icon'
                            className='h-8 w-8 shrink-0'
                            onClick={() => decrement(item.menuItemId)}
                            disabled={isMutating}
                          >
                            <Minus className='h-3 w-3' />
                          </Button>
                          <div className='w-8 h-8 shrink-0 font-medium'>
                            <QuantityInput
                              initialQuantity={item.quantity}
                              onUpdate={(qty) => {
                                if (qty === 0) {
                                  removeItem(item.menuItemId);
                                } else {
                                  setQuantity(item.menuItemId, qty);
                                }
                              }}
                            />
                          </div>
                          <Button
                            variant='outline'
                            size='icon'
                            className='h-8 w-8 shrink-0'
                            onClick={() => increment(item.menuItemId)}
                            disabled={isMutating}
                          >
                            <Plus className='h-3 w-3' />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className='text-right font-medium'>
                        {formatCurrency((Number(item.price) * item.quantity))}
                      </TableCell>
                      <TableCell className='text-center'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-muted-foreground hover:text-destructive'
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
              <span className='text-lg font-semibold'>{formatCurrency(subtotal)}</span>
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

function ManageAlternativesDialog({
  originalItem,
  activeMenuItems,
  isMutating,
}: {
  originalItem: CartItem;
  activeMenuItems: ActiveMenuItem[];
  isMutating: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const addReplacementItem = useCartStore((state) => state.addReplacementItem);
  const removeReplacementItem = useCartStore(
    (state) => state.removeReplacementItem,
  );
  const updateReplacementItemQuantity = useCartStore(
    (state) => state.updateReplacementItemQuantity,
  );

  const replacements = useMemo(
    () => originalItem.replacements || [],
    [originalItem.replacements],
  );

  // Filter items matching search, excluding original item and already added alternatives
  const filteredSearchItems = useMemo(() => {
    if (!search.trim()) return [];
    return activeMenuItems.filter(
      (menuItem) =>
        menuItem.name.toLowerCase().includes(search.toLowerCase()) &&
        menuItem.id !== originalItem.menuItemId &&
        !replacements.some((r) => r.menuItemId === menuItem.id),
    );
  }, [search, activeMenuItems, originalItem.menuItemId, replacements]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {replacements.length > 0 ? (
          <button
            type='button'
            className='flex items-center gap-1.5 mt-1.5 text-xs text-amber-700 hover:text-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900 font-semibold cursor-pointer shadow-xs transition-colors'
          >
            <ArrowLeftRight className='h-3 w-3 animate-pulse' />
            <span>
              {replacements.length} Alternative
              {replacements.length > 1 ? "s" : ""} Selected
            </span>
          </button>
        ) : (
          <button
            type='button'
            className='flex items-center gap-1.5 mt-1.5 text-xs text-amber-600 dark:text-amber-500 hover:text-amber-700 hover:dark:text-amber-400 font-semibold cursor-pointer transition-colors'
          >
            <ArrowLeftRight className='h-3 w-3' />
            <span>Add Alternative (Optional)</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-md p-5'>
        <DialogHeader>
          <DialogTitle className='text-base font-semibold'>
            Alternatives for {originalItem.name}
          </DialogTitle>
          <p className='text-xs text-muted-foreground'>
            If {originalItem.name} is out of stock, admins will use these items
            in order of preference.
          </p>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Search Input */}
          <div className='relative'>
            <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
            <Input
              placeholder='Search alternative items...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-8 h-9 text-xs'
              disabled={isMutating}
            />
            {search && (
              <button
                type='button'
                onClick={() => setSearch("")}
                className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                <X className='h-3 w-3' />
                <span className='hidden'>clear</span>
              </button>
            )}

            {/* Search Results */}
            {filteredSearchItems.length > 0 && (
              <div className='absolute z-50 w-full mt-1 bg-popover border text-popover-foreground rounded-md shadow-lg max-h-48 overflow-y-auto divide-y'>
                {filteredSearchItems.map((menuItem) => (
                  <button
                    key={menuItem.id}
                    type='button'
                    onClick={() => {
                      addReplacementItem(originalItem.menuItemId, {
                        menuItemId: menuItem.id,
                        name: menuItem.name,
                        price: menuItem.price,
                        quantity: 1,
                      });
                      setSearch("");
                    }}
                    className='w-full text-left px-3 py-2 hover:bg-muted text-xs flex justify-between items-center'
                  >
                    <span className='font-medium'>{menuItem.name}</span>
                    <span className='text-muted-foreground text-[10px]'>
                      {formatCurrency(menuItem.price)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configured Alternatives List */}
          <div className='space-y-2'>
            <h4 className='text-xs font-semibold text-foreground/80'>
              Selected Alternatives
            </h4>
            {replacements.length > 0 ? (
              <div className='space-y-2 max-h-52 overflow-y-auto pr-1'>
                {replacements.map((rep) => (
                  <div
                    key={rep.menuItemId}
                    className='flex items-center justify-between border bg-muted/20 p-2 rounded-md'
                  >
                    <div className='space-y-0.5'>
                      <span className='font-medium text-xs'>{rep.name}</span>
                      <span className='block text-muted-foreground text-[10px]'>
                        {formatCurrency(rep.price)} each
                      </span>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className='flex items-center gap-1 border rounded-md bg-background'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7 rounded-none shrink-0'
                          onClick={() => {
                            if (rep.quantity === 1) {
                              removeReplacementItem(
                                originalItem.menuItemId,
                                rep.menuItemId,
                              );
                            } else {
                              updateReplacementItemQuantity(
                                originalItem.menuItemId,
                                rep.menuItemId,
                                rep.quantity - 1,
                              );
                            }
                          }}
                          disabled={isMutating}
                        >
                          <Minus className='h-2.5 w-2.5' />
                        </Button>
                        <div className='w-6 h-7 shrink-0 text-xs font-semibold'>
                          <QuantityInput
                            initialQuantity={rep.quantity}
                            onUpdate={(qty) => {
                              if (qty === 0) {
                                removeReplacementItem(
                                  originalItem.menuItemId,
                                  rep.menuItemId,
                                );
                              } else {
                                updateReplacementItemQuantity(
                                  originalItem.menuItemId,
                                  rep.menuItemId,
                                  qty,
                                );
                              }
                            }}
                          />
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7 rounded-none shrink-0'
                          onClick={() => {
                            updateReplacementItemQuantity(
                              originalItem.menuItemId,
                              rep.menuItemId,
                              rep.quantity + 1,
                            );
                          }}
                          disabled={isMutating}
                        >
                          <Plus className='h-2.5 w-2.5' />
                        </Button>
                      </div>

                      <span className='font-semibold text-xs w-12 text-right'>
                        {formatCurrency((Number(rep.price) * rep.quantity))}
                      </span>

                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                        onClick={() =>
                          removeReplacementItem(
                            originalItem.menuItemId,
                            rep.menuItemId,
                          )
                        }
                        disabled={isMutating}
                      >
                        <Trash className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='border border-dashed rounded-md p-6 text-center text-xs text-muted-foreground'>
                No alternative items configured yet.
              </div>
            )}
          </div>
        </div>

        <div className='flex justify-end gap-2 border-t pt-3 mt-2'>
          <Button size='sm' onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
