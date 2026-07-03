import {
  getMenuCategories,
  getMenuItems,
  getShops,
} from "@/modules/menu/queries";
import { MenuTable } from "./MenuTable";
import { CategoryManager } from "./CategoryManager";
import { MenuFormDialog } from "./MenuFormDialog";
import { ShopManager } from "./ShopManager";

export async function MenuContentFetcher({ organizationId }: { organizationId: string }) {
  const [items, categories, shops] = await Promise.all([
    getMenuItems(organizationId),
    getMenuCategories(organizationId),
    getShops(organizationId),
  ]);

  return (
    <>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <p className='text-sm text-muted-foreground mt-1'>
            {items.length} item{items.length !== 1 ? "s" : ""} on the menu
          </p>
        </div>
        <div className='space-x-3'>
          <MenuFormDialog mode='create' categories={categories} shops={shops} />
          <CategoryManager categories={categories} />
          <ShopManager shops={shops} />
        </div>
      </div>
      <MenuTable data={items} categories={categories} shops={shops} />
    </>
  );
}
