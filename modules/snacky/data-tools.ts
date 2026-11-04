import { tool, type InferUITools } from "ai";
import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

// Read-only tools Ask Snacky answers from. Each one is fixed SQL scoped to
// the admin's org: the model only fills in filters and picks from the lists
// below, so it can never read another org's data or anything but these.

// a UTC timestamp column (stored without tz) as IST wall-clock time
function ist(column: string) {
  return Prisma.raw(`((${column} AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')`);
}

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional();

const range = {
  from: day.describe("First IST day to include, YYYY-MM-DD. Leave out for no lower limit."),
  to: day.describe("Last IST day to include, YYYY-MM-DD. Leave out for up to today."),
};

// IST days, both ends included
function inRange(column: string, from?: string, to?: string) {
  return Prisma.sql`${from ? Prisma.sql`AND ${ist(column)} >= ${from}::date` : Prisma.empty}
    ${to ? Prisma.sql`AND ${ist(column)} < ${to}::date + 1` : Prisma.empty}`;
}

function contains(column: string, value?: string) {
  if (!value?.trim()) return Prisma.empty;
  const escaped = value.trim().replace(/[\\%_]/g, (c) => `\\${c}`);
  return Prisma.sql`AND ${Prisma.raw(column)} ILIKE ${`%${escaped}%`}`;
}

const DIMENSIONS = {
  none: { key: Prisma.sql`'Total'` },
  user: { key: Prisma.sql`u.name` },
  item: { key: Prisma.sql`m.name` },
  category: { key: Prisma.sql`mc.name` },
  shop: { key: Prisma.sql`COALESCE(sh.name, 'No shop')` },
  windowLabel: { key: Prisma.sql`INITCAP(LOWER(TRIM(w.label)))` },
  window: {
    key: Prisma.sql`w.label || ' · ' || TO_CHAR(${ist(`w."createdAt"`)}, 'DD Mon YYYY')`,
    sort: Prisma.sql`MIN(w."createdAt")`,
  },
  day: {
    key: Prisma.sql`TO_CHAR(${ist(`l."createdAt"`)}, 'DD Mon YYYY')`,
    sort: Prisma.sql`MIN(${ist(`l."createdAt"`)}::date)`,
  },
  month: {
    key: Prisma.sql`TO_CHAR(${ist(`l."createdAt"`)}, 'Mon YYYY')`,
    sort: Prisma.sql`MIN(DATE_TRUNC('month', ${ist(`l."createdAt"`)}))`,
  },
  weekday: {
    key: Prisma.sql`TO_CHAR(${ist(`l."createdAt"`)}, 'Dy')`,
    sort: Prisma.sql`MIN(EXTRACT(ISODOW FROM ${ist(`l."createdAt"`)}))`,
  },
  hour: {
    key: Prisma.sql`TO_CHAR(${ist(`l."createdAt"`)}, 'HH12 AM')`,
    sort: Prisma.sql`MIN(EXTRACT(HOUR FROM ${ist(`l."createdAt"`)}))`,
  },
} satisfies Record<string, { key: Prisma.Sql; sort?: Prisma.Sql }>;

type Dimension = keyof typeof DIMENSIONS;
const dimensionNames = Object.keys(DIMENSIONS) as [Dimension, ...Dimension[]];

export type BreakdownRow = {
  label: string;
  spend: number;
  quantity: number;
  orders: number;
  people: number;
};

