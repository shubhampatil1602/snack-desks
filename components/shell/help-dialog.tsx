"use client";

import Link from "next/link";
import { Building2, ChefHat, LifeBuoy, ShoppingBag, Sparkles, Wallet } from "lucide-react";

import { SectionDialog, SectionHeading, type DialogSection } from "@/components/shell/section-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Kbd } from "@/components/ui/kbd";

const SUPPORT_EMAIL = "shubhamspatilnbr@gmail.com";

type Faq = { q: string; a: React.ReactNode };

function Faqs({ title, hint, items }: { title: string; hint: string; items: Faq[] }) {
  return (
    <>
      <SectionHeading title={title} hint={hint} />
      <Accordion type='single' collapsible className='-mt-2'>
        {items.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger className='text-sm'>{item.q}</AccordionTrigger>
            <AccordionContent className='text-sm text-muted-foreground'>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}

const ORDERING: Faq[] = [
  {
    q: "How do I order?",
    a: "When your admin opens an order window, go to Order Window, add items and place the order from the cart before the countdown ends.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "Yes, from the cart, while the window is open. Once the shop has swapped in your backups it can't be changed.",
  },
  {
    q: "What are backups?",
    a: "Items you'd take if one runs out. Add them under an item in the cart; the admin swaps them in only if needed.",
  },
  {
    q: "How does sharing an item work?",
    a: "Items from shops that take group orders can be shared with teammates. Everyone on it pays price × quantity ÷ people.",
  },
  {
    q: "Any shortcuts?",
    a: (
      <>
        On Order Window, press <Kbd>/</Kbd> to jump to search.
      </>
    ),
  },
];

const SNACKY_USER: Faq[] = [
  {
    q: "What can Snacky do on Order Window?",
    a: "Type your order in plain words (\"2 samosas and a chai\"). Snacky can add, remove or change quantities, share items, add backups, mark favourites and cancel. Nothing changes until you tap.",
  },
  {
    q: "What do / and @ do?",
    a: (
      <>
        <Kbd>/</Kbd> picks an item from the menu, <Kbd>@</Kbd> tags a teammate to share with (only when the window has
        group-order items). Click a picked name to swap it.
      </>
    ),
  },
];

const PAYING: Faq[] = [
  {
    q: "Who pays the shop?",
    a: "When the window closes, a spin wheel picks a split master from everyone who ordered or shares an item. They pay the shop.",
  },
  {
    q: "I won the spin. What now?",
    a: "Pay the shop, then tap \"I paid the bill\" on that window in History. The admin can mark the window paid only after that.",
  },
  {
    q: "Where do I see what I owe?",
    a: "History shows each window with your share, including split items.",
  },
];

const WINDOWS: Faq[] = [
  {
    q: "How do I run an order window?",
    a: "Open one from Order Window with a label, a countdown and the shops to order from. Approve or reject orders as they come in; it closes when the countdown ends or when you close it.",
  },
  {
    q: "How does marking a window paid work?",
    a: "After the spin, the winner taps \"I paid the bill\" in their History. Only then can you mark the window paid. If the winner leaves the window, you get a fresh spin.",
  },
  {
    q: "How do new people join?",
    a: "Share your organization's invite code from Users. They sign up and enter it.",
  },
];

const MENUS: Faq[] = [
  {
    q: "How do I add shops and items?",
    a: "In Menus, add a shop, then its items with prices. Prices are read live, so a change affects open orders too.",
  },
  {
    q: "How do I let people share items?",
    a: "Turn on group orders for the shop. Only items from those shops can be split.",
  },
  {
    q: "What is a shop description for?",
    a: "Snacky reads it alongside the shop's menu, so a line like \"half and full plates\" helps it pick the right item.",
  },
];

const SNACKY_ADMIN: Faq[] = [
  {
    q: "What can Ask Snacky do?",
    a: "Answer questions about spending, orders and people, suggest what to order, and open, close or delete windows. It always asks first; reply yes or no, or tap the card.",
  },
  {
    q: "Snacky says it hit a limit",
    a: "It runs on Google's free AI tier. Wait a minute and try again.",
  },
];

const ORGS: Faq[] = [
  {
    q: "How do I add an organization?",
    a: "Use Create Organization, then share its invite code with the first admin.",
  },
  {
    q: "Where do I manage existing ones?",
    a: "Manage Organizations lists every organization with its invite code and members.",
  },
];

function Contact() {
  return (
    <>
      <SectionHeading title='Contact' hint="Stuck, found a bug or have an idea? We'd love to hear it." />
      <div className='space-y-4 text-sm'>
        <a href={`mailto:${SUPPORT_EMAIL}`} className='block border p-4 hover:bg-muted'>
          <p className='font-medium'>Email support</p>
          <p className='text-xs text-muted-foreground'>{SUPPORT_EMAIL}</p>
        </a>
        <div className='flex gap-4 text-xs text-muted-foreground'>
          <Link href='/terms' className='hover:text-foreground'>
            Terms
          </Link>
          <Link href='/privacy' className='hover:text-foreground'>
            Privacy
          </Link>
        </div>
      </div>
    </>
  );
}

const contact: DialogSection = { id: "contact", label: "Contact", icon: LifeBuoy, render: () => <Contact /> };

const SECTIONS: Record<"user" | "admin" | "super-admin", DialogSection[]> = {
  user: [
    { id: "ordering", label: "Ordering", icon: ShoppingBag, render: () => <Faqs title='Ordering' hint='Placing, changing and sharing orders.' items={ORDERING} /> },
    { id: "snacky", label: "Snacky", icon: Sparkles, render: () => <Faqs title='Snacky' hint='Order by typing.' items={SNACKY_USER} /> },
    { id: "paying", label: "Paying", icon: Wallet, render: () => <Faqs title='Paying' hint='The spin wheel and the bill.' items={PAYING} /> },
    contact,
  ],
  admin: [
    { id: "windows", label: "Order windows", icon: ShoppingBag, render: () => <Faqs title='Order windows' hint='Opening, approving and settling up.' items={WINDOWS} /> },
    { id: "menus", label: "Menus", icon: ChefHat, render: () => <Faqs title='Menus' hint='Shops, items and group orders.' items={MENUS} /> },
    { id: "snacky", label: "Ask Snacky", icon: Sparkles, render: () => <Faqs title='Ask Snacky' hint='Your AI helper.' items={SNACKY_ADMIN} /> },
    contact,
  ],
  "super-admin": [
    { id: "orgs", label: "Organizations", icon: Building2, render: () => <Faqs title='Organizations' hint='Running the platform.' items={ORGS} /> },
    contact,
  ],
};

// the window behind the sidebar's Get Help button, with help for each role
export function HelpDialog({ role }: { role: "user" | "admin" | "super-admin" }) {
  return <SectionDialog name='help' title='Help' description='How SnackDesk works' sections={SECTIONS[role]} />;
}
