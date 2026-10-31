"use server";

import { expireOrgData } from "@/lib/cache-tags";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { getCurrentMember, requireAdmin } from "./user";
import {
  ActionResult,
  CategoryInput,
  categorySchema,
  MenuItemInput,
  menuItemSchema,
  ShopInput,
  shopSchema,
} from "@/types/menu";

// Category and shop must belong to the admin's org
async function validateMenuReferences(
  organizationId: string,
  categoryId: string,
  shopId: string,
): Promise<string | null> {
  const [category, shop] = await Promise.all([
    prisma.menuCategory.findFirst({
      where: { id: categoryId, organizationId },
      select: { id: true },
    }),
    prisma.shop.findFirst({
      where: { id: shopId, organizationId },
      select: { id: true },
    }),
  ]);

  if (!category) return "Category not found";
  if (!shop) return "Shop not found";
  return null;
}

export async function createMenuItemAction(
  input: MenuItemInput,
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const existingItem = await prisma.menuItem.findFirst({
    where: {
      organizationId: member.organizationId,
      name: {
        equals: parsed.data.name.trim(),
        mode: "insensitive",
      },
    },
  });

  if (existingItem) {
    return {
      success: false,
      error: "Menu item name must be unique.",
    };
  }

  const referenceError = await validateMenuReferences(
    member.organizationId,
    parsed.data.categoryId,
    parsed.data.shopId,
  );
  if (referenceError) {
    return { success: false, error: referenceError };
  }

  await prisma.menuItem.create({
    data: {
      id: nanoid(),
      organizationId: member.organizationId,
      name: parsed.data.name.trim(),
      price: parsed.data.price,
      unit: parsed.data.unit,
      menuCategoryId: parsed.data.categoryId,
      updatedAt: new Date(),
      shopId: parsed.data.shopId,
      imageUrl: parsed.data.imageUrl || null,
    },
  });
  expireOrgData(member.organizationId, "menu");
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function updateMenuItemAction(
  id: string,
  input: MenuItemInput,
): Promise<ActionResult> {
  const { member } = await requireAdmin();

  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const item = await prisma.menuItem.findFirst({
    where: { id, organizationId: member.organizationId },
  });
  if (!item) {
    return { success: false, error: "Menu item not found" };
  }

  const referenceError = await validateMenuReferences(
    member.organizationId,
    parsed.data.categoryId,
    parsed.data.shopId,
  );
  if (referenceError) {
    return { success: false, error: referenceError };
  }
  const duplicateItem = await prisma.menuItem.findFirst({
    where: {
      organizationId: item.organizationId,
      id: {
        not: id,
      },
      name: {
        equals: parsed.data.name.trim(),
        mode: "insensitive",
      },
    },
  });
  if (duplicateItem) {
    return {
      success: false,
      error: "An item with this name already exists in your menu.",
    };
  }
  await prisma.menuItem.update({
    where: { id },
    data: {
      name: parsed.data.name.trim(),
      price: parsed.data.price,
      unit: parsed.data.unit,
      menuCategoryId: parsed.data.categoryId,
      shopId: parsed.data.shopId,
      imageUrl: parsed.data.imageUrl || null,
    },
  });
  expireOrgData(member.organizationId, "menu");
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function deleteMenuItemAction(id: string): Promise<ActionResult> {
  const { member } = await requireAdmin();

  const item = await prisma.menuItem.findFirst({
    where: { id, organizationId: member.organizationId },
  });
  if (!item) {
    return { success: false, error: "Menu item not found" };
  }

  // check if item has order history — use Restrict behavior
  const hasOrders = await prisma.orderItem.findFirst({
    where: { menuItemId: id },
  });

  if (hasOrders) {
    return {
      success: false,
      error:
        "Cannot delete item with order history. Mark it as unavailable instead.",
    };
  }

  await prisma.menuItem.delete({ where: { id } });
  expireOrgData(member.organizationId, "menu");
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function toggleMenuItemAvailabilityAction(
  id: string,
  isAvailable: boolean,
): Promise<ActionResult> {
  const { member } = await requireAdmin();

  const result = await prisma.menuItem.updateMany({
    where: { id, organizationId: member.organizationId },
    data: { isAvailable },
  });
  if (result.count === 0) {
    return { success: false, error: "Menu item not found" };
  }
  expireOrgData(member.organizationId, "menu");
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function createCategoryAction(
  input: CategoryInput,
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const existingCategory = await prisma.menuCategory.findFirst({
    where: {
      organizationId: member.organizationId,
      name: {
        equals: parsed.data.name.trim(),
        mode: "insensitive",
      },
    },
  });

  if (existingCategory) {
    return {
      success: false,
      error: "Category already exists",
    };
  }

  await prisma.menuCategory.create({
    data: {
      id: nanoid(),
      organizationId: member.organizationId,
      name: parsed.data.name.trim(),
    },
  });

  expireOrgData(member.organizationId, "menu");
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const { member } = await requireAdmin();

  const category = await prisma.menuCategory.findFirst({
    where: { id, organizationId: member.organizationId },
  });
  if (!category) {
    return { success: false, error: "Category not found" };
  }

  // check if category has items
  const itemCount = await prisma.menuItem.count({
    where: { menuCategoryId: id },
  });

  if (itemCount > 0) {
    return {
      success: false,
      error: `Cannot delete category with ${itemCount} item${itemCount !== 1 ? "s" : ""}. Reassign or delete items first.`,
    };
  }

  await prisma.menuCategory.delete({ where: { id } });

  expireOrgData(member.organizationId, "menu");
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function updateCategoryAction(
  id: string,
  input: CategoryInput,
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message ?? "Invalid input" };
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const existingCategory = await prisma.menuCategory.findFirst({
    where: {
      organizationId: member.organizationId,
      id: {
        not: id,
      },
      name: {
        equals: parsed.data.name.trim(),
        mode: "insensitive",
      },
    },
  });

  if (existingCategory) {
    return {
      success: false,
      error: "Category already exists",
    };
  }

  const result = await prisma.menuCategory.updateMany({
    where: {
      id,
      organizationId: member.organizationId,
    },
    data: {
      name: parsed.data.name.trim(),
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      error: "Category not found",
    };
  }

  expireOrgData(member.organizationId, "menu");
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function createShopAction(
  input: ShopInput,
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  const parsed = shopSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const existingShop = await prisma.shop.findFirst({
    where: {
      organizationId: member.organizationId,
      name: {
        equals: parsed.data.name.trim(),
        mode: "insensitive",
      },
    },
  });

  if (existingShop) {
    return {
      success: false,
      error: "Shop already exists",
    };
  }

  await prisma.shop.create({
    data: {
      id: nanoid(),
      organizationId: member.organizationId,
      name: parsed.data.name.trim(),
      paymentUpi: parsed.data.paymentUpi?.trim() || null,
      isGroupOrderEnabled: parsed.data.isGroupOrderEnabled ?? false,
    },
  });

  expireOrgData(member.organizationId, "menu");
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function deleteShopAction(id: string): Promise<ActionResult> {
  const { member } = await requireAdmin();

  const shop = await prisma.shop.findFirst({
    where: { id, organizationId: member.organizationId },
  });
  if (!shop) {
    return { success: false, error: "Shop not found" };
  }

  // check if shop has items
  const itemCount = await prisma.menuItem.count({
    where: { shopId: id },
  });

  if (itemCount > 0) {
    return {
      success: false,
      error: `Cannot delete shop with ${itemCount} item${itemCount !== 1 ? "s" : ""}. Reassign or delete items first.`,
    };
  }

  await prisma.shop.delete({ where: { id } });

  expireOrgData(member.organizationId, "menu");
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function updateShopAction(
  id: string,
  input: ShopInput,
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  const parsed = shopSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message ?? "Invalid input" };
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const existingShop = await prisma.shop.findFirst({
    where: {
      organizationId: member.organizationId,
      id: {
        not: id,
      },
      name: {
        equals: parsed.data.name.trim(),
        mode: "insensitive",
      },
    },
  });

  if (existingShop) {
    return {
      success: false,
      error: "Shop already exists",
    };
  }

  const result = await prisma.shop.updateMany({
    where: {
      id,
      organizationId: member.organizationId,
    },
    data: {
      name: parsed.data.name.trim(),
      paymentUpi: parsed.data.paymentUpi?.trim() || null,
      isGroupOrderEnabled: parsed.data.isGroupOrderEnabled ?? false,
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      error: "Shop not found",
    };
  }

  expireOrgData(member.organizationId, "menu");
  revalidatePath("/admin/menus");
  return { success: true };
}

// Any member can star items from their own org's menu
export async function toggleFavouriteMenuItemAction(
  menuItemId: string,
  isFavourite: boolean,
): Promise<ActionResult> {
  const member = await getCurrentMember();

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuItemId, organizationId: member.organizationId },
    select: { id: true },
  });

  if (!menuItem) {
    return { success: false, error: "Menu item not found" };
  }

  const key = { userId: member.userId, menuItemId };

  if (isFavourite === true) {
    await prisma.favouriteMenuItem.upsert({
      where: { userId_menuItemId: key },
      create: key,
      update: {},
    });
  } else {
    await prisma.favouriteMenuItem.deleteMany({ where: key });
  }

  revalidatePath("/order-window");
  return { success: true };
}
