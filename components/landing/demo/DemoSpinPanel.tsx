"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy } from "lucide-react";

import { WheelSpinner } from "@/app/admin/history/_components/spin/WheelSpinner";
import { Button } from "@/components/ui/button";
import { bill } from "./sample-data";
import { useDemoOffice } from "./use-demo-office";

const NAMES = bill.map((row) => row.name);
const noop = () => {};

// The real wheel on the page itself, picking in the browser
export function DemoSpinPanel() {
  const [spinning, setSpinning] = useState(false);
  const [target, setTarget] = useState<number | null>(null);
  const winner = useDemoOffice((office) => office.winner);
  const setWinner = useDemoOffice((office) => office.setWinner);
  // a new key gives the next spin a fresh wheel, without the last highlight
  const [round, setRound] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function spin() {
    const index = Math.floor(Math.random() * NAMES.length);
    setWinner(null);
    setTarget(null);
    setRound((current) => current + 1);
    setSpinning(true);
    timer.current = setTimeout(() => setTarget(index), 400);
  }

  function settled() {
    setSpinning(false);
    setWinner(target === null ? null : NAMES[target]);
  }

  return (
    <section className='space-y-4 border bg-card p-5'>
      <div>
        <h4 className='font-semibold'>Select Order Collector</h4>
        <p className='mt-1 text-sm text-muted-foreground'>
          A random participant from this order window will be selected.
        </p>
      </div>
      <div className='px-6'>
        <WheelSpinner key={round} names={NAMES} spinning={spinning} target={target} onTick={noop} onSettled={settled} />
      </div>
      <p aria-live='polite' className='flex min-h-6 items-center justify-center gap-1.5 text-sm font-medium'>
        {winner && (
          <>
            <Trophy className='size-4 text-yellow-500' />
            {winner} collects this order
          </>
        )}
      </p>
      <Button type='button' className='w-full' disabled={spinning} onClick={spin}>
        {spinning ? "Spinning..." : winner ? "Spin again" : "Spin wheel"}
      </Button>
    </section>
  );
}
