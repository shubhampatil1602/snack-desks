"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Plus, Pencil, X, ShoppingBag } from "lucide-react";
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
  createShopAction,
  deleteShopAction,
  updateShopAction,
} from "@/actions/menu";
import { IconCheck } from "@tabler/icons-react";
import { ShopCategory, shopSchema } from "@/types/menu";

interface ShopManagerProps {
  shops: ShopCategory[];
}

export function ShopManager({ shops: initial }: ShopManagerProps) {
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
  } = useForm({ resolver: zodResolver(shopSchema) });

  async function onSubmit(values: { name: string }) {
    const result = await createShopAction(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Shop created");
    reset();
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    setDeletingId(id);
    const result = await deleteShopAction(id);
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
    const result = await updateShopAction(id, {
      name: editingName,
    });
    setUpdatingId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Shop updated");
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
          <ShoppingBag className='h-4 w-4 mr-1' />
          Shops
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Manage Shops</SheetTitle>
        </SheetHeader>

        <div className='space-y-6 px-6 pl-8'>
          {/* Add new shop */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
            <Field>
              <FieldLabel htmlFor='name'>New shop</FieldLabel>
              <div className='flex gap-2'>
                <Input
                  id='name'
                  placeholder='e.g. Tea Stall'
                  {...register("name")}
                />
                <Button type='submit' size='sm' disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : <Plus className='h-4 w-4' />}
                </Button>
              </div>
              <FieldError>{errors.name?.message as string}</FieldError>
            </Field>
          </form>

          {/* Shop list */}
          <div className='space-y-1'>
            {initial.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                No shops yet. Create one to organize your menu items by shop.
              </p>
            ) : (
              initial.map((shop) => (
                <div
                  key={shop.id}
                  className='flex items-center justify-between px-3 py-2 border'
                >
                  {editingId === shop.id ? (
                    <Input
                      className='h-4 border-none w-3/4'
                      ref={inputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                    />
                  ) : (
                    <span className='text-sm font-medium'>{shop.name}</span>
                  )}
                  {editingId === shop.id ? (
                    <div className='flex items-center gap-2'>
                      <Button
                        size='sm'
                        onClick={() => handleUpdate(shop.id)}
                        disabled={
                          editingName.trim() === shop.name.trim() ||
                          editingName.trim().length === 0
                        }
                      >
                        {updatingId === shop.id ? (
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
                          setEditingId(shop.id);
                          setEditingName(shop.name);
                        }}
                      >
                        <Pencil className='h-3.5 w-3.5' />
                      </Button>

                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleDelete(shop.id, shop.name)}
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
