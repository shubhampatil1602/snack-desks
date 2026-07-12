"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { QuantityInput } from "@/app/(user)/_components/QuantityInput";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type MenuItem = {
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
  } | null;
  imageUrl?: string | null;
};

type MenuGridProps = {
  items: MenuItem[];
};

export function MenuGrid({ items }: MenuGridProps) {
  const addItem = useCartStore((state) => state.addItem);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const cartItems = useCartStore((state) => state.items);

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'>
      {items.map((item) => {
        const cartItem = cartItems.find(
          (cartItem) => cartItem.menuItemId === item.id,
        );

        const quantity = cartItem?.quantity ?? 0;

        return (
          <div
            key={item.id}
            className='border flex flex-col h-48 relative bg-card shadow-sm group overflow-hidden'
          >
            {/* Top Section: Image + Text Overlay */}
            <div className='relative flex-1 w-full overflow-hidden'>
              {/* Image or Placeholder Background */}
              <div className='absolute inset-0'>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-110'
                  />
                ) : (
                  <></>
                )}
              </div>

              {/* Gradient Overlay for Text Readability */}
              <div className='absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/5 pointer-events-none' />

              {/* Text Content Layer */}
              <div className='absolute inset-0 p-3 flex flex-col pointer-events-none z-10'>
                {/* Badges at Top */}
                <div className='flex justify-end items-start'>
                  {item.shop && (
                    <span className='text-[10px] uppercase tracking-wider bg-accent text-primary font-bold px-2 py-1 shadow-sm border'>
                      {item.shop.name}
                    </span>
                  )}
                </div>

                {/* Name & Category at Bottom of Image */}
                <div className='mt-auto'>
                  <h3
                    className='font-semibold text-white leading-tight line-clamp-2'
                    title={item.name}
                  >
                    {item.name}
                  </h3>
                  <p
                    className='text-xs text-white/80 mt-1 line-clamp-1'
                    title={item.menuCategory.name}
                  >
                    {item.menuCategory.name}
                  </p>
                </div>
              </div>

              {/* Invisible Click Area for Image Preview */}
              {item.imageUrl && (
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className='absolute inset-0 z-20 w-full h-full outline-none'
                      aria-label={`View ${item.name} image`}
                    />
                  </DialogTrigger>
                  <DialogContent className='max-w-2xl bg-transparent border-none shadow-none flex flex-col items-center justify-center'>
                    <DialogTitle className='sr-only'>
                      {item.name} Image
                    </DialogTitle>
                    <div className='relative inline-block max-w-full'>
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className='max-w-full max-h-[70vh] object-contain shadow-2xl'
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Bottom Action Strip */}
            <div className='p-2 shrink-0 border-t bg-card flex items-center justify-between gap-2'>
              <div className='font-semibold text-sm'>
                {formatCurrency(item.price)}
                {item.unit && (
                  <span className='text-muted-foreground font-normal text-xs ml-0.5'>
                    / {item.unit}
                  </span>
                )}
              </div>

              <div className='w-24 shrink-0'>
                {quantity === 0 ? (
                  <Button
                    className='w-full h-8 text-sm'
                    onClick={() =>
                      addItem({
                        menuItemId: item.id,
                        name: item.name,
                        price: item.price,
                      })
                    }
                  >
                    Add
                  </Button>
                ) : (
                  <div className='grid grid-cols-3 items-center border h-8'>
                    <Button
                      variant='ghost'
                      className='h-full w-full rounded-none px-0'
                      onClick={() => decrement(item.id)}
                    >
                      -
                    </Button>

                    <div className='flex items-center justify-center'>
                      <QuantityInput
                        initialQuantity={quantity}
                        onUpdate={(qty) => setQuantity(item.id, qty)}
                      />
                    </div>

                    <Button
                      variant='ghost'
                      className='h-full w-full rounded-none px-0'
                      onClick={() => increment(item.id)}
                    >
                      +
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
