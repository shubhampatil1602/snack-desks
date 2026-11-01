import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TopSellingItem = {
  menuItemId: string;
  name: string;
  quantity: number;
};

type TopSellingItemsCardProps = {
  items: TopSellingItem[];
};

export function TopSellingItemsCard({ items }: TopSellingItemsCardProps) {
  const maxQuantity = items[0]?.quantity ?? 1;

  return (
    <Card size='sm'>
      <CardHeader>
        <CardTitle>Top Selling Items</CardTitle>
        <CardAction>
          <Link
            href="/admin/menus"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View menus
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No sales yet</p>
        ) : (
          <ul className='space-y-3'>
            {items.map((item) => {
              const percentage = (item.quantity / maxQuantity) * 100;

              return (
                <li key={item.menuItemId} className='space-y-1.5'>
                  <div className='flex items-baseline justify-between gap-3'>
                    <span className='truncate'>{item.name}</span>
                    <span className='shrink-0 font-semibold tabular-nums'>
                      {item.quantity.toLocaleString("en-IN")}
                      <span className='ml-1.5 text-xs font-normal text-muted-foreground'>
                        sold
                      </span>
                    </span>
                  </div>
                  <div className='h-[3px] bg-muted'>
                    <div
                      className='h-full bg-primary'
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
