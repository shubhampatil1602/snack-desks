"use client";

import { useEffect, useSyncExternalStore } from "react";

import { deletePushSubscriptionAction, savePushSubscriptionAction } from "@/actions/push";

// Notifications are on when the browser allows them AND the user hasn't
// switched them off in Settings. The browser permission can't be taken back
// from a page, so "off" is our own flag, saved on this device.
const PREFERENCE_KEY = "snackdesk:notifications";
// the banner's X hides it until the next visit
const BANNER_DISMISSED_KEY = "snackdesk:notification-banner-dismissed";

export type NotificationStatus = "unsupported" | "blocked" | "on" | "off";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

// permission can change in the browser's site settings, so re-read on focus
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("focus", listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("focus", listener);
    window.removeEventListener("storage", listener);
  };
}

function read(storage: () => Storage, key: string) {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: string) {
  try {
    storage().setItem(key, value);
  } catch {
    // private mode or blocked storage: the change lasts until reload
  }
  emit();
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

function getStatus(): NotificationStatus {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission === "granted" && read(local, PREFERENCE_KEY) !== "off") return "on";
  return "off";
}

// Web push needs a service worker (public/sw.js) and the server's public key
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function pushSupported() {
  return !!vapidPublicKey && "serviceWorker" in navigator && "PushManager" in window;
}

function base64UrlToBytes(value: string) {
  const base64 = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

// subscribes this browser (or reuses its subscription) and saves it for the signed-in user
async function subscribeToPush() {
  if (!pushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToBytes(vapidPublicKey!),
      }));
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
    await savePushSubscriptionAction({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
  } catch (error) {
    console.error("[push] couldn't subscribe", error);
  }
}

async function unsubscribeFromPush() {
  if (!pushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    await deletePushSubscriptionAction(subscription.endpoint);
    await subscription.unsubscribe();
  } catch (error) {
    console.error("[push] couldn't unsubscribe", error);
  }
}

export function useNotifications() {
  // the server can't know, so it renders as unsupported (no banner)
  const status = useSyncExternalStore(subscribe, getStatus, () => "unsupported" as const);

  async function turnOn(): Promise<NotificationStatus> {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "default") await Notification.requestPermission();
    write(local, PREFERENCE_KEY, "on");
    const status = getStatus();
    if (status === "on") await subscribeToPush();
    return status;
  }

  function turnOff() {
    write(local, PREFERENCE_KEY, "off");
    void unsubscribeFromPush();
  }

  return { status, turnOn, turnOff };
}

// Mounted once in the app shell: while notifications are on, makes sure this
// browser's push subscription is saved for whoever is signed in (it may
// predate web push, or another person may have used this browser)
export function usePushSync() {
  const { status } = useNotifications();
  useEffect(() => {
    if (status === "on") void subscribeToPush();
  }, [status]);
}

export function useNotificationBanner() {
  const dismissed = useSyncExternalStore(
    subscribe,
    () => read(session, BANNER_DISMISSED_KEY) === "1",
    () => true,
  );
  return { dismissed, dismiss: () => write(session, BANNER_DISMISSED_KEY, "1") };
}

export function sendNotification(title: string, body: string) {
  if (typeof window === "undefined" || getStatus() !== "on") return;

  new Notification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  });
}
