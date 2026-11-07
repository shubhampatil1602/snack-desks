import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DemoApp } from "./demo/DemoApp";
import { FadeInBlock, Heading, SubHeading } from "./FadeIn";
import { GET_STARTED_MAILTO } from "./links";

export function HeroSection() {
  return (
    <section className='relative overflow-hidden'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:50px_50px] opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent)]'
      />
      <div className='relative mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:pt-28'>
        <div className='mx-auto max-w-4xl text-center'>
          <Heading className='font-heading text-5xl leading-[1.04] text-balance md:text-8xl'>
            Office snacks, without the group chat
          </Heading>
          <SubHeading as='p' className='mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground'>
            Open an order window. Everyone orders by tapping or typing. Shared
            items split themselves, and a spin decides who pays the shop.
          </SubHeading>
          <div className='mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Button size='lg' asChild>
              <Link href={GET_STARTED_MAILTO}>Email us to get started</Link>
            </Button>
            <Button variant='outline' size='lg' asChild>
              <Link href='#how-it-works'>
                See how it works
                <ArrowRight className='ml-2 size-4' />
              </Link>
            </Button>
          </div>
        </div>

        <FadeInBlock>
          <div id='dashboard' className='mt-14 scroll-mt-20 border bg-muted/30 p-2 lg:mt-18'>
            <DemoApp />
          </div>
        </FadeInBlock>
        <p className='mt-3 text-center text-xs text-muted-foreground'>
          This is a sample office. Switch between the admin and user views, ask
          Snacky a question or spin the wheel further down.
        </p>
      </div>
    </section>
  );
}
