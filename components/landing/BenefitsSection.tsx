import { CheckCircle2 } from "lucide-react";

const benefits = [
  {
    title: "Save Time",
    description:
      "No more collecting snack orders manually through chats and spreadsheets.",
  },
  {
    title: "Better Visibility",
    description:
      "Track spending, participation and ordering patterns across your organization.",
  },
  {
    title: "Organized Ordering",
    description: "Keep every order centralized, searchable and easy to manage.",
  },
  {
    title: "Delight Employees",
    description:
      "Provide a smooth ordering experience your team will actually enjoy using.",
  },
];

export function BenefitsSection() {
  return (
    <section className='py-16'>
      <div className='mx-auto max-w-7xl px-6'>
        <div className='grid gap-12 lg:grid-cols-2 lg:items-center'>
          {/* Left */}
          <div>
            <h2 className='text-4xl font-heading'>Built for busy teams</h2>

            <p className='mt-4 text-muted-foreground'>
              SnackDesk helps organizations streamline snack ordering without
              adding more operational work.
            </p>

            <div className='mt-10 space-y-6'>
              {benefits.map((benefit) => (
                <div key={benefit.title} className='flex gap-4'>
                  <CheckCircle2 className='mt-1 h-5 w-5 text-emerald-600' />

                  <div>
                    <h3 className='font-semibold'>{benefit.title}</h3>

                    <p className='mt-1 text-sm text-muted-foreground'>
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className='border bg-background p-6 shadow-sm'>
            <div className='space-y-4'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Organization Snapshot
                </p>

                <h3 className='mt-1 text-2xl font-bold'>This Month</h3>
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='border p-4'>
                  <p className='text-sm text-muted-foreground'>Total Orders</p>

                  <p className='mt-2 text-2xl font-bold'>248</p>
                </div>

                <div className='border p-4'>
                  <p className='text-sm text-muted-foreground'>Revenue</p>

                  <p className='mt-2 text-2xl font-bold'>₹18,420</p>
                </div>

                <div className='border p-4'>
                  <p className='text-sm text-muted-foreground'>Approval Rate</p>

                  <p className='mt-2 text-2xl font-bold'>96%</p>
                </div>

                <div className='border p-4'>
                  <p className='text-sm text-muted-foreground'>
                    Active Members
                  </p>

                  <p className='mt-2 text-2xl font-bold'>42</p>
                </div>
              </div>

              <div className='border p-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    Most Popular Snack
                  </span>

                  <span className='text-sm font-medium'>Thumbs Up 🥤</span>
                </div>

                <div className='mt-4 h-3 overflow-hidden rounded-full bg-muted'>
                  <div className='h-full w-[78%] rounded-full bg-emerald-500' />
                </div>

                <p className='mt-2 text-xs text-muted-foreground'>
                  Ordered by 78% of employees this month
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
