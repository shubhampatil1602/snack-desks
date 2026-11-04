import { create } from "zustand";

export type ShellDialog = "settings" | "help";

// Which sidebar window is open (Settings or Get Help), shared so the sidebar
// buttons and the user menu open the same dialog
type ShellDialogStore = {
  open: ShellDialog | null;
  setOpen: (open: ShellDialog | null) => void;
};

export const useShellDialogStore = create<ShellDialogStore>()((set) => ({
  open: null,
  setOpen: (open) => set({ open }),
}));

export const openShellDialog = (name: ShellDialog) => useShellDialogStore.getState().setOpen(name);
