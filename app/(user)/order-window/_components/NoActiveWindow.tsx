"use client";

import { Button } from "@/components/ui/button";
import { sendNotification } from "@/hooks/use-notification-permission";
import { useSSE } from "@/hooks/use-sse";
import { Bell, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function NoActiveWindow() {
  const router = useRouter();
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission | null>(() => {
      if (typeof window === "undefined" || !("Notification" in window))
        return null;
      return Notification.permission;
    });

  async function handleEnableNotifications() {
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === "granted") {
      toast.success("Notifications enabled!");
    }
  }

  useSSE({
    onWindowOpened: (payload) => {
      console.log("sending notification");
      sendNotification(
        `🍱 ${payload.label} order window is now open!`,
        payload.endsAt
          ? `Closes in ${Math.round((new Date(payload.endsAt).getTime() - Date.now()) / 60000)} mins`
          : "Place your order now",
      );
      router.refresh();
    },
  });
  return (
    <div className='flex flex-col items-center justify-center min-h-full gap-3'>
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
      {notifPermission === "default" && (
        <Button variant='outline' size='sm' onClick={handleEnableNotifications}>
          <Bell className='h-4 w-4 mr-2' />
          Enable notifications
        </Button>
      )}

      {notifPermission === "granted" && (
        <p className='text-xs text-muted-foreground flex items-center gap-1'>
          <Bell className='h-3 w-3' />
          Notifications enabled
        </p>
      )}
    </div>
  );
}
