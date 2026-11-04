"use client";

import { Bell, X } from "lucide-react";
import { toast } from "sonner";

import {
  useNotificationBanner,
  useNotifications,
  usePushSync,
} from "@/hooks/use-notification-permission";
import { Button } from "@/components/ui/button";

// strip pinned above the app while notifications are off; goes away once they're
// on, or until the next visit when closed. It's in every shell, so it also
// keeps this browser's push subscription saved while notifications are on.
export function NotificationBanner({ message }: { message: string }) {
  const { status, turnOn } = useNotifications();
  const { dismissed, dismiss } = useNotificationBanner();
  usePushSync();

  if (status !== "off" || dismissed) return null;

  async function enable() {
    const result = await turnOn();
    if (result === "on") toast.success("Notifications on");
    if (result === "blocked")
      toast.error(
        "Notifications are blocked. Allow them for this site in your browser's settings.",
      );
  }

  return (
    <div
      data-slot='notification-banner'
      className='fixed inset-x-0 top-0 z-40 flex h-10 items-center gap-3 bg-primary px-4 text-sm text-primary-foreground'
    >
      {/* pushes the page and the sidebar down while the banner is shown */}
      <style>{":root { --notification-banner-height: 2.5rem; }"}</style>

      <Bell className='size-4 shrink-0' />
      <p className='min-w-0 flex-1 truncate font-medium'>
        <span className='sm:hidden'>Turn on notifications</span>
        <span className='hidden sm:inline'>{message}</span>
      </p>
      <Button size='xs' variant='secondary' onClick={enable}>
        Turn on
      </Button>
      <Button
        size='icon-xs'
        variant='ghost'
        aria-label='Close'
        className='text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground'
        onClick={dismiss}
      >
        <X />
      </Button>
    </div>
  );
}
