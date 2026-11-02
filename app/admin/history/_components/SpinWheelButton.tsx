"use client";

import { useRef, useState } from "react";
import { Trophy, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { toast } from "sonner";

import { getSpinDrawAction, spinWheelAction } from "@/actions/spin-wheel";
import type { SpinCandidate, SittingOut } from "@/modules/order-window/spin-draw";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSpinSound } from "./spin/use-spin-sound";
import { WheelSpinner } from "./spin/WheelSpinner";
import { ReelSpinner } from "./spin/ReelSpinner";

type Props = {
  windowId: string;
  winnerName?: string | null;
  hasUnspunLateOrders?: boolean;
};

type Style = "wheel" | "reel";

function getShortName(name: string) {
  const parts = name.trim().split(/\s+/);

  return parts[1] ? `${parts[0]} ${parts[1][0]}.` : parts[0];
}

export function SpinWheelButton({
  windowId,
  winnerName,
  hasUnspunLateOrders,
}: Props) {
  const router = useRouter();
  const { muted, toggleMuted, tick } = useSpinSound();

  const [open, setOpen] = useState(false);
  // who is in the draw; null while loading
  const [draw, setDraw] = useState<{
    candidates: SpinCandidate[];
    sittingOut: SittingOut[];
  } | null>(null);
  const [drawError, setDrawError] = useState<string | null>(null);
  // the style picked with the spin button; set while it spins
  const [style, setStyle] = useState<Style | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const pendingWinner = useRef<SpinCandidate | null>(null);

  const [winner, setWinner] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const spinning = style !== null;
  // the spin action refreshes the page, so winnerName can arrive before the
  // wheel stops; keep the wheel on screen until it has landed
  const showResult =
    !spinning && (winner || (!hasUnspunLateOrders && winnerName));

  async function handleSpin(picked: Style) {
    setTarget(null);
    pendingWinner.current = null;
    setStyle(picked);

    try {
      const result = await spinWheelAction(windowId);

      if (!result.success || !result.winner || !result.candidates) {
        toast.error(result.error ?? "Failed to select winner");
        setStyle(null);
        setOpen(false);
        return;
      }

      // draw from the server's list, in case someone ordered late meanwhile
      const index = result.candidates.findIndex(
        (user) => user.id === result.winner!.id,
      );
      setDraw((current) => ({
        candidates: result.candidates,
        sittingOut: current?.sittingOut ?? [],
      }));
      pendingWinner.current = result.winner;
      setTarget(index);
    } catch (error) {
      console.error(error);
      toast.error("Failed to select winner");
      setStyle(null);
    }
  }

  // the wheel or reel has stopped on the winner: celebrate there, then
  // show the winner screen once everyone has seen where it landed
  function handleSettled() {
    const picked = pendingWinner.current;
    if (!picked) return;

    setTimeout(() => {
      setWinner(picked);
      setStyle(null);
    }, 1500);

    confetti({
      particleCount: 250,
      spread: 100,
      origin: {
        y: 0.6,
      },
    });

    toast.success(`🏆 ${picked.name} was selected to collect the order`);

    router.refresh();
  }

  function handleOpenChange(next: boolean) {
    // no closing mid-spin
    if (!next && spinning) return;
    setOpen(next);
    if (!next) {
      setWinner(null);
      setTarget(null);
      return;
    }

    // load the names, unless the dialog only shows the result
    if (!hasUnspunLateOrders && winnerName) return;
    setDraw(null);
    setDrawError(null);
    getSpinDrawAction(windowId).then((result) => {
      if (result.success) {
        setDraw({ candidates: result.candidates, sittingOut: result.sittingOut });
      } else {
        setDrawError(result.error);
      }
    });
  }

  const names = draw?.candidates.map((user) => user.name) ?? [];

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          size='sm'
          variant={!hasUnspunLateOrders && winnerName ? "winner" : "default"}
        >
          {!hasUnspunLateOrders && winnerName ? (
            <>
              <Trophy className='size-4 mr-2' />
              {getShortName(winnerName)}
            </>
          ) : (
            <>
              <Sparkles className='size-4 mr-2' />
              {winnerName ? "Re-Spin Wheel" : "Spin Wheel"}
            </>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className='data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-xl'>
        {!showResult ? (
          <>
            <AlertDialogHeader>
              <div className='flex items-start justify-between gap-3'>
                <AlertDialogTitle>Select Order Collector</AlertDialogTitle>
                <button
                  type='button'
                  onClick={toggleMuted}
                  aria-label={muted ? "Turn spin sound on" : "Turn spin sound off"}
                  className='text-muted-foreground transition-colors hover:text-foreground'
                >
                  {muted ? <VolumeX className='size-4' /> : <Volume2 className='size-4' />}
                </button>
              </div>

              <AlertDialogDescription>
                A random participant from this order window will be selected.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className='flex min-h-[360px] flex-col items-center justify-center gap-4'>
              {winnerName && !spinning && (
                <div className='text-center space-y-1 bg-yellow-100/50 dark:bg-yellow-900/20 px-6 py-3 border border-yellow-200 dark:border-yellow-900/50'>
                  <p className='text-xs font-semibold text-yellow-600 dark:text-yellow-500 uppercase tracking-wider'>
                    Current Winner
                  </p>
                  <p className='text-xl font-heading text-yellow-800 dark:text-yellow-400'>
                    {winnerName}
                  </p>
                </div>
              )}

              {drawError ? (
                <p className='text-sm text-destructive'>{drawError}</p>
              ) : !draw ? (
                <p className='text-sm text-muted-foreground'>Loading names…</p>
              ) : style === "reel" ? (
                <ReelSpinner
                  names={names}
                  target={target}
                  onTick={() => tick(0.8)}
                  onSettled={handleSettled}
                />
              ) : (
                // stands still as a preview of the names until it's spun
                <WheelSpinner
                  names={names}
                  spinning={style === "wheel"}
                  target={target}
                  onTick={() => tick()}
                  onSettled={handleSettled}
                />
              )}

              {draw && draw.sittingOut.length > 0 && (
                <p className='text-center text-xs text-muted-foreground'>
                  Sitting out:{" "}
                  {draw.sittingOut
                    .map((user) => `${user.name} (${user.reason})`)
                    .join(", ")}
                </p>
              )}
            </div>

            <AlertDialogFooter className='sm:grid sm:grid-cols-3'>
              <AlertDialogCancel disabled={spinning}>Cancel</AlertDialogCancel>
              <Button
                variant='outline'
                disabled={spinning || !draw}
                onClick={() => handleSpin("reel")}
              >
                {style === "reel" ? "Rolling..." : "Roll reel"}
              </Button>
              <Button
                disabled={spinning || !draw}
                onClick={() => handleSpin("wheel")}
              >
                {style === "wheel" ? "Spinning..." : "Spin wheel"}
              </Button>
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

              <h2 className='text-3xl font-heading mt-2'>{winner?.name || winnerName}</h2>
            </div>

            <Badge className='text-sm px-3 py-1'>🏆 Winner</Badge>

            <p className='text-sm text-muted-foreground'>
              Selected to collect this order.
            </p>

            <Button onClick={() => handleOpenChange(false)}>Close</Button>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
