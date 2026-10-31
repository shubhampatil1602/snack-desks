"use client";

import { Star } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ItemStepper } from "./ItemStepper";

export type MenuItem = {
  id: string;
  name: string;
  price: string;
  unit: string | null;
  isAvailable: boolean;
  menuCategory: {
    id: string;
    name: string;
  };
  shop?: {
    id: string;
    name: string;
    isGroupOrderEnabled?: boolean;
  } | null;
  imageUrl?: string | null;
};

export type MenuView = "grid" | "list";

type MenuGridProps = {
  items: MenuItem[];
  view: MenuView;
  quantities: Map<string, number>;
  favourites: Set<string>;
  onToggleFavourite: (menuItemId: string) => void;
  // shop names only help when the window has more than one shop
  showShop: boolean;
};

export function MenuGrid({
  items,
  view,
  quantities,
  favourites,
  onToggleFavourite,
  showShop,
}: MenuGridProps) {
  if (view === "list") {
    return (
      <div className='border bg-card divide-y'>
        {items.map((item) => (
          <MenuItemRow
            key={item.id}
            item={item}
            quantity={quantities.get(item.id) ?? 0}
            isFavourite={favourites.has(item.id)}
            onToggleFavourite={onToggleFavourite}
            showShop={showShop}
          />
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]'>
      {items.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          quantity={quantities.get(item.id) ?? 0}
          isFavourite={favourites.has(item.id)}
          onToggleFavourite={onToggleFavourite}
          showShop={showShop}
        />
      ))}
    </div>
  );
}

type ItemProps = {
  item: MenuItem;
  quantity: number;
  isFavourite: boolean;
  onToggleFavourite: (menuItemId: string) => void;
  showShop?: boolean;
};

function MenuItemCard({
  item,
  quantity,
  isFavourite,
  onToggleFavourite,
  showShop,
}: ItemProps) {
  return (
    // isolate keeps the badges' z-index inside the card, under the sticky filter bar
    <div className='isolate flex min-w-0 flex-col border bg-card'>
      {/* fixed height, so every card matches whatever the name's length */}
      <div className='relative h-40 w-full overflow-hidden'>
        <ItemImage item={item} />

        {/* Gradient Overlay for Text Readability */}
        <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black via-black/50 to-black/5' />

        {/* Name & Category at Bottom of Image */}
        <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3'>
          <h3
            className='line-clamp-2 font-semibold leading-tight text-white'
            title={item.name}
          >
            {item.name}
          </h3>
          <p className='mt-1 line-clamp-1 text-xs text-white/80'>
            {item.menuCategory.name}
          </p>
        </div>

        <FavouriteButton
          item={item}
          isFavourite={isFavourite}
          onToggle={onToggleFavourite}
          className='absolute left-1.5 top-1.5 z-20'
        />

        {/* tags on the image's top right, as before; stacked so they line up on every card */}
        <div className='pointer-events-none absolute right-1.5 top-1.5 z-20 flex max-w-[calc(100%-3rem)] flex-col items-end gap-1 text-[10px] font-bold uppercase tracking-wider'>
          {showShop && item.shop && (
            <span className='max-w-full truncate border bg-accent px-2 py-1 text-primary shadow-sm'>
              {item.shop.name}
            </span>
          )}
          {item.shop?.isGroupOrderEnabled && (
            <span className='bg-emerald-600 px-1.5 py-1 text-white shadow-sm'>
              Group Split
            </span>
          )}
        </div>
      </div>

      <div className='flex items-center justify-between gap-2 border-t p-2.5'>
        <Price item={item} />
        <ItemStepper
          menuItemId={item.id}
          name={item.name}
          price={item.price}
          isGroupOrderEnabled={item.shop?.isGroupOrderEnabled ?? false}
          quantity={quantity}
          className='w-20'
        />
      </div>
    </div>
  );
}

function MenuItemRow({
  item,
  quantity,
  isFavourite,
  onToggleFavourite,
  showShop,
}: ItemProps) {
  const details = [
    showShop ? item.shop?.name : null,
    item.shop?.isGroupOrderEnabled ? "Group split" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className='grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 sm:grid-cols-[3rem_minmax(0,1fr)_auto_auto]'>
      <div className='relative h-12 w-12 overflow-hidden'>
        <ItemImage item={item} small />
      </div>

      <div className='min-w-0'>
        <div className='flex items-center gap-1'>
          <h3 className='truncate text-sm font-semibold' title={item.name}>
            {item.name}
          </h3>
          <FavouriteButton
            item={item}
            isFavourite={isFavourite}
            onToggle={onToggleFavourite}
            plain
          />
        </div>
        <p className='truncate text-xs text-muted-foreground'>
          {/* the price sits under the name on phones */}
          <span className='font-semibold text-foreground sm:hidden'>
            {formatPrice(item.price)}
            {item.unit && ` / ${item.unit}`}
            {details && " · "}
          </span>
          {details}
        </p>
      </div>

      <div className='hidden sm:block'>
        <Price item={item} />
      </div>

      <ItemStepper
        menuItemId={item.id}
        name={item.name}
        price={item.price}
        isGroupOrderEnabled={item.shop?.isGroupOrderEnabled ?? false}
        quantity={quantity}
      />
    </div>
  );
}

// unit on its own line, so narrow cards don't break "₹15 / glass" mid-way
function Price({ item }: { item: MenuItem }) {
  return (
    <div className='min-w-0 leading-tight'>
      <div className='text-sm font-bold tabular-nums'>
        {formatPrice(item.price)}
      </div>
      {item.unit && (
        <div className='truncate text-xs text-muted-foreground'>
          per {item.unit}
        </div>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

// Image (click to enlarge) or a lettered placeholder
function ItemImage({ item, small }: { item: MenuItem; small?: boolean }) {
  if (!item.imageUrl) {
    // cards show the name over the gradient, so only list rows need letters
    return (
      <div
        className='flex h-full w-full items-center justify-center bg-muted font-heading text-lg text-muted-foreground'
        aria-hidden
      >
        {small && initials(item.name)}
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type='button'
          className='group block h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-ring'
          aria-label={`View ${item.name} image`}
        >
          <img
            src={item.imageUrl}
            alt=''
            loading='lazy'
            decoding='async'
            className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
          />
        </button>
      </DialogTrigger>
      <DialogContent className='flex max-w-2xl flex-col items-center justify-center border-none bg-transparent shadow-none'>
        <DialogTitle className='sr-only'>{item.name} Image</DialogTitle>
        <img
          src={item.imageUrl}
          alt={item.name}
          className='max-h-[70vh] max-w-full object-contain shadow-2xl'
        />
      </DialogContent>
    </Dialog>
  );
}

function FavouriteButton({
  item,
  isFavourite,
  onToggle,
  plain,
  className,
}: {
  item: MenuItem;
  isFavourite: boolean;
  onToggle: (menuItemId: string) => void;
  plain?: boolean;
  className?: string;
}) {
  return (
    <button
      type='button'
      onClick={() => onToggle(item.id)}
      aria-label={
        isFavourite
          ? `Remove ${item.name} from favourites`
          : `Add ${item.name} to favourites`
      }
      aria-pressed={isFavourite}
      className={cn(
        "shrink-0 rounded-full",
        plain
          ? "p-1 text-muted-foreground hover:text-foreground"
          : "bg-black/45 p-1.5 text-white/90 hover:bg-black/65 hover:text-white",
        className,
      )}
    >
      <Star
        className={cn(
          plain ? "h-3.5 w-3.5" : "h-4 w-4",
          isFavourite && "fill-amber-400 text-amber-400",
        )}
      />
    </button>
  );
}
