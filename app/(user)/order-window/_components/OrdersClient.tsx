"use client";

import {
  useState,
  useEffect,
  useEffectEvent,
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
import { LayoutGrid, List, ListTree, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSidebar } from "@/components/ui/sidebar";
import { MenuNav } from "./MenuNav";
import { CartBar, OrderCard } from "./OrderCard";
import { SnackyOrderBox } from "./SnackyOrderBox";
import { FoodTypeToggles, type FoodType } from "@/components/food-type-toggles";

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
  favouriteMenuItemIds: string[];
};

export function OrdersClient({
  menuItems,
  existingOrder,
  windowId,
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
  const [selectedShop, setSelectedShop] = useState("all");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [foodType, setFoodType] = useState<FoodType>("all");
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
  async function saveFavourite(menuItemId: string, value: boolean) {
    setFavourite(menuItemId, value);
    const result = await toggleFavouriteMenuItemAction(menuItemId, value);
    if (!result.success) {
      setFavourite(menuItemId, !value);
      toast.error(result.error);
    }
  }

  function toggleFavourite(menuItemId: string) {
    return saveFavourite(menuItemId, !favourites.has(menuItemId));
  }

  const loadExistingOrder = useCartStore((state) => state.loadExistingOrder);
  const setWindowId = useCartStore((state) => state.setWindowId);
  const hasPlacedOrder = useCartStore((state) => state.hasPlacedOrder);
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

  const searchedItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesShop =
      selectedShop === "all" || item.shop?.name === selectedShop;

    const matchesFavourites = !favouritesOnly || favourites.has(item.id);

    const matchesFoodType =
      foodType === "all" || item.isVeg === (foodType === "veg");

    return matchesSearch && matchesShop && matchesFavourites && matchesFoodType;
  });

  // categories in menu order
  const categories = [
    ...new Set(menuItems.map((item) => item.menuCategory.name)),
  ];

  // the menu is grouped by category; ones the filters emptied drop out
  const sections = categories
    .map((category) => ({
      category,
      items: searchedItems.filter(
        (item) => item.menuCategory.name === category,
      ),
    }))
    .filter((section) => section.items.length > 0);

  const navCategories = sections.map((section) => ({
    name: section.category,
    count: section.items.length,
  }));

  // The rail highlights the section being read: the last one whose top has
  // passed under the sticky filter bar
  const toolbarRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const sectionKey = sections.map((section) => section.category).join("\n");

  useEffect(() => {
    const names = sectionKey ? sectionKey.split("\n") : [];
    let frame = 0;

    function update() {
      frame = 0;
      const line =
        (toolbarRef.current?.getBoundingClientRect().bottom ?? 0) + 24;
      let current = names[0] ?? null;
      for (const name of names) {
        const top = sectionRefs.current.get(name)?.getBoundingClientRect().top;
        if (top === undefined || top > line) break;
        current = name;
      }
      setActiveCategory(current);
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    // capture, so it hears whichever element does the scrolling
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      cancelAnimationFrame(frame);
    };
  }, [sectionKey]);

  function jumpTo(category: string) {
    const section = sectionRefs.current.get(category);
    if (!section) return;
    // land just under the sticky filter bar, whatever its height right now
    section.style.scrollMarginTop = `${(toolbarRef.current?.offsetHeight ?? 0) + 16}px`;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    section.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    setActiveCategory(category);
  }

  const [menuOpen, setMenuOpen] = useState(false);

  // The menu rail takes the app sidebar's place here: the sidebar folds to
  // icons on arrival and goes back to how it was on leaving
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();
  const readSidebarOpen = useEffectEvent(() => sidebarOpen);
  const foldSidebar = useEffectEvent((open: boolean) => setSidebarOpen(open));
  useEffect(() => {
    const wasOpen = readSidebarOpen();
    foldSidebar(false);
    return () => foldSidebar(wasOpen);
  }, []);

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

  // only items from shops that take group orders can be shared
  const groupItems = menuItems.filter((item) => item.shop?.isGroupOrderEnabled);
  const groupShops = [...new Set(groupItems.map((item) => item.shop!.name))];
  const snackyMenu = useMemo(
    () =>
      menuItems.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        shop: item.shop?.name ?? null,
        isGroupOrderEnabled: item.shop?.isGroupOrderEnabled ?? false,
      })),
    [menuItems],
  );

  // the veg / non-veg toggles only help when the window sells both
  const vegCount = menuItems.filter((item) => item.isVeg).length;
  const hasBothFoodTypes = vegCount > 0 && vegCount < menuItems.length;

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

  // A cart belongs to the window it was filled in. The window id is saved
  // with it, so a cart left from a closed window (tab reopened or reloaded
  // later) starts empty here. A cart saved before the id was stored has no
  // window to match, so it's cleared too. Read from the store itself: the
  // first render after a reload sees the store's defaults, not what's saved.
  useEffect(() => {
    if (useCartStore.getState().windowId === windowId) return;
    clearCart();
    setWindowId(windowId);
  }, [windowId, setWindowId, clearCart]);

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
      items: existingOrder.items.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price.toString(),
        quantity: item.quantity,
        isGroupOrderEnabled: item.menuItem.shop?.isGroupOrderEnabled ?? false,
        splitUsers:
          item.splits?.map((s) => ({
            id: s.user.id,
            name: s.user.name,
            email: s.user.email,
          })) || [],
        replacements:
          item.replacementPreferences?.map((rep) => ({
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
    setSelectedShop("all");
    setFavouritesOnly(false);
    setFoodType("all");
  };

  // Check if any filter is active
  const hasActiveFilters =
    search || selectedShop !== "all" || favouritesOnly || foodType !== "all";

  // shared by the rail and the phone menu
  const menuNavProps = {
    categories: navCategories,
    active: activeCategory,
    favouritesOnly,
    favouriteCount: favouriteItems.length,
    onToggleFavourites: () => setFavouritesOnly(!favouritesOnly),
  };

  return (
    <div className='mt-4'>
      {showOrderCard && <OrderCard />}

      {/* wide screens: the category rail on the left, the menu on the right.
          Room under the last row for the floating order card */}
      <div
        className={cn(
          "lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-6",
          showOrderCard && "lg:pb-24",
        )}
      >
        <nav
          aria-label='Menu categories'
          className='sticky top-0 hidden max-h-svh self-start overflow-y-auto py-3 lg:block'
        >
          <p className='px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
            Menu
          </p>
          <MenuNav {...menuNavProps} onJump={jumpTo} />
        </nav>

        <div className='min-w-0 space-y-4'>
          <SnackyOrderBox
            windowId={windowId}
            menu={snackyMenu}
            onFavourite={saveFavourite}
            groupShops={groupShops}
            groupItem={groupItems[0]?.name}
          />

          {/* Filters stay on screen while the menu scrolls */}
          <div
            ref={toolbarRef}
            className='sticky top-0 z-30 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:ml-0 lg:pl-0'
          >
            {/* one row on wide screens; phones put search and view on the
                first line and the filters on the second */}
            <div className='flex flex-wrap items-center gap-2 lg:flex-nowrap'>
              <div className='flex basis-full gap-2 lg:contents'>
                <div className='relative min-w-0 flex-1 lg:max-w-md'>
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

                <div
                  className='flex h-9 shrink-0 border border-input bg-card lg:order-last'
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
              </div>

              {hasBothFoodTypes && (
                <FoodTypeToggles value={foodType} onChange={setFoodType} />
              )}

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

              <span className='hidden flex-1 lg:block' />

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
                <section
                  key={section.category}
                  ref={(node) => {
                    if (node) sectionRefs.current.set(section.category, node);
                    else sectionRefs.current.delete(section.category);
                  }}
                  className='space-y-3'
                >
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

      {/* phones and tablets: the rail folds into a floating "Menu" button,
          lifted above the cart bar when that shows */}
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            type='button'
            className={cn(
              "fixed right-4 z-30 flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-background shadow-[0_10px_30px_-6px_rgb(0_0_0/0.6)] lg:hidden",
              cartItems.length > 0
                ? "bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.5rem)]"
                : "bottom-[max(1.25rem,env(safe-area-inset-bottom))]",
            )}
          >
            <ListTree className='h-4 w-4' />
            Menu
          </button>
        </PopoverTrigger>
        <PopoverContent
          side='top'
          align='end'
          className='max-h-[60svh] w-64 overflow-y-auto p-2'
        >
          <MenuNav
            {...menuNavProps}
            onJump={(category) => {
              setMenuOpen(false);
              // after the popover lets go of focus, so the scroll isn't undone
              requestAnimationFrame(() => jumpTo(category));
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
