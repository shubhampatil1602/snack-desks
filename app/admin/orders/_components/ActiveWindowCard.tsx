"use client";

import { useState, useEffect, useRef } from "react";
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
import { useSSE } from "@/hooks/use-sse";
import type { ActiveWindow } from "@/modules/order-window/queries";
import { formatTime, urgencyClass, useCountdown } from "@/hooks/use-countdown";

interface ActiveWindowCardProps {
  window: NonNullable<ActiveWindow>;
}

export function ActiveWindowCard({ window }: ActiveWindowCardProps) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);
  const endsAt = window.endsAt ? new Date(window.endsAt) : null;
  const remaining = useCountdown(endsAt);
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

  // listen for SSE window_closed event
  // (in case another admin closed it)
  useSSE({
    onWindowClosed: ({ windowId }) => {
      if (windowId === window.id) {
        setClosed(true);
        router.refresh();
      }
    },
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
    <div className='border bg-card p-6'>
      <div className='flex items-start justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <h2 className='text-base font-medium'>{window.label}</h2>
            <Badge
              variant='default'
              className='bg-green-600 text-white px-1.5 py-0.5'
            >
              Active
            </Badge>
          </div>
          <p className='text-xs text-muted-foreground'>
            Opened at{" "}
            {new Date(window.startsAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* countdown or no timer */}
        <div className='text-right'>
          {remaining !== null ? (
            <div>
              <p
                className={`text-3xl font-mono font-semibold ${urgencyClass(remaining)}`}
              >
                {formatTime(remaining)}
              </p>
              <p className='text-xs text-muted-foreground mt-0.5'>remaining</p>
            </div>
          ) : (
            !window.endsAt && (
              <div className='flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-700 dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-300'>
                <span>
                  ⚠️ No timer set - this window will stay open until you close
                  it manually.
                </span>
              </div>
            )
          )}
        </div>
      </div>

      <div className='mt-5 pt-4 border-t flex justify-end'>
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
                All pending orders will be locked. Users won&apos;t be able to
                place or edit orders after this. This cannot be undone.
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
