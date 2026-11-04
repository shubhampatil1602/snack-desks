"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Info, Star, Users, X } from "lucide-react";
import { toast } from "sonner";

import {
  cancelOrderAction,
  getOrganizationMembersForSplitAction,
  placeOrderAction,
  updateOrderAction,
} from "@/actions/orders";
import { snackyOrderDraftAction } from "@/actions/snacky";
import type { SnackyDraftChange, SnackyMenuItem, SnackyOrderDraft } from "@/modules/snacky/order-draft";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { SnackyMark } from "@/components/snacky-mark";
import { toOrderItemsInput } from "@/lib/cart";
import { ORDER_STATUS } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { useCartStore, type CartItem } from "@/store/cart-store";
import { useCartSheetStore } from "@/store/cart-sheet-store";
import { useOrderMutation } from "@/store/order-mutation-store";
import { SnackyInput, type SnackyInputHandle, type SnackySuggest } from "./SnackyInput";

export type SnackyMenuPick = SnackyMenuItem;

// what Snacky suggested, kept as changes so the cart can still change
// underneath (a tap on the menu) without being overwritten
type Proposal = SnackyOrderDraft;

// a later change to the same item wins; sharing and backups it leaves out stay
function mergeChanges(before: SnackyDraftChange[], after: SnackyDraftChange[]) {
  const byId = new Map(before.map((change) => [change.menuItemId, change]));
  for (const change of after) {
    const old = byId.get(change.menuItemId);
    byId.set(change.menuItemId, {
      ...change,
      splitUsers: change.splitUsers ?? old?.splitUsers,
      replacements: change.replacements ?? old?.replacements,
    });
  }
  return [...byId.values()];
}

// the cart with Snacky's changes applied
function applyChanges(cart: CartItem[], changes: SnackyDraftChange[]) {
  const next = cart.map((item) => ({ ...item }));
  for (const change of changes) {
    const index = next.findIndex((item) => item.menuItemId === change.menuItemId);
    if (change.quantity === 0) {
      if (index >= 0) next.splice(index, 1);
      continue;
    }
    const line: CartItem = {
      menuItemId: change.menuItemId,
      name: change.name,
      price: change.price,
      quantity: change.quantity,
      isGroupOrderEnabled: change.isGroupOrderEnabled,
      splitUsers: change.splitUsers ?? next[index]?.splitUsers ?? [],
      replacements: change.replacements ?? next[index]?.replacements ?? [],
    };
    if (index >= 0) next[index] = line;
    else next.push(line);
  }
  return next;
}

const userKey = (users?: { id: string }[]) => (users ?? []).map((user) => user.id).sort().join();
const backupKey = (backups?: { menuItemId: string; quantity: number }[]) =>
  (backups ?? []).map((backup) => `${backup.menuItemId}×${backup.quantity}`).sort().join();

// how one change differs from the cart, or null if it doesn't
function describeChange(change: SnackyDraftChange, cart: CartItem[]) {
  const was = cart.find((item) => item.menuItemId === change.menuItemId);
  if (!was) return change.quantity > 0 ? { kind: "new" as const, was } : null;
  if (change.quantity === 0) return { kind: "removed" as const, was };
  const differs =
    was.quantity !== change.quantity ||
    (change.splitUsers && userKey(change.splitUsers) !== userKey(was.splitUsers)) ||
    (change.replacements && backupKey(change.replacements) !== backupKey(was.replacements));
  return differs ? { kind: "changed" as const, was } : null;
}

// the cart as Snacky reads it
function linesOf(items: CartItem[]) {
  return items.map((item) => ({
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    splitUserIds: (item.splitUsers ?? []).map((user) => user.id),
    backups: (item.replacements ?? []).map((rep) => ({ menuItemId: rep.menuItemId, quantity: rep.quantity })),
  }));
}

// your share of the cart's own items
function shareOf(items: CartItem[]) {
  return items.reduce(
    (sum, item) => sum + (Number(item.price) * item.quantity) / ((item.splitUsers?.length ?? 0) + 1),
    0,
  );
}

const EMPTY: Proposal = {
  reply: "",
  changes: [],
  choices: [],
  cancelOrder: false,
  favourites: [],
  warnings: [],
};

