import { VegMark } from "@/components/veg-mark";
import { cn } from "@/lib/utils";

export type FoodType = "all" | "veg" | "nonveg";

// Swiggy-style switches; turning one on turns the other off
export function FoodTypeToggles({
  value,
  onChange,
}: {
  value: FoodType;
  onChange: (value: FoodType) => void;
}) {
  return (
    <>
      {(
        [
          ["veg", true, "Veg"],
          ["nonveg", false, "Non-veg"],
        ] as const
      ).map(([type, isVeg, label]) => {
        const on = value === type;
        return (
          <button
            key={type}
            type='button'
            role='switch'
            aria-checked={on}
            onClick={() => onChange(on ? "all" : type)}
            className='flex h-9 shrink-0 items-center gap-2.5 border border-input bg-card px-3 text-xs font-semibold uppercase tracking-widest hover:bg-muted'
          >
            <span
              className={cn(
                "relative h-3 w-8 transition-colors",
                on
                  ? isVeg
                    ? "bg-green-600/40"
                    : "bg-red-600/40"
                  : "bg-muted-foreground/30",
              )}
            >
              {/* the food mark is the thumb */}
              <span aria-hidden className='contents'>
                <VegMark
                  isVeg={isVeg}
                  className={cn(
                    "absolute top-1/2 left-0 h-[18px] w-[18px] -translate-y-1/2 border-2 shadow-sm transition-transform duration-200 motion-reduce:transition-none",
                    on && "translate-x-[14px]",
                  )}
                />
              </span>
            </span>
            {label}
          </button>
        );
      })}
    </>
  );
}
