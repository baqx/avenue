import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import FeaturesPage from "@/components/marketing/FeaturesPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features — Smart Wallets, AI Reconciliation & Agents",
  description:
    "Explore Avenue's full feature set: virtual NUBANs, AI narration reconciliation, account agents, suspense engine, signed webhooks, and a double-entry ledger.",
};

export default function Features() {
  return (
    <main>
      <Navbar />
      <FeaturesPage />
      <Footer />
    </main>
  );
}
