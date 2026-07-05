"use client";

import { motion } from "motion/react";
import {
  GraduationCap,
  Buildings,
  HandHeart,
  Briefcase,
  User,
  Robot,
  GitFork,
  Sparkle,
  Lightning,
  CheckCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

const USE_CASES = [
  {
    id: "education",
    num: "01",
    icon: GraduationCap,
    industry: "Education",
    title: "Automated Tuition Collection",
    tagline: "Per-student wallets. AI-verified payments. Zero admin overhead.",
    scenario:
      "A middle & high school needs a modern system to collect fees from parents. Each student gets a dedicated virtual NUBAN. When a parent underpays or sends the wrong reference, the AI flags it automatically — no staff intervention needed.",
    capabilities: [
      { icon: Robot, label: "AI Reconciliation", desc: "Detects underpayments and flags mismatched narrations instantly" },
      { icon: GitFork, label: "Action Agents", desc: "SWEEP agent moves accumulated funds to operational account at threshold" },
      { icon: Sparkle, label: "Smart Context", desc: "Custom system_prompt per wallet ensures tuition-specific detection" },
    ],
    dark: true,
    doodle: "education",
  },
  {
    id: "proptech",
    num: "02",
    icon: Buildings,
    industry: "PropTech",
    title: "Property Management & Revenue Splitting",
    tagline: "Per-tenant wallets. Auto-split revenue. AI prevents misdirected rent.",
    scenario:
      "A property platform handles rent collection for multiple landlords. Each tenant gets a unique Avenue wallet. The AI catches payments with suspicious narrations before they hit the landlord, and an agent automatically splits the management fee on every incoming credit.",
    capabilities: [
      { icon: Robot, label: "AI Reconciliation", desc: "Flags \"For groceries\" narrations on a rent wallet before crediting" },
      { icon: GitFork, label: "Partial Sweep Agent", desc: "10% to platform revenue wallet, remainder to landlord — automatically" },
      { icon: Sparkle, label: "Suspense Engine", desc: "Misdirected payments held safely for manual review, never lost" },
    ],
    dark: false,
    doodle: "proptech",
  },
  {
    id: "crowdfunding",
    num: "03",
    icon: HandHeart,
    industry: "Crowdfunding",
    title: "Charity & Campaign Fundraising",
    tagline: "Goal-locked wallets. Hands-off automation. Donor trust built-in.",
    scenario:
      "A medical fundraising platform creates a campaign wallet with a 1,000,000 NGN goal. When the goal is hit, an agent automatically freezes the wallet against over-donations, fires a webhook to update the campaign status, and the funds are ready for disbursement.",
    capabilities: [
      { icon: GitFork, label: "BALANCE_ABOVE Agent", desc: "Auto-locks wallet and fires webhook exactly when goal is reached" },
      { icon: Lightning, label: "One-Way Wallet", desc: "allow_transfers_out=false prevents premature or fraudulent draining" },
      { icon: Robot, label: "WEBHOOK_NOTIFY", desc: "Campaign status updated in real-time without cron jobs" },
    ],
    dark: true,
    doodle: "crowdfunding",
  },
  {
    id: "gig",
    num: "04",
    icon: Briefcase,
    industry: "Gig Economy",
    title: "Milestone Escrow for Freelancers",
    tagline: "Job-specific escrow wallets. Instant internal transfers. Zero fees.",
    scenario:
      "A freelance marketplace creates an Escrow wallet per job. The client deposits milestone payments into it. Once the freelancer delivers, the platform calls Avenue to instantly move funds to the freelancer's personal wallet — no bank transfer delays, no fees.",
    capabilities: [
      { icon: Lightning, label: "Instant Transfers", desc: "Internal ledger moves between Avenue wallets settle in milliseconds" },
      { icon: GitFork, label: "Job-Scoped Wallets", desc: "Isolated escrow per contract prevents fund commingling" },
      { icon: CheckCircle, label: "Zero Fees", desc: "Internal ledger transfers carry no transaction costs" },
    ],
    dark: false,
    doodle: "gig",
  },
  {
    id: "personal",
    num: "05",
    icon: User,
    industry: "Consumer Finance",
    title: "Personal Smart Wallets & Agent OS",
    tagline: "Natural language automation. Agentic finance. For everyday users.",
    scenario:
      "Regular consumers connect their Avenue wallet to the built-in Agent OS and give instructions in plain English: \"If I get paid for that gig, send 50k to savings, schedule a rent reminder, and send the rest to my investment wallet.\" The agent executes it autonomously.",
    capabilities: [
      { icon: Robot, label: "Agent OS", desc: "Natural language instructions drive autonomous financial actions" },
      { icon: GitFork, label: "Native Wallet Tools", desc: "Check Balance, Make Transfers, Schedule, Cancel — built in" },
      { icon: Sparkle, label: "No-code Automation", desc: "Consumer-grade AI agents, enterprise-grade execution" },
    ],
    dark: true,
    doodle: "personal",
  },
];

// SVG Doodles
function EducationDoodle({ dark }: { dark: boolean }) {
  const c = dark ? "#10b981" : "#022c22";
  return (
    <svg viewBox="0 0 280 280" className="w-full h-full absolute inset-0 opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
      <polygon points="140,30 200,90 80,90" fill="none" stroke={c} strokeWidth="3"/>
      <rect x="90" y="90" width="100" height="130" fill="none" stroke={c} strokeWidth="3"/>
      <line x1="110" y1="120" x2="170" y2="120" stroke={c} strokeWidth="2"/>
      <line x1="110" y1="140" x2="170" y2="140" stroke={c} strokeWidth="2"/>
      <line x1="110" y1="160" x2="155" y2="160" stroke={c} strokeWidth="2"/>
      <circle cx="50" cy="70" r="18" fill="none" stroke={c} strokeWidth="2"/>
      <line x1="50" y1="88" x2="50" y2="115" stroke={c} strokeWidth="2"/>
      <line x1="34" y1="100" x2="66" y2="100" stroke={c} strokeWidth="2"/>
      <circle cx="230" cy="170" r="18" fill="none" stroke={c} strokeWidth="2"/>
      <line x1="230" y1="188" x2="230" y2="215" stroke={c} strokeWidth="2"/>
      <line x1="214" y1="200" x2="246" y2="200" stroke={c} strokeWidth="2"/>
      <line x1="20" y1="240" x2="260" y2="240" stroke={c} strokeWidth="2" strokeDasharray="8 5"/>
      <circle cx="40" cy="200" r="8" fill="none" stroke={c} strokeWidth="2"/>
      <circle cx="240" cy="60" r="8" fill="none" stroke={c} strokeWidth="2"/>
    </svg>
  );
}

function PropTechDoodle({ dark }: { dark: boolean }) {
  const c = dark ? "#10b981" : "#022c22";
  return (
    <svg viewBox="0 0 280 280" className="w-full h-full absolute inset-0 opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="110" width="90" height="150" fill="none" stroke={c} strokeWidth="3"/>
      <polygon points="20,110 65,55 110,110" fill="none" stroke={c} strokeWidth="3"/>
      <rect x="130" y="70" width="130" height="190" fill="none" stroke={c} strokeWidth="3"/>
      <polygon points="130,70 195,15 260,70" fill="none" stroke={c} strokeWidth="3"/>
      <rect x="35" y="150" width="28" height="45" fill="none" stroke={c} strokeWidth="2"/>
      <rect x="75" y="150" width="28" height="45" fill="none" stroke={c} strokeWidth="2"/>
      <rect x="148" y="110" width="35" height="50" fill="none" stroke={c} strokeWidth="2"/>
      <rect x="198" y="110" width="35" height="50" fill="none" stroke={c} strokeWidth="2"/>
      <rect x="148" y="175" width="35" height="50" fill="none" stroke={c} strokeWidth="2"/>
      <rect x="198" y="175" width="35" height="50" fill="none" stroke={c} strokeWidth="2"/>
      <line x1="65" y1="55" x2="65" y2="260" stroke={c} strokeWidth="1" strokeDasharray="5 5" opacity="0.4"/>
    </svg>
  );
}

function CrowdfundingDoodle({ dark }: { dark: boolean }) {
  const c = dark ? "#10b981" : "#022c22";
  return (
    <svg viewBox="0 0 280 280" className="w-full h-full absolute inset-0 opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
      <path d="M140 230 C80 190 20 155 20 95 C20 58 48 38 78 45 C105 51 125 72 140 90 C155 72 175 51 202 45 C232 38 260 58 260 95 C260 155 200 190 140 230Z" fill="none" stroke={c} strokeWidth="3"/>
      <circle cx="140" cy="140" r="50" fill="none" stroke={c} strokeWidth="2" strokeDasharray="6 4"/>
      <line x1="140" y1="90" x2="140" y2="190" stroke={c} strokeWidth="2"/>
      <line x1="90" y1="140" x2="190" y2="140" stroke={c} strokeWidth="2"/>
      <circle cx="50" cy="230" r="16" fill="none" stroke={c} strokeWidth="2"/>
      <circle cx="140" cy="250" r="16" fill="none" stroke={c} strokeWidth="2"/>
      <circle cx="230" cy="230" r="16" fill="none" stroke={c} strokeWidth="2"/>
      <line x1="66" y1="224" x2="124" y2="252" stroke={c} strokeWidth="1.5" strokeDasharray="4 3"/>
      <line x1="156" y1="252" x2="214" y2="224" stroke={c} strokeWidth="1.5" strokeDasharray="4 3"/>
    </svg>
  );
}

function GigDoodle({ dark }: { dark: boolean }) {
  const c = dark ? "#10b981" : "#022c22";
  return (
    <svg viewBox="0 0 280 280" className="w-full h-full absolute inset-0 opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="70" width="90" height="120" rx="4" fill="none" stroke={c} strokeWidth="3"/>
      <rect x="170" y="90" width="90" height="120" rx="4" fill="none" stroke={c} strokeWidth="3"/>
      <line x1="110" y1="130" x2="170" y2="130" stroke={c} strokeWidth="2" strokeDasharray="6 3"/>
      <circle cx="140" cy="130" r="10" fill={c} opacity="0.3"/>
      <polygon points="140,30 165,60 115,60" fill="none" stroke={c} strokeWidth="2"/>
      <line x1="140" y1="60" x2="140" y2="100" stroke={c} strokeWidth="2"/>
      <line x1="35" y1="115" x2="95" y2="115" stroke={c} strokeWidth="2"/>
      <line x1="35" y1="135" x2="95" y2="135" stroke={c} strokeWidth="2"/>
      <line x1="35" y1="155" x2="75" y2="155" stroke={c} strokeWidth="2"/>
      <line x1="185" y1="135" x2="245" y2="135" stroke={c} strokeWidth="2"/>
      <line x1="185" y1="155" x2="245" y2="155" stroke={c} strokeWidth="2"/>
      <line x1="185" y1="175" x2="225" y2="175" stroke={c} strokeWidth="2"/>
      <line x1="20" y1="250" x2="260" y2="250" stroke={c} strokeWidth="2"/>
    </svg>
  );
}

function PersonalDoodle({ dark }: { dark: boolean }) {
  const c = dark ? "#10b981" : "#022c22";
  return (
    <svg viewBox="0 0 280 280" className="w-full h-full absolute inset-0 opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
      <circle cx="140" cy="80" r="45" fill="none" stroke={c} strokeWidth="3"/>
      <circle cx="140" cy="80" r="18" fill="none" stroke={c} strokeWidth="2"/>
      <path d="M70 220 C70 170 100 145 140 145 C180 145 210 170 210 220" fill="none" stroke={c} strokeWidth="3"/>
      <line x1="20" y1="250" x2="260" y2="250" stroke={c} strokeWidth="2"/>
      <circle cx="42" cy="55" r="12" fill="none" stroke={c} strokeWidth="2"/>
      <line x1="42" y1="67" x2="42" y2="88" stroke={c} strokeWidth="2"/>
      <line x1="30" y1="77" x2="54" y2="77" stroke={c} strokeWidth="2"/>
      <circle cx="238" cy="55" r="12" fill="none" stroke={c} strokeWidth="2"/>
      <line x1="238" y1="67" x2="238" y2="88" stroke={c} strokeWidth="2"/>
      <line x1="226" y1="77" x2="250" y2="77" stroke={c} strokeWidth="2"/>
      <path d="M54 62 L95 72" stroke={c} strokeWidth="1.5" strokeDasharray="4 3"/>
      <path d="M226 62 L185 72" stroke={c} strokeWidth="1.5" strokeDasharray="4 3"/>
      <circle cx="42" cy="175" r="12" fill="none" stroke={c} strokeWidth="2"/>
      <circle cx="238" cy="175" r="12" fill="none" stroke={c} strokeWidth="2"/>
      <path d="M54 175 L73 190" stroke={c} strokeWidth="1.5" strokeDasharray="4 3"/>
      <path d="M226 175 L207 190" stroke={c} strokeWidth="1.5" strokeDasharray="4 3"/>
    </svg>
  );
}

const DOODLE_COMPONENTS: Record<string, React.FC<{ dark: boolean }>> = {
  education: EducationDoodle,
  proptech: PropTechDoodle,
  crowdfunding: CrowdfundingDoodle,
  gig: GigDoodle,
  personal: PersonalDoodle,
};

export default function UseCasesPage() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero */}
      <section className="pt-40 pb-24 bg-white border-b-2 border-[#022c22] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "radial-gradient(#022c22 2px, transparent 2px)", backgroundSize: "28px 28px" }}
        />
        <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 border-2 border-[#022c22] text-xs font-black uppercase tracking-widest text-[#022c22] mb-8">
              Real-world applications
            </span>
            <h1 className="text-6xl md:text-8xl font-bold text-[#022c22] tracking-tighter leading-[1.05] mb-8 max-w-5xl">
              Built for every payment workflow.
            </h1>
            <p className="text-xl md:text-2xl text-[#6a6c6c] leading-snug max-w-2xl font-medium">
              From school fee collection to freelancer escrow — Avenue powers any financial use case with zero custom infrastructure.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      {USE_CASES.map((uc, i) => {
        const Icon = uc.icon;
        const Doodle = DOODLE_COMPONENTS[uc.doodle];
        const isDark = uc.dark;
        const bgClass = isDark ? "bg-[#022c22]" : i % 4 === 1 ? "bg-[#10b981]" : "bg-white";
        const textMain = isDark ? "text-white" : "text-[#022c22]";
        const textSub = isDark ? "text-[#a7f3d0]" : "text-[#6a6c6c]";
        const accentText = isDark ? "text-[#10b981]" : "text-[#022c22]";
        const badgeBorder = isDark ? "border-[#10b981] text-[#10b981]" : "border-[#022c22] text-[#022c22]";
        const capBorder = isDark ? "border-[#10b981]/20 bg-white/5" : "border-[#022c22]/15 bg-[#f7f9fb]";
        const capIconColor = isDark ? "text-[#10b981]" : "text-[#10b981]";
        const capLabelColor = isDark ? "text-white" : "text-[#022c22]";
        const capDescColor = isDark ? "text-[#6ee7b7]" : "text-[#6a6c6c]";
        const vizBg = isDark ? "bg-[#10b981]/10" : "bg-[#022c22]";
        const shadowColor = "#10b981";
        const flip = i % 2 === 1;

        return (
          <section
            key={uc.id}
            id={uc.id}
            className={`py-24 border-b-2 border-[#022c22] ${bgClass}`}
          >
            <div className="max-w-7xl mx-auto px-5 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, x: flip ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className={flip ? "lg:order-2" : ""}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`text-8xl font-black tracking-tighter ${accentText} opacity-25 leading-none select-none`}>
                      {uc.num}
                    </span>
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 border-2 ${badgeBorder}`}>
                      {uc.industry}
                    </span>
                  </div>
                  <div className="flex items-start gap-4 mb-4">
                    <Icon weight="bold" className={`w-10 h-10 shrink-0 mt-1 ${accentText}`} />
                    <h2 className={`text-4xl md:text-5xl font-bold tracking-tighter leading-[1.1] ${textMain}`}>
                      {uc.title}
                    </h2>
                  </div>
                  <p className={`text-lg font-bold mb-6 ${accentText}`}>{uc.tagline}</p>
                  <p className={`text-lg leading-relaxed mb-10 font-medium ${textSub}`}>
                    {uc.scenario}
                  </p>
                  <div className="space-y-3">
                    {uc.capabilities.map((cap) => {
                      const CapIcon = cap.icon;
                      return (
                        <div key={cap.label} className={`flex items-start gap-4 p-4 border-2 ${capBorder}`}>
                          <CapIcon weight="bold" className={`w-5 h-5 shrink-0 mt-0.5 ${capIconColor}`} />
                          <div>
                            <div className={`font-black text-xs uppercase tracking-wider mb-1 ${capLabelColor}`}>
                              {cap.label}
                            </div>
                            <div className={`text-sm font-medium ${capDescColor}`}>{cap.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Visual */}
                <motion.div
                  initial={{ opacity: 0, x: flip ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative h-[420px] ${flip ? "lg:order-1" : ""}`}
                >
                  <div
                    className={`w-full h-full border-2 border-[#022c22] relative overflow-hidden ${vizBg}`}
                    style={{ boxShadow: `12px 12px 0px 0px ${shadowColor}` }}
                  >
                    {/* Grid doodle background */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(${isDark ? "rgba(16,185,129,0.25)" : "rgba(2,44,34,0.15)"} 1.5px, transparent 1.5px)`,
                        backgroundSize: "24px 24px",
                      }}
                    />
                    {/* SVG doodle */}
                    <Doodle dark={isDark} />
                    {/* Floating terminal card */}
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <div
                        className="bg-white border-2 border-[#022c22] p-7 max-w-sm w-full"
                        style={{ boxShadow: "8px 8px 0px 0px #10b981" }}
                      >
                        <div className="flex items-center gap-3 mb-5 border-b-2 border-[#022c22] pb-4">
                          <Icon weight="bold" className="w-7 h-7 text-[#022c22]" />
                          <span className="font-black text-[#022c22] tracking-tight">{uc.industry}</span>
                          <span className="ml-auto flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
                            </span>
                            <span className="text-xs font-black text-[#10b981]">LIVE</span>
                          </span>
                        </div>
                        <div className="space-y-3 font-mono text-sm font-bold">
                          <div className="flex justify-between">
                            <span className="text-[#6a6c6c]">wallets</span>
                            <span className="text-[#10b981]">active</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6a6c6c]">ai_reconcile</span>
                            <span className="text-[#022c22]">enabled</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6a6c6c]">agents</span>
                            <span className="text-[#022c22]">running</span>
                          </div>
                          <div className="flex justify-between border-t-2 border-[#022c22] pt-3">
                            <span className="text-[#6a6c6c]">suspense</span>
                            <span className="text-[#022c22]">0 pending</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="bg-[#022c22] p-16 md:p-24 text-center border-2 border-[#022c22] shadow-[16px_16px_0px_0px_#10b981]">
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-8 leading-[1.05]">
              What will you build?
              <br />
              <span className="text-[#10b981]">Start today, for free.</span>
            </h2>
            <p className="text-xl text-[#6ee7b7] max-w-2xl mx-auto mb-12 font-medium">
              Every use case above can be live in hours. Avenue handles the infrastructure so you can focus on your product.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button
                variant="primary"
                size="lg"
                href="/signup"
                className="h-16 px-12 text-xl bg-[#10b981] text-[#022c22] hover:bg-white hover:text-[#022c22] border-2 border-transparent font-bold"
              >
                Create free account
              </Button>
              <Button
                variant="outline"
                size="lg"
                href="https://avenue.mintlify.app"
                external
                className="h-16 px-12 text-xl border-2 border-white text-white hover:bg-white hover:text-[#022c22] font-bold"
              >
                Read the docs
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
