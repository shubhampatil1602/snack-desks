"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { createMenuItemAction, updateMenuItemAction } from "@/actions/menu";
import { menuItemSchema as schema } from "@/types/menu";
import type {
  MenuCategory,
  MenuItem,
  MenuItemFormValues,
  MenuItemInput,
  ShopCategory,
} from "@/types/menu";

const UNITS = ["plate", "piece", "rs"];

interface MenuFormDialogProps {
  mode: "create" | "edit";
  item?: MenuItem;
  categories: MenuCategory[];
  shops: ShopCategory[];
}

export function MenuFormDialog({
  mode,
  item,
  categories,
  shops,
}: MenuFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(schema) as Resolver<MenuItemFormValues>,
    defaultValues: {
      name: "",
      price: 0,
      unit: "",
      categoryId: "",
      shopId: "",
      imageUrl: "",
    },
  });

  const unitValue = useWatch({ control, name: "unit" });
  const categoryValue = useWatch({ control, name: "categoryId" });
  const shopValue = useWatch({ control, name: "shopId" });

  const handleOpenChange = (open: boolean) => {
    if (open) {
      if (mode === "edit" && item) {
        reset({
          name: item.name,
          price: Number(item.price),
          unit: item.unit,
          categoryId: item.menuCategoryId ?? "",
          shopId: item.shopId ?? "",
          imageUrl: item.imageUrl ?? "",
        });
      } else {
        reset({
          name: "",
          price: 0,
          unit: "",
          categoryId: "",
          shopId: "",
          imageUrl: "",
        });
      }
    }
    setOpen(open);
  };

  async function onSubmit(values: MenuItemFormValues) {
    const isFormDirty = Object.keys(dirtyFields).length > 0;

    if (mode === "edit" && !isFormDirty) {
      setOpen(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: MenuItemInput = {
        name: values.name,
        price: values.price,
        unit: values.unit,
        categoryId: values.categoryId,
        shopId: values.shopId || null,
        imageUrl: values.imageUrl || null,
      };

      const result =
        mode === "create"
          ? await createMenuItemAction(submitData)
          : await updateMenuItemAction(item!.id, submitData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "create" ? "Item added to menu" : "Menu item updated",
      );

      setOpen(false);
      reset();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleClearShop = () => {
    setValue("shopId", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button size='sm'>
            <Plus className='h-4 w-4 mr-1' />
            Add item
          </Button>
        ) : (
          <Button variant='ghost' size='icon' className='h-8 w-8'>
            <Pencil className='h-4 w-4' />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add menu item" : "Edit menu item"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 mt-2'>
          <Field>
            <FieldLabel htmlFor='name'>Item name</FieldLabel>
            <Input
              id='name'
              placeholder='Vada Pav'
              {...register("name")}
              disabled={isSubmitting}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor='imageUrl'>Image URL (Optional)</FieldLabel>
            <Input
              id='imageUrl'
              placeholder='https://example.com/image.jpg'
              {...register("imageUrl")}
              disabled={isSubmitting}
            />
            <FieldError>{errors.imageUrl?.message}</FieldError>
          </Field>

          <div className='grid grid-cols-2 gap-4'>
            <Field>
              <FieldLabel htmlFor='price'>Price (₹)</FieldLabel>
              <Input
                id='price'
                type='number'
                step='0.01'
                placeholder='20'
                {...register("price")}
                disabled={isSubmitting}
              />
              <FieldError>{errors.price?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor='unit'>Unit</FieldLabel>
              <Select
                value={unitValue}
                onValueChange={(val) =>
                  setValue("unit", val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id='unit'>
                  <SelectValue placeholder='Select unit' />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.unit?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor='category'>Category</FieldLabel>
              <Select
                value={categoryValue}
                onValueChange={(val) =>
                  setValue("categoryId", val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id='category'>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.categoryId?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor='shop'>Shop</FieldLabel>
              <div className='relative'>
                <Select
                  value={shopValue}
                  onValueChange={(val) =>
                    setValue("shopId", val, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id='shop' className={shopValue ? "pr-16" : ""}>
                    <SelectValue placeholder='Select shop (optional)' />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {shopValue && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClearShop();
                    }}
                    className='absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted rounded-md z-10'
                  >
                    <X className='h-4 w-4 text-muted-foreground' />
                  </Button>
                )}
              </div>
              <FieldError>{errors.shopId?.message}</FieldError>
            </Field>
          </div>

          <div className='flex justify-end gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={
                isSubmitting ||
                (mode === "edit" && Object.keys(dirtyFields).length === 0)
              }
            >
              {isSubmitting ? <Spinner className='mr-2' /> : null}
              {mode === "create" ? "Add item" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
