import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Terms & Conditions | SnackDesk",
  description:
    "Review the terms of service, acceptable use guidelines, and conditions for using the SnackDesk platform.",
};

export default function TermsAndConditionsPage() {
  const lastUpdated = "October 2026";

  return (
    <div className='min-h-screen bg-background text-foreground flex flex-col'>
      {/* Header */}
      <header className='border-b sticky top-0 z-30 bg-background/80 backdrop-blur-md'>
        <div className='max-w-5xl mx-auto px-6 h-16 flex items-center justify-between'>
          <Link href='/' className='flex items-center gap-2'>
            <Logo />
            <span className='font-semibold text-base tracking-tight'>
              SnackDesk.
            </span>
          </Link>
          <Button variant='outline' size='sm' asChild>
            <Link href='/'>
              <ArrowLeft className='mr-2 size-4' />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1 max-w-4xl mx-auto px-6 py-12 md:py-16'>
        <div className='space-y-4 mb-10'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20'>
            <FileText className='size-3.5' />
            Legal Agreement
          </div>
          <h1 className='text-3xl sm:text-4xl font-bold tracking-tight'>
            Terms & Conditions
          </h1>
          <p className='text-sm text-muted-foreground'>
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className='prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed'>
          <section className='space-y-3'>
            <h2 className='text-xl font-semibold flex items-center gap-2 text-foreground'>
              1. Acceptance of Terms
            </h2>
            <p className='text-muted-foreground'>
              By accessing or using <strong>SnackDesk</strong> (&quot;the Service&quot;), you agree to be bound by these
              Terms and Conditions (&quot;Terms&quot;). If you do not agree to all of these Terms, you may not access or
              use the Service. These Terms apply to all registered users, administrators, and organization members.
            </p>
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold flex items-center gap-2 text-foreground'>
              <CheckCircle2 className='size-5 text-primary' />
              2. Description of the Service
            </h2>
            <p className='text-muted-foreground'>
              SnackDesk provides workplace organizations with software tools to coordinate snack orders, schedule ordering
              windows, manage restaurant and store menus, consolidate group orders, and view spending statistics. The Service
              serves as an internal workflow coordination platform and is not itself a food preparer or restaurant delivery operator.
            </p>
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold flex items-center gap-2 text-foreground'>
              3. User Accounts & Organization Membership
            </h2>
            <ul className='list-disc pl-5 space-y-2 text-muted-foreground'>
              <li>
                <strong>Eligibility:</strong> You must create an account using valid credentials and join an authorized
                organization using an invite code issued by your company administrator.
              </li>
              <li>
                <strong>Account Confidentiality:</strong> You are responsible for safeguarding your password and account
                credentials. Any activity under your account is your responsibility.
              </li>
              <li>
                <strong>Administrator Authority:</strong> Organization administrators have the authority to manage members,
                open/close ordering windows, modify orders, and approve or reject order submissions.
              </li>
            </ul>
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold flex items-center gap-2 text-foreground'>
              <Scale className='size-5 text-primary' />
              4. Orders, Cancellations & Replacements
            </h2>
            <ul className='list-disc pl-5 space-y-2 text-muted-foreground'>
              <li>
                <strong>Order Windows:</strong> Orders may only be placed, edited, or cancelled while an active order window is
                open, unless an administrator places or edits an order on behalf of a user.
              </li>
              <li>
                <strong>Replacements:</strong> If an item is unavailable at the shop or vendor, administrators may apply
                your designated alternative replacement preference or adjust the item.
              </li>
              <li>
                <strong>Spin-the-Wheel & Gamification:</strong> Any promotional wheels, winner allocations, or company-sponsored
                treat privileges are subject to your organization&apos;s internal policies and discretion.
              </li>
            </ul>
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold flex items-center gap-2 text-foreground'>
              <AlertTriangle className='size-5 text-primary' />
              5. Acceptable Use & Prohibited Conduct
            </h2>
            <p className='text-muted-foreground'>You agree that you will not:</p>
            <ul className='list-disc pl-5 space-y-2 text-muted-foreground'>
              <li>Use the Service for any unlawful or unauthorized purpose.</li>
              <li>Attempt to bypass rate limits, spam server actions, or submit automated bot requests.</li>
              <li>Impersonate any person or misrepresent your affiliation with an organization.</li>
              <li>Interfere with or disrupt the integrity, availability, or security of the Service or its underlying databases.</li>
            </ul>
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold text-foreground'>
              6. Disclaimers & Limitation of Liability
            </h2>
            <p className='text-muted-foreground'>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. SnackDesk makes no representations
              or warranties regarding item availability, food allergen correctness, food preparation times, or delivery quality,
              as all items are supplied by third-party shops or vendors.
            </p>
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold text-foreground'>
              7. Changes to Terms
            </h2>
            <p className='text-muted-foreground'>
              We reserve the right to revise these Terms at any time. Significant changes will be indicated by an updated
              &quot;Last updated&quot; date at the top of this document. Continued use of the platform constitutes agreement to the updated Terms.
            </p>
          </section>

          <section className='space-y-3 border-t pt-6'>
            <h2 className='text-xl font-semibold text-foreground'>8. Contact Information</h2>
            <p className='text-muted-foreground'>
              For questions or clarifications regarding these Terms, please contact:
            </p>
            <p className='text-muted-foreground'>
              Email:{" "}
              <a
                href='mailto:shubhamspatilnbr@gmail.com'
                className='text-primary hover:underline font-medium'
              >
                shubhamspatilnbr@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className='border-t py-6 text-center text-xs text-muted-foreground bg-muted/20'>
        <div className='max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4'>
          <p>© 2026 SnackDesk. All rights reserved.</p>
          <div className='flex gap-4'>
            <Link href='/terms' className='hover:underline font-medium text-foreground'>
              Terms & Conditions
            </Link>
            <Link href='/privacy' className='hover:underline'>
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
