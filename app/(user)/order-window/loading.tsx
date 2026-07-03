import { OrderWindowSkeleton } from "./_components/OrderWindowSkeletons";

export default function OrderWindowLoading() {
  return (
    <div className='px-4 space-y-6'>
      <OrderWindowSkeleton />
    </div>
  );
}
