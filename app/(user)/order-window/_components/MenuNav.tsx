"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type MenuNavProps = {
  categories: { name: string; count: number }[];
  // the section being read, highlighted as you scroll
  active: string | null;
  onJump: (category: string) => void;
  favouritesOnly: boolean;
  favouriteCount: number;
  onToggleFavourites: () => void;
};

const ITEM =
  "flex w-full items-center justify-between gap-3 border-l-2 border-transparent px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring";

// The menu's categories, like a restaurant page on Swiggy: the rail on wide
// screens and the floating "Menu" list on phones. Categories jump to their
// section; Favourites stays a filter.
export function MenuNav({
  categories,
  active,
  onJump,
  favouritesOnly,
  favouriteCount,
  onToggleFavourites,
}: MenuNavProps) {
  return (
    <div className='grid'>
      <button
        type='button'
        aria-pressed={favouritesOnly}
        onClick={onToggleFavourites}
        className={cn(
          ITEM,
          favouritesOnly &&
            "border-amber-400 bg-amber-400/15 font-semibold text-foreground hover:bg-amber-400/25",
        )}
      >
        <span className='flex items-center gap-2'>
          <Star
            className={cn(
              "h-4 w-4",
              favouritesOnly && "fill-amber-400 text-amber-400",
            )}
          />
          Favourites
        </span>
        <span className='tabular-nums'>{favouriteCount}</span>
      </button>

      <span aria-hidden className='my-2 h-px bg-border' />

      {categories.map(({ name, count }) => {
        const current = active === name;
        return (
          <button
            key={name}
            type='button'
            aria-current={current ? "true" : undefined}
            onClick={() => onJump(name)}
            className={cn(
              ITEM,
              current &&
                "border-primary bg-primary/10 font-semibold text-foreground",
            )}
          >
            <span className='truncate'>{name}</span>
            <span className='tabular-nums'>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
