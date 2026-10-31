"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { MenuGrid, type MenuView } from "./MenuGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/store/cart-store";
import { useRouter } from "next/navigation";
import { OrderStatusChangedPayload } from "@/types/sse";
import { sendNotification } from "@/hooks/use-notification-permission";
import type {
  ActiveWindowWithMenu,
  UserActiveOrder,
} from "@/modules/orders/queries";
import { toast } from "sonner";
import { ORDER_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useSSEEvent } from "@/providers/sse-provider";
import { getUserActiveSharedSplitsAction } from "@/actions/orders";
import { toggleFavouriteMenuItemAction } from "@/actions/menu";
import { LayoutGrid, List, Star, X } from "lucide-react";
import type { RepeatOrder } from "@/modules/orders/reorder";
import { RepeatOrderDialog } from "./RepeatOrderDialog";
import { CartBar, OrderCard } from "./OrderCard";

// Grid or list, remembered in this browser. Kept in memory too, in case
// storage is blocked.
const VIEW_STORAGE_KEY = "snackdesk-menu-view";
const viewListeners = new Set<() => void>();
let chosenView: MenuView | null = null;

function subscribeView(listener: () => void) {
  viewListeners.add(listener);
  return () => {
    viewListeners.delete(listener);
  };
}

function readView(): MenuView {
  if (chosenView) return chosenView;
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function saveView(view: MenuView) {
  chosenView = view;
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {}
  viewListeners.forEach((listener) => listener());
}

type OrdersClientProps = {
  menuItems: NonNullable<ActiveWindowWithMenu>["menuItems"];
  existingOrder: UserActiveOrder;
  windowId: string;
  repeatOrder: RepeatOrder | null;
  favouriteMenuItemIds: string[];
};

export function OrdersClient({
  menuItems,
  existingOrder,
  windowId,
  repeatOrder,
  favouriteMenuItemIds,
}: OrdersClientProps) {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);

  useSSEEvent("window_closed", () => {
    sendNotification(`🍱 Order window is closed!`, "Thanks.");
    clearCart();
    router.refresh();
  });

  useSSEEvent<OrderStatusChangedPayload>("order_status_changed", (payload) => {
    if (payload.status === ORDER_STATUS.APPROVED)
      toast.success("Your order has been approved");
    if (payload.status === ORDER_STATUS.REJECTED)
      toast.error("Your order has been rejected");
    router.refresh();
  });

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedShop, setSelectedShop] = useState("all");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [favourites, setFavourites] = useState(
    () => new Set(favouriteMenuItemIds),
  );

  function setFavourite(menuItemId: string, value: boolean) {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (value) next.add(menuItemId);
      else next.delete(menuItemId);
      return next;
    });
  }

  // optimistic; reverted if the server refuses
  async function toggleFavourite(menuItemId: string) {
    const value = !favourites.has(menuItemId);
    setFavourite(menuItemId, value);
    const result = await toggleFavouriteMenuItemAction(menuItemId, value);
    if (!result.success) {
      setFavourite(menuItemId, !value);
      toast.error(result.error);
    }
  }

  const loadExistingOrder = useCartStore((state) => state.loadExistingOrder);
  const setWindowId = useCartStore((state) => state.setWindowId);
  const hasPlacedOrder = useCartStore((state) => state.hasPlacedOrder);
  const currentWindowId = useCartStore((state) => state.windowId);
  const setSharedItems = useCartStore((state) => state.setSharedItems);

  useEffect(() => {
    getUserActiveSharedSplitsAction().then((result) => {
      if (result.success && result.splits) {
        setSharedItems(result.splits);
      }
    });
  }, [setSharedItems]);

  // Get unique shops from menu items (excluding null/undefined)
  const shops = useMemo(() => {
    const shopSet = new Set<string>();
    menuItems.forEach((item) => {
      if (item.shop?.name) {
        shopSet.add(item.shop.name);
      }
    });
    return ["all", ...Array.from(shopSet)];
  }, [menuItems]);

  // every filter except the category; the chip counts come from this
  const searchedItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesShop =
      selectedShop === "all" || item.shop?.name === selectedShop;

    const matchesFavourites = !favouritesOnly || favourites.has(item.id);

    return matchesSearch && matchesShop && matchesFavourites;
  });

  const filteredItems = searchedItems.filter(
    (item) =>
      selectedCategory === "all" || item.menuCategory.name === selectedCategory,
  );

  // categories in menu order
  const categories = [
    ...new Set(menuItems.map((item) => item.menuCategory.name)),
  ];

  const categoryCounts = new Map<string, number>();
  for (const item of searchedItems) {
    const name = item.menuCategory.name;
    categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
  }

  // under "All" the menu is grouped by category; otherwise one group
  const sections = categories
    .map((category) => ({
      category,
      items: filteredItems.filter(
        (item) => item.menuCategory.name === category,
      ),
    }))
    .filter((section) => section.items.length > 0);

  const cartItems = useCartStore((state) => state.items);
  const sharedCount = useCartStore((state) => (state.sharedItems ?? []).length);
  // the floating order card only shows once there's an order to show
  const showOrderCard =
    cartItems.length > 0 || sharedCount > 0 || hasPlacedOrder;
  const quantities = useMemo(
    () => new Map(cartItems.map((item) => [item.menuItemId, item.quantity])),
    [cartItems],
  );

  const favouriteItems = menuItems.filter((item) => favourites.has(item.id));

  // shop names only help when the window has more than one shop
  const showShop = shops.length > 2 && selectedShop === "all";

  const view = useSyncExternalStore<MenuView>(
    subscribeView,
    readView,
    () => "grid",
  );

  // "/" jumps to search, like most search boxes
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      )
        return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (currentWindowId !== null && currentWindowId !== windowId) {
      clearCart();
    }
    setWindowId(windowId);
  }, [windowId, currentWindowId, setWindowId, clearCart]);

  useEffect(() => {
    if (!existingOrder) {
      // If local storage thinks we have an order but the server says no, clear it (e.g., admin deleted it)
      if (hasPlacedOrder) {
        clearCart();
      }
      return;
    }

    loadExistingOrder({
      orderId: existingOrder.id,
      status: existingOrder.status,
      items: existingOrder.items.map((item: any) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price.toString(),
        quantity: item.quantity,
        isGroupOrderEnabled: item.menuItem.shop?.isGroupOrderEnabled ?? false,
        splitUsers:
          item.splits?.map((s: any) => ({
            id: s.user.id,
            name: s.user.name,
            email: s.user.email,
          })) || [],
        replacements:
          item.replacementPreferences?.map((rep: any) => ({
            menuItemId: rep.menuItemId,
            name: rep.menuItem.name,
            price: rep.menuItem.price.toString(),
            quantity: rep.quantity,
          })) || [],
      })),
    });
  }, [existingOrder, loadExistingOrder, clearCart, hasPlacedOrder]);

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedShop("all");
    setFavouritesOnly(false);
  };

  // Check if any filter is active
  const hasActiveFilters =
    search ||
    selectedCategory !== "all" ||
    selectedShop !== "all" ||
    favouritesOnly;

  return (
    <div className='mt-4 space-y-4'>
      {showOrderCard && <OrderCard />}

      {/* room under the last row for the floating order card */}
      <div className={cn("space-y-4", showOrderCard && "lg:pb-24")}>
        {/* Filters stay on screen while the menu scrolls */}
        <div className='sticky top-0 z-30 -mx-4 space-y-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80'>
          {/* search, shop and view share one height and border so the row lines up */}
          <div className='flex flex-wrap items-center gap-2 sm:flex-nowrap mb-4'>
            <div
              className='flex h-9 shrink-0 border border-input bg-card'
              role='group'
              aria-label='View'
            >
              {(
                [
                  ["grid", LayoutGrid, "Grid view"],
                  ["list", List, "List view"],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type='button'
                  aria-label={label}
                  aria-pressed={view === value}
                  onClick={() => saveView(value)}
                  className={cn(
                    "flex w-9 items-center justify-center text-muted-foreground hover:text-foreground sm:w-12",
                    view === value &&
                      "bg-foreground text-background hover:text-background",
                  )}
                >
                  <Icon className='h-[18px] w-[18px]' />
                </button>
              ))}
            </div>
            <RepeatOrderDialog windowId={windowId} order={repeatOrder} />
            {/* on phones search takes the first line and the rest wrap below */}
            <div className='relative min-w-0 w-full basis-full max-sm:order-first sm:max-w-sm sm:flex-auto sm:basis-auto lg:max-w-md'>
              <Input
                ref={searchRef}
                placeholder='Search items'
                aria-label='Search items'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='h-9 border-input bg-card px-3 pr-10 focus-visible:border-ring'
              />
              {search ? (
                <button
                  type='button'
                  onClick={() => setSearch("")}
                  aria-label='Clear search'
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                >
                  <X className='h-4 w-4' />
                </button>
              ) : (
                <Kbd className='pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:inline-flex'>
                  /
                </Kbd>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearFilters}
                className='shrink-0 px-2 text-muted-foreground'
              >
                <X />
                {/* short on phones so the shop picker stays on the same line */}
                Clear<span className='hidden sm:inline'> filters</span>
              </Button>
            )}

            <span className='hidden flex-1 sm:block' />

            {shops.length > 2 && (
              <Select
                value={selectedShop}
                onValueChange={(value) => setSelectedShop(value)}
              >
                <SelectTrigger
                  size='sm'
                  className='min-w-0 flex-1 border-input bg-card px-3 focus-visible:border-ring sm:w-44 sm:flex-none'
                  aria-label='Shop'
                >
                  <SelectValue placeholder='Select shop' />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop} value={shop}>
                      {shop === "all" ? "All shops" : shop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* wraps onto more lines; phones keep a sideways scroll so the
              sticky bar doesn't take half the screen */}
          <div className='flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible mb-4'>
            <Button
              variant='outline'
              size='sm'
              aria-pressed={favouritesOnly}
              onClick={() => setFavouritesOnly(!favouritesOnly)}
              className={cn(
                "shrink-0",
                favouritesOnly &&
                  "border-amber-400 bg-amber-400/15 hover:bg-amber-400/25",
              )}
            >
              <Star
                className={
                  favouritesOnly ? "fill-amber-400 text-amber-400" : undefined
                }
              />
              Favourites
              <span className='font-normal tabular-nums text-muted-foreground'>
                {favouriteItems.length}
              </span>
            </Button>

            <span className='my-1 w-px shrink-0 bg-border' />

            {["all", ...categories].map((category) => {
              const count =
                category === "all"
                  ? searchedItems.length
                  : (categoryCounts.get(category) ?? 0);
              const selected = selectedCategory === category;
              // hide categories the other filters emptied, unless selected
              if (category !== "all" && count === 0 && !selected) return null;
              return (
                <Button
                  key={category}
                  variant={selected ? "default" : "outline"}
                  size='sm'
                  aria-pressed={selected}
                  onClick={() => setSelectedCategory(category)}
                  className='shrink-0'
                >
                  {category === "all" ? "All" : category}
                  <span
                    className={cn(
                      "font-normal tabular-nums",
                      selected ? "opacity-80" : "text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {sections.length === 0 ? (
          <div className='space-y-3 border border-dashed py-10 text-center text-sm text-muted-foreground'>
            <p>
              {favouritesOnly && favourites.size === 0
                ? "No favourites yet. Tap the star on an item to add it."
                : favouritesOnly && !search
                  ? "None of your favourites match in this order window."
                  : "Nothing matches these filters in this order window."}
            </p>
            {hasActiveFilters && (
              <Button variant='outline' size='sm' onClick={clearFilters}>
                <X />
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className='space-y-10'>
            {sections.map((section) => (
              <section key={section.category} className='space-y-3'>
                {/* name, count, then a rule across, so each category reads as its own block */}
                <div className='flex items-center gap-3'>
                  <h2 className='font-heading text-2xl leading-none'>
                    {section.category}
                  </h2>
                  <span className='border px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-muted-foreground'>
                    {section.items.length}{" "}
                    {section.items.length === 1 ? "item" : "items"}
                  </span>
                  <span aria-hidden className='h-px flex-1 bg-border' />
                </div>
                <MenuGrid
                  items={section.items}
                  view={view}
                  quantities={quantities}
                  favourites={favourites}
                  onToggleFavourite={toggleFavourite}
                  showShop={showShop}
                />
              </section>
            ))}
          </div>
        )}

        <CartBar />
      </div>
    </div>
  );
}
