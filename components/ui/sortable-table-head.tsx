"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { TableHead } from "@/components/ui/table";

type SortableTableHeadProps<T extends string> = {
  label: string;
  sortKey: T;
  sort: { key: T; desc: boolean } | null;
  onSort: (key: T) => void;
  className?: string;
};

export function SortableTableHead<T extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: SortableTableHeadProps<T>) {
  const isActive = sort?.key === sortKey;

  return (
    <TableHead className={className}>
      <button
        type="button"
        className="inline-flex h-8 items-center gap-1 text-left font-medium hover:text-foreground"
        onClick={() => onSort(sortKey)}
      >
        {label}
        {isActive ? (
          sort.desc ? (
            <ArrowDown className="size-3.5" />
          ) : (
            <ArrowUp className="size-3.5" />
          )
        ) : (
          <ArrowUpDown className="size-3.5 text-muted-foreground/60" />
        )}
      </button>
    </TableHead>
  );
}

export function useColumnSort<T extends string>() {
  const [sort, setSort] = useState<{ key: T; desc: boolean } | null>(null);

  function toggleSort(key: T) {
    setSort((current) => {
      if (current?.key !== key) return { key, desc: false };
      if (!current.desc) return { key, desc: true };
      return null;
    });
  }

  return { sort, toggleSort };
}
