"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signInSchema, SignInSchema } from "@/types/auth";
import { signInAction } from "@/actions/auth";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { authSession } from "@/actions/user";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
  });

  async function onSubmit(values: SignInSchema) {
    setServerError(null);
    const result = await signInAction(values);
    if (!result.success) return setServerError(result.error);
    toast.success("Welcome back");
    const session = await authSession();
    if (session?.user.role === "super_admin")
      router.push("/super-admin/dashboard");
    else if (session?.user.role === "admin") router.push("/admin/dashboard");
    else router.push("/dashboard");
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-md bg-background/60 px-6 py-7 shadow'>
        <div className='mb-4'>
          <Link href='/' className='text-base font-medium'>
            Snack Desk
          </Link>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Office snack ordering, simplified
          </p>
        </div>

        <div className='flex border-b mb-4'>
          <span className='px-4 py-2 text-sm font-medium border-b-2 border-foreground -mb-px'>
            Sign in
          </span>
          <Link
            href='/register'
            className='px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            Create account
          </Link>
        </div>

        {/* <h1 className='text-xl font-medium tracking-tight mb-1'>
          Welcome back
        </h1>
        <p className='text-sm text-muted-foreground mb-6'>
          Sign in to your office account
        </p> */}

        {serverError && (
          <div className='flex items-center gap-2 border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive mb-5'>
            <AlertCircle className='h-4 w-4 shrink-0' />
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <Field className='flex flex-col gap-0'>
            <FieldLabel htmlFor='email'>Email</FieldLabel>
            <Input
              id='email'
              placeholder='user@gmail.com'
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
              placeholder='••••••••'
              autoComplete='current-password'
              {...register("password")}
            />
            <FieldError>{errors.password?.message}</FieldError>
          </Field>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? <Spinner className='mr-2' /> : null}
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className='text-center text-sm text-muted-foreground mt-6'>
          New here?{" "}
          <Link
            href='/register'
            className='font-medium text-foreground underline underline-offset-2'
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
