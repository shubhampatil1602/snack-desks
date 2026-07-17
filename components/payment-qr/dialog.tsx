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

type PaymentQRDialogProps = {
  shops: { id: string; name: string; paymentUpi: string | null }[];
};

export const PaymentQRDialog = ({ shops }: PaymentQRDialogProps) => {
  if (!shops || shops.length === 0) return null;

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

        <Tabs defaultValue={shops[0].id} className='mt-4'>
          <TabsList className='flex w-full flex-wrap h-auto'>
            {shops.map((shop) => (
              <TabsTrigger key={shop.id} value={shop.id} className='flex-1'>
                {shop.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {shops.map((shop) => (
            <TabsContent key={shop.id} value={shop.id} className='mt-6'>
              <div className='flex flex-col items-center gap-4'>
                <QRCode
                  value={`upi://pay?pa=${shop.paymentUpi}`}
                  size={280}
                  bgColor='#FFFFFF'
                  fgColor='#000000'
                  className='p-8 bg-white shadow-sm border'
                />
                <Badge
                  variant='secondary'
                  className='bg-blue-100 lowercase text-blue-800 hover:bg-blue-100 font-mono px-2 py-1'
                >
                  {shop.paymentUpi}
                </Badge>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
