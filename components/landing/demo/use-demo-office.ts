import { create } from "zustand";

import { bill } from "./sample-data";

export const SPIN_SECTION_ID = "spin-wheel";

const STILL_PENDING = ["Rohan Jain", "Sana Khan"];

type DemoOffice = {
  winner: string | null;
  billPaid: boolean;
  paid: boolean;
  pending: string[];
  setWinner: (winner: string | null) => void;
  markBillPaid: () => void;
  markPaid: () => void;
  approve: (name: string) => void;
};

// What the admin and user views and the wheel further down the page all share
export const useDemoOffice = create<DemoOffice>((set) => ({
  winner: null,
  billPaid: false,
  paid: false,
  pending: STILL_PENDING,
  setWinner: (winner) => set({ winner, billPaid: false, paid: false }),
  markBillPaid: () => set({ billPaid: true }),
  markPaid: () => set({ paid: true }),
  approve: (name) => set((office) => ({ pending: office.pending.filter((person) => person !== name) })),
}));

export const orderCounts = (pending: string[]) => ({
  orders: bill.length,
  approved: bill.length - pending.length,
  pending: pending.length,
});
