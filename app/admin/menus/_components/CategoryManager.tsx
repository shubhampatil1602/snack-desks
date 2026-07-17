"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings2, Trash2, Plus, Pencil, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/actions/menu";
import type { MenuCategory } from "@/types/menu";
import { IconCheck } from "@tabler/icons-react";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(30, "Category name is too long"),
});

interface CategoryManagerProps {
  categories: MenuCategory[];
}

export function CategoryManager({ categories: initial }: CategoryManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [_, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values: { name: string }) {
    const result = await createCategoryAction(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Category created");
    reset();
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    setDeletingId(id);
    const result = await deleteCategoryAction(id);
    setDeletingId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`${name} deleted`);
    router.refresh();
  }

  async function handleUpdate(id: string) {
    setUpdatingId(id);
    const result = await updateCategoryAction(id, {
      name: editingName,
    });
    setUpdatingId(null);
    if (!result.success) {
      toast.error("Category name must be atleast of 2 characters!");
      return;
    }

    toast.success("Category updated");
    setEditingId(null);
    router.refresh();
  }

  useEffect(() => {
    if (editingId) {
      inputRef.current?.focus();
    }
  }, [editingId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='outline' size='sm'>
          <Settings2 className='h-4 w-4 mr-1' />
          Categories
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Manage Categories</SheetTitle>
        </SheetHeader>

        <div className='space-y-6 px-6 pl-8 h-[calc(100vh-100px)] overflow-y-auto pb-10'>
          {/* Add new category */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
            <Field>
              <FieldLabel htmlFor='name'>New category</FieldLabel>
              <div className='flex gap-2'>
                <Input
                  id='name'
                  placeholder='e.g. Drinks'
                  {...register("name")}
                />
                <Button type='submit' size='sm' disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : <Plus className='h-4 w-4' />}
                </Button>
              </div>
              <FieldError>{errors.name?.message as string}</FieldError>
            </Field>
          </form>

          {/* Category list */}
          <div className='space-y-1'>
            {initial.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                No categories yet.
              </p>
            ) : (
              initial.map((cat) => (
                <div
                  key={cat.id}
                  className='flex items-center justify-between px-3 py-2 border'
                >
                  {editingId === cat.id ? (
                    <Input
                      className='h-4 border-none w-3/4'
                      ref={inputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                    />
                  ) : (
                    <span className='text-sm font-medium'>{cat.name}</span>
                  )}
                  {editingId === cat.id ? (
                    <div className='flex items-center gap-2'>
                      <Button
                        size='sm'
                        onClick={() => handleUpdate(cat.id)}
                        disabled={
                          editingName.trim() === cat.name.trim() ||
                          editingName.trim().length === 0
                        }
                      >
                        {updatingId === cat.id ? (
                          <Spinner />
                        ) : (
                          <IconCheck stroke={2} />
                        )}
                      </Button>

                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                      >
                        <X className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  ) : (
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                      >
                        <Pencil className='h-3.5 w-3.5' />
                      </Button>

                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleDelete(cat.id, cat.name)}
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
