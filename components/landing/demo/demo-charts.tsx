"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import {
  ChartsSkeleton,
  HeatmapSkeleton,
} from "@/app/admin/dashboard/_components/DashboardSkeletons";
import { sampleHeatmapDays } from "./sample-data";

export const RevenueTrendChart = dynamic(
  () =>
    import("@/app/admin/dashboard/_components/RevenueTrendChart").then(
      (mod) => mod.RevenueTrendChart,
    ),
  { ssr: false, loading: () => <ChartsSkeleton /> },
);
export const CategoryRevenueChart = dynamic(
  () =>
    import("@/app/admin/dashboard/_components/CategoryRevenueChart").then(
      (mod) => mod.CategoryRevenueChart,
    ),
  { ssr: false, loading: () => <ChartsSkeleton /> },
);
const SnackHeatmap = dynamic(
  () => import("@/components/SnackHeatMap").then((mod) => mod.SnackHeatmap),
  { ssr: false, loading: () => <HeatmapSkeleton /> },
);

export function SampleHeatmap({ title, description }: { title?: string; description?: string }) {
  const days = useMemo(() => sampleHeatmapDays(), []);
  return (
    <SnackHeatmap
      data={days}
      joinedAt='2026-01-01'
      title={title}
      description={description}
      variant='detailed'
    />
  );
}
