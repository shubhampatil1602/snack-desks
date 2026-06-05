"use client";

import { useTheme } from "next-themes";

export function BgGradient() {
  const { theme } = useTheme();
  return (
    <div
      className={`absolute inset-0 bg-size-[48px_48px] opacity-40 ${
        theme === "light"
          ? "bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)]"
          : "bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)]"
      }`}
    />
  );
}
