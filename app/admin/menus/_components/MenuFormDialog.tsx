"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil } from "lucide-react";
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
} from "@/types/menu";

const UNITS = ["plate", "piece", "rs"];

interface MenuFormDialogProps {
  mode: "create" | "edit";
  item?: MenuItem;
  categories: MenuCategory[];
}

export function MenuFormDialog({
  mode,
  item,
  categories,
}: MenuFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(schema) as Resolver<MenuItemFormValues>,
    defaultValues:
      mode === "edit" && item
        ? {
            name: item.name,
            price: Number(item.price),
            unit: item.unit,
            categoryId: item.menuCategoryId ?? "",
          }
        : { name: "", price: 0, unit: "", categoryId: "" },
  });

  const unitValue = useWatch({ control, name: "unit" });
  const categoryValue = useWatch({ control, name: "categoryId" });

  async function onSubmit(values: MenuItemInput) {
    if (mode === "edit" && !isDirty) {
      setOpen(false);
      return;
    }
    const result =
      mode === "create"
        ? await createMenuItemAction(values)
        : await updateMenuItemAction(item!.id, values);

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
  }

  function handleOpenChange(open: boolean) {
    if (open && mode === "edit" && item) {
      reset({
        name: item.name,
        price: Number(item.price),
        unit: item.unit,
        categoryId: item.menuCategoryId ?? "",
      });
    }
    if (!open) {
      reset({ name: "", price: 0, unit: "", categoryId: "" });
    }
    setOpen(open);
  }

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
            <Input id='name' placeholder='Vada Pav' {...register("name")} />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>

          <div className='grid grid-cols-2 gap-4'>
            <Field>
              <FieldLabel htmlFor='price'>Price (₹)</FieldLabel>
              <Input
                id='price'
                type='number'
                placeholder='20'
                {...register("price")}
              />
              <FieldError>{errors.price?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor='unit'>Unit</FieldLabel>
              <Select
                value={unitValue}
                onValueChange={(val) =>
                  setValue("unit", val, { shouldValidate: true })
                }
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
                  setValue("categoryId", !val ? "" : val, {
                    shouldValidate: true,
                  })
                }
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
          </div>

          <div className='flex justify-end gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || (mode === "edit" && !isDirty)}
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
