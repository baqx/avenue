import { LoginForm } from "@/components/auth/AuthForms";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in — Avenue",
  description: "Log in to your Avenue developer account.",
};

export default function LoginPage() {
  return <LoginForm />;
}
