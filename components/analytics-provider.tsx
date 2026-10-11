"use client";

import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

function subscribe(callback: () => void) {
  window.addEventListener("cookie_consent_updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("cookie_consent_updated", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem("snackdesk_cookie_consent") === "all";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function AnalyticsProvider() {
  const hasConsent = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!hasConsent) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
