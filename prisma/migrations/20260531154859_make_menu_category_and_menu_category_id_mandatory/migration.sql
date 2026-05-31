/*
  Warnings:

  - Made the column `menuCategoryId` on table `menu_item` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "menu_item" DROP CONSTRAINT "menu_item_menuCategoryId_fkey";

-- AlterTable
ALTER TABLE "menu_item" ALTER COLUMN "menuCategoryId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_menuCategoryId_fkey" FOREIGN KEY ("menuCategoryId") REFERENCES "menu_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
