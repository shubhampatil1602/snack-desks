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
  /** "detailed": bigger squares, weekday labels, days before joinedAt faded and a summary line */
  variant?: "default" | "detailed";
}

export type Cell = null | { date: string; spent: number; future: boolean };
