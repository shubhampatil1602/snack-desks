"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useShellDialogStore, type ShellDialog } from "@/store/shell-dialog-store";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type DialogSection = { id: string; label: string; icon: LucideIcon; render: () => React.ReactNode };

// A Clerk-style window: sections on the left, the picked one on the right.
// On phones the sections become a row of tabs on top.
export function SectionDialog({
  name,
  title,
  description,
  sections,
}: {
  name: ShellDialog;
  title: string;
  description: string;
  sections: DialogSection[];
}) {
  const open = useShellDialogStore((state) => state.open === name);
  const setOpen = useShellDialogStore((state) => state.setOpen);
  const [section, setSection] = useState(sections[0].id);
  const current = sections.find((item) => item.id === section) ?? sections[0];

  return (
    <Dialog open={open} onOpenChange={(next) => setOpen(next ? name : null)}>
      <DialogContent className='flex h-[min(34rem,calc(100dvh-2rem))] flex-col gap-0 p-0 sm:max-w-3xl sm:flex-row'>
        <nav className='flex shrink-0 gap-1 overflow-x-auto border-b bg-muted/40 p-2 pr-12 sm:w-52 sm:flex-col sm:border-r sm:border-b-0 sm:p-3'>
          <div className='hidden px-2 pt-1 pb-3 sm:block'>
            <DialogTitle className='text-base'>{title}</DialogTitle>
            <DialogDescription className='text-xs'>{description}</DialogDescription>
          </div>
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type='button'
              onClick={() => setSection(id)}
              className={cn(
                "flex shrink-0 items-center gap-2 px-2.5 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                current.id === id && "bg-background font-medium text-foreground shadow-xs ring-1 ring-foreground/10",
              )}
            >
              <Icon className='size-4' />
              {label}
            </button>
          ))}
        </nav>

        <div className='min-h-0 flex-1 overflow-y-auto p-5 sm:p-6'>{current.render()}</div>
      </DialogContent>
    </Dialog>
  );
}

export function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className='mb-5 border-b pb-3 pr-8'>
      <h3 className='text-base font-semibold'>{title}</h3>
      <p className='text-xs text-muted-foreground'>{hint}</p>
    </div>
  );
}
