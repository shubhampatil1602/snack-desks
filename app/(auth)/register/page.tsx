import type { Metadata } from "next";
import { RegisterForm } from "./_components/RegisterForm";
import { authIsNotRequired } from "@/actions/user";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join your organization on SnackDesk and start placing team snack orders.",
};

export default async function RegisterPage() {
  await authIsNotRequired();
  return <RegisterForm />;
}
