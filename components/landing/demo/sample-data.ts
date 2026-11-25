import type { Stat } from "@/components/dashboard/StatGroup";
import { buildHeatmapDays } from "@/lib/get-heatmap-data";
import type {
  CategoryRevenueSlice,
  RevenueTimeSeriesPoint,
} from "@/modules/admin-dashboard/queries";
import type { EmployeeRanking } from "@/modules/rankings/queries";
import type { RunsLeaderboard } from "@/modules/strava/leaderboard";
import type { HeatmapDay } from "@/types/profile";

// The sample office behind the landing page's demo. Every name and number
// here is made up, and the figures agree with each other: the eight shares
// add up to the bill, and the daily revenue adds up to the month.

export const SAMPLE_PERIOD = "October 2026";
export const SAMPLE_WINDOW_SECONDS = 288;

export const revenueStats: Stat[] = [
  { label: "Today", value: "₹980.00", note: "approved today" },
  { label: SAMPLE_PERIOD, value: "₹24,600.00", note: "approved orders" },
  { label: "All time", value: "₹86,400.00", note: "every approved order" },
];

export const orderStats: Stat[] = [
  { label: "Placed", value: "312", note: "all orders" },
  { label: "Approved", value: "298", note: "96% of placed" },
  { label: "Average order", value: "₹82.55", note: "per approved order" },
];

const DAILY_REVENUE: [string, number, number][] = [
  ["1 Oct", 980, 9],
  ["2 Oct", 1120, 16],
  ["5 Oct", 1040, 8],
  ["6 Oct", 1210, 17],
  ["7 Oct", 1090, 10],
  ["8 Oct", 1150, 18],
  ["9 Oct", 870, 7],
  ["12 Oct", 1010, 14],
  ["13 Oct", 1260, 15],
  ["14 Oct", 1130, 18],
  ["15 Oct", 1075, 9],
  ["16 Oct", 1190, 17],
  ["19 Oct", 940, 8],
  ["20 Oct", 1105, 16],
  ["21 Oct", 1220, 12],
  ["22 Oct", 1880, 24],
  ["23 Oct", 1015, 9],
  ["26 Oct", 1160, 18],
  ["27 Oct", 1095, 10],
  ["28 Oct", 1240, 19],
  ["29 Oct", 905, 8],
  ["30 Oct", 915, 16],
];

export const revenueTrend: RevenueTimeSeriesPoint[] = DAILY_REVENUE.map(
  ([label, revenue, orders]) => ({ label, revenue, orders }),
);

export const categoryRevenue: CategoryRevenueSlice[] = [
  { category: "Snacks", revenue: 9348, share: 38 },
  { category: "Tea & coffee", revenue: 5904, share: 24 },
  { category: "Meals", revenue: 4428, share: 18 },
  { category: "Cold drinks", revenue: 2952, share: 12 },
  { category: "Sweets", revenue: 1968, share: 8 },
];

export const rankings: EmployeeRanking[] = [
  { userId: "arjun", name: "Arjun Kulkarni", orders: 46, spent: 3240, rank: 1 },
  { userId: "riya", name: "Riya Shah", orders: 38, spent: 2910, rank: 2 },
  { userId: "dev", name: "Dev Mehta", orders: 31, spent: 2480, rank: 3 },
  { userId: "meera", name: "Meera Nair", orders: 28, spent: 2215, rank: 4 },
  { userId: "kabir", name: "Kabir Verma", orders: 25, spent: 1980, rank: 5 },
  { userId: "sana", name: "Sana Khan", orders: 22, spent: 1640, rank: 6 },
  { userId: "isha", name: "Isha Joshi", orders: 19, spent: 1395, rank: 7 },
  { userId: "rohan", name: "Rohan Jain", orders: 16, spent: 1120, rank: 8 },
];

export const windowWinners = [
  { userId: "kabir", name: "Kabir Verma", wins: 4, rank: 1 },
  { userId: "meera", name: "Meera Nair", wins: 3, rank: 2 },
  { userId: "sana", name: "Sana Khan", wins: 3, rank: 3 },
  { userId: "isha", name: "Isha Joshi", wins: 2, rank: 4 },
  { userId: "rohan", name: "Rohan Jain", wins: 1, rank: 5 },
];

export const topItems = [
  { menuItemId: "samosa", name: "Samosa", quantity: 145 },
  { menuItemId: "chai", name: "Masala Chai", quantity: 98 },
  { menuItemId: "vada-pav", name: "Vada Pav", quantity: 87 },
  { menuItemId: "cold-coffee", name: "Cold Coffee", quantity: 42 },
];

