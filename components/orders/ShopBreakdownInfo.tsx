"use client";

import { Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type ShopBreakdownInfoProps = {
  breakdown: Record<string, number>;
  className?: string;
  iconClassName?: string;
};

export function ShopBreakdownInfo({ breakdown, className, iconClassName }: ShopBreakdownInfoProps) {
  if (!breakdown || Object.keys(breakdown).length === 0) {
    return null;
  }

  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className={`h-4 w-4 rounded-full ${className || ""}`}
        >
          <Info className={`h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors ${iconClassName || ""}`} />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className='w-auto p-3 text-sm'>
        <div className='font-semibold mb-2 text-left'>Shop Breakdown</div>
        <div className='flex flex-col gap-1 text-left'>
          {Object.entries(breakdown).map(([shopName, total]) => (
            <div key={shopName} className='flex justify-between gap-4'>
              <span>{shopName}</span>
              <span className='font-medium'>{formatCurrency(total)}</span>
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
