export interface HeatmapDay {
  date: string;
  spent: number;
}

export interface SnackHeatmapProps {
  data: HeatmapDay[];
  /** ISO date string or Date — the user's createdAt from the DB */
  joinedAt: string | Date;
  title?: string;
  description?: string;
}

export type Cell = null | { date: string; spent: number; future: boolean };
