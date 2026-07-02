import { SignupForm } from "@/components/auth/AuthForms";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up — Avenue",
  description: "Create your Avenue developer account. Free to start. No credit card required.",
};

export default function SignupPage() {
  return <SignupForm />;
}
