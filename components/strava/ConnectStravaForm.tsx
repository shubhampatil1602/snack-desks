"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { connectStravaAction } from "@/actions/strava";

// Strava's brand orange, for the "Connect with Strava" button
const STRAVA_ORANGE = "#FC5200";

// The button stays off until they agree (Strava's API terms, ADR 0002);
// connectStravaAction checks the box again on the server.
export function ConnectStravaForm() {
  const [agreed, setAgreed] = useState(false);

  return (
    <form action={connectStravaAction} className='space-y-4'>
      <label className='flex items-start gap-3 cursor-pointer'>
        <input
          type='checkbox'
          name='consent'
          required
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className='mt-0.5 size-4 shrink-0 accent-primary cursor-pointer'
        />
        <span>
          I agree that everyone in my org can see my place on the runs
          leaderboard (distance, pace, run score and Strava photo), and that
          the spin shows my name when I sit out as the fastest runner.
        </span>
      </label>
      <ConnectButton agreed={agreed} />
    </form>
  );
}

function ConnectButton({ agreed }: { agreed: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type='submit'
      disabled={!agreed || pending}
      style={{ backgroundColor: STRAVA_ORANGE }}
      className='inline-flex h-11 items-center px-5 text-sm font-semibold text-white enabled:hover:opacity-90 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40'
    >
      {pending ? "Opening Strava..." : "Connect with Strava"}
    </button>
  );
}