async function spendBreakdown(
  organizationId: string,
  input: {
    groupBy: Dimension;
    sortBy: "spend" | "quantity" | "orders" | "people";
    limit: number;
    from?: string;
    to?: string;
    user?: string;
    item?: string;
    category?: string;
    shop?: string;
    windowLabel?: string;
    veg?: boolean;
  },
) {
  const dimension: { key: Prisma.Sql; sort?: Prisma.Sql } = DIMENSIONS[input.groupBy];
  // time buckets read in order; everything else biggest first
  const orderBy = dimension.sort
    ? Prisma.sql`${dimension.sort} ASC`
    : Prisma.sql`${Prisma.raw(`"${input.sortBy}"`)} DESC, label ASC`;

  // Approved, non-replaced items, one line per paying person: a split item
  // is shared equally by the owner and each split user, as history prices it
  // (see lib/spend-lines.ts). Shares add back up to the full price, so totals
  // across people match the org's own spend.
  const rows = await prisma.$queryRaw<
    (BreakdownRow & { totalSpend: number; totalQuantity: number; groups: number })[]
  >`
    WITH item_share AS (
      SELECT
        oi.id AS "orderItemId",
        o.id AS "orderId",
        o."userId" AS "ownerId",
        o."windowId",
        o."createdAt",
        oi."menuItemId",
        oi.quantity::float / (1 + COUNT(s.id)) AS qty,
        (oi.quantity * oi."unitPrice")::float / (1 + COUNT(s.id)) AS amount
      FROM "order" o
      INNER JOIN "order_item" oi ON o.id = oi."orderId"
      INNER JOIN "menu_item" m ON oi."menuItemId" = m.id
      LEFT JOIN "order_item_split" s ON s."orderItemId" = oi.id
      WHERE o."organizationId" = ${organizationId}
        AND o.status = 'approved'
        AND oi."replacementApplied" = false
        ${inRange(`o."createdAt"`, input.from, input.to)}
      GROUP BY oi.id, o.id, m.id
    ),
    lines AS (
      SELECT "ownerId" AS "userId", "orderId", "windowId", "createdAt", "menuItemId", qty, amount
      FROM item_share
      UNION ALL
      SELECT s."userId", i."orderId", i."windowId", i."createdAt", i."menuItemId", i.qty, i.amount
      FROM item_share i
      INNER JOIN "order_item_split" s ON s."orderItemId" = i."orderItemId"
      WHERE s."userId" <> i."ownerId"
    )
    SELECT
      ${dimension.key} AS label,
      ROUND(SUM(l.amount)::numeric, 2)::float AS spend,
      ROUND(SUM(l.qty)::numeric, 1)::float AS quantity,
      COUNT(DISTINCT l."orderId")::int AS orders,
      COUNT(DISTINCT l."userId")::int AS people,
      ROUND(SUM(SUM(l.amount)) OVER ()::numeric, 2)::float AS "totalSpend",
      ROUND(SUM(SUM(l.qty)) OVER ()::numeric, 1)::float AS "totalQuantity",
      (COUNT(*) OVER ())::int AS "groups"
    FROM lines l
    INNER JOIN "user" u ON u.id = l."userId"
    INNER JOIN "menu_item" m ON m.id = l."menuItemId"
    INNER JOIN "menu_category" mc ON mc.id = m."menuCategoryId"
    LEFT JOIN "shop" sh ON sh.id = m."shopId"
    INNER JOIN "order_window" w ON w.id = l."windowId"
    WHERE true
      ${contains("u.name", input.user)}
      ${contains("m.name", input.item)}
      ${contains("mc.name", input.category)}
      ${contains("sh.name", input.shop)}
      ${contains("w.label", input.windowLabel)}
      ${input.veg === undefined ? Prisma.empty : Prisma.sql`AND m."isVeg" = ${input.veg}`}
    GROUP BY 1
    ORDER BY ${orderBy}
    LIMIT ${input.limit}
  `;

  const first = rows[0];
  return {
    groupBy: input.groupBy,
    sortBy: input.sortBy,
    rows: rows.map(({ label, spend, quantity, orders, people }) => ({
      label,
      spend,
      quantity,
      orders,
      people,
    })),
    total: { spend: first?.totalSpend ?? 0, quantity: first?.totalQuantity ?? 0 },
    groups: first?.groups ?? 0,
    // more groups than shown
    truncated: (first?.groups ?? 0) > rows.length,
  };
}

