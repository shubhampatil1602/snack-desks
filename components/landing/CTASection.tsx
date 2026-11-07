import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Heading, SubHeading } from "./FadeIn";
import { GET_STARTED_MAILTO } from "./links";

export function CTASection() {
  return (
    <section className='mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:pt-28'>
      <div className='border bg-card px-6 py-14 text-center lg:py-20'>
        <Heading as='h2' className='font-heading text-4xl text-balance md:text-6xl'>Ready when your office is</Heading>
        <SubHeading as='p' className='mt-4 text-lg text-muted-foreground'>
          Tell us about your office and we&apos;ll set it up for you.
        </SubHeading>
        <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Button size='lg' asChild>
            <Link href={GET_STARTED_MAILTO}>Email us to get started</Link>
          </Button>
          <Button variant='outline' size='lg' asChild>
            <Link href='/register'>Join with a code</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
