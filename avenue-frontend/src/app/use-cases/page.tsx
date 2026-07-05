import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import UseCasesPage from "@/components/marketing/UseCasesPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Use Cases — Avenue",
  description:
    "See how Avenue powers tuition collection, property management, crowdfunding, freelancer escrow, and personal smart wallets — all with one clean API.",
};

export default function UseCasesRoute() {
  return (
    <main>
      <Navbar />
      <UseCasesPage />
      <Footer />
    </main>
  );
}
