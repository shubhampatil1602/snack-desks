"use client";

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
import { cn, formatCurrency, formatPrice, formatSplitNames } from "@/lib/utils";
import type { MenuItem } from "@/types/menu";
import { OrderActions } from "./OrderActions";
import {
  shareLabel,
  type LiveOrderItem,
  type PersonOrder,
} from "./live-orders-view";

// quantity · name · price, the same on every card so prices line up
const ROW = "grid grid-cols-[1.75rem_minmax(0,1fr)_4rem] items-baseline gap-x-2";

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-600/15 text-green-700 dark:text-green-400",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-400",
  cancelled: "bg-muted text-muted-foreground",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
        STATUS_STYLES[status] ?? STATUS_STYLES.cancelled,
      )}
    >
      <span aria-hidden className='size-1.5 rounded-full bg-current' />
      {status}
    </span>
  );
}

function Tag({ className, children }: { className?: string; children: string }) {
  return (
    <span
      className={cn(
        "ml-2 inline-block text-[10px] font-semibold uppercase tracking-widest no-underline",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function OrderCard({
  order,
  menuItems,
}: {
  order: PersonOrder;
  menuItems: MenuItem[];
}) {
  // own items first, shared ones after
  const items = [...order.items].sort(
    (a, b) =>
      Number((a.splits?.length ?? 0) > 0) - Number((b.splits?.length ?? 0) > 0),
  );

  return (
    <article
      className={cn(
        "@container border bg-card",
        order.status === "pending" && "border-l-[3px] border-l-amber-500",
      )}
    >
      {/* who, status, total and buttons on one line; buttons wrap below on phones */}
      <header className='flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-muted/40 px-4 py-2'>
        <div className='flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1'>
          <h3 className='font-medium'>{order.user.name}</h3>
          {order.createdByAdmin && (
            <span className='text-[10px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400'>
              On behalf
            </span>
          )}
          <StatusPill status={order.status} />
        </div>
        <span className='font-semibold tabular-nums'>
          {formatCurrency(order.total)}
        </span>
        <div className='flex w-full justify-end @lg:w-auto'>
          {order.isCoSplitOnly ? (
            <span className='text-xs text-muted-foreground'>
              Shared from {order.splitInitiatorNames?.join(", ") || "another"}
              &apos;s order
            </span>
          ) : (
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
          )}
        </div>
      </header>

      {/* items run down in columns as the card gets wider */}
      {/* a line between the columns; the spacing sits on the items so the
          line runs the full height, from the header to the card's edge */}
      <ul className='gap-x-8 px-4 text-sm tabular-nums [column-rule:1px_solid_var(--color-border)] @xl:columns-2 @4xl:columns-3'>
        {items.map((item) => (
          <ItemRows key={item.id} item={item} />
        ))}
      </ul>
    </article>
  );
}

function ItemRows({ item }: { item: LiveOrderItem }) {
  const sharedWith = item.splits?.map((split) => split.user.name) ?? [];
  const isShared = sharedWith.length > 0;
  const people = sharedWith.length + 1;
  const cost = (Number(item.menuItem.price) * item.quantity) / people;
  const swapped = item.replacementApplied;
  const alternatives = item.replacementPreferences ?? [];

  // one list entry per item, so its "If out" line never lands in the next column
  return (
    <li className='break-inside-avoid py-1'>
      <div
        className={cn(
          ROW,
          "py-0.5",
          isShared &&
            "-mx-2 my-0.5 bg-violet-500/10 px-2 py-1 shadow-[inset_2px_0_0_var(--color-violet-500)]",
          swapped && "text-muted-foreground",
        )}
      >
        <span
          className={cn(
            "text-muted-foreground",
            isShared && "font-bold text-violet-600 dark:text-violet-400",
          )}
        >
          {isShared ? shareLabel(item.quantity, people) : `${item.quantity}×`}
        </span>
        <span className='min-w-0'>
          <span className={cn(swapped && "line-through")}>
            {item.menuItem.name}
          </span>
          {isShared && (
            <span className='text-xs text-muted-foreground'>
              {" "}
              · with {formatSplitNames(sharedWith)}
            </span>
          )}
          {swapped && <Tag>Swapped</Tag>}
          {item.originalOrderItemId && (
            <Tag className='text-green-700 dark:text-green-400'>Alternative</Tag>
          )}
        </span>
        <span className={cn("text-right", swapped && "line-through")}>
          {formatPrice(cost)}
        </span>
      </div>

      {/* the owner's card can swap it; a co-splitter's copy only shows the item */}
      {alternatives.length > 0 && !swapped && !item.isShareCopy && (
        <div className={cn(ROW, "pb-1 text-xs text-muted-foreground")}>
          <span aria-hidden className='text-center'>
            ↳
          </span>
          <span className='min-w-0'>
            If out:{" "}
            <span className='font-medium text-foreground'>
              {alternatives
                .map((alt) => `${alt.menuItem.name} × ${alt.quantity}`)
                .join(" + ")}
            </span>
            <UseAlternativeButton item={item} />
          </span>
          <span className='text-right'>
            {formatPrice(
              alternatives.reduce(
                (sum, alt) => sum + Number(alt.menuItem.price) * alt.quantity,
                0,
              ),
            )}
          </span>
        </div>
      )}
    </li>
  );
}

function UseAlternativeButton({ item }: { item: LiveOrderItem }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    startTransition(async () => {
      const result = await applyReplacementAction(item.id);
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
          className='ml-2 h-5 px-1.5 align-middle text-[10px]'
          disabled={pending}
        >
          Use
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Use the alternative?</AlertDialogTitle>
          <AlertDialogDescription>
            Replace{" "}
            <strong>
              {item.menuItem.name} × {item.quantity}
            </strong>{" "}
            with:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className='list-disc space-y-1 pl-5 text-sm'>
          {item.replacementPreferences.map((rep) => (
            <li key={rep.id}>
              {rep.menuItem.name} × {rep.quantity} (
              {formatCurrency(Number(rep.menuItem.price) * rep.quantity)})
            </li>
          ))}
        </ul>
        <p className='text-sm font-medium'>
          This changes the user&apos;s order total.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending}>
            {pending ? "Applying..." : "Use alternative"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
