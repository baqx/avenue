"use client";

import { useEffect, useState } from "react";
import {
  Wallet, Robot, GitFork, Shield, WebhooksLogo, Database,
  Check, X as XIcon, Sparkle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

// ── Feature deep-dives data ────────────────────────────────────────────────
const FEATURES = [
  {
    id: "virtual-wallets",
    icon: Wallet,
    title: "Virtual Wallets & NUBANs",
    desc: "Create a dedicated NUBAN virtual account for every one of your users with a single API call. Avenue provisions the account on Nomba and stores it in a double-entry ledger, ready to receive money immediately.",
    points: [
      "Unique NUBAN per user (0-prefix bank account)",
      "Instant provisioning via Nomba API",
      "Status management: ACTIVE, FROZEN, CLOSED",
      "AI system_prompt per wallet for context-aware reconciliation",
    ],
    visual: "wallet",
  },
  {
    id: "ai-engine",
    icon: Robot,
    title: "AI Reconciliation Engine",
    desc: "Avenue passes every raw bank narration through GPT-4o with your wallet's custom context. The engine returns a structured intent object you can use directly in your product logic.",
    points: [
      "Extracts payment intent from unstructured narrations",
      "0–1 confidence score on every transaction",
      "Flags: UNDERPAYMENT · MISDIRECTION · UNCLEAR_INTENT",
      "Suggested label for statement display",
    ],
    visual: "ai",
  },
  {
    id: "agents",
    icon: GitFork,
    title: "Account Agents",
    desc: "Attach trigger-action rules to any wallet. When a condition is met, Avenue executes the action automatically — sweeping funds, locking the wallet, or dispatching a notification webhook.",
    points: [
      "Triggers: BALANCE_ABOVE, BALANCE_BELOW, ON_CREDIT",
      "Actions: SWEEP, PARTIAL_SWEEP, LOCK_WALLET, WEBHOOK_NOTIFY",
      "Full execution log for every agent fire",
    ],
    visual: "agents",
  },
  {
    id: "suspense",
    icon: Shield,
    title: "Suspense Engine",
    desc: "Not all payments arrive cleanly. Avenue's suspense engine catches every anomalous payment — misdirected, arriving on a closed wallet, or rejected by AI — and holds it safely until you resolve it.",
    points: [
      "Reasons: WALLET_CLOSED · AI_LOW_CONFIDENCE · NO_WALLET_FOUND",
      "Full raw Nomba payload preserved for resolution",
      "Developer-facing queue in the dashboard",
    ],
    visual: "suspense",
  },
  {
    id: "webhooks",
    icon: WebhooksLogo,
    title: "Enriched Webhooks",
    desc: "Avenue doesn't just relay Nomba's raw events. It wraps them in a clean, versioned payload with the AI intelligence output, wallet context, and a cryptographic signature your app can verify.",
    points: [
      "HMAC-SHA256 signed payloads",
      "Versioned API format (api_version field)",
      "Exponential backoff retry (5 attempts)",
    ],
    visual: "webhooks",
  },
  {
    id: "ledger",
    icon: Database,
    title: "Double-entry Ledger",
    desc: "Every debit and credit is an immutable ledger entry. Balances are always computed — never stored as a mutable field. This guarantees mathematical correctness and a full audit trail forever.",
    points: [
      "Append-only immutable entries",
      "Amounts stored in kobo (no float errors)",
      "DB-level idempotency via unique nomba_reference",
    ],
    visual: "ledger",
  },
];

// ── Feature visual components ──────────────────────────────────────────────
function FeatureVisual({ type }: { type: string }) {
  if (type === "ai") {
    const scores = [0.94, 0.87, 0.31, 0.76];
    const labels = ["School fees - SS2 term 2", "Rent deposit - Ade A.", "Unknown narration text", "Market payment John"];
    return (
      <div className="bg-[#022c22] p-8 border-2 border-[#10b981] space-y-4">
        <p className="text-sm font-bold font-mono text-[#10b981] mb-6">avenue_intelligence output</p>
        {scores.map((score, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm text-white font-medium truncate mb-2">{labels[i]}</div>
              <div className="h-2 bg-[#064e3b]">
                <div className="h-full" style={{ width: `${score * 100}%`, background: score > 0.75 ? "#10b981" : "#ef4444" }} />
              </div>
            </div>
            <span className={`text-sm font-mono font-bold shrink-0 ${score > 0.75 ? "text-[#10b981]" : "text-red-400"}`}>{score.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "suspense") {
    const items = [
      { reason: "WALLET_CLOSED",        amount: "₦45,000", status: "PENDING" },
      { reason: "AI_LOW_CONFIDENCE",     amount: "₦12,000", status: "PENDING" },
      { reason: "NO_WALLET_FOUND",       amount: "₦8,500",  status: "RESOLVED" },
    ];
    return (
      <div className="bg-white p-8 border-2 border-[#022c22] shadow-[8px_8px_0px_0px_#022c22]">
        <p className="text-sm font-bold font-mono text-[#022c22] mb-6">Suspense queue</p>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-2 border-[#022c22] bg-[#f0fdf4]">
              <div>
                <p className="text-sm font-bold font-mono text-[#022c22]">{item.reason}</p>
                <p className="text-sm text-[#022c22] font-medium mt-1">{item.amount}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 ${item.status === "PENDING" ? "bg-amber-100 text-amber-700 border border-amber-300" : "bg-[#10b981] text-[#022c22]"}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "wallet") {
    return (
      <div className="bg-white p-8 border-2 border-[#022c22] shadow-[8px_8px_0px_0px_#10b981]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm font-bold font-mono text-[#022c22] mb-1">NUBAN GENERATED</p>
            <p className="text-2xl font-bold text-[#022c22] tracking-tighter">1122334455</p>
          </div>
          <span className="bg-[#f0fdf4] text-[#10b981] border border-[#10b981] px-2 py-1 text-xs font-bold uppercase">Active</span>
        </div>
        <div className="space-y-3 font-mono text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-[#6a6c6c]">Bank</span><span className="text-[#022c22] font-semibold">Nomba MFB</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-[#6a6c6c]">Account Name</span><span className="text-[#022c22] font-semibold">Zenith Pay / user_987</span>
          </div>
          <div className="flex justify-between pb-2">
            <span className="text-[#6a6c6c]">Balance</span><span className="text-[#022c22] font-semibold">₦0.00</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "agents") {
    return (
      <div className="bg-white p-6 border-2 border-[#022c22] shadow-[8px_8px_0px_0px_#10b981]">
        <p className="text-sm font-bold font-mono text-[#022c22] mb-6">AGENT: Auto-Sweep</p>
        <div className="flex items-center justify-between bg-[#f7f9fb] p-4 border border-[#e4e7e9] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 flex items-center justify-center border border-amber-200">
              <span className="text-amber-700 font-bold text-xs">IF</span>
            </div>
            <span className="text-sm font-semibold text-[#022c22]">Balance {'>'} ₦50,000</span>
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <div className="w-0.5 h-6 bg-[#022c22]" />
        </div>
        <div className="flex items-center justify-between bg-[#022c22] p-4 border border-[#022c22]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#10b981] flex items-center justify-center">
              <span className="text-[#022c22] font-bold text-xs">THEN</span>
            </div>
            <span className="text-sm font-semibold text-white">Sweep 100% to Master Wallet</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "webhooks") {
    return (
      <div className="bg-[#022c22] p-6 border-2 border-[#10b981]">
        <p className="text-sm font-bold font-mono text-[#10b981] mb-4">webhook_payload.json</p>
        <pre className="text-xs sm:text-sm font-mono text-[#6ee7b7] overflow-x-auto">
{`{
  "event": "ledger.credit",
  "api_version": "2024-06-15",
  "data": {
    "wallet_id": "wal_abc123",
    "amount": 150000,
    "ai_intent": {
      "confidence": 0.94,
      "label": "School Fees",
      "flags": []
    },
    "signature": "hmac_sha256_..."
  }
}`}
        </pre>
      </div>
    );
  }

  if (type === "ledger") {
    return (
      <div className="bg-white p-6 border-2 border-[#022c22] shadow-[8px_8px_0px_0px_#10b981]">
        <p className="text-sm font-bold font-mono text-[#022c22] mb-4">Immutable Ledger</p>
        <table className="w-full text-left text-sm font-mono">
          <thead>
            <tr className="border-b-2 border-[#022c22]">
              <th className="py-2 text-[#6a6c6c]">TYPE</th>
              <th className="py-2 text-[#6a6c6c]">AMOUNT</th>
              <th className="py-2 text-[#6a6c6c] text-right">BALANCE</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#e4e7e9]">
              <td className="py-3 text-emerald-600 font-bold">+ CREDIT</td>
              <td className="py-3 font-semibold">₦150,000</td>
              <td className="py-3 font-semibold text-right">₦150,000</td>
            </tr>
            <tr className="border-b border-[#e4e7e9]">
              <td className="py-3 text-emerald-600 font-bold">+ CREDIT</td>
              <td className="py-3 font-semibold">₦10,000</td>
              <td className="py-3 font-semibold text-right">₦160,000</td>
            </tr>
            <tr>
              <td className="py-3 text-amber-600 font-bold">- SWEEP</td>
              <td className="py-3 font-semibold">₦160,000</td>
              <td className="py-3 font-semibold text-right">₦0</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}

// ── Comparison table ───────────────────────────────────────────────────────
const COMPARISON = [
  { feature: "Virtual NUBAN provisioning",  avenue: true,  raw: true  },
  { feature: "AI narration reconciliation", avenue: true,  raw: false },
  { feature: "Double-entry ledger",         avenue: true,  raw: false },
  { feature: "Suspense engine",             avenue: true,  raw: false },
  { feature: "Account agents",              avenue: true,  raw: false },
  { feature: "Signed enriched webhooks",    avenue: true,  raw: false },
  { feature: "Retry delivery with backoff", avenue: true,  raw: false },
  { feature: "Idempotency guarantees",      avenue: true,  raw: "Partial" as const },
];

function ComparisonTable() {
  return (
    <section className="py-32 bg-white border-b-2 border-[#022c22]">
      <div className="max-w-5xl mx-auto px-5 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-[#022c22] tracking-tighter mb-4">
            Avenue vs. raw Nomba API
          </h2>
          <p className="text-xl text-[#6a6c6c] font-medium">
            Both give you NUBANs. Avenue gives you everything else.
          </p>
        </div>

        <div className="border-2 border-[#022c22] bg-white">
          <div className="grid grid-cols-3 border-b-2 border-[#022c22] bg-[#022c22]">
            <div className="p-6 text-lg font-bold text-white">Feature</div>
            <div className="p-6 text-lg font-bold text-[#022c22] bg-[#10b981] border-l-2 border-[#022c22] text-center">
              Avenue
            </div>
            <div className="p-6 text-lg font-bold text-white border-l-2 border-[#022c22] text-center">
              Raw Nomba
            </div>
          </div>
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 border-b-2 border-[#022c22] last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-[#f0fdf4]"}`}
            >
              <div className="p-5 text-lg font-semibold text-[#022c22] flex items-center">{row.feature}</div>
              <div className="p-5 border-l-2 border-[#022c22] flex items-center justify-center">
                <Check weight="bold" className="text-[#10b981] w-8 h-8" />
              </div>
              <div className="p-5 border-l-2 border-[#022c22] flex items-center justify-center">
                {row.raw === true ? (
                  <Check weight="bold" className="text-[#10b981] w-8 h-8" />
                ) : row.raw === "Partial" ? (
                  <span className="text-sm font-bold text-amber-600 bg-amber-100 px-3 py-1 border border-amber-300">Partial</span>
                ) : (
                  <XIcon weight="bold" className="text-[#022c22]/30 w-8 h-8" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  const [activeSection, setActiveSection] = useState(FEATURES[0].id);

  useEffect(() => {
    const handleScroll = () => {
      const sections = FEATURES.map(f => document.getElementById(f.id));
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(FEATURES[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="pt-32 pb-24 border-b-2 border-[#022c22] bg-[#022c22] relative overflow-hidden">
        {/* African pattern animated background */}
        <div 
          className="absolute inset-0 opacity-[0.07] animate-bg-scroll pointer-events-none" 
          style={{ backgroundImage: 'url("/african_pattern.png")', backgroundSize: '300px' }} 
        />
        
        <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10">
          <div className="max-w-4xl">
            <span className="text-[#10b981] font-bold tracking-widest uppercase mb-6 block">Platform Features</span>
            <h1 className="text-6xl lg:text-8xl font-bold text-white tracking-tighter leading-[1.05] mb-8">
              Everything you need to build on payments.
            </h1>
            <p className="text-2xl text-[#6ee7b7] leading-relaxed max-w-2xl mb-12 font-medium">
              Avenue handles the hard parts of payment infrastructure — AI reconciliation, ledger math, edge cases — so you can focus on your product.
            </p>
            <Button variant="primary" size="lg" href="/signup" className="h-16 px-10 text-xl bg-[#10b981] text-[#022c22] hover:bg-white border-2 border-transparent font-bold">
              Start for free
            </Button>
          </div>
        </div>
      </section>

      {/* Editorial Deep Dives */}
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24 flex items-start gap-16 relative">
        {/* Sticky Sidebar Navigation */}
        <div className="hidden lg:block w-[280px] shrink-0 sticky top-32">
          <h3 className="text-sm font-bold font-mono text-[#022c22] mb-6 uppercase tracking-widest">Contents</h3>
          <ul className="space-y-4 border-l-2 border-[#e4e7e9] pl-6">
            {FEATURES.map(f => (
              <li key={f.id}>
                <a 
                  href={`#${f.id}`}
                  className={`text-lg font-bold block transition-colors ${activeSection === f.id ? "text-[#10b981]" : "text-[#6a6c6c] hover:text-[#022c22]"}`}
                >
                  {f.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Content Flow */}
        <div className="flex-1 space-y-40">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <section key={feature.id} id={feature.id} className="scroll-mt-32">
                <Icon weight="fill" className="w-16 h-16 text-[#022c22] mb-8" />
                <h2 className="text-5xl font-bold text-[#022c22] tracking-tighter mb-8 leading-tight">
                  {feature.title}
                </h2>
                <p className="text-2xl text-[#6a6c6c] leading-relaxed mb-12 font-medium">
                  {feature.desc}
                </p>
                
                <div className="mb-16">
                  <h4 className="text-lg font-bold text-[#022c22] mb-6 tracking-tight uppercase">Key capabilities</h4>
                  <ul className="space-y-4">
                    {feature.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-4">
                        <Check weight="bold" className="w-6 h-6 text-[#10b981] shrink-0 mt-0.5" />
                        <span className="text-xl text-[#022c22] font-semibold">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual block */}
                <div className="mt-12">
                  <FeatureVisual type={feature.visual} />
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <ComparisonTable />

      {/* CTA */}
      <section className="py-32 bg-[#10b981] border-t-2 border-[#022c22]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 text-center">
          <h2 className="text-6xl md:text-8xl font-bold text-[#022c22] tracking-tighter mb-8 leading-[1.05]">
            Ready to start building?
          </h2>
          <p className="text-2xl text-[#022c22] mb-12 max-w-2xl mx-auto font-medium">
            Free to start. No credit card required. Live API keys in under two minutes.
          </p>
          <Button variant="primary" size="lg" href="/signup" className="h-16 px-12 text-xl bg-[#022c22] text-white hover:bg-white hover:text-[#022c22] border-2 border-[#022c22] font-bold">
            Get started free
          </Button>
        </div>
      </section>
    </main>
  );
}
