"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { markAsPaidAction } from "@/actions/spin-wheel";
import { Button } from "@/components/ui/button";

// Works only once the spin winner has said they paid the bill; until then
// the action says so in a toast
export function MarkAsPaidButton({ windowId }: { windowId: string }) {
  const [pending, startTransition] = useTransition();

  function markPaid() {
    startTransition(async () => {
      const result = await markAsPaidAction(windowId);
      if (result.success) toast.success("Marked as paid");
      else toast.error(result.error);
    });
  }

  return (
    <Button size='sm' onClick={markPaid} disabled={pending}>
      {pending ? "Marking..." : "Mark as Paid"}
    </Button>
  );
}
