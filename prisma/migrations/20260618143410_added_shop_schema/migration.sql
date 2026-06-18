-- AlterTable
ALTER TABLE "menu_item" ADD COLUMN     "shopId" TEXT;

-- CreateTable
CREATE TABLE "shop" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_organizationId_idx" ON "shop"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "shop_organizationId_name_key" ON "shop"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop" ADD CONSTRAINT "shop_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
