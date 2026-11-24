CREATE TABLE IF NOT EXISTS "strava_connection" (
    "userId" TEXT NOT NULL,
    "athleteId" BIGINT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strava_connection_pkey" PRIMARY KEY ("userId")
);

CREATE UNIQUE INDEX IF NOT EXISTS "strava_connection_athleteId_key" ON "strava_connection"("athleteId");

CREATE TABLE IF NOT EXISTS "strava_activity" (
    "id" BIGINT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sportType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "movingTime" INTEGER NOT NULL,
    "elapsedTime" INTEGER NOT NULL,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strava_activity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "strava_activity_userId_startDate_idx" ON "strava_activity"("userId", "startDate");

CREATE TABLE IF NOT EXISTS "runs_leaderboard_lock" (
    "organizationId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runs_leaderboard_lock_pkey" PRIMARY KEY ("organizationId", "day")
);

CREATE TABLE IF NOT EXISTS "runs_leaderboard_entry" (
    "organizationId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "movingTime" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "runs_leaderboard_entry_pkey" PRIMARY KEY ("organizationId", "day", "userId")
);

CREATE INDEX IF NOT EXISTS "runs_leaderboard_entry_userId_idx" ON "runs_leaderboard_entry"("userId");

DO $$ BEGIN
  ALTER TABLE "strava_connection" ADD CONSTRAINT "strava_connection_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "strava_activity" ADD CONSTRAINT "strava_activity_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "strava_connection"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "runs_leaderboard_lock" ADD CONSTRAINT "runs_leaderboard_lock_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "runs_leaderboard_entry" ADD CONSTRAINT "runs_leaderboard_entry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
