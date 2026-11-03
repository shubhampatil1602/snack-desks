"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { markBillPaidAction } from "@/actions/spin-wheel";
import { Button } from "@/components/ui/button";

// The split master says they paid the shop, so the admin can mark it paid
export function BillPaidButton({ windowId }: { windowId: string }) {
  const [pending, startTransition] = useTransition();

  function markPaid() {
    startTransition(async () => {
      const result = await markBillPaidAction(windowId);
      if (result.success) toast.success("Thanks! The admin can mark it paid now.");
      else toast.error(result.error);
    });
  }

  return (
    <Button
      size='sm'
      className='h-6 rounded-full px-2.5 text-xs'
      onClick={(event) => {
        // the row toggles open on click
        event.stopPropagation();
        markPaid();
      }}
      disabled={pending}
    >
      {pending ? "Saving..." : "I paid the bill"}
    </Button>
  );
}
