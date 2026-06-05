import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className='relative overflow-hidden min-h-[80vh]'>
      {/* Grid background */}
      <div
        className='absolute inset-0 bg-size-[48px_48px] opacity-40 
        bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)]
        dark:bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)]'
      />

      <div className='relative mx-auto max-w-7xl px-6 py-40'>
        <div className='mx-auto max-w-4xl text-center'>
          <Badge variant='secondary' className='mb-6 rounded-full px-4 py-1'>
            Trusted by modern teams
          </Badge>

          <h1 className='text-balance text-5xl tracking-normal md:text-7xl font-heading'>
            Office snack ordering
            <br />
            made effortless
          </h1>

          <p className='mx-auto mt-6 max-w-2xl text-lg text-muted-foreground'>
            Create ordering windows, collect employee orders, manage approvals,
            track spending, and keep your workplace fueled - all from one
            dashboard.
          </p>

          <div className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Button size='lg'>
              <a href='#footer'>Register Your Organization</a>
            </Button>

            <Button variant='outline' size='lg'>
              See How It Works
              <ArrowRight className='ml-2 size-4' />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
