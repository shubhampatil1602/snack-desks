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
  boardKey,
  dayBoardFacts,
  orgRunFacts,
  personalRunFacts,
} from "@/modules/snacky/run-facts";
import { getRunsLeaderboard, istDay } from "@/modules/strava/leaderboard";
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
        topic: z
          .enum(["running", "snacking"])
          .describe("running if the joke is about Strava runs or walks, otherwise snacking"),
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

// Bump when the prompts change: saved roasts of an older version are
// written again the next time someone opens them.
const ROAST_VERSION = 5;

export type SnackySummary = z.infer<typeof roastSchema> & {
  // the plain numbers under the roast, worked out here, not by the model
  facts: string;
  // the runs board a leaderboard roast was written from (boardKey)
  board?: string;
  version?: number;
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

// every roast: mostly savage, a little kind
const KINDNESS = `Keep it about 80 to 90% roast and 10 to 20% kindness: now and then let a little warmth slip in, like a backhanded compliment or quiet credit for showing up ("still, respect for the 6 am alarm"), usually in the aside. Kind, not soppy: never a pep talk, never "keep going".`;

const ROAST_LIMITS = `Savage, never cruel: roast the snacking habit and the spending, and let things (wallets, budgets, the pantry, the office, gym memberships in general) suffer, not people. A person may only be teased about their orders and spending. Never joke about anyone's body, legs, weight, looks, fitness, diet, fasting, health, gender, religion or caste, or how much they earn. Use names and figures exactly as given, and nothing that isn't in the numbers. A sprinkle of Hinglish is welcome ("bas ek aur", "chai pe charcha"). No emoji.

${KINDNESS}`;

// how to read a pace, for every roast with Strava numbers
const PACE_GUIDE = `Pace is minutes per km, so lower is faster: under 5:30/km is quick, 6:00 to 8:00/km is a steady jog, 9:00/km and slower is barely faster than a walk, and slower than 12:00/km counts as a walk: it scores 0, though the runner still shows on the board, unranked. Points (the run score) reward distance and speed together. Roast with all three: km, pace and points. Every comparison must make sense: only things that move can be faster or slower than a runner, so never compare a pace with food or objects that don't move (no "even the jelly moves faster"). If a joke needs explaining, write another.`;

// added after ROAST_LIMITS when Strava numbers are in the facts
const RUN_EXCEPTION = `Running is the one exception to the fitness rule: roast their Strava numbers like the snacking ones (the km, the pace, the points, early alarms, runs against snacks). ${PACE_GUIDE} Tease the numbers only, never their body, weight, looks or health. Genuinely fast runs (in the facts) deserve real credit: give one running roast to that, a compliment with at most a light jab. With none, roast the running freely.`;

// the leaderboard roast: everyone in the office sees it
const RUN_STYLE = `Style: a savage sports commentator crossed with the notorious push notifications food delivery apps are famous for. Each roast slide is a real roast of a runner's numbers: the slow pace, the short run, the low points, the long slow slog, the big gap, the show-off at the top. The aside lands the punchline. Examples of the tone only. Never reuse their punchlines; invent fresh ones every time:
- "Rohan ran **5.63 km** at 10:19/km." / "Longest run, slowest pace. Strava nearly filed it under walks."
- "Isha: **1.56 km** for 10.74 points." / "Warm-up done. The run is still loading."
- "Kabir: **16.15** points off 2.48 km." / "Barely warmed up and still on top. Show-off."
- "**4.54** points between first and second." / "Second place is in a different postcode."`;

const RUN_LIMITS = `${PACE_GUIDE}

These are roasts, not pep talks: no motivation, no "keep going", no cheering on the roast slides. ${KINDNESS} The one exception is a runner marked GENUINELY FAST: they earned it, so their slide gives them real credit (a compliment with at most a light jab), and they deserve an award. Everyone else gets roasted, and if nobody is marked, roast everyone freely. Otherwise praise belongs only on the awards. Don't make jokes about the bill, the spin wheel or split master being scared, terrified, crying or losing a customer; roast the runners' numbers instead. Everyone in the office sees this, so tease the numbers only, never anyone's body, weight, looks, health, age, gender, religion or caste. Use names and figures exactly as given, and nothing that isn't in the numbers. A sprinkle of Hinglish is welcome. No emoji.`;

// running roasts first, the rest in the order written (a stable sort)
function runningFirst<T extends { topic: "running" | "snacking" }>(roasts: T[]) {
  return [...roasts].sort((a, b) => Number(b.topic === "running") - Number(a.topic === "running"));
}

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
  roasts: [
    { line: "No approved orders yet.", aside: "Snacky is starving for data.", topic: "snacking" as const },
  ],
  awards: [],
  facts: "Nothing to roast this period",
};

