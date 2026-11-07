import type { ReactNode } from "react";

import { TopSellingItemsCard } from "@/app/admin/dashboard/_components/TopSellingItemsCard";
import { SnackyMark } from "@/components/snacky-mark";
import { VegMark } from "@/components/veg-mark";
import { formatPrice } from "@/lib/utils";
import { Heading, SubHeading } from "./FadeIn";
import { DemoOwe } from "./demo/DemoOwe";
import { DemoRoastCard } from "./demo/DemoRoastCard";
import { DemoSnackyBox } from "./demo/DemoSnackyBox";
import { DemoSpinPanel } from "./demo/DemoSpinPanel";
import { SPIN_SECTION_ID } from "./demo/use-demo-office";
import { menu, topItems } from "./demo/sample-data";

const DISH_IDS = ["samosa", "cold-coffee", "pizza"];
const dishes = menu.filter((item) => DISH_IDS.includes(item.id));

function Feature({ id, title, body, children }: { id?: string; title: string; body: string; children: ReactNode }) {
  return (
    <article id={id} className='flex min-w-0 scroll-mt-20 flex-col border bg-muted/30'>
      <div className='p-5 pb-4'>
        <Heading as='h3' className='font-heading text-3xl leading-tight'>{title}</Heading>
        <SubHeading as='p' className='mt-1.5 max-w-lg text-[0.9375rem] text-pretty text-muted-foreground'>{body}</SubHeading>
      </div>
      <div className='mt-auto space-y-3 px-5 pb-5'>{children}</div>
    </article>
  );
}

export function FeaturesSection() {
  return (
    <section id='features' className='mx-auto max-w-7xl scroll-mt-20 px-4 pt-20 sm:px-6 lg:pt-28'>
      <div className='mx-auto max-w-4xl text-center'>
        <Heading as='h2' className='font-heading text-4xl leading-tight text-balance md:text-6xl'>
          Everything around the snack break
        </Heading>
        <SubHeading as='p' className='mt-4 text-lg text-muted-foreground'>
          Ordering, splitting, paying and the monthly roast, all in one place.
        </SubHeading>
      </div>

      <div className='mt-12 grid gap-3 lg:grid-cols-2'>
        <Feature
          title='Order like you’d say it'
          body='Type it the way you’d message it. Snacky fills the cart, and nothing is ordered until you tap Place order.'
        >
          <DemoSnackyBox />
          <div className='grid grid-cols-3 gap-3'>
            {dishes.map((item) => (
              <div key={item.id} className='flex min-w-0 flex-col border bg-card'>
                <div className='relative h-28 overflow-hidden bg-muted'>
                  <div className='absolute inset-0 bg-linear-to-t from-black via-black/50 to-black/5' />
                  <p className='absolute inset-x-0 bottom-0 p-2.5 text-sm leading-tight font-semibold text-white'>
                    {item.name}
                  </p>
                  <div className='absolute top-1.5 right-1.5 flex flex-col items-end gap-1 text-[10px] font-bold tracking-wider uppercase'>
                    <VegMark isVeg={item.isVeg} />
                    {item.group && <span className='bg-emerald-600 px-1.5 py-1 text-white'>Group Split</span>}
                  </div>
                </div>
                <p className='border-t p-2.5 text-sm font-bold tabular-nums'>{formatPrice(item.price)}</p>
              </div>
            ))}
          </div>
        </Feature>

        <Feature
          title='Everyone knows what they owe'
          body='Shared items split themselves, and each person sees exactly what to pay and who to pay.'
        >
          <DemoOwe />
        </Feature>

        <Feature
          id={SPIN_SECTION_ID}
          title='One spin settles it'
          body='The wheel picks who collects the order and pays the shop. Everyone else pays them back.'
        >
          <DemoSpinPanel />
        </Feature>

        <Feature
          title='Snacky reads the numbers'
          body='Roasts, made-up awards and straight answers about what your office spends.'
        >
          <DemoRoastCard />
          <section className='space-y-3 border bg-card p-4 text-sm'>
            <p className='ml-auto w-fit bg-primary px-3 py-2 text-primary-foreground'>
              Who ordered the most samosas in October?
            </p>
            <div className='flex gap-3'>
              <SnackyMark />
              <p className='pt-1'>Arjun, with 46. Riya is next with 21, and nobody else is close.</p>
            </div>
          </section>
          <div inert>
            <TopSellingItemsCard items={topItems} />
          </div>
        </Feature>
      </div>
    </section>
  );
}
