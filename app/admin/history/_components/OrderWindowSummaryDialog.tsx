"use client";

import { useState } from "react";
import { Copy, FileText } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { AdminWindowHistory as AdminWindowHistoryType } from "@/modules/orders/admin-history-queries";

type OrderWindowSummaryDialogProps = {
  window: AdminWindowHistoryType[number];
  trigger?: React.ReactNode;
};

export function OrderWindowSummaryDialog({
  window,
  trigger,
}: OrderWindowSummaryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculations
  const approvedOrders = window.orders.filter((o) => o.status === "approved");

  const rejectedOrders = window.orders.filter((o) => o.status === "rejected");

  const cancelledOrders = window.orders.filter((o) => o.status === "cancelled");

  const total = approvedOrders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (itemSum, item) =>
          itemSum + Number(item.menuItem.price) * item.quantity,
        0,
      ),
    0,
  );

  // Item breakdown (only from approved orders)
  const itemBreakdown = new Map<string, { quantity: number; total: number }>();

  for (const order of approvedOrders) {
    for (const item of order.items) {
      const existing = itemBreakdown.get(item.menuItem.name);
      const itemTotal = Number(item.menuItem.price) * item.quantity;

      if (existing) {
        existing.quantity += item.quantity;
        existing.total += itemTotal;
      } else {
        itemBreakdown.set(item.menuItem.name, {
          quantity: item.quantity,
          total: itemTotal,
        });
      }
    }
  }

  // Sort by total (highest first)
  const sortedBreakdown = Array.from(itemBreakdown.entries()).sort(
    (a, b) => b[1].quantity - a[1].quantity,
  );

  async function copySummary() {
    const date = new Date(window.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const text = `${window.label} Window (${date})

Total: ₹${total.toFixed(2)}

Item Breakdown:
${sortedBreakdown
  .map(([name, value]) => `  ${name} × ${value.quantity}`)
  .join("\n")}`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Window summary copied to clipboard!");
    } catch {
      toast.error("Failed to copy, Please try again");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='summary' size='sm'>
            <FileText className='mr-2 h-3.5 w-3.5' />
            Summary
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{window.label} Window Summary</DialogTitle>
          <p className='text-sm font-normal text-muted-foreground'>
            {new Date(window.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Stats Grid */}
          <div className='grid grid-cols-6 gap-3'>
            <div className='col-span-2'>
              <p className='text-xs text-muted-foreground'>Total</p>
              <p className='text-xl font-semibold'>₹{total.toFixed(2)}</p>
            </div>

            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Orders</p>
              <p className='text-xl font-semibold'>{window.orders.length}</p>
            </div>

            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Approved</p>
              <p className='text-xl font-semibold text-green-600'>
                {approvedOrders.length}
              </p>
            </div>

            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Rejected</p>
              <p className='text-xl font-semibold text-red-600'>
                {rejectedOrders.length}
              </p>
            </div>

            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Cancelled</p>
              <p className='text-xl font-semibold text-yellow-600'>
                {cancelledOrders.length}
              </p>
            </div>
          </div>

          {/* Copy Button */}
          <div className='flex justify-end'>
            <Button variant='ghost' size='sm' onClick={copySummary}>
              <Copy className='mr-2 h-3.5 w-3.5' />
              Copy Summary
            </Button>
          </div>

          {/* Item Breakdown */}
          <div className='space-y-3 border-t pt-4 max-h-120 overflow-y-auto'>
            <h4 className='font-medium'>Item Breakdown (Approved Orders)</h4>

            {sortedBreakdown.length > 0 ? (
              <div className='space-y-2'>
                {sortedBreakdown.map(([name, value]) => (
                  <div
                    key={name}
                    className='flex justify-between text-sm items-center'
                  >
                    <span className='text-muted-foreground'>
                      {name} × {value.quantity}
                    </span>
                    <span className='font-medium'>
                      ₹{value.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground text-center py-4'>
                No approved orders to display
              </p>
            )}

            {/* Total */}
            {sortedBreakdown.length > 0 && (
              <div className='flex justify-between text-sm font-medium pt-2 border-t'>
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
