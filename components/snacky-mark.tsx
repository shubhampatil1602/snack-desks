import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Snacky's badge, shown wherever an answer or suggestion comes from Snacky
export function SnackyMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground",
        className,
      )}
    >
      <Sparkles className='size-[55%]' />
    </span>
  );
}
