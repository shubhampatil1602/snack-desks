import { Badge } from "@/components/ui/badge";
import type { TodaysWindow } from "@/modules/order-window/queries";

interface TodaysWindowsListProps {
  windows: TodaysWindow[];
}

export function TodaysWindowsList({ windows }: TodaysWindowsListProps) {
  if (windows.length === 0) return null;

  return (
    <div className='space-y-2'>
      {windows.map((w) => (
        <div
          key={w.id}
          className='flex items-center justify-between border px-4 py-3'
        >
          <div className='flex items-center gap-3'>
            <Badge
              variant={w.status === "active" ? "default" : "secondary"}
              className={`${w.status === "active" ? "bg-green-600 text-white px-1.5 py-0.5" : ""} px-1.5 py-0.5`}
            >
              {w.status === "active" ? "Active" : "Closed"}
            </Badge>
            <span className='text-sm font-medium'>{w.label}</span>
          </div>
          <div className='flex items-center gap-4 text-xs text-muted-foreground'>
            <span>{w._count.orders} orders</span>
            <span>
              {new Date(w.startsAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {w.endsAt &&
                ` → ${new Date(w.endsAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
