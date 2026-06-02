type OrderItem = {
  id: string;
  quantity: number;
  menuItem: {
    name: string;
    price: string;
  };
};

type OrderHistoryDetailsProps = {
  items: OrderItem[];
};

export function OrderHistoryDetails({ items }: OrderHistoryDetailsProps) {
  const total = items.reduce(
    (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
    0,
  );

  return (
    <div className='space-y-2'>
      {items.map((item) => (
        <div key={item.id} className='flex justify-between'>
          <span>
            {item.menuItem.name} × {item.quantity}
          </span>

          <span>
            ₹{(Number(item.menuItem.price) * item.quantity).toFixed(2)}
          </span>
        </div>
      ))}

      <div className='border-t pt-2 flex justify-between font-medium'>
        <span>Total</span>

        <span>₹{total.toFixed(2)}</span>
      </div>
    </div>
  );
}
