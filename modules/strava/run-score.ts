// Run Score (see CONTEXT.md, ADR 0001): a day's runs added together, scored
// as average speed (km/h) × distance (km) to the power 0.4. Running twice as
// far counts the same as running 32% faster, so a 2 km run has to beat
// 5:15/km to outscore 10 km at 10:00/km.
const DISTANCE_WEIGHT = 0.4;

// slower than 11:30/km is a walk, even when it was recorded as a Run
export const WALK_PACE_SECONDS_PER_KM = 690;

type ActivityLike = {
  sportType: string;
  manual: boolean;
  distance: number; // metres
  movingTime: number; // seconds
};

export function paceSecondsPerKm(distance: number, movingTime: number) {
  return distance > 0 ? movingTime / (distance / 1000) : Infinity;
}

/** A recorded Run at 11:30/km or faster. */
export function isScoringRun(activity: ActivityLike) {
  return (
    activity.sportType === "Run" &&
    !activity.manual &&
    activity.distance > 0 &&
    activity.movingTime > 0 &&
    paceSecondsPerKm(activity.distance, activity.movingTime) <=
      WALK_PACE_SECONDS_PER_KM
  );
}

export function runScore(distance: number, movingTime: number) {
  if (distance <= 0 || movingTime <= 0) return 0;
  const km = distance / 1000;
  const kmPerHour = km / (movingTime / 3600);
  // two decimals, so equal-looking scores are equal ties
  return Math.round(kmPerHour * Math.pow(km, DISTANCE_WEIGHT) * 100) / 100;
}

/** One person's day: their scoring runs added up, or null if they had none. */
export function scoreDay(activities: ActivityLike[]) {
  const runs = activities.filter(isScoringRun);
  if (runs.length === 0) return null;

  const distance = runs.reduce((sum, run) => sum + run.distance, 0);
  const movingTime = runs.reduce((sum, run) => sum + run.movingTime, 0);
  return { distance, movingTime, score: runScore(distance, movingTime) };
}

export function formatPace(distance: number, movingTime: number) {
  const pace = paceSecondsPerKm(distance, movingTime);
  if (!Number.isFinite(pace)) return "–";
  const minutes = Math.floor(pace / 60);
  const seconds = Math.round(pace % 60);
  return seconds === 60
    ? `${minutes + 1}:00/km`
    : `${minutes}:${String(seconds).padStart(2, "0")}/km`;
}

export function formatKm(distance: number) {
  return `${(distance / 1000).toFixed(2)} km`;
}
