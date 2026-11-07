import { Heading, SubHeading } from "./FadeIn";

const STEPS = [
  { title: "Open a window", body: "Pick the shops and set a countdown. Everyone gets an alert." },
  { title: "Everyone orders", body: "Tap the menu or type to Snacky. Share an item with anyone." },
  { title: "Spin the wheel", body: "The window closes and the wheel picks who collects the order." },
  { title: "Settle up", body: "They pay the shop, and everyone else pays them their share." },
];

export function HowItWorksSection() {
  return (
    <section id='how-it-works' className='mx-auto max-w-7xl scroll-mt-20 px-4 pt-20 sm:px-6 lg:pt-28'>
      <Heading as='h2' className='text-center font-heading text-4xl md:text-6xl'>How it works</Heading>
      <ol className='mt-12 grid divide-y border bg-card sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x'>
        {STEPS.map((step, index) => (
          <li key={step.title} className='min-w-0 p-5'>
            <p className='text-xs text-muted-foreground'>Step {index + 1}</p>
            <Heading as='h3' className='mt-1 font-heading text-2xl'>{step.title}</Heading>
            <SubHeading as='p' className='mt-1.5 text-sm text-muted-foreground'>{step.body}</SubHeading>
          </li>
        ))}
      </ol>
    </section>
  );
}
