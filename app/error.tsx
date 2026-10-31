"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, RotateCcw, TriangleAlert } from "lucide-react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='flex h-[100dvh] w-full flex-col items-center justify-center bg-background px-4 md:px-6'>
      <div className='flex max-w-md flex-col items-center text-center space-y-6'>
        <div className='flex h-24 w-24 items-center justify-center rounded-full bg-muted'>
          <TriangleAlert className='h-12 w-12 text-muted-foreground' />
        </div>
        <div className='space-y-2'>
          <h2 className='text-2xl font-semibold tracking-tight text-foreground'>
            Something went wrong
          </h2>
          <p className='text-muted-foreground'>
            We couldn&apos;t load this page. Try again, and if it keeps
            happening, let your admin know.
          </p>
          {error.digest && (
            <p className='text-xs text-muted-foreground'>
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className='flex flex-col sm:flex-row items-center justify-center gap-3 w-full'>
          <Button
            variant='outline'
            className='w-full sm:w-auto'
            onClick={() => unstable_retry()}
          >
            <RotateCcw className='mr-2 h-4 w-4' />
            Try again
          </Button>
          <Button className='w-full sm:w-auto' asChild>
            <Link href='/'>
              <Home className='mr-2 h-4 w-4' />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
