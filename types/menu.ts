import { z } from "zod";
import { getMenuCategories, getMenuItems } from "@/modules/menu/queries";

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  unit: z.string().min(1, "Unit is required"),
  categoryId: z.string().min(1, "Category is required"),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;

export type MenuItemFormValues = {
  name: string;
  price: number;
  unit: string;
  categoryId: string;
};

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export type MenuItem = Omit<
  Awaited<ReturnType<typeof getMenuItems>>[number],
  "price"
> & { price: string };

export type MenuCategory = Awaited<
  ReturnType<typeof getMenuCategories>
>[number];
