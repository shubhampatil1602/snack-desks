"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Copy, Users, Check, ArrowUpDown } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type OrderWindowUserSummaryDialogProps = {
  window: {
    createdAt: Date;
    label: string;
    orders: {
      status: string;
      user: {
        id: string;
        name: string;
      };
      items: {
        quantity: number;
        replacementApplied: boolean;
        menuItem: {
          price: string;
          shop?: { name: string } | null;
        };
      }[];
    }[];
  };
  trigger?: React.ReactNode;
};

export function OrderWindowUserSummaryDialog({
  window,
  trigger,
}: OrderWindowUserSummaryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "amount">("name");

  let total = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  let cancelledCount = 0;
  const shopTotals: Record<string, number> = {};
  const userTotals: Record<
    string,
    { id: string; name: string; total: number }
  > = {};

  window.orders.forEach((order) => {
    if (order.status === "approved") approvedCount++;
    else if (order.status === "rejected") rejectedCount++;
    else if (order.status === "cancelled") cancelledCount++;

    if (order.status === "approved") {
      let orderTotal = 0;
      order.items.forEach((item) => {
        if (!item.replacementApplied) {
          const itemTotal = Number(item.menuItem.price) * item.quantity;
          orderTotal += itemTotal;
          total += itemTotal;

          const shopName = item.menuItem.shop?.name || "Unknown";
          shopTotals[shopName] = (shopTotals[shopName] || 0) + itemTotal;
        }
      });

      if (orderTotal > 0) {
        if (userTotals[order.user.id]) {
          userTotals[order.user.id].total += orderTotal;
        } else {
          userTotals[order.user.id] = {
            id: order.user.id,
            name: order.user.name,
            total: orderTotal,
          };
        }
      }
    }
  });

  const userBreakdown = Object.values(userTotals).sort((a, b) => {
    if (sortBy === "amount") return b.total - a.total;
    return a.name.localeCompare(b.name);
  });

  async function copySummary() {
    const date = new Date(window.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const shopBreakdownText = Object.entries(shopTotals)
      .map(
        ([shopName, shopTotal]) => `${shopName}: ${formatCurrency(shopTotal)}`,
      )
      .join(", ");

    const text = `${window.label} Window (${date})

Total Bill: ${formatCurrency(total)}
${shopBreakdownText ? shopBreakdownText + "\n" : ""}
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
                {approvedCount}
              </p>
            </div>

            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Rejected</p>
              <p className='text-xl font-semibold text-red-600'>
                {rejectedCount}
              </p>
            </div>

            <div className='col-span-1 text-center'>
              <p className='text-xs text-muted-foreground'>Cancelled</p>
              <p className='text-xl font-semibold text-yellow-600'>
                {cancelledCount}
              </p>
            </div>
          </div>

          {/* Shop Breakdown */}
          {Object.entries(shopTotals).length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {Object.entries(shopTotals).map(([shopName, shopTotal]) => (
                <div
                  key={shopName}
                  className='flex items-center text-xs bg-primary/10 px-2.5 py-1 rounded-full font-semibold'
                >
                  <span className='text-muted-foreground uppercase tracking-wider mr-1.5'>
                    {shopName}:
                  </span>
                  <span className='text-primary'>
                    {formatCurrency(shopTotal)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* User Breakdown - Approved Orders Only */}
          <div className='space-y-3 border-t pt-4 max-h-120 overflow-y-auto'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-3'>
                <h4 className='font-medium'>Amount Per User</h4>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setSortBy((s) => (s === "name" ? "amount" : "name"))
                  }
                  className='h-6 text-[11px] px-2 font-normal text-muted-foreground hover:text-foreground'
                >
                  <ArrowUpDown className='h-3 w-3 mr-1' />
                  Sort: {sortBy === "name" ? "A to Z" : "Amount"}
                </Button>
              </div>
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
