-- DropForeignKey
ALTER TABLE "menu_item" DROP CONSTRAINT "menu_item_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "order_window" DROP CONSTRAINT "order_window_organizationId_fkey";

-- AddForeignKey
ALTER TABLE "order_window" ADD CONSTRAINT "order_window_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
