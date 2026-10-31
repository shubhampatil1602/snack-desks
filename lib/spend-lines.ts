import { Prisma } from "@/lib/generated/prisma/client";

/**
 * `WITH spend_lines AS (...)` — every approved, non-replaced order item in the
 * org, expanded into one row per paying user. A split item is shared equally
 * by the order owner and each split user, matching how order history prices
 * split items (price / participants).
 *
 * Columns: "userId", "orderKey", "windowId", "createdAt", "menuItemId", amount
 *
 * "orderKey" mirrors history's order list: co-split items count under the
 * user's own approved order in that window, or a synthetic per-window order
 * when they have none.
 */
export function spendLinesCte(
  organizationId: string,
  range?: { start: Date; end: Date },
) {
  const rangeFilter = range
    ? Prisma.sql`AND o."createdAt" >= ${range.start} AND o."createdAt" <= ${range.end}`
    : Prisma.empty;

  return Prisma.sql`
    WITH item_share AS (
      SELECT
        oi.id AS "orderItemId",
        o.id AS "orderId",
        o."userId" AS "ownerId",
        o."windowId",
        o."createdAt",
        oi."menuItemId",
        oi.quantity * m.price / (1 + COUNT(s.id)) AS amount
      FROM "order" o
      INNER JOIN "order_item" oi ON o.id = oi."orderId"
      INNER JOIN "menu_item" m ON oi."menuItemId" = m.id
      LEFT JOIN "order_item_split" s ON s."orderItemId" = oi.id
      WHERE o."organizationId" = ${organizationId}
        AND o.status = 'approved'
        AND oi."replacementApplied" = false
        ${rangeFilter}
      GROUP BY oi.id, o.id, m.id
    ),
    spend_lines AS (
      SELECT
        i."ownerId" AS "userId",
        i."orderId" AS "orderKey",
        i."windowId",
        i."createdAt",
        i."menuItemId",
        i.amount
      FROM item_share i
      UNION ALL
      SELECT
        s."userId",
        COALESCE(
          (
            SELECT MIN(own.id)
            FROM "order" own
            WHERE own."userId" = s."userId"
              AND own."windowId" = i."windowId"
              AND own.status = 'approved'
          ),
          'split-' || i."windowId"
        ) AS "orderKey",
        i."windowId",
        i."createdAt",
        i."menuItemId",
        i.amount
      FROM item_share i
      INNER JOIN "order_item_split" s ON s."orderItemId" = i."orderItemId"
      WHERE s."userId" <> i."ownerId"
    )
  `;
}

/** createdAt (UTC, no tz) as IST wall-clock time, for bucketing by IST day/month. */
export const IST_CREATED_AT = Prisma.sql`(l."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata'`;
