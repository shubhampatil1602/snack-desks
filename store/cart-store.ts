import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartReplacementItem = {
  menuItemId: string;
  name: string;
  price: string;
  quantity: number;
};

export type CartItem = {
  menuItemId: string;
  name: string;
  price: string;
  quantity: number;
  replacements?: CartReplacementItem[];
};

type CartStore = {
  items: CartItem[];
  orderId: string | null;
  hasPlacedOrder: boolean;
  windowId: string | null;
  savedItems: CartItem[];
  orderStatus: string | null;

  addItem: (item: Omit<CartItem, "quantity" | "replacements">) => void;
  removeItem: (menuItemId: string) => void;

  increment: (menuItemId: string) => void;
  decrement: (menuItemId: string) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;

  addReplacementItem: (originalMenuItemId: string, replacement: CartReplacementItem) => void;
  removeReplacementItem: (originalMenuItemId: string, replacementMenuItemId: string) => void;
  updateReplacementItemQuantity: (originalMenuItemId: string, replacementMenuItemId: string, quantity: number) => void;

  clearCart: () => void;

  loadExistingOrder: (data: {
    orderId: string;
    status: string;
    items: CartItem[];
  }) => void;
  setWindowId: (windowId: string) => void;
  markCurrentAsSaved: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      orderId: null,
      hasPlacedOrder: false,
      windowId: null,
      savedItems: [],
      orderStatus: null,

      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (cartItem) => cartItem.menuItemId === item.menuItemId,
          );

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.menuItemId === item.menuItemId
                  ? {
                      ...cartItem,
                      quantity: cartItem.quantity + 1,
                    }
                  : cartItem,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: 1,
              },
            ],
          };
        }),

      removeItem: (menuItemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.menuItemId !== menuItemId),
        })),

      increment: (menuItemId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.menuItemId === menuItemId
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                }
              : item,
          ),
        })),

      setQuantity: (menuItemId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.menuItemId !== menuItemId),
            };
          }
          return {
            items: state.items.map((item) =>
              item.menuItemId === menuItemId
                ? {
                    ...item,
                    quantity,
                  }
                : item,
            ),
          };
        }),

      decrement: (menuItemId) =>
        set((state) => ({
          items: state.items.flatMap((item) => {
            if (item.menuItemId !== menuItemId) {
              return item;
            }

            if (item.quantity === 1) {
              return [];
            }

            return {
              ...item,
              quantity: item.quantity - 1,
            };
          }),
        })),

      addReplacementItem: (originalMenuItemId, replacement) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.menuItemId !== originalMenuItemId) return item;
            const currentReps = item.replacements || [];
            const existingRep = currentReps.find(
              (r) => r.menuItemId === replacement.menuItemId,
            );
            if (existingRep) {
              return {
                ...item,
                replacements: currentReps.map((r) =>
                  r.menuItemId === replacement.menuItemId
                    ? { ...r, quantity: r.quantity + replacement.quantity }
                    : r,
                ),
              };
            }
            return {
              ...item,
              replacements: [...currentReps, replacement],
            };
          }),
        })),

      removeReplacementItem: (originalMenuItemId, replacementMenuItemId) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.menuItemId !== originalMenuItemId) return item;
            return {
              ...item,
              replacements: (item.replacements || []).filter(
                (r) => r.menuItemId !== replacementMenuItemId,
              ),
            };
          }),
        })),

      updateReplacementItemQuantity: (originalMenuItemId, replacementMenuItemId, quantity) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.menuItemId !== originalMenuItemId) return item;
            return {
              ...item,
              replacements: (item.replacements || []).map((r) =>
                r.menuItemId === replacementMenuItemId
                  ? { ...r, quantity }
                  : r,
              ),
            };
          }),
        })),

      clearCart: () =>
        set({
          items: [],
          orderId: null,
          orderStatus: null,
          hasPlacedOrder: false,
          savedItems: [],
        }),

      loadExistingOrder: ({ orderId, status, items }) =>
        set({
          orderId,
          orderStatus: status,
          hasPlacedOrder: true,
          items,
          savedItems: items,
        }),

      setWindowId: (windowId) =>
        set({
          windowId,
        }),

      markCurrentAsSaved: () =>
        set((state) => ({
          savedItems: state.items,
        })),
    }),
    {
      name: "snackdesk-cart",
      partialize: (state) => ({
        items: state.items,
        orderId: state.orderId,
        orderStatus: state.orderStatus,
        hasPlacedOrder: state.hasPlacedOrder,
        savedItems: state.savedItems,
      }),
    },
  ),
);

export const useCartCount = () =>
  useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

export function useCartSubtotal() {
  return useCartStore((state) =>
    state.items.reduce(
      (total, item) => total + Number(item.price) * item.quantity,
      0,
    ),
  );
}
