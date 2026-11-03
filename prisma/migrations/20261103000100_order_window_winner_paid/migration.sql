-- When the spin winner says they paid the shop's bill; admin marks paid after
ALTER TABLE "order_window" ADD COLUMN IF NOT EXISTS "winnerPaidAt" TIMESTAMP(3);
