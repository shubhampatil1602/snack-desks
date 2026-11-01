-- Optional banner line per order window; empty shows the default one
ALTER TABLE "order_window" ADD COLUMN IF NOT EXISTS "tagline" TEXT;