async function orderWindows(
  organizationId: string,
  input: { from?: string; to?: string; label?: string; limit: number },
) {
  const rows = await prisma.$queryRaw<
    {
      id: string;
      label: string;
      opened: string;
      status: string;
      paid: boolean;
      winner: string | null;
      orders: number;
      people: number;
      spend: number;
      total: number;
    }[]
  >`
    SELECT
      w.id,
      w.label,
      TO_CHAR(${ist(`w."createdAt"`)}, 'Dy DD Mon YYYY, HH12:MI AM') AS opened,
      w.status,
      w.paid,
      wu.name AS winner,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'approved')::int AS orders,
      COUNT(DISTINCT o."userId") FILTER (WHERE o.status = 'approved')::int AS people,
      COALESCE(SUM(oi.quantity * oi."unitPrice") FILTER (
        WHERE o.status = 'approved' AND oi."replacementApplied" = false
      ), 0)::float AS spend,
      (COUNT(*) OVER ())::int AS total
    FROM "order_window" w
    LEFT JOIN "user" wu ON wu.id = w."winnerUserId"
    LEFT JOIN "order" o ON o."windowId" = w.id
    LEFT JOIN "order_item" oi ON oi."orderId" = o.id
    LEFT JOIN "menu_item" m ON m.id = oi."menuItemId"
    WHERE w."organizationId" = ${organizationId}
      ${inRange(`w."createdAt"`, input.from, input.to)}
      ${contains("w.label", input.label)}
    GROUP BY w.id, wu.name
    ORDER BY w."createdAt" DESC
    LIMIT ${input.limit}
  `;

  return {
    windows: rows.map((row) => ({
      id: row.id,
      label: row.label,
      opened: row.opened,
      status: row.status,
      paid: row.paid,
      winner: row.winner,
      orders: row.orders,
      people: row.people,
      spend: row.spend,
    })),
    totalWindows: rows[0]?.total ?? 0,
  };
}

async function windowWinners(
  organizationId: string,
  input: { from?: string; to?: string },
) {
  const rows = await prisma.$queryRaw<{ name: string; wins: number; paid: number }[]>`
    SELECT u.name, COUNT(*)::int AS wins, COUNT(*) FILTER (WHERE w.paid)::int AS paid
    FROM "order_window" w
    INNER JOIN "user" u ON u.id = w."winnerUserId"
    WHERE w."organizationId" = ${organizationId}
      ${inRange(`w."createdAt"`, input.from, input.to)}
    GROUP BY u.id, u.name
    ORDER BY wins DESC, u.name ASC
  `;
  return { winners: rows };
}

async function members(
  organizationId: string,
  input: { from?: string; to?: string },
) {
  // names and order counts only: no emails or phone numbers go to the model
  const rows = await prisma.$queryRaw<
    { name: string; role: string; joined: string; lastOrder: string | null; ordersInRange: number }[]
  >`
    SELECT
      u.name,
      mb.role,
      TO_CHAR(${ist(`mb."createdAt"`)}, 'DD Mon YYYY') AS joined,
      TO_CHAR(MAX(${ist(`o."createdAt"`)}), 'DD Mon YYYY') AS "lastOrder",
      COUNT(o.id) FILTER (WHERE true ${inRange(`o."createdAt"`, input.from, input.to)})::int AS "ordersInRange"
    FROM "member" mb
    INNER JOIN "user" u ON u.id = mb."userId"
    LEFT JOIN "order" o
      ON o."userId" = mb."userId"
      AND o."organizationId" = mb."organizationId"
      AND o.status = 'approved'
    WHERE mb."organizationId" = ${organizationId}
    GROUP BY u.id, u.name, mb.role, mb."createdAt"
    ORDER BY u.name ASC
  `;
  return { members: rows };
}

async function menuItems(organizationId: string, input: { search?: string }) {
  const rows = await prisma.$queryRaw<
    { name: string; category: string; shop: string | null; price: number; unit: string; veg: boolean; available: boolean }[]
  >`
    SELECT m.name, mc.name AS category, sh.name AS shop, m.price::float AS price,
      m.unit, m."isVeg" AS veg, m."isAvailable" AS available
    FROM "menu_item" m
    INNER JOIN "menu_category" mc ON mc.id = m."menuCategoryId"
    LEFT JOIN "shop" sh ON sh.id = m."shopId"
    WHERE m."organizationId" = ${organizationId}
      ${contains("m.name", input.search)}
    ORDER BY mc.name ASC, m.name ASC
    LIMIT 200
  `;
  return { items: rows };
}