// the whole office, for the admin's dashboard
async function writeOrgSummary(organizationId: string, period: string) {
  const before = previousPeriod(period);
  const [stats, categories, items, rankings, winners, beforeStats, runFacts] = await Promise.all([
    getDashboardStats(organizationId, period),
    getRevenueByCategory(organizationId, period),
    getTopSellingItems(organizationId, period),
    getEmployeeRankings(organizationId, period),
    getTopWindowWinners(organizationId, period),
    before ? getDashboardStats(organizationId, before) : null,
    orgRunFacts(organizationId, period),
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
    ...runFacts,
  ].filter(Boolean);

  const output = await roast(`Write Snacky's cheeky roast of how this office snacked, for the admin's dashboard, from these numbers only:
${facts.map((fact) => `- ${fact}`).join("\n")}

${ROAST_STYLE}

Write 3 or 4 roasts and exactly 3 made-up awards with dramatic titles (biggest spender, favourite item, top category or shop or spin winner). If the period before is given, one roast can tease the change.${runFacts.length > 0 ? " The first roast is about the office's running on Strava (topic running), and one award may be." : ""}

${ROAST_LIMITS}${runFacts.length > 0 ? `\n\n${RUN_EXCEPTION}` : ""}`);

  return {
    ...output,
    roasts: runFacts.length > 0 ? runningFirst(output.roasts) : output.roasts,
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
  const [user, stats, favourites, categories, wins, rankings, beforeStats, running] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      getUserStats(organizationId, userId, period),
      getUserFavoriteItems(organizationId, userId, period),
      getUserSpendingByCategory(organizationId, userId, period),
      getUserSplitMasterWins(organizationId, userId),
      getEmployeeRankings(organizationId, period),
      before ? getUserStats(organizationId, userId, before) : null,
      personalRunFacts(organizationId, userId, period),
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
    ...running.lines,
  ].filter(Boolean);

  const output = await roast(`Write Snacky's cheeky roast of ONE person's own snacking, shown only to them on their dashboard, from these numbers only:
${facts.map((fact) => `- ${fact}`).join("\n")}

Talk to them directly ("you", "your"), first name at most once. Don't name or compare with anyone else; their rank is fine.

${ROAST_STYLE}

Write 3 or 4 roasts and exactly 3 made-up personal awards with dramatic titles (their signature item, their spending or rank, their favourite category or their spin wins). If the period before is given, one roast can tease the change.${running.lines.length > 0 ? " Write 4 roasts: the first 2 about their running on Strava (topic running), then 2 about their snacking. One of the 3 awards is for their running." : ""}

${ROAST_LIMITS}${running.lines.length > 0 ? `\n\n${RUN_EXCEPTION}` : ""}`);

  return {
    ...output,
    // their running comes first when they have Strava numbers
    roasts: running.lines.length > 0 ? runningFirst(output.roasts) : output.roasts,
    facts: [
      `${stats.totalOrders.toLocaleString("en-IN")} orders`,
      `${rupees(stats.totalSpent)} spent`,
      stats.currentRank && `#${stats.currentRank.rank} of ${rankings.length}`,
      running.runs > 0 && `${running.runs} run${running.runs === 1 ? "" : "s"}`,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

// one day's runs leaderboard, shown to everyone on /runs and /admin/runs
async function writeRunsRoast(organizationId: string, day: string) {
  const board = await getRunsLeaderboard(organizationId, day);
  const key = boardKey(board);
  const { entries } = board;

  if (entries.length === 0) {
    return {
      roasts: [
        {
          line: day === istDay() ? "No runs on the board yet." : "Nobody ran this day.",
          aside: "The leaderboard is stretching alone.",
          topic: "running" as const,
        },
      ],
      awards: [],
      facts: "No runs to roast",
      board: key,
    };
  }

  const facts = dayBoardFacts(board);
  const output = await roast(`Write Snacky's cheeky commentary on ONE day's office runs leaderboard, shown to everyone in the office on the leaderboard page, from these numbers only:
${facts.map((fact) => `- ${fact}`).join("\n")}

${RUN_STYLE}

Write exactly 3 roasts (topic running), each about different runners where there are enough, then exactly 3 made-up awards (the most points, the fastest pace, the longest run or the slowest pace), each winner with their figure. The awards may be celebratory; the roasts may not. With one runner, all three awards can go to them.

${RUN_LIMITS}`);

  const scored = entries.filter((entry) => entry.rank !== null);
  const slow = entries.length - scored.length;
  return {
    ...output,
    facts: [
      `${scored.length} runner${scored.length === 1 ? "" : "s"}`,
      slow > 0 && `${slow} too slow`,
      scored[0] && `top ${scored[0].score.toFixed(2)}`,
      scored[0]?.name.split(" ")[0],
    ]
      .filter(Boolean)
      .join(" · "),
    board: key,
  };
}

/**
 * "org" for the whole office; a user id for that person's own roast; "runs"
 * for a day's runs leaderboard, whose period is the day (YYYY-MM-DD).
 */
export type SummaryScope = "org" | "runs" | { userId: string };

function scopeKey(scope: SummaryScope) {
  return typeof scope === "string" ? scope : scope.userId;
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
  if (!row || !summary?.roasts || summary.version !== ROAST_VERSION) return null;
  return { ...summary, updatedAt: row.updatedAt };
}

/** Writes the period's summary afresh and saves it, so it stays until the next refresh. */
export async function refreshSnackySummary(
  organizationId: string,
  period: string,
  scope: SummaryScope = "org",
): Promise<SnackySummary> {
  const written =
    scope === "org"
      ? await writeOrgSummary(organizationId, period)
      : scope === "runs"
        ? await writeRunsRoast(organizationId, period)
        : await writePersonalSummary(organizationId, scope.userId, period);
  const key = scopeKey(scope);
  const summary = { ...written, version: ROAST_VERSION };
  const row = await prisma.snackySummary.upsert({
    where: { organizationId_period_scope: { organizationId, period, scope: key } },
    create: { organizationId, period, scope: key, summary },
    update: { summary },
  });
  return { ...summary, updatedAt: row.updatedAt };
}
