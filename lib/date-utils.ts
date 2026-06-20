export function parsePeriod(period: string): {
  startDate?: Date;
  endDate?: Date;
} {
  if (period === "all") {
    return { startDate: undefined, endDate: undefined };
  }

  if (period.length === 4 && /^\d{4}$/.test(period)) {
    const year = Number(period);
    return {
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31, 23, 59, 59),
    };
  }

  if (period.length === 7 && /^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");
    return {
      startDate: new Date(Number(year), Number(month) - 1, 1),
      endDate: new Date(Number(year), Number(month), 0, 23, 59, 59),
    };
  }

  // Default to current month if invalid format
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return {
    startDate: new Date(year, month, 1),
    endDate: new Date(year, month + 1, 0, 23, 59, 59),
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
