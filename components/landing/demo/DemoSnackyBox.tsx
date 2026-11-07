"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { SnackyMark } from "@/components/snacky-mark";
import { prefersReducedMotion } from "@/app/admin/history/_components/spin/use-spin-sound";
import { cn } from "@/lib/utils";

const MENU_CHIP = "rounded-sm bg-primary/15 px-0.5 font-medium text-foreground";
const PERSON_CHIP =
  "rounded-sm bg-primary/10 px-0.5 font-medium text-foreground underline decoration-primary/40 underline-offset-2";

const TYPED = [
  { text: "2 samosas, a cold coffee or a chai if it’s out, and split a ", className: "" },
  { text: "Margherita Pizza", className: MENU_CHIP },
  { text: " with ", className: "" },
  { text: "Riya", className: PERSON_CHIP },
];
const TYPED_LENGTH = TYPED.reduce((sum, part) => sum + part.text.length, 0);

// the first `count` characters, keeping each part's chip style
function typedSoFar(count: number) {
  let left = count;
  return TYPED.map((part) => {
    const text = part.text.slice(0, Math.max(0, left));
    left -= part.text.length;
    return { ...part, text };
  }).filter((part) => part.text);
}

const LINES = [
  { quantity: 2, name: "Samosa", amount: "₹40.00" },
  { quantity: 1, name: "Cold Coffee", amount: "₹80.00", backup: "1× Masala Chai" },
  {
    quantity: 1,
    name: "Margherita Pizza",
    amount: "₹150.00",
    sharedWith: "Riya",
    shareOf: "₹300.00",
  },
];

// SnackyOrderBox's layout playing one scripted order. It's finished at rest,
// and plays once when it first comes into view.
export function DemoSnackyBox() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState<number | null>(null);
  const [thinking, setThinking] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const typer = useRef<ReturnType<typeof setInterval>>(undefined);
  const wait = useRef<ReturnType<typeof setTimeout>>(undefined);

  function play() {
    clearInterval(typer.current);
    clearTimeout(wait.current);
    setDone(null);
    setThinking(false);
    let count = 0;
    setTyped(0);
    typer.current = setInterval(() => {
      count += 1;
      setTyped(count);
      if (count < TYPED_LENGTH) return;
      clearInterval(typer.current);
      setThinking(true);
      wait.current = setTimeout(() => {
        setTyped(null);
        setThinking(false);
      }, 650);
    }, 22);
  }

  useEffect(() => {
    const element = rootRef.current;
    if (!element || prefersReducedMotion()) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        play();
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      clearInterval(typer.current);
      clearTimeout(wait.current);
    };
  }, []);

  const playing = typed !== null;

  return (
    <div ref={rootRef} className='border border-l-4 border-l-primary bg-card'>
      <div className='bg-muted/40'>
        <div className='flex items-center gap-2 px-3 pt-2 text-xs'>
          <span className='font-semibold'>Snacky</span>
          <span className='truncate text-muted-foreground'>· order, change or cancel by typing</span>
          <span className='ml-auto hidden shrink-0 items-center gap-1 text-muted-foreground sm:flex'>
            <Kbd>/</Kbd> menu
            <Kbd className='ml-1'>@</Kbd> share
          </span>
        </div>
        <div className='flex items-start gap-2 p-2 pl-3'>
          <SnackyMark className='mt-1.5 size-6' />
          <p aria-label='Example order typed to Snacky' className='min-h-[3.25rem] min-w-0 flex-1 px-1 py-1.5 text-sm whitespace-pre-wrap'>
            {typedSoFar(typed ?? TYPED_LENGTH).map((part, index) => (
              <span key={index} className={part.className}>
                {part.text}
              </span>
            ))}
            {playing && !thinking && (
              <span aria-hidden className='ml-px inline-block h-[1em] w-px animate-pulse bg-current align-[-0.12em]' />
            )}
          </p>
          <Button type='button' size='icon-sm' className='size-9' disabled={playing} onClick={play} aria-label='Ask Snacky'>
            {thinking ? <Spinner /> : <ArrowUp />}
          </Button>
        </div>
      </div>

      {/* kept in the layout while it plays, so nothing below jumps */}
      <div className={cn("border-t", playing && "invisible")}>
        <ul>
          {LINES.map((line) => (
            <li key={line.name} className='flex items-start justify-between gap-3 px-3 py-2 text-sm'>
              <div className='min-w-0'>
                <p className='truncate'>
                  <span className='font-semibold tabular-nums'>{line.quantity}×</span> {line.name}
                  <span className='ml-1.5 text-xs text-muted-foreground'>new</span>
                </p>
                {line.sharedWith && (
                  <p className='flex items-center gap-1 text-xs text-muted-foreground'>
                    <Users className='size-3 shrink-0' />
                    <span className='truncate'>Shared with {line.sharedWith}</span>
                  </p>
                )}
                {line.backup && (
                  <p className='truncate text-xs text-muted-foreground'>
                    If it runs out: {line.backup}
                  </p>
                )}
              </div>
              <p className='shrink-0 text-right tabular-nums'>
                {line.amount}
                {line.shareOf && (
                  <span className='block text-xs text-muted-foreground'>
                    your share of {line.shareOf}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
        <div className='flex flex-wrap items-center justify-end gap-2 p-3'>
          {done && (
            <p role='status' className='mr-auto text-sm font-semibold text-green-700 dark:text-green-400'>
              {done}
            </p>
          )}
          <Button type='button' variant='ghost' size='sm' onClick={play}>
            Discard
          </Button>
          <Button type='button' variant='outline' size='sm' onClick={() => setDone("Cart updated")}>
            Update cart
          </Button>
          <Button type='button' size='sm' onClick={() => setDone("Order placed")}>
            Place order · ₹270.00
          </Button>
        </div>
      </div>
    </div>
  );
}
