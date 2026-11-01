"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleSplitSummary } from "@/actions/toggle-split-summary";
import { Switch } from "@/components/ui/switch";

// flips at once; goes back if saving fails
export function SplitSummarySwitch({
  memberId,
  userName,
  checked,
}: {
  memberId: string;
  userName: string;
  checked: boolean;
}) {
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(checked);
  const [, startTransition] = useTransition();

  return (
    <Switch
      checked={optimisticChecked}
      aria-label={`${userName} sees full bill`}
      onCheckedChange={(next) =>
        startTransition(async () => {
          setOptimisticChecked(next);
          try {
            await toggleSplitSummary(memberId, next);
          } catch {
            toast.error(`Couldn't change ${userName}'s setting. Try again.`);
          }
        })
      }
    />
  );
}
