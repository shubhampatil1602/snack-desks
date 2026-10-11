import { prisma } from "@/lib/db";

export async function getMenuItems(organizationId: string) {
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
  return await prisma.menuCategory.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getShops(organizationId: string) {
  return await prisma.shop.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getMenuItemsSoldCounts(organizationId: string) {
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
