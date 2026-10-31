import { create } from "zustand";

// Open state of the cart sheet, shared so the order window's cart panel and
// bottom bar can open the same sheet as the header's Cart button
type CartSheetStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useCartSheetStore = create<CartSheetStore>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
