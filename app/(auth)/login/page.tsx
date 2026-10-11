import type { Metadata } from "next";
import { LoginForm } from "./_components/LoginForm";
import { authIsNotRequired } from "@/actions/user";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your SnackDesk account to join team snack ordering.",
};

export default async function LoginPage() {
  await authIsNotRequired();
  return <LoginForm />;
}
