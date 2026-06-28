import {
  Clock3,
  ShoppingCart,
  ShieldCheck,
  Zap,
  Trophy,
  Building2,
} from "lucide-react";
import { Heading, SubHeading } from "./FadeIn";

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
          <Heading className='text-4xl font-heading'>
            Everything you need to manage office snacks
          </Heading>

          <SubHeading className='mt-4 text-muted-foreground'>
            Streamlined tools for office managers and happy employees.
          </SubHeading>
        </div>

        <div className='mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className='group relative overflow-hidden border bg-background/70 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
              >
                {/* subtle top glow */}
                <div className='absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

                {/* icon */}
                <div className='mt-3 flex h-12 w-12 items-center justify-center border border-border/50 bg-muted/50 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/5'>
                  <Icon className='h-5 w-5' />
                </div>

                {/* content */}
                <div className='mt-6'>
                  <Heading
                    as='h3'
                    className='text-lg font-semibold tracking-tight'
                  >
                    {feature.title}
                  </Heading>

                  <SubHeading
                    as='h4'
                    className='mt-2 text-sm text-muted-foreground'
                  >
                    {feature.description}
                  </SubHeading>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
