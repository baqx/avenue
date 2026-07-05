import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Avenue — Intelligent Wallet Infrastructure for Developers",
    template: "%s | Avenue",
  },
  description:
    "Avenue gives developers a smart API layer on top of Nomba: virtual wallets with AI reconciliation, account agents, suspense handling, and enriched webhooks.",
  keywords: ["wallet API", "fintech infrastructure", "virtual accounts", "Nigerian payments", "Nomba", "developer API"],
  openGraph: {
    title: "Avenue — Intelligent Wallet Infrastructure",
    description: "Smart wallet API with AI reconciliation, account agents, and enriched webhooks.",
    url: "https://avenue.so",
    siteName: "Avenue",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Avenue — Intelligent Wallet Infrastructure",
    description: "Smart wallet API with AI reconciliation, account agents, and enriched webhooks.",
  },
};

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
