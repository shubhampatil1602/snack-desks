"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Pencil, ShoppingBag } from "lucide-react";
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
import { ShopCategory, ShopInput, shopSchema } from "@/types/menu";

interface ShopManagerProps {
  shops: ShopCategory[];
}

export function ShopManager({ shops: initial }: ShopManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [_, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShopInput>({ resolver: zodResolver(shopSchema) });

  async function onSubmit(values: ShopInput) {
    if (editingId) {
      const result = await updateShopAction(editingId, values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Shop updated");
      setEditingId(null);
      reset({ name: "", paymentUpi: "" });
      router.refresh();
    } else {
      const result = await createShopAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Shop created");
      reset({ name: "", paymentUpi: "" });
      router.refresh();
    }
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
    if (editingId === id) {
      setEditingId(null);
      reset({ name: "", paymentUpi: "" });
    }
    router.refresh();
  }

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

        <div className='space-y-6 px-6 pl-8 h-[calc(100vh-100px)] overflow-y-auto pb-10'>
          {/* Shop Form */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
            <Field>
              <FieldLabel htmlFor='name'>{editingId ? "Update Shop" : "New Shop"}</FieldLabel>
              <div className='flex flex-col gap-2'>
                <Input
                  id='name'
                  placeholder='Shop Name (e.g. Tea Stall)'
                  {...register("name")}
                />
                <Input
                  id='paymentUpi'
                  placeholder='Payment UPI (Optional)'
                  {...register("paymentUpi")}
                />
                <div className='flex gap-2 mt-1'>
                  <Button type='submit' size='sm' disabled={isSubmitting} className='flex-1'>
                    {isSubmitting ? <Spinner /> : (editingId ? "Update Shop" : "Add Shop")}
                  </Button>
                  {editingId && (
                    <Button 
                      type='button' 
                      variant='outline' 
                      size='sm' 
                      onClick={() => {
                        setEditingId(null);
                        reset({ name: "", paymentUpi: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
              <FieldError>{errors.name?.message as string}</FieldError>
              <FieldError>{errors.paymentUpi?.message as string}</FieldError>
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
                  className={`flex items-center justify-between px-3 py-2 border ${editingId === shop.id ? 'bg-muted/30 border-primary' : ''}`}
                >
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>{shop.name}</span>
                    {shop.paymentUpi && <span className='text-[10px] text-muted-foreground'>{shop.paymentUpi}</span>}
                  </div>
                  
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => {
                        setEditingId(shop.id);
                        reset({ name: shop.name, paymentUpi: shop.paymentUpi || "" });
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
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
