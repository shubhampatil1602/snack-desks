import { OrderWindowContentSkeleton } from "./_components/OrderWindowSkeletons";

export default function OrderWindowLoading() {
  return (
    <div className='px-4 space-y-6 w-full'>
      <div>
        <h1 className='text-2xl font-heading tracking-wide'>Orders</h1>
        <p className='text-sm text-muted-foreground mt-1'>
          Manage order windows and live orders
        </p>
      </div>

      <OrderWindowContentSkeleton />
    </div>
  );
}
