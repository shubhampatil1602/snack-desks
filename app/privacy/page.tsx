import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, Bell, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Privacy Policy | SnackDesk",
  description:
    "Learn how SnackDesk collects, uses, and safeguards your personal data when ordering team snacks.",
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className='size-3.5' />
            Data Protection & Security
          </div>
          <h1 className='text-3xl sm:text-4xl font-bold tracking-tight'>
            Privacy Policy
          </h1>
          <p className='text-sm text-muted-foreground'>
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className='prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed'>
          <section className='space-y-3'>
            <h2 className='text-xl font-semibold flex items-center gap-2 text-foreground'>
              1. Introduction
            </h2>
            <p className='text-muted-foreground'>
              Welcome to <strong>SnackDesk</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We provide an
              office snack ordering and workplace engagement platform designed for modern teams. We respect your
              privacy and are committed to protecting your personal information. This Privacy Policy describes how
              we collect, use, and share information when you use our website, web application, and associated services.
            </p>
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold flex items-center gap-2 text-foreground'>
              <Database className='size-5 text-primary' />
              2. Information We Collect
            </h2>
            <p className='text-muted-foreground'>
              We collect information to provide you with seamless group ordering, real-time tracking, and team analytics:
            </p>
            <ul className='list-disc pl-5 space-y-2 text-muted-foreground'>
              <li>
                <strong>Account Information:</strong> Your name, email address, password hash, and assigned organization.
              </li>
              <li>
                <strong>Order & Preference Data:</strong> Snack selections, item quantities, alternative replacement
                preferences, timestamps, order history, and notes.
              </li>
              <li>
                <strong>Gamification & Rankings:</strong> Spin-the-wheel participation, winning records, and team order
                milestone statistics visible to your organization members.
              </li>
              <li>
                <strong>Technical & Session Data:</strong> IP addresses, browser user-agent, session cookies, and
                anonymized interaction metrics (via Vercel Analytics and Speed Insights) to maintain service security and speed.
              </li>
            </ul>
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold flex items-center gap-2 text-foreground'>
              <Eye className='size-5 text-primary' />
              3. How We Use Your Information
            </h2>
            <p className='text-muted-foreground'>
              We process your data strictly for legitimate operational purposes:
            </p>
            <ul className='list-disc pl-5 space-y-2 text-muted-foreground'>
              <li>Facilitating scheduled snack ordering windows and order consolidation for office administrators.</li>
              <li>Displaying live status updates (pending, approved, rejected, replaced) across team members.</li>
              <li>Generating aggregate spending analytics, popularity trends, and team leaderboards for your organization.</li>
              <li>Protecting the platform against brute-force logins, spam submissions, and unauthorized access.</li>
              <li>Communicating critical service updates, order notifications, or password reset instructions.</li>
            </ul>
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold flex items-center gap-2 text-foreground'>
              <Lock className='size-5 text-primary' />
              4. Data Sharing & Security
            </h2>
            <p className='text-muted-foreground'>
              <strong>We do not sell, rent, or trade your personal information.</strong> Your data is shared only in the
              following contexts:
            </p>
            <ul className='list-disc pl-5 space-y-2 text-muted-foreground'>
              <li>
                <strong>Within Your Organization:</strong> Designated team administrators and coworkers can see order items,
                names, and window summaries to coordinate group orders.
              </li>
              <li>
                <strong>Essential Infrastructure Providers:</strong> Managed database hosts, authentication systems, and
                hosting services operating under strict data protection standards.
              </li>
              <li>
                <strong>Legal Compliance:</strong> When required by applicable law, court order, or official governmental request.
              </li>
            </ul>
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold flex items-center gap-2 text-foreground'>
              <Bell className='size-5 text-primary' />
              5. Cookies & Tracking
            </h2>
            <p className='text-muted-foreground'>
              We use strictly necessary cookies to keep you signed in securely, remember your display preferences (such as
              theme color and active reporting periods), and optional performance analytics to diagnose slow page loads. You can
              manage your preferences via our Cookie Consent banner at any time.
            </p>
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold flex items-center gap-2 text-foreground'>
              6. Your Rights & Data Retention
            </h2>
            <p className='text-muted-foreground'>
              You have the right to request access to your stored personal information, correct inaccurate profile data, or
              request account deletion through your organization administrator or by contacting our team.
            </p>
          </section>

          <section className='space-y-3 border-t pt-6'>
            <h2 className='text-xl font-semibold text-foreground'>7. Contact Us</h2>
            <p className='text-muted-foreground'>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact us at:
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
            <Link href='/terms' className='hover:underline'>
              Terms & Conditions
            </Link>
            <Link href='/privacy' className='hover:underline font-medium text-foreground'>
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
