"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

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
};

type MenuGridProps = {
  items: MenuItem[];
};

export function MenuGrid({ items }: MenuGridProps) {
  const addItem = useCartStore((state) => state.addItem);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const cartItems = useCartStore((state) => state.items);

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'>
      {items.map((item) => {
        const cartItem = cartItems.find(
          (cartItem) => cartItem.menuItemId === item.id,
        );

        const quantity = cartItem?.quantity ?? 0;
        return (
          <div key={item.id} className='border p-4 flex flex-col gap-3 shadow'>
            <div>
              <h3 className='font-medium'>{item.name}</h3>

              <p className='text-sm text-muted-foreground'>
                {item.menuCategory.name}
              </p>
            </div>

            <div className='flex items-center justify-between'>
              <span>
                ₹{item.price}
                {item.unit ? ` / ${item.unit}` : ""}
              </span>

              {quantity === 0 ? (
                <Button
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
                <div className='flex items-center border'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => decrement(item.id)}
                  >
                    -
                  </Button>

                  <span className='w-8 text-center'>{quantity}</span>

                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => increment(item.id)}
                  >
                    +
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
