-- Brings the migration history in line with the schema. These changes were
-- applied to production with `prisma db push`, so every statement is written
-- to be a no-op where the object already exists.

-- AlterTable
ALTER TABLE "order_window" ADD COLUMN IF NOT EXISTS "originalWinnerUserId" TEXT;

-- AlterTable
ALTER TABLE "shop" ADD COLUMN IF NOT EXISTS "isGroupOrderEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "order_item_split" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_split_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_OrderWindowToShop" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OrderWindowToShop_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "order_item_split_orderItemId_idx" ON "order_item_split"("orderItemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "order_item_split_userId_idx" ON "order_item_split"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_OrderWindowToShop_B_index" ON "_OrderWindowToShop"("B");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_split_orderItemId_fkey') THEN
    ALTER TABLE "order_item_split" ADD CONSTRAINT "order_item_split_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_split_userId_fkey') THEN
    ALTER TABLE "order_item_split" ADD CONSTRAINT "order_item_split_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_OrderWindowToShop_A_fkey') THEN
    ALTER TABLE "_OrderWindowToShop" ADD CONSTRAINT "_OrderWindowToShop_A_fkey" FOREIGN KEY ("A") REFERENCES "order_window"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_OrderWindowToShop_B_fkey') THEN
    ALTER TABLE "_OrderWindowToShop" ADD CONSTRAINT "_OrderWindowToShop_B_fkey" FOREIGN KEY ("B") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
