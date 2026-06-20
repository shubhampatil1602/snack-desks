export interface HeatmapDay {
  date: string;
  orders: number;
}

export interface SnackHeatmapProps {
  data: HeatmapDay[];
}
