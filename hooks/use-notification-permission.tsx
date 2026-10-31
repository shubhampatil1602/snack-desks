"use client";

import { useEffect } from "react";

export function useNotificationPermission() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "default"
    )
      return;

    // don't auto-request - let user click the banner
    // this hook just ensures we're ready when they do
  }, []);
}

export function sendNotification(title: string, body: string) {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  new Notification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  });
}
