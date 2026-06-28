-- AlterTable
ALTER TABLE "menu_item" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "createdByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
