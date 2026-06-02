"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type HistoryPeriod = "all" | "today" | "week" | "month";

export type HistoryStatus =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

type OrderHistoryFiltersProps = {
  period: HistoryPeriod;
  statusFilter: HistoryStatus;

  onPeriodChange: (value: HistoryPeriod) => void;

  onStatusChange: (value: HistoryStatus) => void;
};

export function OrderHistoryFilters({
  period,
  statusFilter,
  onPeriodChange,
  onStatusChange,
}: OrderHistoryFiltersProps) {
  return (
    <div className='flex justify-between mb-3'>
      <Tabs
        value={period}
        onValueChange={(value) => onPeriodChange(value as HistoryPeriod)}
      >
        <TabsList>
          <TabsTrigger value='all'>All</TabsTrigger>

          <TabsTrigger value='today'>Today</TabsTrigger>

          <TabsTrigger value='week'>This Week</TabsTrigger>

          <TabsTrigger value='month'>This Month</TabsTrigger>
        </TabsList>
      </Tabs>

      <Select
        value={statusFilter}
        onValueChange={(value) => onStatusChange(value as HistoryStatus)}
      >
        <SelectTrigger className='w-[180px]'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value='all'>All Status</SelectItem>

          <SelectItem value='pending'>Pending</SelectItem>

          <SelectItem value='approved'>Approved</SelectItem>

          <SelectItem value='rejected'>Rejected</SelectItem>

          <SelectItem value='cancelled'>Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
