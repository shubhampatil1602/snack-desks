"use client";

import { useState } from "react";
import { FileDown, Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Calendar } from "@/components/ui/calendar";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Label } from "@/components/ui/label";

type Format = "csv" | "excel";

export function ExportOrdersDialog() {
  const [from, setFrom] = useState<Date>();
  const [to, setTo] = useState<Date>();
  const [format, setFormat] = useState<Format>("csv");

  function setToday() {
    const now = new Date();

    setFrom(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    setTo(now);
  }

  function setThisWeek() {
    const now = new Date();

    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());

    setFrom(start);
    setTo(now);
  }

  function setThisMonth() {
    const now = new Date();

    setFrom(new Date(now.getFullYear(), now.getMonth(), 1));
    setTo(now);
  }

  function handleExport() {
    if (!from || !to) return;

    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });

    window.open(`/api/export-orders?${params}`, "_blank");
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <FileDown className='mr-2 h-4 w-4' />
          Export Orders
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Export Orders</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Quick Range */}
          <div className='space-y-3'>
            <Label>Quick Range</Label>

            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' size='sm' onClick={setToday}>
                Today
              </Button>

              <Button variant='outline' size='sm' onClick={setThisWeek}>
                This Week
              </Button>

              <Button variant='outline' size='sm' onClick={setThisMonth}>
                This Month
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className='space-y-3'>
            <Label>Date Range</Label>

            <div className='grid grid-cols-2 gap-3'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='justify-start'>
                    <CalendarIcon className='mr-2 h-4 w-4' />

                    {from ? from.toLocaleDateString() : "From Date"}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className='w-auto p-0'>
                  <Calendar mode='single' selected={from} onSelect={setFrom} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='justify-start'>
                    <CalendarIcon className='mr-2 h-4 w-4' />

                    {to ? to.toLocaleDateString() : "To Date"}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className='w-auto p-0'>
                  <Calendar mode='single' selected={to} onSelect={setTo} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Format */}
          <div className='space-y-3'>
            <Label>Format</Label>

            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as Format)}
            >
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='csv' id='csv' />
                <Label htmlFor='csv'>CSV</Label>
              </div>

              <div className='flex items-center space-x-2 opacity-50'>
                <RadioGroupItem value='excel' id='excel' disabled />
                <Label htmlFor='excel'>Excel (Coming Soon)</Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            className='w-full'
            onClick={handleExport}
            disabled={!from || !to}
          >
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
