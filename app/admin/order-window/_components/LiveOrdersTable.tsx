import type { LiveOrder } from "@/modules/orders/admin-queries";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderActions } from "./OrderActions";

type LiveOrdersTableProps = {
  orders: LiveOrder[];
};

function getStatusVariant(status: string) {
  switch (status) {
    case "approved":
      return "default";

    case "rejected":
      return "destructive";

    default:
      return "secondary";
  }
}

export function LiveOrdersTable({ orders }: LiveOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className='border p-6 text-sm text-muted-foreground'>
        No orders yet
      </div>
    );
  }

  const bill = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className='border'>
      <div className='flex items-center gap-6 border p-4'>
        <div>
          <p className='text-xs text-muted-foreground'>Orders</p>
          <p className='text-xl font-semibold'>{orders.length}</p>
        </div>

        <div>
          <p className='text-xs text-muted-foreground'>Bill</p>
          <p className='text-xl font-semibold'>₹{bill}</p>
        </div>
      </div>
      <Table>
        <TableHeader className='bg-muted'>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className='font-medium'>{order.user.name}</TableCell>

              <TableCell>
                <div className='space-y-1'>
                  {order.items.map((item) => (
                    <div key={item.id}>
                      {item.menuItem.name} × {item.quantity}
                      <Badge className='ml-1'>(₹{item.menuItem.price})</Badge>
                    </div>
                  ))}
                </div>
              </TableCell>

              <TableCell>₹{order.total}</TableCell>

              <TableCell>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </TableCell>

              <TableCell>
                <OrderActions orderId={order.id} status={order.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
