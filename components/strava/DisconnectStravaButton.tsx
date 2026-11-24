"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { disconnectStravaAction } from "@/actions/strava";
import { Button } from "@/components/ui/button";
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

export function DisconnectStravaButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    try {
      setLoading(true);
      await disconnectStravaAction();
      toast.success("Strava disconnected");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Couldn't disconnect Strava. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='outline' size='sm' disabled={loading}>
          Disconnect
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Strava?</AlertDialogTitle>
          <AlertDialogDescription>
            We&apos;ll delete your Strava activities and your place on the runs
            leaderboard, and you can be drawn as split master in every window.
            You can connect again any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDisconnect} disabled={loading}>
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