export const recentWindows = [
  { id: "today", label: "Evening Snacks", createdAt: new Date("2026-11-07T11:00:00Z"), status: "active", ordersCount: 8, revenue: 980 },
  { id: "lunch", label: "Lunch", createdAt: new Date("2026-11-06T07:00:00Z"), status: "closed", ordersCount: 14, revenue: 2140 },
  { id: "evening", label: "Evening Snacks", createdAt: new Date("2026-11-05T11:00:00Z"), status: "closed", ordersCount: 9, revenue: 1065 },
  { id: "tea", label: "Morning Tea", createdAt: new Date("2026-11-05T05:30:00Z"), status: "closed", ordersCount: 11, revenue: 310 },
];

// the same year as the rest of the page's clock, so the map is never empty
export function sampleHeatmapDays(): HeatmapDay[] {
  let seed = 20261107;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return buildHeatmapDays(new Map()).map((day) => {
    const weekday = new Date(`${day.date}T12:00:00Z`).getUTCDay();
    const roll = next();
    if (weekday === 0 || weekday === 6 || roll < 0.12) return day;
    return { ...day, spent: roll < 0.4 ? 80 : roll < 0.75 ? 220 : 480 };
  });
}

export const roasts = [
  {
    lead: "312 orders",
    line: " in October. The pantry has stopped taking our calls.",
    aside: "“Bas ek aur,” said everyone, every day.",
  },
  {
    lead: "46 samosas",
    line: " for Arjun alone. His wallet has applied for medical leave.",
    aside: "The samosa has declined to comment.",
  },
];

export const awards = [
  { title: "Samosa Laureate", winner: "Arjun", quip: "46 and still hungry" },
  { title: "Wheel’s Favourite", winner: "Kabir", quip: "4 wins, 4 walks to the shop" },
  { title: "Pizza Diplomat", winner: "Riya", quip: "Has never split a pizza alone" },
];

export const menu = [
  { id: "samosa", name: "Samosa", price: 20, isVeg: true, shop: "Sharma Snacks", group: false },
  { id: "vada-pav", name: "Vada Pav", price: 25, isVeg: true, shop: "Sharma Snacks", group: false },
  { id: "chai", name: "Masala Chai", price: 15, isVeg: true, shop: "Sharma Snacks", group: false },
  { id: "cold-coffee", name: "Cold Coffee", price: 80, isVeg: true, shop: "Hot Bites", group: true },
  { id: "pizza", name: "Margherita Pizza", price: 300, isVeg: true, shop: "Hot Bites", group: true },
  { id: "puff", name: "Chicken Puff", price: 45, isVeg: false, shop: "Hot Bites", group: true },
];

export const bill = [
  { name: "Arjun Kulkarni", items: "2× Samosa, 1× Cold Coffee, 1× Margherita Pizza (shared with Riya)", amount: 270 },
  { name: "Riya Shah", items: "1× Margherita Pizza (shared with Arjun), 2× Samosa", amount: 190 },
  { name: "Kabir Verma", items: "3× Vada Pav, 1× Cold Coffee, 2× Masala Chai", amount: 185 },
  { name: "Dev Mehta", items: "2× Cold Coffee", amount: 160 },
  { name: "Rohan Jain", items: "1× Cold Coffee, 3× Samosa", amount: 140 },
  { name: "Meera Nair", items: "2× Samosa, 1× Cold Coffee", amount: 120 },
  { name: "Isha Joshi", items: "2× Chicken Puff, 1× Samosa", amount: 110 },
  { name: "Sana Khan", items: "1× Chicken Puff, 2× Vada Pav", amount: 95 },
];

export const BILL_TOTAL = 1270;

export const olderWindows = [
  { id: "lunch", date: "6 Nov 2026", time: "12:30 pm", label: "Lunch", winner: "Sana Khan" },
  { id: "evening", date: "5 Nov 2026", time: "4:30 pm", label: "Evening Snacks", winner: "Kabir Verma" },
  { id: "tea", date: "5 Nov 2026", time: "11:00 am", label: "Morning Tea", winner: "Isha Joshi" },
];

export const toBuy = [
  {
    name: "Sharma Snacks",
    lines: [
      { name: "Samosa", quantity: 10, amount: 200 },
      { name: "Vada Pav", quantity: 5, amount: 125 },
      { name: "Masala Chai", quantity: 2, amount: 30 },
    ],
  },
  {
    name: "Hot Bites",
    lines: [
      { name: "Cold Coffee", quantity: 6, amount: 480 },
      { name: "Margherita Pizza", quantity: 1, amount: 300 },
      { name: "Chicken Puff", quantity: 3, amount: 135 },
    ],
  },
];

// The user view is Riya's. Her figures match her row in the rankings (38
// orders, ₹2,910) and her share of the bill above (₹190).
export const USER_ID = "riya";
export const USER_NAME = "Riya Shah";
export const userProfile = { id: USER_ID, name: USER_NAME, email: "riya@yourcompany.com" };
export const userMember = {
  createdAt: new Date("2026-01-12T06:00:00Z"),
  organization: { name: "Sample Office", inviteCode: "CHAI42" },
};
export const userSplitMasterWins = 2;

