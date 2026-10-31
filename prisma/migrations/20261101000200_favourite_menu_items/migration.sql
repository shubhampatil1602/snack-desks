-- Favourites moved from orders to menu items
ALTER TABLE "order" DROP COLUMN IF EXISTS "isFavourite";

-- CreateTable
CREATE TABLE "favourite_menu_item" (
    "userId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favourite_menu_item_pkey" PRIMARY KEY ("userId","menuItemId")
);

-- CreateIndex
CREATE INDEX "favourite_menu_item_menuItemId_idx" ON "favourite_menu_item"("menuItemId");

-- AddForeignKey
ALTER TABLE "favourite_menu_item" ADD CONSTRAINT "favourite_menu_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favourite_menu_item" ADD CONSTRAINT "favourite_menu_item_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
