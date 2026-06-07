/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,name]` on the table `menu_category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,name]` on the table `menu_item` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "menu_category_organizationId_name_key" ON "menu_category"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_organizationId_name_key" ON "menu_item"("organizationId", "name");
