import { Clock3, ShoppingCart, ClipboardCheck } from "lucide-react";
import { Heading, SubHeading } from "./FadeIn";

const steps = [
  {
    number: "01",
    title: "Create a Window",
    description:
      "Admins create snack ordering sessions with optional countdown timers and availability controls.",
    icon: Clock3,
  },
  {
    number: "02",
    title: "Employees Order",
    description:
      "Employees browse available snacks and place, update or cancel orders within seconds.",
    icon: ShoppingCart,
  },
  {
    number: "03",
    title: "Review & Fulfill",
    description:
      "Admins approve requests, export orders and coordinate fulfillment with vendors.",
    icon: ClipboardCheck,
  },
];

export function HowItWorksSection() {
  return (
    <section className='py-16' id='how-it-works'>
      <div className='mx-auto max-w-7xl px-6'>
        <div className='mx-auto max-w-2xl text-center'>
          <Heading className='text-4xl font-heading'>
            How SnackDesk Works
          </Heading>

          <SubHeading className='mt-4 text-muted-foreground max-w-lg mx-auto'>
            From creating an order window to collecting snacks, everything
            happens in three simple steps.
          </SubHeading>
        </div>

        <div className='relative mt-16'>
          {/* connector line */}
          <div className='absolute left-0 right-0 top-12 hidden h-px bg-linear-to-r from-transparent via-border to-transparent lg:block' />

          <div className='grid gap-6 lg:grid-cols-3'>
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className='group relative overflow-hidden border bg-background/70 backdrop-blur-sm p-6 transition-all duration-300 hover:border-emerald-500/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                >
                  {/* subtle top glow */}
                  <div className='absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

                  {/* step number */}
                  <span className='text-xs font-medium tracking-[0.3em] text-muted-foreground/60'>
                    {step.number}
                  </span>

                  {/* icon */}
                  <div className='mt-3 flex h-12 w-12 items-center justify-center border border-border/50 bg-muted/50 transition-all duration-300 group-hover:scale-105 group-hover:bg-emerald-500/5'>
                    <Icon className='h-5 w-5' />
                  </div>

                  {/* content */}
                  <div className='mt-6'>
                    <Heading
                      as='h3'
                      className='text-lg font-semibold tracking-tight'
                    >
                      {step.title}
                    </Heading>

                    <SubHeading
                      as='h4'
                      className='mt-2 text-sm text-muted-foreground'
                    >
                      {step.description}
                    </SubHeading>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
