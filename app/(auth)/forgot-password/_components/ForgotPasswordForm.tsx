"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { resetPasswordAction } from "@/actions/reset-password";
import { forgotPasswordSchema, ForgotPasswordSchema } from "@/types/auth";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | undefined | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordSchema) {
    setServerError(null);
    try {
      const result = await resetPasswordAction({
        email: values.email,
        token: values.token,
        newPassword: values.newPassword,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }
      toast.success(
        "Password reset successfully! Please login with your new password.",
      );
      router.push("/login");
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-md bg-background px-6 py-7 shadow'>
        <div className='mb-4'>
          <Link href='/' className='text-base font-medium'>
            SnackDesk
          </Link>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Reset your password
          </p>
        </div>

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
            <FieldLabel htmlFor='token'>Reset Token</FieldLabel>
            <Input
              id='token'
              placeholder='Enter the reset token'
              autoComplete='off'
              className='font-mono'
              {...register("token")}
            />
            <p className='text-xs text-muted-foreground mt-1'>
              Ask the admin for the token
            </p>
            <FieldError>{errors.token?.message}</FieldError>
          </Field>

          <Field className='flex flex-col gap-0'>
            <FieldLabel htmlFor='newPassword'>New Password</FieldLabel>
            <div className='relative'>
              <Input
                id='newPassword'
                type={showPassword ? "text" : "password"}
                placeholder='Enter new password'
                autoComplete='new-password'
                className='pr-10'
                {...register("newPassword")}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </button>
            </div>
            <FieldError>{errors.newPassword?.message}</FieldError>
          </Field>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? <Spinner className='mr-2' /> : null}
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

        <p className='text-center text-sm text-muted-foreground mt-6'>
          Remember your password?{" "}
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
