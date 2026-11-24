import { prisma } from "@/lib/db";
import {
  getActivity,
  getAthlete,
  listActivitiesSince,
  StravaAuthError,
  type StravaActivityJson,
} from "@/lib/strava/api";

// Keeps our copy of each connected user's Strava activities. Strava's webhook
// tells us about new, edited and deleted activities; the spin also pulls
// today's activities before it locks the leaderboard, in case a webhook
// was missed.

function toRow(userId: string, activity: StravaActivityJson) {
  return {
    userId,
    name: activity.name,
    sportType: activity.sport_type,
    startDate: new Date(activity.start_date),
    distance: activity.distance,
    movingTime: activity.moving_time,
    elapsedTime: activity.elapsed_time,
    manual: activity.manual,
  };
}

async function saveActivities(userId: string, activities: StravaActivityJson[]) {
  await prisma.$transaction(
    activities.map((activity) =>
      prisma.stravaActivity.upsert({
        where: { id: BigInt(activity.id) },
        create: { id: BigInt(activity.id), ...toRow(userId, activity) },
        update: toRow(userId, activity),
      }),
    ),
  );
}

/** Everything since `since`, for a new connection's charts or the spin's refresh. */
export async function importActivitiesSince(userId: string, since: Date) {
  try {
    const activities = await listActivitiesSince(userId, since);
    await saveActivities(userId, activities);
  } catch (e) {
    if (e instanceof StravaAuthError) {
      await removeStravaData(userId);
      return;
    }
    console.error("Strava import failed", userId, e);
  }
}

/** Fetches one activity the webhook named and stores it (or drops it if it's gone). */
export async function refreshActivity(userId: string, activityId: number) {
  try {
    const activity = await getActivity(userId, activityId);
    if (!activity) {
      await prisma.stravaActivity.deleteMany({ where: { id: BigInt(activityId) } });
      return;
    }
    await saveActivities(userId, [activity]);
  } catch (e) {
    if (e instanceof StravaAuthError) {
      await removeStravaData(userId);
      return;
    }
    console.error("Strava activity refresh failed", activityId, e);
  }
}

/**
 * Forgets everything we got from Strava for this user: tokens, activities
 * and their rows on every leaderboard (ADR 0002).
 */
export async function removeStravaData(userId: string) {
  await prisma.$transaction([
    prisma.runsLeaderboardEntry.deleteMany({ where: { userId } }),
    // activities go with the connection (cascade)
    prisma.stravaConnection.deleteMany({ where: { userId } }),
  ]);
}

/** False only when Strava says our access is gone (a webhook can't prove it). */
export async function checkStillAuthorized(userId: string) {
  try {
    await getAthlete(userId);
    return true;
  } catch (e) {
    return !(e instanceof StravaAuthError);
  }
}
