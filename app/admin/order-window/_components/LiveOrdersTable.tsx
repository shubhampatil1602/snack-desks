"use client";

import type { LiveOrder } from "@/modules/orders/admin-queries";
import { formatCurrency, formatSplitNames } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderActions } from "./OrderActions";
import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { applyReplacementAction } from "@/actions/orders";
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

import { AddOrderOnBehalfDialog } from "./AddOrderOnBehalfDialog";
import type { MenuItem } from "@/types/menu";

type LiveOrdersTableProps = {
  orders: LiveOrder[];
  windowId?: string;
  windowLabel?: string;
  menuItems?: MenuItem[];
};

type ParticipantLiveOrder = LiveOrder & {
  rawItems?: LiveOrder["items"];
  isCoSplitOnly?: boolean;
  hasSplit?: boolean;
  splitInitiatorName?: string;
};

function processLiveOrders(rawOrders: LiveOrder[]): ParticipantLiveOrder[] {
  const userOrderMap = new Map<string, ParticipantLiveOrder>();
  const otherOrders: ParticipantLiveOrder[] = [];

  for (const order of rawOrders) {
    if (order.status === "cancelled") {
      otherOrders.push({
        ...order,
        rawItems: order.items,
        isCoSplitOnly: false,
        hasSplit: false,
      });
      continue;
    }

    const ownerItems: LiveOrder["items"] = [];
    const coSplitItemsMap = new Map<string, LiveOrder["items"]>();
    let orderHasSplit = false;

    for (const item of order.items) {
      const splits = item.splits || [];
      if (splits.length > 0) {
        orderHasSplit = true;
        const participantCount = splits.length + 1;
        const perPersonPrice = (
          Number(item.menuItem.price) / participantCount
        ).toFixed(2);

        // 1. Owner's item
        ownerItems.push({
          ...item,
          menuItem: {
            ...item.menuItem,
            price: perPersonPrice,
          },
        });

        // 2. Co-splitters' items
        for (const split of splits) {
          const coSplitItem: LiveOrder["items"][number] = {
            ...item,
            id: `${item.id}-split-${split.userId}`,
            menuItem: {
              ...item.menuItem,
              price: perPersonPrice,
            },
            splits: [
              {
                id: `owner-${order.userId}`,
                orderItemId: item.id,
                userId: order.userId,
                shareRatio: 1 / participantCount,
                status: "accepted",
                createdAt: new Date(),
                user: {
                  id: order.user.id,
                  name: order.user.name,
                  email: order.user.email,
                },
              },
              ...splits
                .filter((s) => s.userId !== split.userId)
                .map((s) => ({
                  ...s,
                  shareRatio: 1 / participantCount,
                })),
            ],
          };

          if (!coSplitItemsMap.has(split.userId)) {
            coSplitItemsMap.set(split.userId, []);
          }
          coSplitItemsMap.get(split.userId)!.push(coSplitItem);
        }
      } else {
        ownerItems.push(item);
      }
    }

    const ownerTotal = ownerItems
      .filter((i) => !i.replacementApplied)
      .reduce((sum, i) => sum + Number(i.menuItem.price) * i.quantity, 0);

    if (!userOrderMap.has(order.userId)) {
      userOrderMap.set(order.userId, {
        ...order,
        rawItems: order.items,
        items: ownerItems,
        total: ownerTotal,
        isCoSplitOnly: false,
        hasSplit: orderHasSplit,
      });
    } else {
      const existing = userOrderMap.get(order.userId)!;
      existing.items.push(...ownerItems);
      existing.total += ownerTotal;
      if (orderHasSplit) existing.hasSplit = true;
      if (order.items) {
        existing.rawItems = [...(existing.rawItems || []), ...order.items];
      }
    }

    for (const [splitUserId, splitItems] of coSplitItemsMap.entries()) {
      const splitUserObj = order.items
        .flatMap((i) => i.splits || [])
        .find((s) => s.userId === splitUserId)?.user || {
        id: splitUserId,
        name: "Unknown User",
        email: "",
      };

      const splitUserTotal = splitItems
        .filter((i) => !i.replacementApplied)
        .reduce((sum, i) => sum + Number(i.menuItem.price) * i.quantity, 0);

      if (userOrderMap.has(splitUserId)) {
        const existing = userOrderMap.get(splitUserId)!;
        existing.items.push(...splitItems);
        existing.total += splitUserTotal;
        existing.hasSplit = true;
      } else {
        userOrderMap.set(splitUserId, {
          ...order,
          id: `split-${order.id}-${splitUserId}`,
          userId: splitUserId,
          user: {
            ...order.user,
            id: splitUserId,
            name: splitUserObj.name,
            email: splitUserObj.email,
          },
          items: splitItems,
          total: splitUserTotal,
          rawItems: undefined,
          isCoSplitOnly: true,
          hasSplit: true,
          splitInitiatorName: order.user.name,
          createdByAdmin: false,
        });
      }
    }
  }

  const result = [...userOrderMap.values(), ...otherOrders];
  result.sort((a, b) => a.user.name.localeCompare(b.user.name));
  return result;
}

