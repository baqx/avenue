"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { List, X } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Docs", href: "/docs" },
  
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled ? "py-2" : "py-4"
        )}
      >
        <nav
          className={cn(
            "mx-auto px-5 lg:px-8 h-16 flex items-center justify-between transition-all duration-500",
            scrolled
              ? "max-w-5xl bg-white/80 backdrop-blur-xl rounded-full border border-gray-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              : "max-w-7xl bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm"
          )}
        >
          {/* Logo */}
          <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity">
            <Logo size="md" />
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#059669] hover:bg-[#10b981]/10 rounded-full transition-all duration-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-[#022c22] transition-colors px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-[#022c22] hover:bg-[#059669] px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Start Building
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-24 left-4 right-4 z-40 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-2xl md:hidden overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3.5 text-base font-medium text-gray-800 hover:text-[#059669] hover:bg-[#10b981]/10 rounded-xl transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-gray-100 my-2" />
              <div className="flex flex-col gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="w-full py-3.5 text-center text-base font-medium text-gray-800 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="w-full py-3.5 text-center text-base font-semibold text-white bg-[#022c22] hover:bg-[#059669] rounded-xl shadow-md transition-colors"
                >
                  Start Building
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
