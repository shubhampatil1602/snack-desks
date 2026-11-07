"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SnackyMark } from "@/components/snacky-mark";

type Message = { id: number; from: "me" | "snacky"; text: string; proposal?: boolean };

const STARTER: Message[] = [
  { id: 1, from: "me", text: "Who ordered the most samosas in October?" },
  { id: 2, from: "snacky", text: "Arjun, with 46. Riya is next with 21, and nobody else is close." },
];

const QUESTIONS = [
  {
    text: "Who has won the wheel most?",
    status: "Counting spin wins…",
    answer: "Kabir, with 4 wins in October. Meera and Sana have 3 each.",
  },
  {
    text: "How much did we spend at Sharma Snacks?",
    status: "Adding up spend…",
    answer: "₹9,840.00 across 18 windows in October. That’s 40% of the month.",
  },
  {
    text: "Open a tea window",
    status: "Getting the window ready…",
    answer: "Here’s the usual tea window. Open it when you’re ready.",
    proposal: true,
  },
];

// Ask Snacky's layout with scripted answers. The real page calls Gemini.
export function DemoAskSnacky() {
  const [messages, setMessages] = useState(STARTER);
  const [status, setStatus] = useState<string | null>(null);
  const [decision, setDecision] = useState<string | null>(null);
  const nextId = useRef(3);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function ask(question: (typeof QUESTIONS)[number]) {
    if (status) return;
    setMessages((current) => [
      ...current,
      { id: nextId.current++, from: "me", text: question.text },
    ]);
    setStatus(question.status);
    if (question.proposal) setDecision(null);
    timer.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: nextId.current++, from: "snacky", text: question.answer, proposal: question.proposal },
      ]);
      setStatus(null);
    }, 800);
  }

  return (
    <div className='px-4 py-5'>
      <section className='flex min-h-[34rem] flex-col border bg-card'>
        <header className='flex items-center gap-3 border-b px-4 py-2.5'>
          <SnackyMark />
          <div className='min-w-0 flex-1'>
            <p className='font-heading text-base leading-tight'>Ask Snacky</p>
            <p className='truncate text-xs text-muted-foreground'>
              Questions about orders, spend, people and the menu, or open a window
            </p>
          </div>
        </header>

        <div aria-live='polite' className='flex-1 space-y-5 p-4'>
          {messages.map((message) =>
            message.from === "me" ? (
              <div key={message.id} className='flex justify-end'>
                <p className='max-w-[80%] bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground'>
                  {message.text}
                </p>
              </div>
            ) : (
              <div key={message.id} className='flex gap-3'>
                <SnackyMark />
                <div className='min-w-0 flex-1 space-y-3 pt-0.5 text-sm'>
                  <p>{message.text}</p>
                  {message.proposal && (
                    <div className='max-w-md border bg-background'>
                      <dl className='space-y-2.5 p-3'>
                        <div>
                          <dt className='text-xs text-muted-foreground'>Label</dt>
                          <dd className='font-semibold'>Tea</dd>
                        </div>
                        <div>
                          <dt className='text-xs text-muted-foreground'>Tagline</dt>
                          <dd>Cutting chai, full gossip.</dd>
                        </div>
                        <div>
                          <dt className='text-xs text-muted-foreground'>Shops (tap to change)</dt>
                          <dd className='mt-1'>
                            <span className='border border-primary px-2 py-0.5 text-xs text-primary'>
                              Sharma Snacks
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className='text-xs text-muted-foreground'>Closes in</dt>
                          <dd>30 min</dd>
                        </div>
                      </dl>
                      <div className='flex justify-end gap-2 border-t p-2.5'>
                        {decision ? (
                          <p className='px-1 py-1 text-sm font-semibold'>{decision}</p>
                        ) : (
                          <>
                            <Button type='button' variant='outline' size='sm' onClick={() => setDecision("Cancelled. No window opened.")}>
                              Cancel
                            </Button>
                            <Button
                              type='button'
                              size='sm'
                              onClick={() => {
                                setDecision("Order window opened");
                                toast.success("Order window opened");
                              }}
                            >
                              Open window
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
          {status && <p className='pl-10 text-sm text-muted-foreground'>{status}</p>}
        </div>

        <div className='flex flex-wrap gap-2 px-4 pb-3'>
          {QUESTIONS.map((question) => (
            <button
              key={question.text}
              type='button'
              disabled={!!status}
              onClick={() => ask(question)}
              className='border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted disabled:opacity-50'
            >
              {question.text}
            </button>
          ))}
        </div>

        <div className='flex items-center gap-2 border-t py-2 pr-2 pl-4 text-sm text-muted-foreground'>
          <span className='min-w-0 flex-1 truncate'>
            Ask Snacky… e.g. “Who ordered the most samosas in October?”
          </span>
          <Button type='button' size='icon' disabled aria-label='Ask'>
            <ArrowUp />
          </Button>
        </div>
      </section>
    </div>
  );
}
