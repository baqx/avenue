'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks/redux';
import { logout } from '@/lib/features/authSlice';
import {
  SquaresFour,
  Wallet,
  ListDashes,
  WarningOctagon,
  Robot,
  PlugsConnected,
  SignOut,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: SquaresFour },
  { name: 'Wallets', href: '/dashboard/wallets', icon: Wallet },
  { name: 'Transactions', href: '/dashboard/transactions', icon: ListDashes },
  { name: 'Suspense', href: '/dashboard/suspense', icon: WarningOctagon },
  { name: 'Agents', href: '/dashboard/agents', icon: Robot },
  { name: 'Webhooks', href: '/dashboard/webhooks', icon: PlugsConnected },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex fixed h-full inset-y-0 z-10">
        <div className="flex items-center h-16 shrink-0 px-6 border-b border-gray-100">
          <span className="text-xl font-bold text-gray-900 tracking-tight">Avenue</span>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors'
                  )}
                >
                  <Icon
                    className={cn(
                      isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600',
                      'shrink-0 w-5 h-5 mr-3'
                    )}
                    weight={isActive ? 'fill' : 'regular'}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <SignOut className="shrink-0 w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1 w-full">
        <main className="flex-1">
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
