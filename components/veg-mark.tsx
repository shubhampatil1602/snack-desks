import { cn } from "@/lib/utils";

// The Indian food mark: a green dot in a green square for veg, red for non-veg.
// White backing, so it stays readable over menu photos.
export function VegMark({
  isVeg,
  className,
}: {
  isVeg: boolean;
  className?: string;
}) {
  const label = isVeg ? "Veg" : "Non-veg";
  return (
    <span
      role='img'
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid h-4 w-4 shrink-0 place-items-center border-[1.5px] bg-white",
        isVeg ? "border-green-600" : "border-red-600",
        className,
      )}
    >
      <span
        className={cn(
          "h-[45%] w-[45%] rounded-full",
          isVeg ? "bg-green-600" : "bg-red-600",
        )}
      />
    </span>
  );
}
