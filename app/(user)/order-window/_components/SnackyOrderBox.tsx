"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Users, X } from "lucide-react";
import { toast } from "sonner";

import { placeOrderAction, updateOrderAction } from "@/actions/orders";
import { snackyOrderDraftAction } from "@/actions/snacky";
import type { SnackyOrderDraft } from "@/modules/snacky/order-draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { SnackyMark } from "@/components/snacky-mark";
import { toOrderItemsInput } from "@/lib/cart";
import { ORDER_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useCartStore, type CartItem } from "@/store/cart-store";
import { useCartSheetStore } from "@/store/cart-sheet-store";
import { useOrderMutation } from "@/store/order-mutation-store";

// the cart with the draft added on top: quantities add up, shares join
function withDraft(items: CartItem[], draft: SnackyOrderDraft) {
  const next: CartItem[] = items.map((item) => ({ ...item }));

  for (const drafted of draft.items) {
    const existing = next.find((item) => item.menuItemId === drafted.menuItemId);
    if (existing) {
      existing.quantity += drafted.quantity;
      const known = new Set((existing.splitUsers ?? []).map((user) => user.id));
      existing.splitUsers = [
        ...(existing.splitUsers ?? []),
        ...drafted.splitUsers.filter((user) => !known.has(user.id)),
      ];
    } else {
      next.push({
        menuItemId: drafted.menuItemId,
        name: drafted.name,
        price: drafted.price,
        quantity: drafted.quantity,
        isGroupOrderEnabled: drafted.isGroupOrderEnabled,
        splitUsers: drafted.splitUsers,
        replacements: [],
      });
    }
  }
  return next;
}

// your share of the cart's own items
function shareOf(items: CartItem[]) {
  return items.reduce(
    (sum, item) => sum + (Number(item.price) * item.quantity) / ((item.splitUsers?.length ?? 0) + 1),
    0,
  );
}

