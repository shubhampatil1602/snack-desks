"use client";

import { useState } from "react";
import { Trophy, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { toast } from "sonner";

import { spinWheelAction } from "@/actions/spin-wheel";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  windowId: string;
  winnerName?: string | null;
};

export function SpinWheelButton({ windowId, winnerName }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const [winner, setWinner] = useState<{
    id: string;
    name: string;
  } | null>(null);

  async function handleSpin() {
    try {
      setSpinning(true);

      const result = await spinWheelAction(windowId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      setWinner(result.winner!);

      confetti({
        particleCount: 150,
        spread: 100,
        origin: {
          y: 0.6,
        },
      });

      toast.success(
        `🏆 ${result?.winner?.name} was selected to collect the order`,
      );

      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to select winner");
    } finally {
      setSpinning(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setWinner(null);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size='sm' variant={winnerName ? "winner" : "default"}>
          {winnerName ? (
            <>
              <Trophy className='size-4 mr-2' />
              {winnerName}
            </>
          ) : (
            <>
              <Sparkles className='size-4 mr-2' />
              Spin Wheel
            </>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className='max-w-md'>
        {winnerName ? (
          <div className='py-6 text-center space-y-5'>
            <div className='flex justify-center'>
              <div className='rounded-full bg-yellow-100 dark:bg-yellow-950 p-4'>
                <Trophy className='size-10 text-yellow-500' />
              </div>
            </div>

            <div>
              <p className='text-sm text-muted-foreground'>Order Collector</p>

              <h2 className='text-3xl font-heading mt-2'>{winnerName}</h2>
            </div>

            <Badge className='text-sm px-3 py-1'>🏆 Winner</Badge>

            <p className='text-sm text-muted-foreground'>
              Selected to collect this order.
            </p>

            <Button onClick={() => setOpen(false)}>Close</Button>
          </div>
        ) : !winner ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Select Order Collector</AlertDialogTitle>

              <AlertDialogDescription>
                A random participant from this order window will be selected.
                This action can only be performed once.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className='py-10 flex justify-center'>
              {spinning ? (
                <div className='text-center space-y-4'>
                  <div className='animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto' />

                  <p className='text-sm text-muted-foreground'>
                    Spinning the wheel...
                  </p>
                </div>
              ) : (
                <div className='text-center space-y-2'>
                  <Sparkles className='size-12 mx-auto text-primary' />

                  <p className='text-sm text-muted-foreground'>
                    Ready to pick the collector
                  </p>
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={spinning}>Cancel</AlertDialogCancel>

              <AlertDialogAction
                disabled={spinning}
                onClick={(e) => {
                  e.preventDefault();
                  handleSpin();
                }}
              >
                {spinning ? "Selecting..." : "Start Spin"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <div className='py-6 text-center space-y-5'>
            <div className='flex justify-center'>
              <div className='rounded-full bg-yellow-100 dark:bg-yellow-950 p-4'>
                <Trophy className='size-10 text-yellow-500' />
              </div>
            </div>

            <div>
              <p className='text-sm text-muted-foreground'>Order Collector</p>

              <h2 className='text-3xl font-heading mt-2'>{winner.name}</h2>
            </div>

            <Badge className='text-sm px-3 py-1'>🏆 Winner</Badge>

            <p className='text-sm text-muted-foreground'>
              Selected to collect this order.
            </p>

            <Button onClick={handleClose}>Close</Button>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
