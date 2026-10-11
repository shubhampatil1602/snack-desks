"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
  Users,
  Check,
} from "lucide-react";
import {
  placeOrderAction,
  updateOrderAction,
  cancelOrderAction,
  getActiveMenuItemsAction,
  getOrganizationMembersForSplitAction,
  getUserActiveSharedSplitsAction,
} from "@/actions/orders";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { hasCartChanged } from "@/lib/cart";
import { ORDER_STATUS } from "@/lib/constants";
import { useTransition, useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn, formatSplitNames } from "@/lib/utils";

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
  isGroupOrderEnabled?: boolean;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const [cancelling, setCancelling] = useState(false);
  const [placing, startPlacing] = useTransition();
  const [updating, startUpdating] = useTransition();
  const [activeMenuItems, setActiveMenuItems] = useState<ActiveMenuItem[]>([]);
  const sharedItems = useCartStore((state) => state.sharedItems);
  const setSharedItems = useCartStore((state) => state.setSharedItems);

  useEffect(() => {
    if (open) {
      getActiveMenuItemsAction().then((result) => {
        if (result.success && result.items) {
          setActiveMenuItems(result.items);
        }
      });
      getUserActiveSharedSplitsAction().then((result) => {
        if (result.success && result.splits) {
          setSharedItems(result.splits);
        }
      });
    }
  }, [open, setSharedItems]);

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
          splitUserIds: item.splitUsers?.map((u) => u.id),
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
          splitUserIds: item.splitUsers?.map((u) => u.id),
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
            {sharedItems && sharedItems.length > 0 && (
              <div className='p-3 border-b bg-primary/5 space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-1.5'>
                    <Users className='h-3.5 w-3.5 text-primary' />
                    <span className='text-xs font-semibold text-primary uppercase tracking-wider'>
                      Shared With You (Group Order)
                    </span>
                  </div>
                  <span className='text-[10px] text-muted-foreground'>
                    {sharedItems.length} split item{sharedItems.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className='space-y-1.5'>
                  {sharedItems.map((split) => (
                    <div
                      key={split.id}
                      className='flex items-center justify-between bg-card border p-2 text-xs rounded-sm'
                    >
                      <div className='space-y-0.5'>
                        <div className='flex items-center gap-1.5 flex-wrap'>
                          <span className='font-medium text-foreground'>
                            {split.name} × {split.quantity}
                          </span>
                          <span className='text-[9px] bg-primary/10 text-primary border border-primary/20 px-1 py-0.2 rounded-full font-medium'>
                            {split.splitFraction} split
                          </span>
                        </div>
                        <p className='text-[10px] text-muted-foreground'>
                          Ordered by{" "}
                          <span className='font-medium text-foreground'>
                            {split.initiatorName}
                          </span>
                          {split.coSplitterNames.length > 0 &&
                            ` (also with ${split.coSplitterNames.join(", ")})`}
                        </p>
                      </div>

                      <div className='text-right'>
                        <span className='font-semibold text-primary'>
                          {formatCurrency(split.userShare)}
                        </span>
                        <p className='text-[9px] text-muted-foreground line-through'>
                          {formatCurrency(
                            Number(split.unitPrice) * split.quantity,
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && (!sharedItems || sharedItems.length === 0) ? (
              <p className='text-sm text-muted-foreground p-4 text-center'>
                Your cart is empty
              </p>
            ) : items.length === 0 ? (
              <div className='p-4 text-center space-y-1'>
                <p className='text-xs text-muted-foreground'>
                  No personal items in your cart.
                </p>
                <p className='text-[11px] text-muted-foreground'>
                  Your shared group order items are displayed above. You can add more snacks for yourself from the menu or keep only the shared items.
                </p>
              </div>
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
                  {items.map((item) => {
                    const activeMatch = activeMenuItems.find(
                      (m) => m.id === item.menuItemId,
                    );
                    const isGroupOrder =
                      item.isGroupOrderEnabled ??
                      activeMatch?.isGroupOrderEnabled ??
                      false;
                    const splitCount = item.splitUsers?.length || 0;
                    const participantCount = splitCount + 1;
                    const itemTotal = Number(item.price) * item.quantity;
                    const userShare = itemTotal / participantCount;

                    return (
                      <TableRow key={item.menuItemId} className='border-b'>
                        <TableCell className='font-medium py-3'>
                          <div className='flex flex-col gap-0.5'>
                            <span className='font-semibold text-sm'>
                              {item.name}
                            </span>
                            {isGroupOrder && (
                              <SplitItemDialog
                                item={item}
                                isMutating={isMutating}
                              />
                            )}
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
                          {splitCount > 0 ? (
                            <div className='flex flex-col items-end leading-tight'>
                              <span className='text-sm font-semibold text-primary'>
                                {formatCurrency(userShare)}
                              </span>
                              <span className='text-[10px] text-muted-foreground line-through'>
                                {formatCurrency(itemTotal)}
                              </span>
                              <span className='text-[10px] text-emerald-600 font-medium'>
                                (1/{participantCount} share)
                              </span>
                            </div>
                          ) : (
                            formatCurrency(itemTotal)
                          )}
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
                    );
                  })}
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
                <>
                  <Button
                    className='w-full'
                    onClick={handlePlaceOrder}
                    disabled={items.length === 0 || placing}
                    size='lg'
                  >
                    {placing && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    {placing ? "Placing..." : "Place Order"}
                  </Button>
                  {items.length === 0 && sharedItems && sharedItems.length > 0 && (
                    <p className='text-[11px] text-center text-muted-foreground mt-2'>
                      Your shared group order is already placed by{" "}
                      {sharedItems[0].initiatorName}.
                    </p>
                  )}
                </>
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

function SplitItemDialog({
  item,
  isMutating,
}: {
  item: CartItem;
  isMutating: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const setSplitUsers = useCartStore((state) => state.setSplitUsers);

  const currentSplits = useMemo(() => item.splitUsers || [], [item.splitUsers]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() =>
    currentSplits.map((u) => u.id),
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (nextOpen) {
      setSelectedUserIds(currentSplits.map((u) => u.id));
      setLoading(true);
      getOrganizationMembersForSplitAction()
        .then((res) => {
          if (res.success && res.users) {
            setUsers(res.users);
          }
        })
        .finally(() => setLoading(false));
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()),
    );
  }, [users, search]);

  const toggleUser = (user: { id: string; name: string }) => {
    setSelectedUserIds((prev) =>
      prev.includes(user.id)
        ? prev.filter((id) => id !== user.id)
        : [...prev, user.id],
    );
  };

  const handleSave = () => {
    const selectedObjects = users
      .filter((u) => selectedUserIds.includes(u.id))
      .map((u) => ({ id: u.id, name: u.name, email: u.email }));
    setSplitUsers(item.menuItemId, selectedObjects);
    setIsOpen(false);
  };

  const participantCount = selectedUserIds.length + 1;
  const itemTotal = Number(item.price) * item.quantity;
  const sharePerPerson = itemTotal / participantCount;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {currentSplits.length > 0 ? (
          <button
            type='button'
            disabled={isMutating}
            title={`Split with: ${currentSplits.map((u) => u.name).join(", ")}`}
            className='inline-flex items-center gap-1.5 mt-1 text-xs text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors max-w-full'
          >
            <Users className='h-3.5 w-3.5 shrink-0' />
            <span className='truncate'>
              Split with {formatSplitNames(currentSplits.map((u) => u.name))} (1/
              {currentSplits.length + 1})
            </span>
          </button>
        ) : (
          <button
            type='button'
            disabled={isMutating}
            className='inline-flex items-center gap-1.5 mt-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold cursor-pointer transition-colors py-0.5'
          >
            <Users className='h-3.5 w-3.5 shrink-0' />
            <span>Split Item (Optional)</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-md p-5'>
        <DialogHeader>
          <DialogTitle className='text-base font-semibold'>
            Split {item.name} with Colleagues
          </DialogTitle>
          <p className='text-xs text-muted-foreground'>
            Select team members to split 1 quantity of this item. Each person
            pays an equal share.
          </p>
        </DialogHeader>

        {/* Calculation summary banner */}
        <div className='p-3 bg-muted/50 rounded-lg text-xs space-y-1 border'>
          <div className='flex justify-between font-medium'>
            <span>Total Item Cost:</span>
            <span>{formatCurrency(itemTotal)}</span>
          </div>
          <div className='flex justify-between text-muted-foreground'>
            <span>Participants:</span>
            <span>
              You + {selectedUserIds.length} colleague(s) = {participantCount}{" "}
              people
            </span>
          </div>
          <div className='flex justify-between font-semibold text-primary pt-1 border-t'>
            <span>Your Share:</span>
            <span>{formatCurrency(sharePerPerson)}</span>
          </div>
        </div>

        {/* Search */}
        <div className='relative mt-1'>
          <Search className='absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground' />
          <Input
            placeholder='Search colleagues by name...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-8 h-8 text-xs'
          />
        </div>

        {/* User list */}
        <div className='max-h-48 overflow-y-auto space-y-1 pr-1'>
          {loading ? (
            <div className='py-6 text-center text-xs text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin mx-auto mb-1' />
              Loading colleagues...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className='py-6 text-center text-xs text-muted-foreground'>
              No colleagues found
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUserIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-colors",
                    isSelected
                      ? "bg-primary/10 border-primary text-primary font-medium"
                      : "hover:bg-muted/50",
                  )}
                >
                  <div className='flex flex-col'>
                    <span>{u.name}</span>
                    <span className='text-[10px] text-muted-foreground'>
                      {u.email}
                    </span>
                  </div>
                  {isSelected && <Check className='h-4 w-4 text-primary' />}
                </div>
              );
            })
          )}
        </div>

        <div className='flex gap-2 justify-end pt-2 border-t'>
          {selectedUserIds.length > 0 && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='text-xs text-destructive'
              onClick={() => setSelectedUserIds([])}
            >
              Clear Split
            </Button>
          )}
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button type='button' size='sm' onClick={handleSave}>
            Save Split
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
