import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";

export type WindowHabit = {
  label: string;
  count: number;
  // the shops this window usually opens with
  shops: string[];
  // its latest taglines, newest first
  taglines: string[];
  // usual opening time, e.g. "10 AM"
  usualTime: string;
};

// the office's own lines, to show Snacky the tagline style before an org
// has taglines of its own
export const TAGLINE_EXAMPLES = [
  "Garma garam samose aur vada pav, nasta order karlo!",
  "Thandi chaas aur thoda chakhna, lunch ke saath ho jaaye?",
  "Nilesh bhai, aaj veg manchurian ho jaaye!",
  "Yadavji ke vada pav ho jaaye?",
];

function mostCommon<T>(values: T[]) {
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/** The org's most-used windows from its last 80, most used first. */
export async function getWindowHabits(organizationId: string, limit = 6): Promise<WindowHabit[]> {
  const windows = await prisma.orderWindow.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: { label: true, tagline: true, createdAt: true, shops: { select: { name: true } } },
  });

  const byLabel = new Map<string, typeof windows>();
  for (const window of windows) {
    const key = window.label.trim().toLowerCase();
    byLabel.set(key, [...(byLabel.get(key) ?? []), window]);
  }

  return [...byLabel.values()]
    .map((group) => {
      const shopSets = group.map((w) => w.shops.map((s) => s.name).sort().join("|"));
      const usualShops = mostCommon(shopSets.filter(Boolean));
      return {
        label: group[0].label.trim(),
        count: group.length,
        shops: usualShops ? usualShops.split("|") : [],
        taglines: [...new Set(group.map((w) => w.tagline?.trim()).filter((t): t is string => !!t))].slice(0, 3),
        usualTime: mostCommon(group.map((w) => formatInTimeZone(w.createdAt, "Asia/Kolkata", "h a"))) ?? "",
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** One line per habit, for Snacky's prompts. */
export function describeHabits(habits: WindowHabit[]) {
  if (habits.length === 0) return "- None yet: this org hasn't opened many windows.";
  return habits
    .map(
      (h) =>
        `- "${h.label}": opened ${h.count} times, usually around ${h.usualTime}, shops: ${h.shops.join(", ") || "varies"}` +
        (h.taglines.length ? `; recent taglines: ${h.taglines.map((t) => `"${t}"`).join(", ")}` : ""),
    )
    .join("\n");
}

export type ShopMenu = {
  // the admin's own words about the shop, if any
  description: string | null;
  items: string[];
};

/** Each shop's available items, so taglines only mention food it sells. */
export async function getShopMenus(organizationId: string) {
  const shops = await prisma.shop.findMany({
    where: { organizationId },
    select: {
      name: true,
      description: true,
      menuItems: {
        where: { isAvailable: true },
        select: { name: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  return new Map<string, ShopMenu>(
    shops.map((shop) => [
      shop.name,
      { description: shop.description, items: shop.menuItems.map((item) => item.name) },
    ]),
  );
}

export function describeShopMenus(menus: Map<string, ShopMenu>) {
  if (menus.size === 0) return "- No menus yet.";
  return [...menus.entries()]
    .map(
      ([shop, { description, items }]) =>
        `- ${shop}${description ? ` (${description})` : ""}: ` +
        (items.length > 0
          ? `${items.slice(0, 25).join(", ")}${items.length > 25 ? ", …" : ""}`
          : "nothing on the menu yet"),
    )
    .join("\n");
}

export const TAGLINE_FOOD_RULE =
  "A tagline may only mention food that its window's shops sell, from the shop menus. Never add other dishes, even classic ones (no kachori if the shop doesn't sell it). Generic words like nasta, chai time or khana are fine.";
