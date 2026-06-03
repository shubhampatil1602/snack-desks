import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className='py-16'>
      <div className='mx-auto max-w-7xl px-6'>
        <div className='relative overflow-hidden border bg-linear-to-br from-background via-background to-muted/40 px-8 py-16 text-center'>
          {/* subtle glow */}
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_60%)]' />

          <div className='relative mx-auto max-w-3xl'>
            <h2 className='text-4xl font-heading md:text-5xl'>
              Ready to simplify office snack ordering?
            </h2>

            <p className='mx-auto mt-4 max-w-xl text-lg text-muted-foreground'>
              Join organizations using SnackDesk to streamline snack requests,
              manage approvals and keep teams fueled without the chaos of
              spreadsheets and group chats.
            </p>

            <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
              <Button size='lg'>Register Your Organization</Button>

              <Button variant='outline' size='lg'>
                Contact Us
                <ArrowRight className='ml-2 size-4' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
