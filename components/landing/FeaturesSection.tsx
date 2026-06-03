import {
  Clock3,
  ShoppingCart,
  ShieldCheck,
  Zap,
  Trophy,
  Building2,
} from "lucide-react";

const features = [
  {
    icon: Clock3,
    title: "Create Order Windows",
    description: "Open snack ordering windows with optional countdown timers.",
  },
  {
    icon: ShoppingCart,
    title: "Employee Ordering",
    description:
      "Employees can place, update or cancel snack orders in seconds.",
  },
  {
    icon: ShieldCheck,
    title: "Approval Workflow",
    description: "Admins can approve or reject orders before fulfillment.",
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    description: "Instant updates across the platform using live events.",
  },
  {
    icon: Trophy,
    title: "Analytics & Rankings",
    description: "Track spending, top snacks and employee rankings.",
  },
  {
    icon: Building2,
    title: "Organization Management",
    description:
      "Invite teammates using organization codes and manage access centrally.",
  },
];

export function FeaturesSection() {
  return (
    <section id='features' className='py-16'>
      <div className='mx-auto max-w-7xl px-6'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-4xl font-heading'>
            Everything you need to manage office snacks
          </h2>

          <p className='mt-4 text-muted-foreground'>
            Streamlined tools for office managers and happy employees.
          </p>
        </div>

        <div className='mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className='group border bg-background p-6 transition-all hover:shadow-md'
              >
                <div className='mb-4 flex h-10 w-10 items-center justify-center border bg-muted'>
                  <Icon className='h-5 w-5' />
                </div>

                <h3 className='font-semibold'>{feature.title}</h3>

                <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
