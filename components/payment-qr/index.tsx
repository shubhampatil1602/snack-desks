"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import QRCode from "react-qr-code";
import { Badge } from "../ui/badge";
import { QrCode } from "lucide-react";
import { Button } from "../ui/button";

const PAYMENT_QRS = {
  dukaan: "q836375586@ybl",
  vadapav: "9925997380@postbank",
};

export const PaymentQR = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <QrCode className='mr-2 h-4 w-4' />
          QR Code
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Payment Options</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue='dukaan' className='mt-4'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='dukaan'>Dukaan</TabsTrigger>
            <TabsTrigger value='vadapav'>Vada Pav</TabsTrigger>
          </TabsList>

          <TabsContent value='dukaan' className='mt-6'>
            <div className='flex flex-col items-center gap-4'>
              <QRCode
                value={`upi://pay?pa=${PAYMENT_QRS["dukaan"]}`}
                size={280}
                bgColor='#FFFFFF'
                fgColor='#000000'
              />
              <Badge
                variant='secondary'
                className='bg-blue-100 lowercase text-blue-800 hover:bg-blue-100 font-mono px-1 py-0.5'
              >
                {PAYMENT_QRS["dukaan"]}
              </Badge>
            </div>
          </TabsContent>

          <TabsContent value='vadapav' className='mt-6'>
            <div className='flex flex-col items-center gap-4'>
              <QRCode
                value={`upi://pay?pa=${PAYMENT_QRS["vadapav"]}`}
                size={280}
                bgColor='#FFFFFF'
                fgColor='#000000'
              />
              <Badge
                variant='secondary'
                className='bg-orange-100 lowercase text-orange-800 hover:bg-orange-100 font-mono px-1 py-0.5'
              >
                {PAYMENT_QRS["vadapav"]}
              </Badge>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
