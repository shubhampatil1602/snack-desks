import type { Metadata } from "next";
import { authIsNotRequired } from "@/actions/user";
import { ForgotPasswordForm } from "./_components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your SnackDesk account.",
};

export default async function ForgotPasswordPage() {
  await authIsNotRequired();
  return <ForgotPasswordForm />;
}
