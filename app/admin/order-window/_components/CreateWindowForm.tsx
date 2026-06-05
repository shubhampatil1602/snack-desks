"use client";

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
import { createWindowAction } from "@/actions/order-window";

const schema = z.object({
  label: z.string().min(1, "Label is required"),
  hasDuration: z.boolean().default(false),
  duration: z.coerce.number().min(1).optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateWindowForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      label: "",
      hasDuration: false,
      duration: 15,
    },
  });

  const { field: hasDurationField } = useController({
    control,
    name: "hasDuration",
  });

  async function onSubmit(values: FormValues) {
    const result = await createWindowAction({
      label: values.label,
      duration: values.hasDuration ? values.duration : undefined,
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

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 max-w-sm'>
        <Field>
          <FieldLabel htmlFor='label'>Window label</FieldLabel>
          <Input
            id='label'
            placeholder='Tea, Lunch, Evening...'
            {...register("label")}
          />
          <FieldDescription>
            This helps users know which session they&apos;re ordering for
          </FieldDescription>
          <FieldError>{errors.label?.message}</FieldError>
        </Field>

        <div className='flex items-center justify-between py-1'>
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
          <Field>
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
