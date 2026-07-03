import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export function UserHistorySkeleton() {
  return (
    <div>
      {/* Filters Skeleton */}
      <div className='flex flex-wrap gap-4 mb-4 mt-6'>
        <div className='flex space-x-1'>
          <Skeleton className='h-10 w-24 rounded-none' />
          <Skeleton className='h-10 w-24 rounded-none' />
          <Skeleton className='h-10 w-32 rounded-none' />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className='border overflow-x-auto'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-[80px]'>Expand</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className='h-4 w-20' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-32' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-16' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-5 w-24 rounded-none' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-8 w-8 rounded-none' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