// one window in full: what to buy per shop, each person's share (split
// items shared equally, as everywhere else), splits and order statuses.
// Counts pending and approved orders, like the admin's live To buy list.
async function windowSummary(
  organizationId: string,
  input: { label?: string; date?: string },
) {
  const where: Prisma.OrderWindowWhereInput = {
    organizationId,
    ...(input.label?.trim() ? { label: { contains: input.label.trim(), mode: "insensitive" } } : {}),
  };
  let windows = await prisma.orderWindow.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      label: true,
      status: true,
      paid: true,
      createdAt: true,
      endsAt: true,
      winnerUser: { select: { name: true } },
    },
  });
  if (input.date) {
    windows = windows.filter(
      (w) => formatInTimeZone(w.createdAt, "Asia/Kolkata", "yyyy-MM-dd") === input.date,
    );
  }
  const window = windows[0];
  if (!window) return { found: false as const, note: "No window matches that" };

  const orders = await prisma.order.findMany({
    where: { windowId: window.id, organizationId },
    select: {
      status: true,
      user: { select: { name: true } },
      items: {
        where: { replacementApplied: false },
        select: {
          quantity: true,
          unitPrice: true,
          menuItem: { select: { name: true, shop: { select: { name: true } } } },
          splits: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  const statuses: Record<string, number> = {};
  const buy = new Map<string, Map<string, number>>();
  const shares = new Map<string, number>();
  const splits: { item: string; people: string[] }[] = [];
  let total = 0;
  let approvedSpend = 0;

  for (const order of orders) {
    statuses[order.status] = (statuses[order.status] ?? 0) + 1;
    if (order.status === "rejected" || order.status === "cancelled") continue;
    for (const item of order.items) {
      const cost = Number(item.unitPrice) * item.quantity;
      const shop = item.menuItem.shop?.name ?? "Other";
      const lines = buy.get(shop) ?? new Map<string, number>();
      lines.set(item.menuItem.name, (lines.get(item.menuItem.name) ?? 0) + item.quantity);
      buy.set(shop, lines);
      total += cost;
      if (order.status === "approved") approvedSpend += cost;

      const people = [order.user.name, ...item.splits.map((s) => s.user.name)];
      const unique = [...new Set(people)];
      unique.forEach((name) => shares.set(name, (shares.get(name) ?? 0) + cost / unique.length));
      if (unique.length > 1) splits.push({ item: `${item.quantity}× ${item.menuItem.name}`, people: unique });
    }
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    found: true as const,
    // more windows matched; this is the newest of them
    otherMatches: windows.length - 1,
    window: {
      id: window.id,
      label: window.label,
      opened: formatInTimeZone(window.createdAt, "Asia/Kolkata", "EEE dd MMM yyyy, h:mm a"),
      status: window.status,
      closesAt: window.endsAt ? formatInTimeZone(window.endsAt, "Asia/Kolkata", "h:mm a") : null,
      winner: window.winnerUser?.name ?? null,
      paid: window.paid,
    },
    orderStatuses: statuses,
    total: round(total),
    approvedSpend: round(approvedSpend),
    toBuy: [...buy.entries()].map(([shop, lines]) => ({
      shop,
      items: [...lines.entries()]
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity),
    })),
    shares: [...shares.entries()]
      .map(([name, amount]) => ({ name, amount: round(amount) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 60),
    splits: splits.slice(0, 30),
  };
}

export function snackyDataTools(organizationId: string, shopNames: string[] = []) {
  return {
    // No execute: the page shows these details with an Open button, and the
    // admin's click opens the window through the usual server action
    openOrderWindow: tool({
      description:
        "Propose opening a new order window. The admin sees the details and confirms or cancels; the result says which. " +
        "Only call it once the admin has told you both the label and the shops (by name, or \"all\"); if either is missing, ask for it first and never assume. Tagline and timer are optional. " +
        `The org's shops: ${shopNames.join(", ") || "none yet"}.`,
      inputSchema: z.object({
        label: z.string().max(25).describe("Window label, e.g. Tea or Lunch"),
        shops: z.array(z.string()).min(1).describe("Shop names exactly as listed"),
        tagline: z.string().max(120).optional().describe("Line on the users' banner"),
        durationMinutes: z.number().int().min(1).max(600).optional().describe("Auto-close timer"),
      }),
      outputSchema: z.object({ opened: z.boolean(), note: z.string() }),
    }),
    // also confirmed by the admin on the page, like openOrderWindow
    closeOrderWindow: tool({
      description:
        "Propose closing the open order window (its id and label are under Current state). The admin confirms or cancels; the result says which.",
      inputSchema: z.object({
        windowId: z.string().describe("The open window's id from Current state"),
        label: z.string().describe("The open window's label"),
      }),
      outputSchema: z.object({ closed: z.boolean(), note: z.string() }),
    }),
    // also confirmed by the admin on the page, which shows the window as it is in the database
    deleteOrderWindow: tool({
      description:
        "Propose deleting one order window with all its orders, for good. Take its id from orderWindows or windowSummary, never guess it. The admin confirms or cancels; the result says which.",
      inputSchema: z.object({
        windowId: z.string().describe("The window's id from orderWindows or windowSummary"),
        label: z.string().describe("The window's label"),
      }),
      outputSchema: z.object({ deleted: z.boolean(), note: z.string() }),
    }),
    spendBreakdown: tool({
      description:
        "Approved spend, quantity, order count and people, grouped by one dimension, with optional filters. " +
        "Use it for any question about money, items, categories, shops, people's spend or trends over time. " +
        "Split items are shared equally between the people splitting them. " +
        "Text filters match part of a name, case-insensitive.",
      inputSchema: z.object({
        groupBy: z
          .enum(dimensionNames)
          .describe(
            "none = one total row; windowLabel = kind of window like Tea or Lunch; window = each window; day/month/weekday/hour = over time (IST), sorted in time order",
          ),
        sortBy: z.enum(["spend", "quantity", "orders", "people"]).default("spend"),
        limit: z.number().int().min(1).max(100).default(10),
        ...range,
        user: z.string().optional().describe("Person's name"),
        item: z.string().optional().describe("Menu item name"),
        category: z.string().optional(),
        shop: z.string().optional(),
        windowLabel: z.string().optional().describe("Window label, e.g. tea or lunch"),
        veg: z.boolean().optional().describe("true = veg items only, false = non-veg only"),
      }),
      execute: (input) => spendBreakdown(organizationId, input),
    }),
    windowSummary: tool({
      description:
        "Everything about ONE order window: what to buy per shop, each person's share (split items shared equally), which items were split and with whom, order statuses, total, winner and paid. " +
        "Counts pending and approved orders (rejected and cancelled left out); approvedSpend is approved only. " +
        "Leave both filters out for the latest window (the open one, if any). When more windows match, it returns the newest; otherMatches says how many others.",
      inputSchema: z.object({
        label: z.string().optional().describe("Part of the window label, e.g. lunch"),
        date: day.describe("The IST day the window opened, YYYY-MM-DD"),
      }),
      execute: (input) => windowSummary(organizationId, input),
    }),
    orderWindows: tool({
      description:
        "Order windows newest first: label, when it opened, status, approved orders, people, spend, who won the spin and whether they've been paid back.",
      inputSchema: z.object({
        ...range,
        label: z.string().optional().describe("Part of the window label, e.g. lunch"),
        limit: z.number().int().min(1).max(50).default(15),
      }),
      execute: (input) => orderWindows(organizationId, input),
    }),
    windowWinners: tool({
      description:
        "How many windows each person won on the spin wheel (they collect the order), and how many of those are paid back.",
      inputSchema: z.object(range),
      execute: (input) => windowWinners(organizationId, input),
    }),
    members: tool({
      description:
        "Everyone in the org with role, join date, last approved order date and approved orders in the range. Use it for who hasn't ordered, new joiners, or exact names.",
      inputSchema: z.object(range),
      execute: (input) => members(organizationId, input),
    }),
    menuItems: tool({
      description:
        "Menu items with category, shop, current price, unit, veg or not, and whether available.",
      inputSchema: z.object({
        search: z.string().optional().describe("Part of an item name"),
      }),
      execute: (input) => menuItems(organizationId, input),
    }),
  };
}

export type SnackyDataTools = InferUITools<ReturnType<typeof snackyDataTools>>;
