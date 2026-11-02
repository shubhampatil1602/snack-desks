import { generateText, Output } from "ai";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { SNACKY_VOICE, snackyModel, snackyNow } from "@/lib/snacky";
import {
  getDashboardStats,
  getRevenueByCategory,
  getTopSellingItems,
  getTopWindowWinners,
} from "@/modules/admin-dashboard/queries";
import { getEmployeeRankings } from "@/modules/rankings/queries";
import {
  getUserFavoriteItems,
  getUserSplitMasterWins,
  getUserSpendingByCategory,
  getUserStats,
} from "@/modules/user-dashboard/queries";

const roastSchema = z.object({
  roasts: z
    .array(
      z.object({
        line: z
          .string()
          .describe("The joke, at most 80 characters, with its one key figure or name in **bold**"),
        aside: z.string().describe("The punchline, savage and dramatic, at most 55 characters"),
      }),
    )
    .min(3)
    .max(4),
  awards: z
    .array(
      z.object({
        title: z.string().describe("A made-up award, at most 26 characters"),
        winner: z.string().describe("Who or what won, with its figure: Samosa single, 1,271"),
        quip: z.string().describe("One savage line, at most 50 characters"),
      }),
    )
    .length(3),
});

export type SnackySummary = z.infer<typeof roastSchema> & {
  // the plain numbers under the roast, worked out here, not by the model
  facts: string;
  updatedAt: Date;
};

// the period before, to compare with: last month or last year
function previousPeriod(period: string) {
  if (/^\d{4}$/.test(period)) return String(Number(period) - 1);
  const month = /^(\d{4})-(\d{2})$/.exec(period);
  if (!month) return null;
  const [year, m] = [Number(month[1]), Number(month[2])];
  return m === 1 ? `${year - 1}-12` : `${year}-${String(m - 1).padStart(2, "0")}`;
}

