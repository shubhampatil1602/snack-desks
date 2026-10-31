import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MAX_AGE_MS = 5000;

// Client time at which each server render (keyed by its timestamp) was first shown
const firstShownAt = new Map<number, number>();

/**
 * Live pages can be shown again from the browser cache (staleTimes) after
 * their real-time listeners were paused, so refetch when this render was
 * first shown more than a few seconds ago. Compares client times only, so
 * a skewed client clock can't cause a refresh loop.
 */
export function useRefreshWhenStale(renderedAt: number) {
  const router = useRouter();

  useEffect(() => {
    const now = Date.now();
    const shownAt = firstShownAt.get(renderedAt);

    if (shownAt === undefined) {
      firstShownAt.set(renderedAt, now);
      return;
    }

    if (now - shownAt > MAX_AGE_MS) {
      firstShownAt.delete(renderedAt);
      router.refresh();
    }
  }, [renderedAt, router]);
}
