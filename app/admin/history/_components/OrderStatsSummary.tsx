import { formatCurrency } from "@/lib/utils";

type OrderStatsSummaryProps = {
  stats: {
    total: number;
    orderCount: number;
    approvedCount: number;
    rejectedCount: number;
    cancelledCount: number;
  };
};

export function OrderStatsSummary({ stats }: OrderStatsSummaryProps) {
  return (
    <div className='grid grid-cols-6 gap-3'>
      <div className='col-span-2'>
        <p className='text-xs text-muted-foreground'>Total</p>
        <p className='text-xl font-semibold'>
          {formatCurrency(stats.total)}
        </p>
      </div>
      <div className='col-span-1 text-center'>
        <p className='text-xs text-muted-foreground'>Orders</p>
        <p className='text-xl font-semibold'>{stats.orderCount}</p>
      </div>
      <div className='col-span-1 text-center'>
        <p className='text-xs text-muted-foreground'>Approved</p>
        <p className='text-xl font-semibold text-green-600'>
          {stats.approvedCount}
        </p>
      </div>
      <div className='col-span-1 text-center'>
        <p className='text-xs text-muted-foreground'>Rejected</p>
        <p className='text-xl font-semibold text-red-600'>
          {stats.rejectedCount}
        </p>
      </div>
      <div className='col-span-1 text-center'>
        <p className='text-xs text-muted-foreground'>Cancelled</p>
        <p className='text-xl font-semibold text-yellow-600'>
          {stats.cancelledCount}
        </p>
      </div>
    </div>
  );
}
