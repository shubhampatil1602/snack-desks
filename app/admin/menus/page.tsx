import { requireAdmin } from "@/actions/user";
import {
  getMenuCategories,
  getMenuItems,
  getShops,
} from "@/modules/menu/queries";
import { MenuTable } from "./_components/MenuTable";
import { prisma } from "@/lib/db";
import { CategoryManager } from "./_components/CategoryManager";
import { MenuFormDialog } from "./_components/MenuFormDialog";
import { ShopManager } from "./_components/ShopManager";

export default async function MenusPage() {
  const { session } = await requireAdmin();

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  const [items, categories, shops] = member
    ? await Promise.all([
        getMenuItems(member.organizationId),
        getMenuCategories(member.organizationId),
        getShops(member.organizationId),
      ])
    : [[], [], []];

  return (
    <div className='px-4'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-heading tracking-wide'>Menus</h1>
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
    </div>
  );
}