function rupees(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

// the tone and the limits, shared by the office roast and the personal one
const ROAST_STYLE = `Style: the notorious, savage-but-loving push notifications food delivery apps are famous for. Dramatic, sarcastic, a little unhinged: personify things (the samosa, the wallet, the budget, the gym membership, the diet plan, the salary), use mock-serious drama and absurd comparisons, and keep each line punchy. The aside lands the punchline. Examples of the tone only. Never reuse their punchlines; invent fresh ones every time:
- "₹31,853 on snacks this year." / "Somewhere, a gym membership is crying quietly."
- "Samosa single: 1,271 orders." / "It has more attendance than half the team."
- "Vedika spent ₹3,139 on snacks." / "Her wallet has filed a missing person report."
- "Nashta ate 47% of the budget." / "Lunch has stopped returning our calls."
- "1,285 orders this year." / "The pantry has trust issues now."
- "Cutting chai ×640." / "Not an addiction. A lifestyle. Probably."`;

const ROAST_LIMITS = `Savage, never cruel: roast the snacking habit and the spending, and let things (wallets, budgets, the pantry, the office, gym memberships in general) suffer, not people. A person may only be teased about their orders and spending. Never joke about anyone's body, legs, weight, looks, fitness, diet, fasting, health, gender, religion or caste, or how much they earn. Use names and figures exactly as given, and nothing that isn't in the numbers. A sprinkle of Hinglish is welcome ("bas ek aur", "chai pe charcha"). No emoji.`;

async function roast(prompt: string) {
  const { output } = await generateText({
    model: snackyModel,
    output: Output.object({ schema: roastSchema }),
    // a different set of jokes each time someone asks again
    temperature: 1.1,
    system: SNACKY_VOICE,
    prompt: `It is ${snackyNow()}. ${prompt}`,
  });
  return output;
}

const NOTHING_YET = {
  roasts: [{ line: "No approved orders yet.", aside: "Snacky is starving for data." }],
  awards: [],
  facts: "Nothing to roast this period",
};

// the whole office, for the admin's dashboard
async function writeOrgSummary(organizationId: string, period: string) {
  const before = previousPeriod(period);
  const [stats, categories, items, rankings, winners, beforeStats] = await Promise.all([
    getDashboardStats(organizationId, period),
    getRevenueByCategory(organizationId, period),
    getTopSellingItems(organizationId, period),
    getEmployeeRankings(organizationId, period),
    getTopWindowWinners(organizationId, period),
    before ? getDashboardStats(organizationId, before) : null,
  ]);

  if (stats.approvedOrders === 0) return NOTHING_YET;

  const facts = [
    `Period: ${period === "all" ? "all time" : period}`,
    `Approved spend ${rupees(stats.totalRevenue)} over ${stats.approvedOrders} approved orders (${stats.totalOrders} placed), average ${rupees(stats.avgOrderValue)} per order`,
    beforeStats &&
      `Period before (${before}): ${rupees(beforeStats.totalRevenue)} over ${beforeStats.approvedOrders} approved orders`,
    `Spend by shop: ${Object.entries(stats.totalRevenueShopBreakdown).map(([shop, amount]) => `${shop} ${rupees(amount)}`).join(", ")}`,
    `Spend by category: ${categories.slice(0, 6).map((c) => `${c.category} ${rupees(c.revenue)} (${c.share}%)`).join(", ")}`,
    `Top items by quantity: ${items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}`,
    `Biggest spenders: ${rankings.slice(0, 3).map((r) => `${r.name} ${rupees(r.spent)} over ${r.orders} orders`).join(", ")}; ${rankings.length} people ordered`,
    winners.length > 0 &&
      `Most spin wins (collects the order): ${winners.slice(0, 3).map((w) => `${w.name} ${w.wins}`).join(", ")}`,
  ].filter(Boolean);

  const output = await roast(`Write Snacky's cheeky roast of how this office snacked, for the admin's dashboard, from these numbers only:
${facts.map((fact) => `- ${fact}`).join("\n")}

${ROAST_STYLE}

Write 3 or 4 roasts and exactly 3 made-up awards with dramatic titles (biggest spender, favourite item, top category or shop or spin winner). If the period before is given, one roast can tease the change.

${ROAST_LIMITS}`);

  return {
    ...output,
    facts: [
      `${stats.approvedOrders.toLocaleString("en-IN")} orders`,
      `${rupees(stats.totalRevenue)} spent`,
      items[0] && `top pick ${items[0].name}`,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

// one person's own snacking, for their dashboard; nobody else is named
async function writePersonalSummary(organizationId: string, userId: string, period: string) {
  const before = previousPeriod(period);
  const [user, stats, favourites, categories, wins, rankings, beforeStats] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    getUserStats(organizationId, userId, period),
    getUserFavoriteItems(organizationId, userId, period),
    getUserSpendingByCategory(organizationId, userId, period),
    getUserSplitMasterWins(organizationId, userId),
    getEmployeeRankings(organizationId, period),
    before ? getUserStats(organizationId, userId, before) : null,
  ]);

  if (stats.totalOrders === 0) return NOTHING_YET;

  const firstName = user?.name.split(" ")[0] ?? "you";
  const facts = [
    `Period: ${period === "all" ? "all time" : period}`,
    `Their name: ${firstName}`,
    `They spent ${rupees(stats.totalSpent)} over ${stats.totalOrders} orders, average ${rupees(stats.averageOrderValue)} per order`,
    stats.currentRank &&
      `Their spending rank: #${stats.currentRank.rank} of ${rankings.length} people in the office`,
    beforeStats && `Period before (${before}): ${rupees(beforeStats.totalSpent)} over ${beforeStats.totalOrders} orders`,
    favourites.length > 0 && `Their favourite items: ${favourites.slice(0, 3).map((i) => `${i.name} ×${i.quantity}`).join(", ")}`,
    categories.length > 0 && `Their spend by category: ${categories.slice(0, 3).map((c) => `${c.category} ${c.share}%`).join(", ")}`,
    `Times they won the spin and collected the office order (all time): ${wins}`,
  ].filter(Boolean);

  const output = await roast(`Write Snacky's cheeky roast of ONE person's own snacking, shown only to them on their dashboard, from these numbers only:
${facts.map((fact) => `- ${fact}`).join("\n")}

Talk to them directly ("you", "your"), first name at most once. Don't name or compare with anyone else; their rank is fine.

${ROAST_STYLE}

Write 3 or 4 roasts and exactly 3 made-up personal awards with dramatic titles (their signature item, their spending or rank, their favourite category or their spin wins). If the period before is given, one roast can tease the change.

${ROAST_LIMITS}`);

  return {
    ...output,
    facts: [
      `${stats.totalOrders.toLocaleString("en-IN")} orders`,
      `${rupees(stats.totalSpent)} spent`,
      stats.currentRank && `#${stats.currentRank.rank} of ${rankings.length}`,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

/** "org" for the whole office; a user id for that person's own roast. */
export type SummaryScope = "org" | { userId: string };

function scopeKey(scope: SummaryScope) {
  return scope === "org" ? "org" : scope.userId;
}

/** The saved summary for the period, or null if there isn't one yet. */
export async function getSavedSnackySummary(
  organizationId: string,
  period: string,
  scope: SummaryScope = "org",
): Promise<SnackySummary | null> {
  const row = await prisma.snackySummary.findUnique({
    where: { organizationId_period_scope: { organizationId, period, scope: scopeKey(scope) } },
  });
  // summaries saved in an older shape are written again
  const summary = row?.summary as Omit<SnackySummary, "updatedAt"> | undefined;
  if (!row || !summary?.roasts) return null;
  return { ...summary, updatedAt: row.updatedAt };
}

/** Writes the period's summary afresh and saves it, so it stays until the next refresh. */
export async function refreshSnackySummary(
  organizationId: string,
  period: string,
  scope: SummaryScope = "org",
): Promise<SnackySummary> {
  const summary =
    scope === "org"
      ? await writeOrgSummary(organizationId, period)
      : await writePersonalSummary(organizationId, scope.userId, period);
  const key = scopeKey(scope);
  const row = await prisma.snackySummary.upsert({
    where: { organizationId_period_scope: { organizationId, period, scope: key } },
    create: { organizationId, period, scope: key, summary },
    update: { summary },
  });
  return { ...summary, updatedAt: row.updatedAt };
}
