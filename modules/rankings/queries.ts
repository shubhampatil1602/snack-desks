import { tagOrgData } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";
import { parsePeriod } from "@/lib/date-utils";
import { spendLinesCte } from "@/lib/spend-lines";

export async function getEmployeeRankings(
  organizationId: string,
  period: string,
) {
  "use cache: remote";
  tagOrgData(organizationId, "orders", "menu", "members");

  const { startDate, endDate } = parsePeriod(period);
  const range =
    startDate && endDate ? { start: startDate, end: endDate } : undefined;

  const rawQuery = await prisma.$queryRaw<
    { userId: string; name: string; orders: number; spent: number }[]
  >`
    ${spendLinesCte(organizationId, range)}
    SELECT
      u.id as "userId",
      u.name as "name",
      COUNT(DISTINCT l."orderKey")::int as "orders",
      SUM(l.amount)::float as "spent"
    FROM spend_lines l
    JOIN "user" u ON u.id = l."userId"
    GROUP BY u.id, u.name
    ORDER BY "spent" DESC
  `;

  return rawQuery.map((employee, index) => ({
    rank: index + 1,
    ...employee,
  }));
}

export type EmployeeRanking = Awaited<
  ReturnType<typeof getEmployeeRankings>
>[number];
