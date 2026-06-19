import { authIsNotRequired } from "@/actions/user";
import { ForgotPasswordForm } from "./_components/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  await authIsNotRequired();
  return <ForgotPasswordForm />;
}
