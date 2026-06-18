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
  Kirana: "q836375586@ybl",
  Nashta: "9925997380@postbank",
};

export const PaymentQR = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <QrCode className='mr-2 h-4 w-4' />
          Payment QR
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Payment Options</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue='Kirana' className='mt-4'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='Kirana'>Kirana</TabsTrigger>
            <TabsTrigger value='Nashta'>Nashta</TabsTrigger>
          </TabsList>

          <TabsContent value='Kirana' className='mt-6'>
            <div className='flex flex-col items-center gap-4'>
              <QRCode
                value={`upi://pay?pa=${PAYMENT_QRS["Kirana"]}`}
                size={280}
                bgColor='#FFFFFF'
                fgColor='#000000'
                className='p-8 bg-white'
              />
              <Badge
                variant='secondary'
                className='bg-blue-100 lowercase text-blue-800 hover:bg-blue-100 font-mono px-1 py-0.5'
              >
                {PAYMENT_QRS["Kirana"]}
              </Badge>
            </div>
          </TabsContent>

          <TabsContent value='Nashta' className='mt-6'>
            <div className='flex flex-col items-center gap-4'>
              <QRCode
                value={`upi://pay?pa=${PAYMENT_QRS["Nashta"]}`}
                size={280}
                bgColor='#FFFFFF'
                fgColor='#000000'
                className='p-8 bg-white'
              />
              <Badge
                variant='secondary'
                className='bg-orange-100 lowercase text-orange-800 hover:bg-orange-100 font-mono px-1 py-0.5'
              >
                {PAYMENT_QRS["Nashta"]}
              </Badge>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