// Order by typing: Snacky turns "2 samosa, no chai" into changes to the cart,
// which the person applies, places, or discards. Follow-ups change the same
// proposal, and "/" picks straight from the menu without asking Snacky.
export function SnackyOrderBox({
  windowId,
  menu,
  groupShops,
  groupItem,
  onFavourite,
}: {
  windowId: string;
  menu: SnackyMenuPick[];
  // shops in this window that take group orders; only their items split
  groupShops: string[];
  // one of their items, for the example line
  groupItem?: string;
  onFavourite: (menuItemId: string, on: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  // what they typed for this proposal so far, for follow-ups
  const [earlier, setEarlier] = useState<string[]>([]);
  // the "/" or "@" list, while one is open
  const [suggest, setSuggest] = useState<SnackySuggest | null>(null);
  const [empty, setEmpty] = useState(true);
  // people to tag with "@", only when something here can be shared
  const [people, setPeople] = useState<{ id: string; name: string; email: string }[]>([]);
  const canShare = groupShops.length > 0;
  const [showHelp, setShowHelp] = useState(true);
  const inputRef = useRef<SnackyInputHandle>(null);
  const router = useRouter();
  const { pending: mutation, run } = useOrderMutation();
  const orderStatus = useCartStore((state) => state.orderStatus);
  const orderId = useCartStore((state) => state.orderId);
  const hasPlacedOrder = useCartStore((state) => state.hasPlacedOrder);
  const cartItems = useCartStore((state) => state.items);
  const setCartOpen = useCartSheetStore((state) => state.setOpen);

  // "/" anywhere on the page opens the menu picker
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        target?.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }
      event.preventDefault();
      // a "/" at the end, keeping what's already typed
      inputRef.current?.openMenu();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!canShare) return;
    getOrganizationMembersForSplitAction().then((result) => {
      if (result.success && result.users) setPeople(result.users);
    });
  }, [canShare]);


  // an approved or rejected order can't change any more
  if (orderStatus && orderStatus !== ORDER_STATUS.PENDING) return null;

  const changes = proposal?.changes ?? [];
  const proposed = applyChanges(cartItems, changes);
  const shown = changes.flatMap((change) => {
    const diff = describeChange(change, cartItems);
    return diff ? [{ change, diff, line: proposed.find((item) => item.menuItemId === change.menuItemId) }] : [];
  });
  const untouched = cartItems.filter(
    (item) => !shown.some((row) => row.change.menuItemId === item.menuItemId),
  ).length;
  const cartChanges = shown.length > 0;

  function resetText() {
    inputRef.current?.clear();
  }

  function clear() {
    setProposal(null);
    setEarlier([]);
    resetText();
  }

  // n more of an item, on top of what the proposal already has
  function addMore(item: SnackyMenuItem, quantity: number, from: Proposal | null): Proposal {
    const current = applyChanges(cartItems, from?.changes ?? []).find(
      (line) => line.menuItemId === item.menuItemId,
    );
    const base = from ?? { ...EMPTY, reply: "Picked from the menu. Add more, or apply it." };
    return {
      ...base,
      changes: mergeChanges(base.changes, [
        { ...item, quantity: Math.min(20, (current?.quantity ?? 0) + quantity) },
      ]),
    };
  }

  async function ask(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    if (message.length > 300) {
      toast.error("Keep it under 300 characters");
      return;
    }
    setLoading(true);
    const result = await snackyOrderDraftAction(windowId, {
      text: message,
      cart: linesOf(applyChanges(useCartStore.getState().items, changes)),
      earlier,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setProposal({ ...result.data, changes: mergeChanges(changes, result.data.changes) });
    setEarlier((current) => [...current, message].slice(-4));
    resetText();
  }

  function undoChange(menuItemId: string) {
    setProposal(
      (current) =>
        current && {
          ...current,
          changes: current.changes.filter((change) => change.menuItemId !== menuItemId),
        },
    );
  }

  function choose(choiceIndex: number, item: SnackyMenuItem) {
    setProposal((current) => {
      if (!current) return current;
      const next = addMore(item, current.choices[choiceIndex]?.quantity ?? 1, current);
      return { ...next, choices: current.choices.filter((_, index) => index !== choiceIndex) };
    });
  }

  function saveFavourites() {
    if (!proposal) return;
    for (const favourite of proposal.favourites) onFavourite(favourite.menuItemId, favourite.on);
    setProposal({ ...proposal, favourites: [] });
  }

  function updateCart() {
    useCartStore.getState().setItems(proposed);
    clear();
    setCartOpen(true);
    toast.success(
      hasPlacedOrder
        ? "Cart updated. Update the order to save it."
        : "Cart updated. Check it and place the order.",
    );
  }

  // places the new cart, or saves it into the order already placed
  function placeNow() {
    run(hasPlacedOrder ? "updating" : "placing", async () => {
      const result = hasPlacedOrder
        ? orderId
          ? await updateOrderAction(orderId, toOrderItemsInput(proposed))
          : { success: false as const, error: "Order not found" }
        : await placeOrderAction({ windowId, items: toOrderItemsInput(proposed) });

      // the proposal stays, so they can put it in the cart instead
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      useCartStore.getState().setItems(proposed);
      clear();
      toast.success(
        hasPlacedOrder
          ? "Order updated. You can still edit it until it's approved."
          : "Order placed. You can still edit it until it's approved.",
      );
      router.refresh();
    });
  }

  function cancelOrder() {
    if (!orderId) return;
    run("cancelling", async () => {
      const result = await cancelOrderAction(orderId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      useCartStore.getState().clearCart();
      clear();
      toast.success("Order cancelled");
      router.refresh();
    });
  }

  const busy = mutation !== null;
  const placeTotal = shareOf(proposed);
  // taking everything out of a placed order is a cancel, not an update
  const emptiesOrder = hasPlacedOrder && proposed.length === 0;

  const example = groupItem
    ? `e.g. my usual, no chai, or 1 ${groupItem.toLowerCase()} shared with Ravi`
    : "e.g. 2 samosa and a cutting chai, no chai, or same as last time";
  const placeholder = proposal ? "Anything else? e.g. also a chai, or no samosa" : "Tell Snacky your order…";

  return (
    // a primary edge and a label set it apart from the plain search field
    <div className='border border-l-4 border-l-primary bg-card'>
      <div>
        <div className='bg-muted/40'>
          <div className='flex items-center gap-2 px-3 pt-2 text-xs'>
            <span className='font-semibold'>Snacky</span>
            <span className='truncate text-muted-foreground'>· order, change or cancel by typing</span>
            <span className='ml-auto hidden shrink-0 items-center gap-1 text-muted-foreground sm:flex'>
              <Kbd>/</Kbd> menu
              {canShare && (
                <>
                  <Kbd className='ml-1'>@</Kbd> share
                </>
              )}
            </span>
            <button
              type='button'
              onClick={() => setShowHelp((open) => !open)}
              aria-expanded={showHelp}
              aria-controls='snacky-help'
              aria-label='How to use Snacky'
              title='How to use Snacky'
              className={cn(
                "shrink-0 text-muted-foreground hover:text-foreground max-sm:ml-auto",
                showHelp && "text-foreground",
              )}
            >
              <Info className='size-3.5' />
            </button>
          </div>

          {showHelp && <SnackyHelp canShare={canShare} onClose={() => setShowHelp(false)} />}

          <div className='flex items-start gap-2 p-2 pl-3'>
            <SnackyMark className='mt-1.5 size-6' />
            <SnackyInput
              ref={inputRef}
              menu={menu}
              people={people}
              canShare={canShare}
              disabled={loading}
              placeholder={placeholder}
              onSubmit={ask}
              onPickAlone={(item) => setProposal((current) => addMore(item, 1, current))}
              onSuggest={setSuggest}
              onEmptyChange={setEmpty}
            />
            <Button
              type='button'
              size='icon-sm'
              className='size-9'
              disabled={loading || empty}
              onClick={() => inputRef.current?.submit()}
              aria-label='Ask Snacky'
            >
              {loading ? <Spinner /> : <ArrowUp />}
            </Button>
          </div>
        </div>

        {suggest && (
          <ul role='listbox' className='max-h-72 overflow-y-auto border-t'>
            {suggest.picks.length === 0 && (
              <li className='px-3 py-2 text-sm text-muted-foreground'>Nothing on this menu matches.</li>
            )}
            {suggest.picks.map((choice, index) => (
              <li key={choice.id} role='option' aria-selected={index === suggest.highlight}>
                <button
                  type='button'
                  // keep the caret in the box
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => suggest.pick(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted/60",
                    index === suggest.highlight && "bg-muted",
                  )}
                >
                  <span className='min-w-0 truncate'>
                    {choice.label}
                    {choice.detail && <span className='text-xs text-muted-foreground'> · {choice.detail}</span>}
                  </span>
                  {choice.item ? (
                    <span className='shrink-0 tabular-nums'>{formatCurrency(choice.item.price)}</span>
                  ) : (
                    <Users className='size-3.5 shrink-0 text-muted-foreground' />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!proposal && !suggest && (
          <p className='border-t px-3 py-1.5 text-xs text-muted-foreground'>
            {example}. Type / for the menu{canShare ? " and @ to share with someone" : ""}, even mid-sentence.{" "}
            {groupShops.length > 0
              ? `Only ${groupShops.join(", ")} items can be shared.`
              : "No shop in this window takes group orders."}
          </p>
        )}

        {proposal && (
          <div className='animate-in border-t duration-200 fade-in'>
            <div className='flex items-start gap-2 px-3 pt-2.5'>
              <p className='min-w-0 flex-1 text-sm'>{proposal.reply}</p>
              <button
                type='button'
                onClick={clear}
                aria-label='Discard'
                className='text-muted-foreground hover:text-foreground'
              >
                <X className='size-4' />
              </button>
            </div>

            {cartChanges && (
              <ul className='mx-3 mt-2 divide-y border'>
                {shown.map(({ change, diff, line }) => {
                  const removed = diff.kind === "removed";
                  const quantity = line?.quantity ?? diff.was?.quantity ?? 0;
                  const total = Number(change.price) * quantity;
                  const people = (line?.splitUsers?.length ?? 0) + 1;
                  const tag =
                    diff.kind === "new"
                      ? "new"
                      : removed
                        ? "remove"
                        : diff.was && diff.was.quantity !== quantity
                          ? `was ${diff.was.quantity}`
                          : "changed";
                  return (
                    <li key={change.menuItemId} className='flex items-start justify-between gap-3 px-3 py-2 text-sm'>
                      <div className='min-w-0'>
                        <p className='truncate'>
                          <span className={cn(removed && "text-muted-foreground line-through")}>
                            <span className='font-semibold tabular-nums'>{quantity}×</span> {change.name}
                          </span>
                          <span
                            className={cn(
                              "ml-1.5 text-xs",
                              removed ? "text-destructive" : "text-muted-foreground",
                            )}
                          >
                            {tag}
                          </span>
                        </p>
                        {!removed && line?.splitUsers && line.splitUsers.length > 0 && (
                          <p className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <Users className='size-3 shrink-0' />
                            <span className='truncate'>
                              Shared with {line.splitUsers.map((user) => user.name.split(" ")[0]).join(", ")}
                            </span>
                          </p>
                        )}
                        {!removed && line?.replacements && line.replacements.length > 0 && (
                          <p className='truncate text-xs text-muted-foreground'>
                            If it runs out: {line.replacements.map((rep) => `${rep.quantity}× ${rep.name}`).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className='flex shrink-0 items-start gap-2'>
                        {!removed && (
                          <p className='text-right tabular-nums'>
                            {formatCurrency(total / people)}
                            {people > 1 && (
                              <span className='block text-xs text-muted-foreground'>
                                your share of {formatCurrency(total)}
                              </span>
                            )}
                          </p>
                        )}
                        <button
                          type='button'
                          onClick={() => undoChange(change.menuItemId)}
                          aria-label={`Undo the change to ${change.name}`}
                          title='Undo this change'
                          className='mt-0.5 text-muted-foreground hover:text-foreground'
                        >
                          <X className='size-3.5' />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {cartChanges && untouched > 0 && (
              <p className='mt-1 px-3 text-xs text-muted-foreground'>
                {untouched} other item{untouched === 1 ? "" : "s"} in your {hasPlacedOrder ? "order" : "cart"}{" "}
                stay as they are.
              </p>
            )}

            {proposal.choices.map((choice, choiceIndex) => (
              <div key={choice.asked} className='mx-3 mt-2 space-y-1.5'>
                <p className='text-xs text-muted-foreground'>
                  Which {choice.asked}
                  {choice.quantity > 1 ? ` (×${choice.quantity})` : ""}?
                </p>
                <div className='flex flex-wrap gap-1.5'>
                  {choice.options.map((option) => (
                    <Button
                      key={option.menuItemId}
                      size='sm'
                      variant='outline'
                      className='h-7'
                      onClick={() => choose(choiceIndex, option)}
                    >
                      {option.name} · {formatCurrency(option.price)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            {proposal.favourites.length > 0 && (
              <div className='mx-3 mt-2 flex flex-wrap items-center gap-2 text-xs'>
                <Star className='size-3.5 text-amber-500' />
                <span className='text-muted-foreground'>
                  {proposal.favourites.map((f) => `${f.on ? "Star" : "Unstar"} ${f.name}`).join(", ")}
                </span>
                <Button size='sm' variant='outline' className='h-7' onClick={saveFavourites}>
                  {proposal.favourites.every((f) => f.on) ? "Add to favourites" : "Update favourites"}
                </Button>
              </div>
            )}

            {proposal.warnings.length > 0 && (
              <ul className='mt-2 space-y-0.5 px-3 text-xs text-amber-600 dark:text-amber-500'>
                {proposal.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}

            <div className='flex flex-wrap justify-end gap-2 p-3'>
              <Button variant='ghost' size='sm' onClick={clear} disabled={busy}>
                Discard
              </Button>
              {hasPlacedOrder && (proposal.cancelOrder || (cartChanges && emptiesOrder)) && (
                <Button variant='destructive' size='sm' onClick={cancelOrder} disabled={busy}>
                  {mutation === "cancelling" ? "Cancelling..." : "Cancel my order"}
                </Button>
              )}
              {cartChanges && !emptiesOrder && (
                <>
                  <Button variant='outline' size='sm' onClick={updateCart} disabled={busy}>
                    Update cart
                  </Button>
                  {proposed.length > 0 && (
                    <Button size='sm' onClick={placeNow} disabled={busy}>
                      {mutation === "placing"
                        ? "Placing..."
                        : mutation === "updating"
                          ? "Updating..."
                          : `${hasPlacedOrder ? "Update order" : "Place order"} · ${formatCurrency(placeTotal)}`}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// how to use the box, opened from the (i) in its header
function SnackyHelp({ canShare, onClose }: { canShare: boolean; onClose: () => void }) {
  const examples = ["2 samosa, 1 chai", "no chai", "make it 3", "my usual", "cancel my order"];
  return (
    <div
      id='snacky-help'
      className='mx-3 mt-2 flex animate-in items-start gap-3 border bg-card px-3 py-2 text-xs duration-200 fade-in'
    >
      <div className='min-w-0 flex-1 space-y-1.5'>
        <p className='flex flex-wrap items-center gap-x-3 gap-y-1'>
          <span>
            <Kbd>/</Kbd> menu item
          </span>
          {canShare && (
            <span>
              <Kbd>@</Kbd> share with someone
            </span>
          )}
          <span className='text-muted-foreground'>Click a chip to swap it</span>
        </p>
        <p className='flex flex-wrap items-center gap-1.5'>
          <span className='text-muted-foreground'>Try</span>
          {examples.map((example) => (
            <span key={example} className='border bg-muted/50 px-1.5 py-0.5'>
              {example}
            </span>
          ))}
        </p>
        <p className='text-muted-foreground'>Nothing is ordered until you tap Place order.</p>
      </div>
      <button type='button' onClick={onClose} aria-label='Close' className='text-muted-foreground hover:text-foreground'>
        <X className='size-3.5' />
      </button>
    </div>
  );
}
