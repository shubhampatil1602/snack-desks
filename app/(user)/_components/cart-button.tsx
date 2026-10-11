"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartSheet } from "./cart-sheet";
import { useState, useEffect } from "react";
import { useCartCount, useCartStore } from "@/store/cart-store";
import { getUserActiveSharedSplitsAction } from "@/actions/orders";

export function CartButton() {
  const [open, setOpen] = useState(false);

  const itemCount = useCartCount();
  const setSharedItems = useCartStore((state) => state.setSharedItems);

  useEffect(() => {
    getUserActiveSharedSplitsAction().then((result) => {
      if (result.success && result.splits) {
        setSharedItems(result.splits);
      }
    });
  }, [setSharedItems]);

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        className='relative gap-2 cursor-pointer'
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
