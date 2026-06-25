-- AlterTable
ALTER TABLE "order_item" ADD COLUMN     "originalOrderItemId" TEXT,
ADD COLUMN     "replacementApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replacementAppliedAt" TIMESTAMP(3),
ADD COLUMN     "replacementAppliedById" TEXT;

-- CreateTable
CREATE TABLE "order_item_replacement" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_replacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_item_replacement_orderItemId_idx" ON "order_item_replacement"("orderItemId");

-- CreateIndex
CREATE INDEX "order_item_replacement_menuItemId_idx" ON "order_item_replacement"("menuItemId");

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_replacementAppliedById_fkey" FOREIGN KEY ("replacementAppliedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_originalOrderItemId_fkey" FOREIGN KEY ("originalOrderItemId") REFERENCES "order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_replacement" ADD CONSTRAINT "order_item_replacement_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_replacement" ADD CONSTRAINT "order_item_replacement_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
