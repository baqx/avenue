"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/lib/hooks/redux";
import { logout } from "@/lib/features/authSlice";
import { useGetProfileQuery } from "@/lib/api/developerApi";
import {
  House,
  Wallet,
  ListDashes,
  GitFork,
  ShieldWarning,
  WebhooksLogo,
  GearSix,
  CaretLeft,
  CaretRight,
  SignOut,
  List,
} from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Overview", href: "/dashboard", icon: House, exact: true },
  { name: "Wallets", href: "/dashboard/wallets", icon: Wallet },
  { name: "Transactions", href: "/dashboard/transactions", icon: ListDashes },
  { name: "Agents", href: "/dashboard/agents", icon: GitFork },
  { name: "Suspense", href: "/dashboard/suspense", icon: ShieldWarning },
  { name: "Webhooks", href: "/dashboard/webhooks", icon: WebhooksLogo },
  { name: "Settings", href: "/dashboard/settings", icon: GearSix },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: profile } = useGetProfileQuery();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-[#f7f9fb] overflow-hidden">
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#022c22]/20 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-[#e4e7e9] flex flex-col transition-all duration-300 z-50 shrink-0",
          "fixed inset-y-0 left-0 md:relative",
          collapsed ? "md:w-[80px]" : "md:w-[260px]",
          mobileMenuOpen ? "translate-x-0 w-[260px] shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center border-b border-[#e4e7e9] px-5 shrink-0 overflow-hidden">
          <div className={cn("transition-all duration-300 w-[140px]", collapsed ? "opacity-0 invisible md:hidden" : "opacity-100 visible")}>
            <Logo size="sm" />
          </div>
          {collapsed && (
            <div className="absolute left-0 w-full hidden md:flex justify-center">
              <div className="w-8 h-8 bg-[#022c22] rounded flex items-center justify-center">
                <span className="text-white font-bold font-mono text-xl leading-none">A</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-20 w-7 h-7 bg-white border border-[#e4e7e9] shadow-sm rounded-full hidden md:flex items-center justify-center text-[#6a6c6c] hover:bg-[#f7f9fb] transition-colors z-30"
        >
          {collapsed ? <CaretRight weight="bold" /> : <CaretLeft weight="bold" />}
        </button>

        <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 h-10 rounded-lg transition-colors relative",
                  isActive
                    ? "bg-[#f0fdf4] text-[#059669]"
                    : "text-[#6a6c6c] hover:bg-[#f7f9fb] hover:text-[#022c22]"
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon weight={isActive ? "fill" : "regular"} className="w-5 h-5 shrink-0" />
                <span className={cn("font-bold text-sm whitespace-nowrap transition-all duration-300 absolute left-11", collapsed ? "md:opacity-0 md:invisible" : "opacity-100 visible")}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#e4e7e9]">
          <button
            onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
            className="flex w-full items-center gap-3 px-3 h-10 rounded-lg text-[#6a6c6c] hover:bg-red-50 hover:text-red-600 transition-colors relative"
            title={collapsed ? "Log out" : undefined}
          >
            <SignOut className="w-5 h-5 shrink-0" />
            <span className={cn("font-bold text-sm whitespace-nowrap transition-all duration-300 absolute left-11", collapsed ? "md:opacity-0 md:invisible" : "opacity-100 visible")}>
              Log out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[#e4e7e9] flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-[#6a6c6c] hover:bg-[#f7f9fb] rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <List className="w-6 h-6" />
            </button>
            <div className="md:hidden pt-2 pl-2">
              <Logo size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-[#022c22]">{profile?.company_name || 'Developer'}</div>
              <div className="text-xs text-[#6a6c6c]">{profile?.email || 'Loading...'}</div>
            </div>
            <div className="w-9 h-9 bg-[#022c22] rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{profile?.company_name?.[0]?.toUpperCase() || 'D'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
