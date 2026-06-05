import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { BgGradient } from "./client-components";

export function HeroSection() {
  return (
    <section className='relative overflow-hidden min-h-[80vh]'>
      {/* Grid background */}
      <BgGradient />

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
