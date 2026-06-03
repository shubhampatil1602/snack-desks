import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
          <div className='space-y-3'>
            {items.map((item) => {
              const percentage = (item.quantity / maxQuantity) * 100;

              return (
                <div key={item.menuItemId}>
                  <div className='mb-1 flex items-center justify-between'>
                    <span className='font-medium'>{item.name}</span>

                    <span className='text-sm text-muted-foreground'>
                      {item.quantity} ordered
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