export const userSpentStats: Stat[] = [
  { label: "Today", value: "₹190.00", note: "approved today" },
  { label: SAMPLE_PERIOD, value: "₹2,910.00", note: "your share, approved" },
  { label: "All time", value: "₹10,240.00", note: "every approved order" },
];

export const userOrderStats: Stat[] = [
  { label: "Orders", value: "38", note: "approved" },
  { label: "Average order", value: "₹76.58", note: "per approved order" },
  { label: "Rank", value: "#2", note: "in your organization" },
];

const USER_DAILY_SPEND: [string, number, number][] = [
  ["1 Oct", 190, 3],
  ["5 Oct", 230, 3],
  ["7 Oct", 260, 4],
  ["9 Oct", 180, 2],
  ["13 Oct", 310, 4],
  ["15 Oct", 240, 3],
  ["19 Oct", 200, 3],
  ["21 Oct", 290, 4],
  ["22 Oct", 360, 4],
  ["26 Oct", 220, 3],
  ["28 Oct", 240, 3],
  ["30 Oct", 190, 2],
];

export const userSpendTrend: RevenueTimeSeriesPoint[] = USER_DAILY_SPEND.map(
  ([label, revenue, orders]) => ({ label, revenue, orders }),
);

export const userCategorySpend: CategoryRevenueSlice[] = [
  { category: "Meals", revenue: 1164, share: 40 },
  { category: "Snacks", revenue: 873, share: 30 },
  { category: "Tea & coffee", revenue: 582, share: 20 },
  { category: "Cold drinks", revenue: 291, share: 10 },
];

export const userFavouriteItems = [
  { menuItemId: "samosa", name: "Samosa", quantity: 21 },
  { menuItemId: "pizza", name: "Margherita Pizza", quantity: 9 },
  { menuItemId: "cold-coffee", name: "Cold Coffee", quantity: 8 },
  { menuItemId: "vada-pav", name: "Vada Pav", quantity: 6 },
];

export const userPastOrders = [
  { id: "lunch", date: "6 Nov 2026", label: "Lunch", winner: "Sana Khan", total: 240 },
  { id: "evening", date: "5 Nov 2026", label: "Evening Snacks", winner: "Kabir Verma", total: 150 },
  { id: "tea", date: "5 Nov 2026", label: "Morning Tea", winner: "Isha Joshi", total: 30 },
];

export const userRecentOrders = [
  { id: "today", windowLabel: "Evening Snacks", createdAt: new Date("2026-11-07T11:00:00Z"), total: 190, status: "approved" },
  { id: "lunch", windowLabel: "Lunch", createdAt: new Date("2026-11-06T07:00:00Z"), total: 240, status: "approved" },
  { id: "evening", windowLabel: "Evening Snacks", createdAt: new Date("2026-11-05T11:00:00Z"), total: 150, status: "approved" },
  { id: "tea", windowLabel: "Morning Tea", createdAt: new Date("2026-11-05T05:30:00Z"), total: 30, status: "approved" },
];

export const userRoasts = [
  {
    lead: "38 orders",
    line: " in October. Your desk now gets its own delivery route.",
    aside: "The samosa guy knows your name.",
  },
  {
    lead: "21 samosas",
    line: " and still second to Arjun. Silver has never tasted this crisp.",
    aside: "There’s always November.",
  },
];

export const userAwards = [
  { title: "Pizza Diplomat", winner: "You", quip: "Has never split a pizza alone" },
  { title: "Silver Samosa", winner: "You", quip: "21, and Arjun still ahead" },
  { title: "Spin Survivor", winner: "You", quip: "2 wins, 2 walks to the shop" },
];

export const userRoastFooter = "38 orders · ₹2,910.00 · most ordered: Samosa";

// a day on the runs leaderboard (scores from modules/strava/run-score.ts)
export const runsBoard: RunsLeaderboard = {
  day: "2026-10-14",
  lockedAt: null,
  entries: [
    { userId: "meera", name: "Meera Nair", photoUrl: null, distance: 5200, movingTime: 1622, score: 22.32, rank: 1 },
    { userId: "kabir", name: "Kabir Verma", photoUrl: null, distance: 3100, movingTime: 1070, score: 16.41, rank: 2 },
    { userId: "riya", name: "Riya Shah", photoUrl: null, distance: 2400, movingTime: 768, score: 15.97, rank: 3 },
    { userId: "arjun", name: "Arjun Kulkarni", photoUrl: null, distance: 4000, movingTime: 1800, score: 13.93, rank: 4 },
    { userId: "isha", name: "Isha Joshi", photoUrl: null, distance: 1800, movingTime: 738, score: 11.11, rank: 5 },
    // slower than 12:00/km: on the board, but no score
    { userId: "tanvi", name: "Tanvi Rao", photoUrl: null, distance: 2100, movingTime: 1600, score: 0, rank: null },
  ],
};
