import { Badge } from "@/components/ui/badge";

type OrderStatusBadgeProps = {
  status: string;
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  switch (status) {
    case "approved":
      return <Badge className='text-green-600'>Approved</Badge>;

    case "rejected":
      return <Badge variant='destructive'>Rejected</Badge>;

    case "pending":
      return (
        <Badge variant='secondary' className='text-yellow-800'>
          Pending
        </Badge>
      );

    case "cancelled":
      return <Badge variant='outline'>Cancelled</Badge>;

    default:
      return <Badge variant='outline'>{status}</Badge>;
  }
}
