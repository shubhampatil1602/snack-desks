"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Copy, Users, Check } from "lucide-react";

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

type OrderWindowUserSummaryDialogProps = {
  window: AdminWindowHistoryType[number];
  trigger?: React.ReactNode;
};

export function OrderWindowUserSummaryDialog({
  window,
  trigger,
}: OrderWindowUserSummaryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Only approved orders
  const approvedOrders = window.orders.filter((o) => o.status === "approved");
  const rejectedOrders = window.orders.filter((o) => o.status === "rejected");
  const cancelledOrders = window.orders.filter((o) => o.status === "cancelled");

  // Total Bill from approved orders only
  const total = approvedOrders.reduce(
    (sum, order) =>
      sum +
      order.items
        .filter((item) => !item.replacementApplied)
        .reduce(
          (itemSum, item) =>
            itemSum + Number(item.menuItem.price) * item.quantity,
          0,
        ),
    0,
  );

  // User breakdown from approved orders ONLY
  const userBreakdown = approvedOrders
    .map((order) => ({
      id: order.user.id,
      name: order.user.name,
      total: order.items
        .filter((item) => !item.replacementApplied)
        .reduce(
          (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
          0,
        ),
    }))
    // Group by user (if same user has multiple approved orders)
    .reduce(
      (acc, curr) => {
        const existing = acc.find((user) => user.id === curr.id);
        if (existing) {
          existing.total += curr.total;
        } else {
          acc.push({ ...curr });
        }
        return acc;
      },
      [] as Array<{ id: string; name: string; total: number }>,
    )
    // Sort by total (highest first)
    .sort((a, b) => b.total - a.total);

  async function copySummary() {
    const date = new Date(window.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const text = `${window.label} Window (${date})

Total Bill: ${formatCurrency(total)}
${userBreakdown
  .map((user) => `  ${user.name} - ${formatCurrency(user.total)}`)
  .join("\n")}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Failed to copy, Please try again");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='split' size='sm'>
            <Users className='mr-2 h-3.5 w-3.5' />
            Split
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{window.label} Window - User Summary</DialogTitle>
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
          <div className='grid grid-cols-5 gap-3'>
            <div className='col-span-2'>
              <p className='text-xs text-muted-foreground'>
                Total bill to split
              </p>
              <p className='text-xl font-semibold'>{formatCurrency(total)}</p>
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

          {/* User Breakdown - Approved Orders Only */}
          <div className='space-y-3 border-t pt-4 max-h-120 overflow-y-auto'>
            <div className='flex justify-between items-center'>
              <h4 className='font-medium'>Amount Per User</h4>
              <Button
                variant='ghost'
                size='sm'
                onClick={copySummary}
                className='gap-2'
              >
                {copied ? (
                  <>
                    <Check className='h-3.5 w-3.5 text-green-500' />
                    <span className='text-green-500'>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className='h-3.5 w-3.5' />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {userBreakdown.length > 0 ? (
              <div className='space-y-2'>
                {userBreakdown.map((user) => (
                  <div
                    key={user.id}
                    className='flex justify-between text-sm items-center'
                  >
                    <span className='font-medium text-muted-foreground'>
                      {user.name}
                    </span>
                    <span className='font-medium'>
                      {formatCurrency(user.total)}
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
            {userBreakdown.length > 0 && (
              <div className='flex justify-between text-sm font-medium pt-2 border-t'>
                <span>Total Bill</span>
                <span>{formatCurrency(total)}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
