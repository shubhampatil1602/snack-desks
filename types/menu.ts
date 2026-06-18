import { z } from "zod";
import {
  getMenuCategories,
  getMenuItems,
  getShops,
} from "@/modules/menu/queries";

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  unit: z.string().min(1, "Unit is required"),
  categoryId: z.string().min(1, "Category is required"),
  shopId: z.string().optional().nullable(),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;

export type MenuItemFormValues = {
  name: string;
  price: number;
  unit: string;
  categoryId: string;
  shopId: string;
};

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(30, "Category name is too long"),
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

export const shopSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Shop name is required")
    .max(30, "Shop name is too long"),
});

export type ShopInput = z.infer<typeof shopSchema>;

export type ShopCategory = Awaited<ReturnType<typeof getShops>>[number];