// Order by typing: Snacky turns "2 samosa and a chai" into a draft, then
// "Place order" sends it straight away, or "Add to cart" puts it in the cart
// to check first
export function SnackyOrderBox({
  windowId,
  groupShops,
  groupItem,
}: {
  windowId: string;
  // shops in this window that take group orders; only their items split
  groupShops: string[];
  // one of their items, for the example line
  groupItem?: string;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<SnackyOrderDraft | null>(null);
  const router = useRouter();
  const { pending: mutation, run } = useOrderMutation();
  const orderStatus = useCartStore((state) => state.orderStatus);
  const orderId = useCartStore((state) => state.orderId);
  const hasPlacedOrder = useCartStore((state) => state.hasPlacedOrder);
  const cartItems = useCartStore((state) => state.items);
  const setCartOpen = useCartSheetStore((state) => state.setOpen);

  // an approved or rejected order can't change any more
  if (orderStatus && orderStatus !== ORDER_STATUS.PENDING) return null;

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    const result = await snackyOrderDraftAction(windowId, text);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setDraft(result.data);
  }

  function addToCart() {
    if (!draft) return;
    const { items, setItems } = useCartStore.getState();
    setItems(withDraft(items, draft));
    setDraft(null);
    setText("");
    setCartOpen(true);
    toast.success("Added to your cart. Check it and place the order.");
  }

  // places the cart plus the draft, or adds the draft to the order already placed
  function placeNow() {
    if (!draft) return;
    const next = withDraft(useCartStore.getState().items, draft);
    run(hasPlacedOrder ? "updating" : "placing", async () => {
      const result = hasPlacedOrder
        ? orderId
          ? await updateOrderAction(orderId, toOrderItemsInput(next))
          : { success: false as const, error: "Order not found" }
        : await placeOrderAction({ windowId, items: toOrderItemsInput(next) });

      // the draft stays, so they can add it to the cart instead
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      useCartStore.getState().setItems(next);
      setDraft(null);
      setText("");
      toast.success(
        hasPlacedOrder
          ? "Order updated. You can still edit it until it's approved."
          : "Order placed. You can still edit it until it's approved.",
      );
      router.refresh();
    });
  }

  const busy = mutation !== null;
  const placeTotal = draft ? shareOf(withDraft(cartItems, draft)) : 0;
  // other cart items go in with the draft, so say so
  const withCart = cartItems.length > 0;

  const example =
    groupItem
      ? `e.g. my usual, or 1 ${groupItem.toLowerCase()} shared with Ravi`
      : "e.g. 2 samosa and a cutting chai, or my usual";

  return (
    <div className='border bg-card'>
      <form onSubmit={ask} className='flex items-center gap-2 p-2 pl-3'>
        <SnackyMark className='size-6' />
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder='Tell Snacky your order'
          aria-label='Tell Snacky your order'
          maxLength={300}
          disabled={loading}
          className='h-9 min-w-0 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0'
        />
        <Button type='submit' size='icon-sm' className='size-9' disabled={loading || !text.trim()} aria-label='Ask Snacky'>
          {loading ? <Spinner /> : <ArrowUp />}
        </Button>
      </form>

      {!draft && (
        <p className='border-t px-3 py-1.5 text-xs text-muted-foreground'>
          {example}.{" "}
          {groupShops.length > 0
            ? `Only ${groupShops.join(", ")} items can be shared.`
            : "No shop in this window takes group orders."}
        </p>
      )}

      {draft && (
        <div className='animate-in border-t duration-200 fade-in'>
          <div className='flex items-start gap-2 px-3 pt-2.5'>
            <p className='min-w-0 flex-1 text-sm'>{draft.reply}</p>
            <button
              type='button'
              onClick={() => setDraft(null)}
              aria-label='Discard draft'
              className='text-muted-foreground hover:text-foreground'
            >
              <X className='size-4' />
            </button>
          </div>

          {draft.items.length > 0 && (
            <ul className='mx-3 mt-2 divide-y border'>
              {draft.items.map((item) => {
                const total = Number(item.price) * item.quantity;
                const people = item.splitUsers.length + 1;
                return (
                  <li key={item.menuItemId} className='flex items-start justify-between gap-3 px-3 py-2 text-sm'>
                    <div className='min-w-0'>
                      <p className='truncate'>
                        <span className='font-semibold tabular-nums'>{item.quantity}×</span> {item.name}
                      </p>
                      {item.splitUsers.length > 0 && (
                        <p className='flex items-center gap-1 text-xs text-muted-foreground'>
                          <Users className='size-3 shrink-0' />
                          <span className='truncate'>
                            Shared with {item.splitUsers.map((user) => user.name.split(" ")[0]).join(", ")}
                          </span>
                        </p>
                      )}
                    </div>
                    <p className='shrink-0 text-right tabular-nums'>
                      {formatCurrency(total / people)}
                      {people > 1 && (
                        <span className='block text-xs text-muted-foreground'>
                          your share of {formatCurrency(total)}
                        </span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          {draft.warnings.length > 0 && (
            <ul className='mt-2 space-y-0.5 px-3 text-xs text-amber-600 dark:text-amber-500'>
              {draft.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}

          {draft.items.length > 0 && withCart && (
            <p className='mt-2 px-3 text-xs text-muted-foreground'>
              {hasPlacedOrder
                ? "Placing adds these to your order."
                : "Placing also orders what's already in your cart."}
            </p>
          )}

          <div className='flex flex-wrap justify-end gap-2 p-3'>
            <Button variant='ghost' size='sm' onClick={() => setDraft(null)} disabled={busy}>
              Discard
            </Button>
            {draft.items.length > 0 && (
              <>
                <Button variant='outline' size='sm' onClick={addToCart} disabled={busy}>
                  Add to cart
                </Button>
                <Button size='sm' onClick={placeNow} disabled={busy}>
                  {mutation === "placing"
                    ? "Placing..."
                    : mutation === "updating"
                      ? "Updating..."
                      : `${hasPlacedOrder ? "Update order" : "Place order"} · ${formatCurrency(placeTotal)}`}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
