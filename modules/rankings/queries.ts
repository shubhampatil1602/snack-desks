import { prisma } from "@/lib/db";
import { parsePeriod } from "@/lib/date-utils";

export async function getEmployeeRankings(
  organizationId: string,
  period: string,
) {
  const { startDate, endDate } = parsePeriod(period);

  let rawQuery;
  
  if (startDate && endDate) {
    rawQuery = await prisma.$queryRaw<{ userId: string; name: string; orders: number; spent: number }[]>`
      SELECT 
        u.id as "userId",
        u.name as "name",
        COUNT(DISTINCT o.id)::int as "orders",
        SUM(oi.quantity * m.price)::float as "spent"
      FROM "user" u
      JOIN "order" o ON u.id = o."userId"
      JOIN "order_item" oi ON o.id = oi."orderId"
      JOIN "menu_item" m ON oi."menuItemId" = m.id
      WHERE o."organizationId" = ${organizationId}
        AND o.status = 'approved'
        AND oi."replacementApplied" = false
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
      GROUP BY u.id, u.name
      ORDER BY "spent" DESC
    `;
  } else {
    rawQuery = await prisma.$queryRaw<{ userId: string; name: string; orders: number; spent: number }[]>`
      SELECT 
        u.id as "userId",
        u.name as "name",
        COUNT(DISTINCT o.id)::int as "orders",
        SUM(oi.quantity * m.price)::float as "spent"
      FROM "user" u
      JOIN "order" o ON u.id = o."userId"
      JOIN "order_item" oi ON o.id = oi."orderId"
      JOIN "menu_item" m ON oi."menuItemId" = m.id
      WHERE o."organizationId" = ${organizationId}
        AND o.status = 'approved'
        AND oi."replacementApplied" = false
      GROUP BY u.id, u.name
      ORDER BY "spent" DESC
    `;
  }

  return rawQuery.map((employee, index) => ({
    rank: index + 1,
    ...employee,
  }));
}

export type EmployeeRanking = Awaited<
  ReturnType<typeof getEmployeeRankings>
>[number];
