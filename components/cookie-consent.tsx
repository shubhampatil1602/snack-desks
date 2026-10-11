"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X, SlidersHorizontal, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("snackdesk_cookie_consent");
      if (!consent) {
        // Small delay to prevent layout pop on immediate page load
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  function handleSave(level: "all" | "essential") {
    try {
      localStorage.setItem("snackdesk_cookie_consent", level);
      window.dispatchEvent(
        new CustomEvent("cookie_consent_updated", { detail: level }),
      );
    } catch {
      // Ignore
    }
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div
      role='region'
      aria-label='Cookie consent banner'
      className='fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300'
    >
      <div className='bg-card/95 backdrop-blur-md border shadow-2xl p-4 sm:p-5 text-card-foreground flex flex-col gap-3.5 relative'>
        {/* Close Button */}
        <button
          onClick={() => handleSave("essential")}
          aria-label='Close cookie banner'
          className='absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1'
        >
          <X className='size-4' />
        </button>

        {!showSettings ? (
          /* Main Simple Banner View */
          <>
            <div className='flex items-start gap-3 pr-6'>
              <div className='size-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5'>
                <Cookie className='size-4' />
              </div>
              <div>
                <h3 className='text-sm font-semibold'>Cookie Preferences</h3>
                <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>
                  We use essential cookies for authentication and session state, plus
                  minimal performance analytics. You can customize your preferences or read our{" "}
                  <Link
                    href='/privacy'
                    className='text-primary underline underline-offset-2 hover:text-primary/80 font-medium'
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className='flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50 mt-1'>
              <Button
                size='xs'
                variant='ghost'
                className='text-muted-foreground hover:text-foreground text-[11px] gap-1 px-2'
                onClick={() => setShowSettings(true)}
              >
                <SlidersHorizontal className='size-3' />
                Customize
              </Button>

              <div className='flex items-center gap-2 ml-auto'>
                <Button
                  size='xs'
                  variant='outline'
                  onClick={() => handleSave("essential")}
                >
                  Essential Only
                </Button>
                <Button size='xs' onClick={() => handleSave("all")}>
                  Accept All
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Custom Settings View */
          <>
            <div className='flex items-center gap-2 pr-6 border-b pb-2.5'>
              <button
                onClick={() => setShowSettings(false)}
                className='text-muted-foreground hover:text-foreground transition-colors p-1'
                aria-label='Back to cookie overview'
              >
                <ArrowLeft className='size-4' />
              </button>
              <h3 className='text-sm font-semibold'>Cookie Custom Settings</h3>
            </div>

            <div className='space-y-3 py-1 text-xs max-h-[60vh] overflow-y-auto pr-1'>
              {/* Category 1: Strictly Necessary */}
              <div className='flex items-start justify-between gap-3 p-2.5 rounded bg-muted/40 border border-muted'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-1.5 font-medium text-foreground'>
                    <span>Strictly Necessary</span>
                    <span className='text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-normal'>
                      Always Active
                    </span>
                  </div>
                  <p className='text-[11px] text-muted-foreground leading-relaxed'>
                    Required for authentication, security, active ordering sessions, and theme display. These cannot be switched off.
                  </p>
                </div>
                <div className='pt-0.5 text-primary'>
                  <Check className='size-4' />
                </div>
              </div>

              {/* Category 2: Performance & Analytics */}
              <div className='flex items-start justify-between gap-3 p-2.5 rounded border border-border/60 hover:bg-muted/20 transition-colors'>
                <div className='space-y-1 pr-2'>
                  <div className='font-medium text-foreground'>
                    Performance & Analytics
                  </div>
                  <p className='text-[11px] text-muted-foreground leading-relaxed'>
                    Allows anonymous speed measurement and error diagnostics via Vercel Speed Insights and Analytics to help us optimize page load speed.
                  </p>
                </div>
                <div className='pt-0.5 shrink-0'>
                  <Switch
                    checked={analyticsConsent}
                    onCheckedChange={setAnalyticsConsent}
                    size='sm'
                    aria-label='Toggle Performance and Analytics Cookies'
                  />
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between gap-2 pt-2 border-t border-border/50'>
              <Button
                size='xs'
                variant='ghost'
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>

              <div className='flex items-center gap-2'>
                <Button
                  size='xs'
                  variant='outline'
                  onClick={() => handleSave("essential")}
                >
                  Reject Non-Essential
                </Button>
                <Button
                  size='xs'
                  onClick={() =>
                    handleSave(analyticsConsent ? "all" : "essential")
                  }
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
