"use client";

import { useState } from "react";
import { useController, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles } from "lucide-react";
import { createWindowAction } from "@/actions/order-window";
import { suggestWindowNameAction } from "@/actions/snacky";
import { DEFAULT_WINDOW_TAGLINE } from "@/lib/constants";
import type { Shop } from "@/lib/generated/prisma/client";

const schema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Label is required")
    .max(25, "Backxhodi mat kar bhai..."),
  tagline: z
    .string()
    .trim()
    .max(120, "Keep the tagline under 120 characters")
    .optional(),
  hasDuration: z.boolean().default(false),
  duration: z.coerce.number().min(1).optional(),
  shopIds: z.array(z.string()).min(1, "Select at least one shop"),
});

type FormValues = z.infer<typeof schema>;

export function CreateWindowForm({ shops }: { shops: Shop[] }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      label: "",
      tagline: "",
      hasDuration: false,
      duration: 15,
      shopIds: [],
    },
  });

  const { field: hasDurationField } = useController({
    control,
    name: "hasDuration",
  });

  const { field: shopIdsField } = useController({
    control,
    name: "shopIds",
  });

  const [suggesting, setSuggesting] = useState(false);

  // Snacky fills in a label, tagline and the usual shops; the admin can
  // still change all three
  async function suggestName() {
    setSuggesting(true);
    const result = await suggestWindowNameAction({
      label: getValues("label"),
      tagline: getValues("tagline"),
    });
    setSuggesting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setValue("label", result.data.label, { shouldValidate: true });
    setValue("tagline", result.data.tagline);
    if (result.data.shopIds.length > 0) {
      setValue("shopIds", result.data.shopIds, { shouldValidate: true });
    }
  }

  async function onSubmit(values: FormValues) {
    const result = await createWindowAction({
      label: values.label.trim(),
      tagline: values.tagline?.trim() || undefined,
      duration: values.hasDuration ? values.duration : undefined,
      shopIds: values.shopIds,
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Order window opened");
    router.refresh();
  }

  return (
    <div className='border bg-card p-4'>
      <h2 className='text-base font-medium mb-1'>Open Order Window</h2>
      <p className='text-sm text-muted-foreground mb-5'>
        Once opened, users in your org can start placing orders.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 w-full'>
        <Field className='max-w-sm'>
          <FieldLabel htmlFor='label'>Window label</FieldLabel>
          <div className='flex gap-2'>
            <Input
              id='label'
              placeholder='Tea, Lunch, Evening...'
              className='border-input px-3 focus-visible:border-ring'
              {...register("label")}
            />
            <Button
              type='button'
              onClick={suggestName}
              disabled={suggesting}
              title='Snacky suggests a label and tagline'
              className='h-10'
            >
              {suggesting ? <Spinner /> : <Sparkles />}
              Suggest
            </Button>
          </div>
          <FieldDescription>
            This helps users know which session they&apos;re ordering for
          </FieldDescription>
          <FieldError>{errors.label?.message}</FieldError>
        </Field>

        <Field className='max-w-xl'>
          <FieldLabel htmlFor='tagline'>Tagline (optional)</FieldLabel>
          <Input
            id='tagline'
            placeholder={DEFAULT_WINDOW_TAGLINE}
            maxLength={120}
            {...register("tagline")}
          />
          <FieldDescription>
            Shown at the top of the order window. Leave it empty for the usual
            line.
          </FieldDescription>
          <FieldError>{errors.tagline?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel>Available Shops</FieldLabel>
          <div className='grid grid-cols-2 sm:grid-cols-8 gap-2 mt-2'>
            {shops.length > 0 && (
              <label className='flex items-center gap-2 cursor-pointer'>
                <Checkbox
                  checked={shopIdsField.value?.length === shops.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      shopIdsField.onChange(shops.map((s) => s.id));
                    } else {
                      shopIdsField.onChange([]);
                    }
                  }}
                />
                <span className='text-sm font-medium leading-none'>
                  Select All
                </span>
              </label>
            )}
            {shops.map((shop) => (
              <label
                key={shop.id}
                className='flex items-center gap-2 cursor-pointer'
              >
                <Checkbox
                  checked={shopIdsField.value?.includes(shop.id)}
                  onCheckedChange={(checked) => {
                    const current = shopIdsField.value || [];
                    if (checked) {
                      shopIdsField.onChange([...current, shop.id]);
                    } else {
                      shopIdsField.onChange(
                        current.filter((id) => id !== shop.id),
                      );
                    }
                  }}
                />
                <span className='text-sm font-medium leading-none'>
                  {shop.name}
                </span>
              </label>
            ))}
          </div>
          {shops.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              No shops available. Create one first.
            </p>
          )}
          <FieldError>{errors.shopIds?.message}</FieldError>
        </Field>

        <div className='flex items-center justify-between py-1 max-w-sm'>
          <div>
            <p className='text-sm font-medium'>Set a timer</p>
            <p className='text-xs text-muted-foreground'>
              Window closes automatically when timer expires
            </p>
          </div>
          <Switch
            checked={hasDurationField.value}
            onCheckedChange={hasDurationField.onChange}
          />
        </div>

        {hasDurationField.value && (
          <Field className='max-w-sm'>
            <FieldLabel htmlFor='duration'>Duration (minutes)</FieldLabel>
            <Input
              id='duration'
              type='number'
              placeholder='15'
              min={1}
              {...register("duration")}
            />
            <FieldError>{errors.duration?.message}</FieldError>
          </Field>
        )}

        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? <Spinner className='mr-2' /> : null}
          Open Window
        </Button>
      </form>
    </div>
  );
}
