"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { requireAdmin } from "./user";
import {
  ActionResult,
  CategoryInput,
  categorySchema,
  MenuItemInput,
  menuItemSchema,
} from "@/types/menu";

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

  await prisma.menuItem.create({
    data: {
      id: nanoid(),
      organizationId: member.organizationId,
      name: parsed.data.name.trim(),
      price: parsed.data.price,
      unit: parsed.data.unit,
      menuCategoryId: parsed.data.categoryId,
      updatedAt: new Date(),
    },
  });
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function updateMenuItemAction(
  id: string,
  input: MenuItemInput,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) {
    return { success: false, error: "Menu item not found" };
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
      menuCategoryId: parsed.data.categoryId ?? null,
    },
  });
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function deleteMenuItemAction(id: string): Promise<ActionResult> {
  await requireAdmin();

  const item = await prisma.menuItem.findUnique({ where: { id } });
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
  revalidatePath("/admin/menus");
  return { success: true };
}

export async function toggleMenuItemAvailabilityAction(
  id: string,
  isAvailable: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  await prisma.menuItem.update({
    where: { id },
    data: { isAvailable },
  });
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

  revalidatePath("/admin/menus");
  return { success: true };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  await requireAdmin();

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

  revalidatePath("/admin/menus");
  return { success: true };
}
