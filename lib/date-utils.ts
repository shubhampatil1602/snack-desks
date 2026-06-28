import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, getYear, getMonth, getDate } from "date-fns";

const TIME_ZONE = "Asia/Kolkata";

export function getISTDateParts(date: Date = new Date()) {
  const zonedDate = toZonedTime(date, TIME_ZONE);
  return {
    year: getYear(zonedDate),
    month: getMonth(zonedDate), // 0-indexed in date-fns
    day: getDate(zonedDate),
  };
}

export function getISTDayBoundaries(date: Date = new Date()) {
  const zonedDate = toZonedTime(date, TIME_ZONE);
  return {
    dayStart: fromZonedTime(startOfDay(zonedDate), TIME_ZONE),
    dayEnd: fromZonedTime(endOfDay(zonedDate), TIME_ZONE),
  };
}

export function getISTMonthBoundaries(date: Date = new Date()) {
  const zonedDate = toZonedTime(date, TIME_ZONE);
  return {
    monthStart: fromZonedTime(startOfMonth(zonedDate), TIME_ZONE),
    monthEnd: fromZonedTime(endOfMonth(zonedDate), TIME_ZONE),
  };
}

export function parsePeriod(period: string): {
  startDate?: Date;
  endDate?: Date;
} {
  if (period === "all") {
    return { startDate: undefined, endDate: undefined };
  }

  if (period.length === 4 && /^\d{4}$/.test(period)) {
    const year = Number(period);
    // Create a local date for Jan 1 of that year in the zoned time representation
    const zonedDate = new Date(year, 0, 1);
    return {
      startDate: fromZonedTime(startOfYear(zonedDate), TIME_ZONE),
      endDate: fromZonedTime(endOfYear(zonedDate), TIME_ZONE),
    };
  }

  if (period.length === 7 && /^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");
    const zonedDate = new Date(Number(year), Number(month) - 1, 1);
    return {
      startDate: fromZonedTime(startOfMonth(zonedDate), TIME_ZONE),
      endDate: fromZonedTime(endOfMonth(zonedDate), TIME_ZONE),
    };
  }

  // Default to current month if invalid format, using IST
  const zonedDate = toZonedTime(new Date(), TIME_ZONE);
  return {
    startDate: fromZonedTime(startOfMonth(zonedDate), TIME_ZONE),
    endDate: fromZonedTime(endOfMonth(zonedDate), TIME_ZONE),
  };
}

export function buildDateFilter(period: string) {
  const { startDate, endDate } = parsePeriod(period);
  return startDate && endDate
    ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }
    : {};
}

