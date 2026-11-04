"use client";

import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notification-permission";
import { useSSEEvent } from "@/providers/sse-provider";
import { Bell, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function NoActiveWindow() {
  const router = useRouter();
  const notifications = useNotifications();

  async function handleEnableNotifications() {
    if ((await notifications.turnOn()) === "on") {
      toast.success("Notifications enabled!");
    }
  }
  // the "window is open" notification comes by web push (lib/push.ts)
  useSSEEvent("window_opened", () => {
    router.refresh();
  });
  return (
    <div className='flex flex-col items-center justify-center min-h-[85vh] gap-3'>
      <div className='rounded-full bg-muted p-4'>
        <ShoppingBag className='h-8 w-8 text-muted-foreground' />
      </div>
      <div className='text-center'>
        <p className='text-base font-medium'>No active order window</p>
        <p className='text-sm text-muted-foreground text-center max-w-xs'>
          Your admin hasn&apos;t opened an order window yet. You&apos;ll get a
          notification when one opens.
        </p>
      </div>
      {/* Notification permission */}
      {notifications.status === "off" && (
        <Button variant='outline' size='sm' onClick={handleEnableNotifications}>
          <Bell className='h-4 w-4 mr-2' />
          Enable notifications
        </Button>
      )}

      {notifications.status === "on" && (
        <p className='text-xs text-muted-foreground flex items-center gap-1'>
          <Bell className='h-3 w-3' />
          Notifications enabled
        </p>
      )}
    </div>
  );
}
