"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { bill, BILL_TOTAL } from "./sample-data";

const firstName = (name: string) => name.split(" ")[0];
const MASTER = "Kabir Verma";

// Who owes what once the wheel has picked, in sample data
export function DemoOwe() {
  const [paid, setPaid] = useState(false);
  const master = bill.find((row) => row.name === MASTER)!;
  const rows = [master, ...bill.filter((row) => row !== master)];

  return (
    <section className='border bg-card'>
      <h4 className='flex flex-wrap items-center gap-x-2 border-b px-4 py-2.5 text-sm font-semibold'>
        Evening Snacks
        <span className='text-xs font-normal text-muted-foreground'>
          7 Nov 2026 · {bill.length} orders · {formatCurrency(BILL_TOTAL)}
        </span>
      </h4>
      <ul className='divide-y text-sm'>
        {rows.map((row) => (
          <li key={row.name} className='flex items-center justify-between gap-3 px-4 py-2'>
            <span className='flex min-w-0 flex-wrap items-center gap-x-2 font-medium'>
              {firstName(row.name)}
              {row === master ? (
                <span className='flex items-center gap-1 text-[10px] font-semibold tracking-widest text-yellow-600 uppercase dark:text-yellow-400'>
                  <Trophy className='size-3' />
                  Split master
                </span>
              ) : (
                <span className='text-xs font-normal text-muted-foreground'>
                  pays {firstName(MASTER)}
                </span>
              )}
            </span>
            <span className='font-semibold tabular-nums'>{formatCurrency(row.amount)}</span>
          </li>
        ))}
      </ul>
      <div className='flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='shrink-0 bg-white p-1'>
            <QRCode value='SnackDesk sample QR' size={44} />
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-semibold'>Sharma Snacks</p>
            <p className='text-xs text-muted-foreground'>
              {firstName(MASTER)} pays {formatCurrency(BILL_TOTAL)} and gets{" "}
              {formatCurrency(BILL_TOTAL - master.amount)} back
            </p>
          </div>
        </div>
        {paid ? (
          <p role='status' className='text-sm font-semibold text-green-700 dark:text-green-400'>
            Thanks! The admin can mark it paid now.
          </p>
        ) : (
          <Button type='button' size='sm' onClick={() => setPaid(true)}>
            I paid the bill
          </Button>
        )}
      </div>
    </section>
  );
}
