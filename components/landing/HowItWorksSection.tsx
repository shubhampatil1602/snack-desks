import { Clock3, ShoppingCart, ClipboardCheck } from "lucide-react";

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
    <section className='py-16'>
      <div className='mx-auto max-w-7xl px-6'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-4xl font-heading'>How SnackDesk Works</h2>

          <p className='mt-4 text-muted-foreground max-w-lg mx-auto'>
            From creating an order window to collecting snacks, everything
            happens in three simple steps.
          </p>
        </div>

        <div className='relative mt-16'>
          {/* connector line */}
          <div className='absolute left-0 right-0 top-10 hidden h-px bg-border lg:block' />

          <div className='grid gap-6 lg:grid-cols-3'>
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className='relative border bg-background p-6'
                >
                  <div className='mb-5 flex items-center justify-between'>
                    <div className='flex h-12 w-12 items-center justify-center border bg-muted'>
                      <Icon className='h-5 w-5' />
                    </div>

                    <span className='text-sm font-medium text-muted-foreground'>
                      {step.number}
                    </span>
                  </div>

                  <h3 className='text-lg font-semibold'>{step.title}</h3>

                  <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
