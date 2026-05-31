"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartSheet } from "./cart-sheet";
import { useState } from "react";
import { useCartCount } from "@/store/cart-store";

export function CartButton() {
  const [open, setOpen] = useState(false);

  const itemCount = useCartCount();

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        className='relative gap-2'
        onClick={() => setOpen(true)}
      >
        <ShoppingCart className='h-4 w-4' />
        Cart
        {itemCount > 0 && <span className='text-xs'>({itemCount})</span>}
      </Button>

      <CartSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
