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

type OrderItem = {
  id: string;
  quantity: number;
  replacementApplied?: boolean;
  originalOrderItemId?: string | null;
  menuItem: {
    name: string;
    price: string;
  };
  replacementPreferences?: {
    id: string;
    quantity: number;
    menuItem: {
      name: string;
      price: string;
    };
  }[];
};

type OrderHistoryDetailsProps = {
  items: OrderItem[];
  isAdmin?: boolean;
  isLocked?: boolean;
};

export function OrderHistoryDetails({
  items,
  isAdmin = false,
  isLocked = false,
}: OrderHistoryDetailsProps) {
  const activeItems = items.filter((item) => !item.replacementApplied);
  const replacedItems = items.filter((item) => item.replacementApplied);

  const total = activeItems.reduce(
    (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
    0,
  );

  return (
    <div className='space-y-3'>
      <div className='space-y-1.5'>
        {activeItems.map((item) => (
          <div
            key={item.id}
            className='flex flex-col gap-1 py-1 border-b last:border-0 border-muted/10'
          >
            <div className='flex justify-between items-center text-sm'>
              <div className='flex items-center gap-2'>
                <span>
                  {item.menuItem.name} × {item.quantity}
                </span>

                {!isLocked &&
                  isAdmin &&
                  item.replacementPreferences &&
                  item.replacementPreferences.length > 0 && (
                    <UseAlternativeButton orderItemId={item.id} item={item} />
                  )}
              </div>

              <span>
                ₹{(Number(item.menuItem.price) * item.quantity).toFixed(2)}
              </span>
            </div>

            {item.replacementPreferences &&
              item.replacementPreferences.length > 0 && (
                <div className='text-[10px] text-muted-foreground pl-2 border-l border-amber-300 dark:border-amber-700 ml-1'>
                  <span className='font-semibold text-amber-700 dark:text-amber-500 mr-1'>
                    Alternative Pref:
                  </span>
                  {item.replacementPreferences
                    .map((rep) => `${rep.menuItem.name} × ${rep.quantity}`)
                    .join(", ")}
                </div>
              )}
          </div>
        ))}
      </div>

      <div className='border-t pt-2 flex justify-between font-medium text-sm'>
        <span>Total</span>

        <span>₹{total.toFixed(2)}</span>
      </div>

      {replacedItems.length > 0 && (
        <div className='border-t pt-3 mt-2 space-y-2'>
          <p className='text-[10px] font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider'>
            Alternatives Used
          </p>
          <div className='space-y-2'>
            {replacedItems.map((item) => (
              <div
                key={item.id}
                className='space-y-1 pl-2 border-l-2 border-amber-400 dark:border-amber-500'
              >
                <div className='flex justify-between text-xs text-muted-foreground'>
                  <span className='line-through'>
                    {item.menuItem.name} × {item.quantity}
                  </span>
                  <span className='line-through'>
                    ₹{(Number(item.menuItem.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
                {item.replacementPreferences &&
                  item.replacementPreferences.length > 0 && (
                    <div className='pl-3 space-y-0.5'>
                      {item.replacementPreferences.map((pref) => {
                        const isDelivered = activeItems.some(
                          (activeItem) =>
                            activeItem.menuItem.name === pref.menuItem.name &&
                            (activeItem.originalOrderItemId === item.id ||
                              !activeItem.originalOrderItemId),
                        );

                        return (
                          <div
                            key={pref.id}
                            className='flex justify-between text-xs text-foreground/80'
                          >
                            <span
                              className={
                                !isDelivered
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }
                            >
                              • {pref.menuItem.name} × {pref.quantity}{" "}
                              {!isDelivered && "(removed)"}
                            </span>
                            <span
                              className={
                                !isDelivered
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }
                            >
                              ₹
                              {(
                                Number(pref.menuItem.price) * pref.quantity
                              ).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UseAlternativeButton({
  orderItemId,
  item,
}: {
  orderItemId: string;
  item: OrderItem;
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
          className='h-5 py-0 px-1.5 text-[10px] cursor-pointer font-bold'
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
              {item.replacementPreferences?.map((rep) => (
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
