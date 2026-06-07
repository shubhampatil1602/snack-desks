import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address").trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  inviteCode: z.string().min(1, "Organization code is required"),
});

export const signInSchema = z.object({
  email: z.email("Invalid email address").trim(),
  password: z.string().min(1, "Password is required").trim(),
});

export type SignUpSchema = z.infer<typeof signUpSchema>;
export type SignInSchema = z.infer<typeof signInSchema>;

export type ActionResult<T = void> =
  | { success: true; role?: string; data?: T }
  | { success: false; error: string };
