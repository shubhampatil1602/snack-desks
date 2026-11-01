"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Spinner } from "@/components/ui/spinner";
import { closeWindowAction } from "@/actions/order-window";
import { WindowClosedPayload } from "@/types/sse";
import type { ActiveWindow } from "@/modules/order-window/queries";
import { formatTime, urgencyClass, useCountdown } from "@/hooks/use-countdown";
import { useSSEEvent } from "@/providers/sse-provider";
import { formatCurrency } from "@/lib/utils";

interface ActiveWindowCardProps {
  window: NonNullable<ActiveWindow>;
  serverNow: number;
  orderCount: number;
  bill: number;
  // the Order on behalf button
  action?: ReactNode;
}

export function ActiveWindowCard({
  window,
  serverNow,
  orderCount,
  bill,
  action,
}: ActiveWindowCardProps) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);
  const endsAt = window.endsAt ? new Date(window.endsAt) : null;
  const remaining = useCountdown(endsAt, serverNow);
  const autoClosedRef = useRef(false);

  // auto close when timer hits zero
  useEffect(() => {
    if (remaining === 0 && !autoClosedRef.current) {
      autoClosedRef.current = true;
      closeWindowAction(window.id).then(() => {
        router.refresh();
      });
    }
  }, [remaining, window.id, router]);

  useSSEEvent<WindowClosedPayload>("window_closed", ({ windowId }) => {
    if (windowId === window.id) {
      setClosed(true);
      router.refresh();
    }
  });

  async function handleClose() {
    setClosing(true);
    const result = await closeWindowAction(window.id);
    setClosing(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Order window closed");
    router.refresh();
  }

  if (closed) return null;

  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-3 border bg-card px-4 py-3'>
      <div className='flex items-center gap-2'>
        <h2 className='text-base font-medium'>{window.label}</h2>
        <Badge
          variant='default'
          className='bg-green-600 text-white px-1.5 py-0.5'
        >
          Active
        </Badge>
      </div>

      <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground'>
        <span>
          Opened{" "}
          {new Date(window.startsAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {remaining !== null ? (
          <span
            className={`font-mono text-base font-semibold ${urgencyClass(remaining)}`}
          >
            {formatTime(remaining)} left
          </span>
        ) : (
          !window.endsAt && (
            <span
              className='border border-dashed px-2 py-0.5 text-xs'
              title='This window stays open until you end it'
            >
              No timer
            </span>
          )
        )}
        <span className='tabular-nums'>
          {orderCount} {orderCount === 1 ? "order" : "orders"} ·{" "}
          {formatCurrency(bill)}
        </span>
      </div>

      <div className='ml-auto flex flex-wrap items-center gap-2'>
        {action}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='destructive' size='sm' disabled={closing}>
              {closing ? <Spinner className='mr-2' /> : null}
              End Window
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End this order window?</AlertDialogTitle>
              <AlertDialogDescription>
                Any pending orders will be automatically approved and the order
                window will be closed. Users won&apos;t be able to place or edit
                orders after this.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClose}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                End Window
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
