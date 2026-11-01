import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FavoriteItem = {
  menuItemId: string;
  name: string;
  quantity: number;
};

type FavoriteItemsCardProps = {
  items: FavoriteItem[];
};

export function FavoriteItemsCard({ items }: FavoriteItemsCardProps) {
  const maxQuantity = items[0]?.quantity ?? 1;

  return (
    <Card size='sm'>
      <CardHeader>
        <CardTitle>Favorite Items</CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No orders yet</p>
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
                        ordered
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
