-- Snacky summaries per person as well as per org
ALTER TABLE "snacky_summary" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'org';

ALTER TABLE "snacky_summary" DROP CONSTRAINT "snacky_summary_pkey";
ALTER TABLE "snacky_summary" ADD CONSTRAINT "snacky_summary_pkey" PRIMARY KEY ("organizationId", "period", "scope");
