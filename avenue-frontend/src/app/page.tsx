import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import LandingPage from "@/components/marketing/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Avenue — Intelligent Wallet Infrastructure for Developers",
  description:
    "Avenue gives developers virtual wallets with AI-powered reconciliation, automated account agents, suspense handling, and enriched webhooks — all built on Nomba.",
};

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <LandingPage />
      <Footer />
    </main>
  );
}
