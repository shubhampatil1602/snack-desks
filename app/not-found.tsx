"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className='flex h-[100dvh] w-full flex-col items-center justify-center bg-background px-4 md:px-6'>
      <div className='flex max-w-md flex-col items-center text-center space-y-6'>
        <div className='flex h-24 w-24 items-center justify-center rounded-full bg-muted'>
          <SearchX className='h-12 w-12 text-muted-foreground' />
        </div>
        <div className='space-y-2'>
          <h1 className='text-4xl font-extrabold tracking-tight sm:text-5xl'>
            404
          </h1>
          <h2 className='text-2xl font-semibold tracking-tight text-foreground'>
            Page not found
          </h2>
          <p className='text-muted-foreground'>
            Oops! It seems you&apos;ve wandered off the menu. The page
            you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className='flex flex-col sm:flex-row items-center justify-center gap-3 w-full'>
          <Button
            variant='outline'
            className='w-full sm:w-auto'
            onClick={() => window.history.back()}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Go Back
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
