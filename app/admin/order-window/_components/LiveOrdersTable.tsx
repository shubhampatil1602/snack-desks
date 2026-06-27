"use client";

import type { LiveOrder } from "@/modules/orders/admin-queries";
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
import { useState, useTransition } from "react";
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

type LiveOrdersTableProps = {
  orders: LiveOrder[];
};

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

export function LiveOrdersTable({ orders }: LiveOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className='border p-6 text-sm text-muted-foreground'>
        No orders yet
      </div>
    );
  }

  const bill = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className='border'>
      <div className='flex items-center gap-6 border p-4'>
        <div>
          <p className='text-xs text-muted-foreground'>Orders</p>
          <p className='text-xl font-semibold'>{orders.length}</p>
        </div>

        <div>
          <p className='text-xs text-muted-foreground'>Bill</p>
          <p className='text-xl font-semibold'>₹{bill}</p>
        </div>
      </div>
      <Table>
        <TableHeader className='bg-muted'>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className='font-medium'>{order.user.name}</TableCell>

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
                            (₹{item.menuItem.price} each)
                          </Badge>

                          {hasReplacements && !isReplaced && (
                            <UseAlternativeButton
                              orderItemId={item.id}
                              item={item}
                            />
                          )}

                          {isReplaced && (
                            <Badge
                              variant='outline'
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
                            {item.replacementPreferences
                              .map((r) => `${r.menuItem.name} × ${r.quantity}`)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TableCell>

              <TableCell>₹{order.total}</TableCell>

              <TableCell>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </TableCell>

              <TableCell>
                <OrderActions orderId={order.id} status={order.status} />
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
