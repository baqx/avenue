"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import {
  Lightning,
  Wallet,
  Robot,
  GitFork,
  Shield,
  Terminal,
  WebhooksLogo,
  Database,
  Sparkle,
  CheckCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CodeBlock } from "@/components/ui/CodeBlock";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ── Hero Section ───────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex items-center pt-24 bg-white overflow-hidden border-b-2 border-[#022c22]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <h1 className="text-6xl md:text-8xl font-bold text-[#022c22] tracking-tighter leading-[1.05] mb-8">
            Smart wallets for every payment.
          </h1>
          <p className="text-xl md:text-2xl text-[#6a6c6c] leading-snug max-w-2xl mb-10 font-medium">
            Avenue gives developers virtual accounts with AI-powered reconciliation, automated agents, and enriched webhooks — all in one clean API.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="primary" size="lg" href="/signup" icon className="text-lg h-14 px-8 border-2 border-[#022c22]">
              Start Building Free
            </Button>
            <Button variant="outline" size="lg" href="https://avenue.mintlify.app" external className="text-lg h-14 px-8 border-2 border-[#022c22] text-[#022c22] hover:bg-[#f0fdf4]">
              View Docs
            </Button>
          </div>
          
        </motion.div>
      </div>

      {/* Asymmetric Product Shot/Asset placed bottom right */}
      <motion.div 
        initial={{ opacity: 0, x: 100, y: 50 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex absolute bottom-0 right-0 w-[45%] h-[60%] bg-[#022c22] border-t-2 border-l-2 border-[#022c22] items-center justify-center p-12"
      >
        <div className="w-full h-full border-2 border-[#10b981] bg-white flex items-center justify-center p-8 shadow-[8px_8px_0px_0px_#10b981]">
          <pre className="text-[#022c22] font-mono text-sm leading-loose w-full max-w-sm font-semibold">
            <code>
{`{
  "event": "ledger.credit",
  "data": {
    "amount": 150000,
    "ai_intent": {
      "confidence": 0.94,
      "label": "School Fees"
    }
  }
}`}
            </code>
          </pre>
        </div>
      </motion.div>
    </section>
  );
}

// ── Marquee Section ────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "Smart Virtual Wallets", "AI Reconciliation", "Account Agents",
  "Suspense Engine", "Enriched Webhooks", "Double-entry Ledger",
  "Idempotent Payments", "Real-time Notifications", "Nomba Integration",
  "Developer-first API", "HMAC Verification", "Auto-Sweep Agents",
];

function MarqueeSection() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <section className="py-6 border-b-2 border-[#022c22] bg-[#10b981] overflow-hidden">
      <div className="flex gap-8 marquee-track w-max">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-8 shrink-0">
            <span className="text-sm font-black text-[#022c22] tracking-tighter uppercase">{item}</span>
            <span className="w-2 h-2 rounded-none bg-[#022c22] shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── GSAP Sticky Stack Features ──────────────────────────────────────────────
const FEATURES = [
  {
    title: "Smart Virtual Wallets",
    desc: "Spin up dedicated NUBANs per user in milliseconds. Every wallet has its own AI context, statement, and automation layer.",
    icon: Wallet,
    color: "bg-[#022c22]",
    textColor: "text-white",
    descColor: "text-[#6ee7b7]",
    iconColor: "text-[#10b981]",
  },
  {
    title: "AI Reconciliation",
    desc: "Avenue reads raw bank narrations and extracts structured intent — flagging underpayments, misdirections, and anomalies automatically.",
    icon: Robot,
    color: "bg-[#10b981]",
    textColor: "text-[#022c22]",
    descColor: "text-[#022c22]/80",
    iconColor: "text-[#022c22]",
    borderColor: "border-2 border-[#022c22]",
  },
  {
    title: "Account Agents",
    desc: "Set triggers and actions on any wallet — auto-sweep on threshold, lock on anomaly, notify on specific credit amounts.",
    icon: GitFork,
    color: "bg-white",
    textColor: "text-[#022c22]",
    descColor: "text-[#6a6c6c]",
    iconColor: "text-[#022c22]",
    borderColor: "border-2 border-[#022c22]",
  },
  {
    title: "Suspense Engine",
    desc: "Money that hits a closed wallet, a misdirected payment, or fails AI confidence? It goes into a suspense queue — never lost, always resolvable.",
    icon: Shield,
    color: "bg-[#f0fdf4]",
    textColor: "text-[#022c22]",
    descColor: "text-[#6a6c6c]",
    iconColor: "text-[#10b981]",
    borderColor: "border-2 border-[#022c22]",
  }
];

function StickyStackSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".stack-card");
      
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return; // Last card doesn't scale
        
        gsap.to(card, {
          scale: 0.95 - (cards.length - i) * 0.02,
          opacity: 0.9,
          scrollTrigger: {
            trigger: card,
            start: "top 15%",
            endTrigger: ".stack-container",
            end: "bottom bottom",
            scrub: true,
          }
        });
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-32 bg-white stack-container border-b-2 border-[#022c22] relative">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 mb-20">
        <h2 className="text-5xl md:text-7xl font-bold text-[#022c22] tracking-tighter max-w-3xl leading-[1.05]">
          The infrastructure layer payments deserve.
        </h2>
      </div>

      <div className="max-w-5xl mx-auto px-5 lg:px-8 pb-32 relative">
        {FEATURES.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div 
              key={i} 
              className={`stack-card sticky top-[15%] w-full min-h-[50vh] flex flex-col justify-center p-10 md:p-16 mb-8 origin-top shadow-xl ${feature.color} ${feature.borderColor || ""}`}
              style={{ zIndex: i }}
            >
              <Icon weight="bold" className={`w-16 h-16 mb-8 ${feature.iconColor}`} />
              <h3 className={`text-5xl md:text-6xl font-bold tracking-tighter mb-6 ${feature.textColor}`}>
                {feature.title}
              </h3>
              <p className={`text-xl md:text-2xl leading-relaxed max-w-3xl font-medium ${feature.descColor}`}>
                {feature.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── GSAP Horizontal Pan Section ──────────────────────────────────────────
const PAN_STEPS = [
  {
    num: "01",
    title: "Create an account",
    desc: "Instantly receive live and test API keys. No waiting, no approval process.",
    code: `POST /v1/auth/signup\n{\n  "email": "dev@yourapp.io",\n  "company": "YourApp"\n}`
  },
  {
    num: "02",
    title: "Provision wallets",
    desc: "Create a dedicated virtual NUBAN for each user with a single API call.",
    code: `POST /v1/wallets\n{\n  "customer": "usr_182",\n  "prompt": "School fees"\n}`
  },
  {
    num: "03",
    title: "Enriched webhooks",
    desc: "Avenue's AI reads the narration and fires a clean webhook to your app.",
    code: `{\n  "event": "ledger.credit",\n  "data": {\n    "amount": 150000,\n    "ai_intent": "School fees"\n  }\n}`
  }
];

function HorizontalPanSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      const track = trackRef.current;
      if (!track) return;
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: () => "+=" + track.offsetWidth,
          pin: true,
          scrub: 1,
        }
      });
      
      tl.to(track, {
        x: () => -(track.scrollWidth - document.documentElement.clientWidth) + "px",
        ease: "none"
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="h-screen flex flex-col justify-center bg-[#022c22] overflow-hidden border-b-2 border-[#022c22]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full mb-12">
        <h2 className="text-6xl font-bold text-white tracking-tighter">Live in three steps.</h2>
      </div>
      
      <div ref={trackRef} className="flex gap-8 px-5 lg:px-8 w-max">
        {PAN_STEPS.map((step) => (
          <div key={step.num} className="w-[85vw] md:w-[700px] bg-white border-2 border-[#10b981] flex flex-col h-[500px] shrink-0">
            <div className="p-12 flex-1 border-b-2 border-[#10b981]">
              <span className="text-7xl font-black text-[#022c22] tracking-tighter block mb-6">{step.num}</span>
              <h3 className="text-4xl font-bold text-[#022c22] tracking-tighter mb-4">{step.title}</h3>
              <p className="text-xl text-[#6a6c6c] font-medium leading-relaxed">{step.desc}</p>
            </div>
            <div className="h-[220px] bg-[#022c22] p-8 overflow-hidden">
              <pre className="text-[#10b981] font-mono text-lg leading-relaxed whitespace-pre-wrap font-bold">
                {step.code}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Two-Column Image + Text Section (Replacing Bento) ─────────────────────
function FeatureSplitSection() {
  return (
    <section className="py-32 bg-white border-b-2 border-[#022c22]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-6xl font-bold text-[#022c22] tracking-tighter mb-8 leading-[1.05]">
              Idempotent by design.
              <br />
              Signed webhooks.
            </h2>
            <p className="text-2xl text-[#6a6c6c] leading-relaxed mb-8 max-w-lg font-medium">
              We handle the edge cases that break payment integrations. Database-level unique constraints ensure no double-credits. Every outbound event is cryptographically signed.
            </p>
            <div className="space-y-4">
              {["No missing webhooks", "No double processing", "Cryptographic verification"].map((item) => (
                <div key={item} className="flex items-center gap-4 text-xl font-bold text-[#022c22] tracking-tight">
                  <Shield weight="fill" className="text-[#10b981] w-8 h-8" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#10b981] border-2 border-[#022c22] p-10 h-[500px] flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#022c22 3px, transparent 3px)', backgroundSize: '40px 40px' }} />
             <div className="relative z-10 bg-white border-2 border-[#022c22] p-10 shadow-[12px_12px_0px_0px_#022c22] max-w-md w-full">
               <div className="flex items-center gap-4 mb-8 border-b-2 border-[#022c22] pb-6">
                 <Terminal weight="bold" className="w-10 h-10 text-[#022c22]" />
                 <span className="font-black text-3xl text-[#022c22] tracking-tighter">webhook.verified</span>
               </div>
               <div className="space-y-5 font-mono text-lg font-bold">
                  <div className="flex justify-between"><span className="text-[#6a6c6c]">status</span><span className="text-[#10b981]">200 OK</span></div>
                  <div className="flex justify-between"><span className="text-[#6a6c6c]">signature</span><span className="text-[#022c22]">valid</span></div>
                  <div className="flex justify-between"><span className="text-[#6a6c6c]">idempotency</span><span className="text-[#022c22]">enforced</span></div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Final CTA Section ──────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="bg-[#022c22] p-16 md:p-32 text-center border-2 border-[#022c22] shadow-[16px_16px_0px_0px_#10b981]">
          <h2 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-8 leading-[1.05]">
            Build your payments layer
            <br />
            <span className="text-[#10b981]">in a day, not a month.</span>
          </h2>
          <p className="text-2xl text-[#6ee7b7] max-w-3xl mx-auto mb-16 font-medium">
            Join developers already using Avenue to build smarter payment infrastructure on Nomba.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button variant="primary" size="lg" href="/signup" className="h-16 px-12 text-xl bg-[#10b981] text-[#022c22] hover:bg-white hover:text-[#022c22] border-2 border-transparent font-bold">
              Create free account
            </Button>
            <Button variant="outline" size="lg" href="https://avenue.mintlify.app" external className="h-16 px-12 text-xl border-2 border-white text-white hover:bg-white hover:text-[#022c22] font-bold">
              Read the docs
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main Landing Page export ───────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="bg-white">
      <HeroSection />
      <MarqueeSection />
      <StickyStackSection />
      <HorizontalPanSection />
      <FeatureSplitSection />
      <CTASection />
    </main>
  );
}
