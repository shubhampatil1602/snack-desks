import { tagOrgData } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";

export async function getMenuItems(organizationId: string) {
  "use cache: remote";
  tagOrgData(organizationId, "menu");

  const items = await prisma.menuItem.findMany({
    where: { organizationId },
    include: { menuCategory: true, shop: true },

    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => ({
    ...item,
    price: item.price.toString(),
  }));
}

export async function getMenuCategories(organizationId: string) {
  "use cache: remote";
  tagOrgData(organizationId, "menu");

  return await prisma.menuCategory.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getShops(organizationId: string) {
  "use cache: remote";
  tagOrgData(organizationId, "menu");

  return await prisma.shop.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getMenuItemsSoldCounts(organizationId: string) {
  "use cache: remote";
  tagOrgData(organizationId, "orders", "menu");

  const grouped = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      replacementApplied: false,
      order: { organizationId, status: "approved" },
    },
    _sum: { quantity: true },
  });

  return new Map(
    grouped.map((row) => [row.menuItemId, row._sum.quantity ?? 0]),
  );
}

// Not cached: it's per user, small, and changes on every star tap
export async function getUserFavouriteMenuItemIds(
  organizationId: string,
  userId: string,
) {
  const favourites = await prisma.favouriteMenuItem.findMany({
    where: { userId, menuItem: { organizationId } },
    select: { menuItemId: true },
  });

  return favourites.map((favourite) => favourite.menuItemId);
}
