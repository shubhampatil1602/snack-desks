// app/admin/dashboard/_components/TopSellingItemsCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No sales yet</p>
        ) : (
          <div className='space-y-3'>
            {items.map((item) => {
              const percentage = (item.quantity / maxQuantity) * 100;

              return (
                <div key={item.menuItemId}>
                  <div className='mb-1 flex items-center justify-between'>
                    <span className='font-medium'>{item.name}</span>

                    <span className='text-sm text-muted-foreground'>
                      {item.quantity} sold
                    </span>
                  </div>

                  <Progress value={percentage} className='h-3' />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
