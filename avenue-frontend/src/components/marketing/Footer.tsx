import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { GithubLogo, XLogo, LinkedinLogo } from "@phosphor-icons/react/dist/ssr";

const footerLinks = {
  Product: [
    { label: "Features",    href: "/features" },
    { label: "Pricing",     href: "/#pricing" },
  ],
  Developers: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/docs/api-reference" },
    { label: "Quickstart",    href: "/docs/quickstart" },
    { label: "Webhooks",      href: "/docs/webhooks" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#f7f9fb] border-t border-[#e4e7e9]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Logo size="md" />
            <p className="mt-4 text-sm text-[#6a6c6c] leading-relaxed max-w-[220px]">
              Intelligent wallet infrastructure built on top of Nomba for Nigerian developers.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 mt-5">
              {[
                { icon: GithubLogo,   href: "#", label: "GitHub" },
                { icon: XLogo,        href: "#", label: "X / Twitter" },
                { icon: LinkedinLogo, href: "#", label: "LinkedIn" },
              ].map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6a6c6c] hover:text-[#022c22] hover:bg-[#e4e7e9] transition-colors"
                >
                  <Icon size={16} weight="bold" />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold text-[#022c22] uppercase tracking-wider mb-4">
                {group}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#6a6c6c] hover:text-[#022c22] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#e4e7e9] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6a6c6c]">
            © {new Date().getFullYear()} Avenue Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-[#6a6c6c]">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