function getStatusVariant(status: string) {
  switch (status) {
    case "approved":
      return "default";

    case "rejected":
      return "destructive";

    default:
      return "secondary";
  }
}

export function LiveOrdersTable({
  orders,
  windowId,
  windowLabel,
  menuItems,
}: LiveOrdersTableProps) {
  const processedOrders = useMemo(() => processLiveOrders(orders), [orders]);

  if (orders.length === 0) {
    return (
      <div className='border'>
        <div className='flex items-center justify-between p-4 flex-wrap gap-4'>
          <div className='flex items-center gap-6'>
            <div>
              <p className='text-xs text-muted-foreground'>Orders</p>
              <p className='text-xl font-semibold'>0</p>
            </div>

            <div>
              <p className='text-xs text-muted-foreground'>Bill</p>
              <p className='text-xl font-semibold'>{formatCurrency(0)}</p>
            </div>
          </div>

          {windowId && menuItems && (
            <AddOrderOnBehalfDialog
              windowId={windowId}
              windowLabel={windowLabel ?? "Active Window"}
              menuItems={menuItems}
            />
          )}
        </div>
        <div className='border-t p-8 text-center text-sm text-muted-foreground'>
          No orders yet
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(
    (o) => o.status !== "cancelled" && o.status !== "rejected",
  );
  const bill = activeOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className='border overflow-x-auto'>
      <div className='flex items-center justify-between p-4 flex-wrap gap-4'>
        <div className='flex items-center gap-6'>
          <div>
            <p className='text-xs text-muted-foreground'>Orders</p>
            <p className='text-xl font-semibold'>{activeOrders.length}</p>
          </div>

          <div>
            <p className='text-xs text-muted-foreground'>Bill</p>
            <p className='text-xl font-semibold'>{formatCurrency(bill)}</p>
          </div>
        </div>

        {windowId && menuItems && (
          <AddOrderOnBehalfDialog
            windowId={windowId}
            windowLabel={windowLabel ?? "Active Window"}
            menuItems={menuItems}
          />
        )}
      </div>
      <Table>
        <TableHeader className='bg-muted border-t'>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {processedOrders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className='font-medium'>
                <div className='flex items-center gap-2'>
                  <span>{order.user.name}</span>
                  {(order.isCoSplitOnly || order.hasSplit) && (
                    <Badge
                      variant='outline'
                      className='text-[10px] border-primary/30 text-primary bg-primary/5 rounded-full py-0 px-1.5'
                    >
                      Split
                    </Badge>
                  )}
                  {order.createdByAdmin && (
                    <Badge
                      variant='outline'
                      className='text-[10px] border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20 rounded-full py-0 px-1.5'
                    >
                      On Behalf
                    </Badge>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <div className='space-y-2'>
                  {order.items.map((item) => {
                    const hasReplacements =
                      item.replacementPreferences &&
                      item.replacementPreferences.length > 0;
                    const isReplaced = item.replacementApplied;

                    return (
                      <div key={item.id} className='flex flex-col gap-1'>
                        <div className='flex items-center flex-wrap gap-2'>
                          <span
                            className={
                              isReplaced
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {item.menuItem.name} × {item.quantity}
                          </span>

                          <Badge variant='secondary' className='text-[10px]'>
                            ({formatCurrency(item.menuItem.price)} each)
                          </Badge>

                          {item.splits && item.splits.length > 0 && (
                            <div className='inline-flex items-center gap-1.5 flex-wrap'>
                              <Badge
                                variant='outline'
                                className='text-[10px] border-primary/30 text-primary bg-primary/5 rounded-md py-0.5 px-2 font-medium normal-case tracking-normal'
                                title={`Split with: ${item.splits.map((s) => s.user.name).join(", ")}`}
                              >
                                1/{item.splits.length + 1} Split • {formatSplitNames(item.splits.map((s) => s.user.name))}
                              </Badge>

                              <span className='text-[10px] text-muted-foreground font-medium'>
                                ({formatCurrency(Number(item.menuItem.price) / (item.splits.length + 1))}/person)
                              </span>
                            </div>
                          )}

                          {hasReplacements && !isReplaced && (
                            <UseAlternativeButton
                              orderItemId={item.id}
                              item={item}
                            />
                          )}

                          {isReplaced && (
                            <Badge
                              variant='default'
                              className='text-[10px] bg-muted'
                            >
                              Alternative Used
                            </Badge>
                          )}
                        </div>

                        {/* Display what it was replaced with, or its preference */}
                        {hasReplacements && !isReplaced && (
                          <div className='text-[10px] text-muted-foreground ml-2 border-l pl-2 border-muted'>
                            Alternative Pref:{" "}
                            {item.replacementPreferences.length > 0 &&
                              `${item.replacementPreferences[0].menuItem.name} × ${item.replacementPreferences[0].quantity}`}
                            {item.replacementPreferences.length > 1 && " ..."}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TableCell>

              <TableCell>{formatCurrency(order.total)}</TableCell>

              <TableCell>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </TableCell>

              <TableCell>
                {!order.isCoSplitOnly ? (
                  <OrderActions
                    orderId={order.id}
                    status={order.status}
                    userName={order.user.name}
                    userId={order.user.id || order.userId}
                    items={(order.rawItems || order.items).filter(
                      (item) => !item.replacementApplied,
                    )}
                    menuItems={menuItems}
                  />
                ) : (
                  <span className='text-xs text-muted-foreground'>
                    Split with {order.splitInitiatorName}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UseAlternativeButton({
  orderItemId,
  item,
}: {
  orderItemId: string;
  item: LiveOrder["items"][number];
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    startTransition(async () => {
      const result = await applyReplacementAction(orderItemId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Alternative applied");
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size='xs'
          variant='outline'
          className='h-5 py-0 px-1.5 text-[10px] cursor-pointer'
          disabled={pending}
        >
          Use Alternative
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apply Alternative Preference?</AlertDialogTitle>
          <AlertDialogDescription>
            Replace{" "}
            <strong>
              {item.menuItem.name} × {item.quantity}
            </strong>{" "}
            with:
            <ul className='list-disc pl-5 mt-2 space-y-1 text-sm'>
              {item.replacementPreferences.map((rep) => (
                <li key={rep.id}>
                  {rep.menuItem.name} × {rep.quantity} (₹
                  {(Number(rep.menuItem.price) * rep.quantity).toFixed(2)})
                </li>
              ))}
            </ul>
            <p className='mt-4 text-sm font-medium'>
              This action will update the user&apos;s order total.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={pending}
            className='bg-primary text-primary-foreground hover:bg-primary/95'
          >
            {pending ? "Applying..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
