-- Veg / non-veg mark on menu items. The default marks every existing item as
-- veg; set the non-veg ones from the admin menu.
ALTER TABLE "menu_item" ADD COLUMN IF NOT EXISTS "isVeg" BOOLEAN NOT NULL DEFAULT true;
