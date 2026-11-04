"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Check, Palette, User } from "lucide-react";
import { toast } from "sonner";

import { updateMyNameAction } from "@/actions/account";
import { cn } from "@/lib/utils";
import { SectionDialog, SectionHeading } from "@/components/shell/section-dialog";
import { useThemeColor } from "@/components/theme/theme-color-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SettingsUser = { name: string; email: string; avatar?: string | null };

// the account window behind the sidebar's Settings button
export function SettingsDialog({ user }: { user: SettingsUser }) {
  return (
    <SectionDialog
      name='settings'
      title='Account'
      description='Your profile and preferences'
      sections={[
        { id: "profile", label: "Profile", icon: User, render: () => <ProfileSection user={user} /> },
        { id: "preferences", label: "Preferences", icon: Palette, render: () => <PreferencesSection /> },
      ]}
    />
  );
}

// one setting: label and hint on the left, the control on the right
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-2 border-b py-4 first:pt-0 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6'>
      <div className='min-w-0 sm:w-40 sm:shrink-0'>
        <p className='text-sm font-medium'>{label}</p>
        {hint && <p className='text-xs text-muted-foreground'>{hint}</p>}
      </div>
      <div className='min-w-0 flex-1'>{children}</div>
    </div>
  );
}

function ProfileSection({ user }: { user: SettingsUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const trimmed = name.trim();
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmed || trimmed === user.name) return;
    setSaving(true);
    const result = await updateMyNameAction(trimmed);
    setSaving(false);
    if (!result.success) return toast.error(result.error);
    toast.success("Name updated");
    router.refresh();
  }

  return (
    <>
      <SectionHeading title='Profile' hint='How others see you in splits, rankings and the spin wheel.' />
      <Row label='Profile'>
        <div className='flex items-center gap-3'>
          <Avatar className='size-12 rounded-full'>
            <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
            <AvatarFallback className='rounded-full'>{initials}</AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <p className='truncate font-medium'>{user.name}</p>
            <p className='truncate text-xs text-muted-foreground'>{user.email}</p>
          </div>
        </div>
      </Row>
      <Row label='Name'>
        <form onSubmit={save} className='flex gap-2'>
          <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} aria-label='Name' />
          <Button type='submit' disabled={saving || !trimmed || trimmed === user.name}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </form>
      </Row>
      <Row label='Email'>
        <p className='py-1.5 text-sm'>{user.email}</p>
      </Row>
    </>
  );
}

const MODES = ["light", "dark", "system"] as const;

const COLORS = [
  { id: "default", name: "Default", swatch: "#0f172a" },
  { id: "claude", name: "Claude", swatch: "#d97757" },
];

function PreferencesSection() {
  const { theme, setTheme } = useTheme();
  const { themeColor, setThemeColor } = useThemeColor();
  const [permission, setPermission] = useState<NotificationPermission | null>(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : null,
  );

  async function enableNotifications() {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") toast.success("Notifications on");
  }

  return (
    <>
      <SectionHeading title='Preferences' hint='Saved on this device.' />
      <Row label='Mode'>
        <div className='inline-flex border p-0.5'>
          {MODES.map((mode) => (
            <button
              key={mode}
              type='button'
              onClick={() => setTheme(mode)}
              className={cn(
                "px-3 py-1 text-sm capitalize text-muted-foreground hover:text-foreground",
                theme === mode && "bg-muted font-medium text-foreground",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </Row>
      <Row label='Theme'>
        <div className='flex flex-wrap gap-2'>
          {COLORS.map((color) => (
            <button
              key={color.id}
              type='button'
              onClick={() => setThemeColor(color.id)}
              className={cn(
                "flex items-center gap-2 border px-3 py-1.5 text-sm hover:bg-muted",
                themeColor === color.id && "border-primary",
              )}
            >
              <span className='size-3.5 rounded-full' style={{ backgroundColor: color.swatch }} />
              {color.name}
              {themeColor === color.id && <Check className='size-3.5' />}
            </button>
          ))}
        </div>
      </Row>
      <Row label='Notifications' hint='When an order window opens or closes.'>
        {permission === null ? (
          <p className='py-1.5 text-sm text-muted-foreground'>This browser doesn&apos;t support notifications.</p>
        ) : permission === "granted" ? (
          <p className='flex items-center gap-1.5 py-1.5 text-sm'>
            <Bell className='size-4 text-primary' /> On
          </p>
        ) : permission === "denied" ? (
          <p className='py-1.5 text-sm text-muted-foreground'>
            Blocked. Allow notifications for this site in your browser&apos;s settings.
          </p>
        ) : (
          <Button variant='outline' onClick={enableNotifications}>
            <Bell /> Turn on
          </Button>
        )}
      </Row>
    </>
  );
}
