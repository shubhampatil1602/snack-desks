import { format, subMonths, startOfMonth } from "date-fns";

export interface MonthOption {
  value: string;
  label: string;
  year: string;
  month: string;
}

export function generateMonthsFromDate(startDate: Date): MonthOption[] {
  const months: MonthOption[] = [];
  const now = new Date();
  const start = startOfMonth(startDate);
  const current = startOfMonth(now);

  let date = current;
  while (date >= start) {
    months.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM"),
      year: format(date, "yyyy"),
      month: format(date, "MM"),
    });
    date = subMonths(date, 1);
  }

  return months;
}

export function getYearsFromMonths(months: MonthOption[]): string[] {
  return Array.from(new Set(months.map((m) => m.year))).sort(
    (a, b) => Number(b) - Number(a),
  );
}

export function groupMonthsByYear(
  months: MonthOption[],
  years: string[],
): Record<string, MonthOption[]> {
  return years.reduce(
    (acc, year) => {
      acc[year] = months.filter((m) => m.year === year);
      return acc;
    },
    {} as Record<string, MonthOption[]>,
  );
}

export function getActivePeriod(period: string | undefined): string {
  return period || format(new Date(), "yyyy-MM");
}

export function getPeriodLabel(
  period: string | undefined,
  months: MonthOption[],
): string {
  if (period === "all") {
    return "All Time";
  }

  const activePeriod = getActivePeriod(period);

  if (activePeriod.length === 4 && /^\d{4}$/.test(activePeriod)) {
    return activePeriod;
  }

  if (activePeriod.length === 7 && /^\d{4}-\d{2}$/.test(activePeriod)) {
    const month = months.find((m) => m.value === activePeriod);
    if (month) {
      return `${month.label} ${activePeriod.split("-")[0]}`;
    }
    return activePeriod;
  }

  return "Select period";
}

export function isAllTimeView(period: string | undefined): boolean {
  return period === "all";
}

export function isYearView(period: string | undefined): boolean {
  const activePeriod = getActivePeriod(period);
  return activePeriod.length === 4 && /^\d{4}$/.test(activePeriod);
}

export function isMonthView(period: string | undefined): boolean {
  const activePeriod = getActivePeriod(period);
  return activePeriod.length === 7 && /^\d{4}-\d{2}$/.test(activePeriod);
}
