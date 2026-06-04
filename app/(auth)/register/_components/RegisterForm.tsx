"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signUpSchema, SignUpSchema } from "@/types/auth";
import { signUpAction } from "@/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
  });

  async function onSubmit(values: SignUpSchema) {
    setServerError(null);
    const result = await signUpAction(values);
    if (!result.success) return setServerError(result.error);
    router.push("/dashboard");
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-md bg-background px-6 py-4 shadow'>
        <div className='my-4'>
          <p className='text-base font-medium'>Snack Desk</p>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Office snack ordering, simplified
          </p>
        </div>

        <div className='flex border-b my-4'>
          <Link
            href='/login'
            className='px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            Sign in
          </Link>
          <span className='px-4 py-2 text-sm font-medium border-b-2 border-foreground -mb-px'>
            Create account
          </span>
        </div>

        {/* <h1 className='text-xl font-medium tracking-tight mb-3'>
          Join your team
        </h1> */}

        {serverError && (
          <div className='flex items-center gap-2 border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive mb-5'>
            <AlertCircle className='h-4 w-4 shrink-0' />
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <Field className='flex flex-col gap-0'>
            <FieldLabel htmlFor='inviteCode'>
              Ask your office admin for Organization code.
            </FieldLabel>
            <Input
              id='inviteCode'
              placeholder='e.g. X4K2MNQP'
              autoComplete='off'
              maxLength={8}
              className='font-mono tracking-widest uppercase'
              {...register("inviteCode")}
              onChange={(e) =>
                setValue("inviteCode", e.target.value.toUpperCase(), {
                  shouldValidate: true,
                })
              }
            />

            <FieldError>{errors.inviteCode?.message}</FieldError>
          </Field>

          <Field className='flex flex-col gap-0'>
            <FieldLabel htmlFor='name'>Full name</FieldLabel>
            <Input
              id='name'
              placeholder='John Doe'
              autoComplete='name'
              {...register("name")}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>

          <Field className='flex flex-col gap-0'>
            <FieldLabel htmlFor='email'>Work email</FieldLabel>
            <Input
              id='email'
              placeholder='john@gmail.com'
              autoComplete='email'
              {...register("email")}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>

          <Field className='flex flex-col gap-0'>
            <FieldLabel htmlFor='password'>Password</FieldLabel>
            <Input
              id='password'
              type='password'
              placeholder='Min. 8 characters'
              autoComplete='new-password'
              {...register("password")}
            />

            <FieldError>{errors.password?.message}</FieldError>
          </Field>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? <Spinner className='mr-2' /> : null}
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className='text-center text-sm text-muted-foreground mt-6'>
          Already have an account?{" "}
          <Link
            href='/login'
            className='font-medium text-foreground underline underline-offset-2'
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
