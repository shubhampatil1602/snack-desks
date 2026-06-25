import {
  format,
  startOfYear,
  endOfYear,
  eachWeekOfInterval,
  addDays,
  isAfter,
  isBefore,
  subYears,
} from "date-fns";
import type { UserOrderHistory } from "@/modules/orders/user-history-queries";
import { Cell, HeatmapDay } from "@/types/profile";

export function getHeatmapData(orders: UserOrderHistory) {
  const endDate = new Date();
  const startDate = subYears(endDate, 1);

  const orderMap = new Map<string, number>();
  for (const order of orders) {
    const date = format(order.createdAt, "yyyy-MM-dd");
    const orderTotal = order.items
      .filter((item) => !item.replacementApplied)
      .reduce(
        (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
        0,
      );
    orderMap.set(date, (orderMap.get(date) ?? 0) + orderTotal);
  }

  const data = [];

  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    const key = format(date, "yyyy-MM-dd");

    data.push({
      date: key,
      spent: orderMap.get(key) ?? 0, // renamed from orders
    });
  }

  return data;
}

export const CELL_SIZE = 12;
export const CELL_GAP = 4;
export const STEP = CELL_SIZE + CELL_GAP;

export const PLATFORM_YEAR = 2026;

// Thresholds in ₹ — tweak if your avg order value differs
// ₹1–99   → light
// ₹100–299 → medium
// ₹300+    → dark
export function getIntensity(spent: number) {
  if (spent === 0) return "bg-muted";
  if (spent < 100) return "bg-green-200 dark:bg-green-950";
  if (spent < 300) return "bg-green-400 dark:bg-green-800";
  return "bg-green-600 dark:bg-green-600";
}

export function buildWeeks(data: HeatmapDay[], year: number): Cell[][] {
  const dataMap = new Map(data.map((d) => [d.date, d.spent]));
  const today = new Date();
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const weeks = eachWeekOfInterval(
    { start: yearStart, end: yearEnd },
    { weekStartsOn: 0 },
  );

  return weeks.map((weekStart) =>
    Array.from({ length: 7 }, (_, i): Cell => {
      const date = addDays(weekStart, i);
      if (isBefore(date, yearStart) || isAfter(date, yearEnd)) return null;
      const key = format(date, "yyyy-MM-dd");
      const future = isAfter(date, today);
      return {
        date: key,
        spent: future ? 0 : (dataMap.get(key) ?? 0),
        future,
      };
    }),
  );
}

export function getMonthLabels(weeks: Cell[][]) {
  const seen = new Map<number, number>();

  weeks.forEach((week, colIndex) => {
    week.forEach((cell) => {
      if (!cell) return;
      const month = new Date(cell.date).getMonth();
      if (!seen.has(month)) seen.set(month, colIndex);
    });
  });

  return Array.from(seen.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([month, colIndex]) => ({
      label: format(new Date(2000, month, 1), "MMM"),
      colIndex,
    }));
}

export function buildYearOptions(startYear: number): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = startYear; y <= currentYear; y++) years.push(y);
  return years;
}
