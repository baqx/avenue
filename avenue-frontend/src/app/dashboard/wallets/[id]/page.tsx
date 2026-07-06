'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGetWalletDetailsQuery, useFreezeWalletMutation, useUnfreezeWalletMutation, useCloseWalletMutation, useGetWalletReportQuery } from '@/lib/api/walletsApi';
import { useToast } from '@/components/ui/toast/ToastProvider';
import { CardShimmer } from '@/components/ui/Shimmer';
import { ArrowLeft, Bank, User, Hash, LockKey, LockKeyOpen, Trash, CircleNotch, TrendUp, TrendDown, Warning, ChartBar } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

function WalletReportSection({ walletId }: { walletId: string }) {
  const { data: report, isLoading, isError } = useGetWalletReportQuery(walletId);

  const formatCurrency = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);
  };

  if (isLoading) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Analytics</h3>
        <CardShimmer className="h-48" />
      </div>
    );
  }

  if (isError || !report) {
    return null; // Fail silently or show a small error state
  }

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Wallet Analytics & Report</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Inflow */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2 text-green-600">
            <TrendUp weight="bold" className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Total Inflow</span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(report.total_inflow)}</p>
          <p className="text-sm text-gray-500 mt-1">{report.transaction_count} total transactions</p>
        </div>

        {/* Total Outflow */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2 text-red-600">
            <TrendDown weight="bold" className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Total Outflow</span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(report.total_outflow)}</p>
        </div>

        {/* Flagged / Anomalies */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2 text-yellow-600">
            <Warning weight="bold" className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Flagged</span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{report.flagged_transactions_count}</p>
          <p className="text-sm text-gray-500 mt-1">transactions routed to suspense</p>
        </div>
      </div>

      {/* Category Breakdown */}
      {report.categories && report.categories.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
            <ChartBar className="w-5 h-5 text-gray-500" />
            <h3 className="text-base font-semibold text-gray-900">Category Breakdown</h3>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-gray-100">
              {report.categories.map((cat, idx) => (
                <li key={idx} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cat.category}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{cat.transaction_count} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(cat.total_amount)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WalletDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const toast = useToast();
  
  const { data: wallet, isLoading, isError, refetch } = useGetWalletDetailsQuery(resolvedParams.id);
  
  const [freezeWallet, { isLoading: isFreezing }] = useFreezeWalletMutation();
  const [unfreezeWallet, { isLoading: isUnfreezing }] = useUnfreezeWalletMutation();
  const [closeWallet, { isLoading: isClosing }] = useCloseWalletMutation();

  const formatCurrency = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Active</span>;
      case 'FROZEN': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Frozen</span>;
      case 'CLOSED': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">Closed</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  const handleToggleFreeze = async () => {
    if (!wallet) return;
    try {
      if (wallet.status === 'ACTIVE') {
        await freezeWallet(wallet.id).unwrap();
        toast.success('Wallet Frozen', 'The wallet has been temporarily frozen.');
      } else if (wallet.status === 'FROZEN') {
        await unfreezeWallet(wallet.id).unwrap();
        toast.success('Wallet Unfrozen', 'The wallet is now active again.');
      }
      refetch();
    } catch (err: any) {
      toast.error('Action failed', err?.data?.error?.message || err?.data?.detail || 'Could not update wallet status.');
    }
  };

  const handleClose = async () => {
    if (!wallet || wallet.status === 'CLOSED') return;
    if (confirm('Are you sure you want to permanently close this wallet? Any incoming transfers will be routed to Suspense.')) {
      try {
        await closeWallet(wallet.id).unwrap();
        toast.success('Wallet Closed', 'The wallet has been permanently closed.');
        refetch();
      } catch (err: any) {
        toast.error('Action failed', err?.data?.error?.message || err?.data?.detail || 'Could not close wallet.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardShimmer />
        <CardShimmer className="h-64" />
      </div>
    );
  }

  if (isError || !wallet) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-2xl">
        Failed to load wallet details. The wallet may not exist.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/wallets" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Wallets
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{wallet.label || 'Virtual Account'}</h1>
            {getStatusBadge(wallet.status)}
          </div>
          <p className="mt-1 text-sm text-gray-500">ID: {wallet.id}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {wallet.status !== 'CLOSED' && (
            <button
              onClick={handleToggleFreeze}
              disabled={isFreezing || isUnfreezing}
              className={cn(
                "inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70",
                wallet.status === 'ACTIVE' 
                  ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-yellow-500"
                  : "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 focus:ring-yellow-500"
              )}
            >
              {isFreezing || isUnfreezing ? (
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
              ) : wallet.status === 'ACTIVE' ? (
                <LockKey className="w-4 h-4 mr-2" />
              ) : (
                <LockKeyOpen className="w-4 h-4 mr-2" />
              )}
              {wallet.status === 'ACTIVE' ? 'Freeze Wallet' : 'Unfreeze Wallet'}
            </button>
          )}
          
          {wallet.status !== 'CLOSED' && (
            <button
              onClick={handleClose}
              disabled={isClosing}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 transition-colors"
            >
              {isClosing ? <CircleNotch className="w-4 h-4 mr-2 animate-spin" /> : <Trash className="w-4 h-4 mr-2" />}
              Close Wallet
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center items-center text-center">
          <p className="text-sm font-medium text-gray-500 mb-2">Available Balance</p>
          <p className="text-4xl font-extrabold text-gray-900">{formatCurrency(wallet.balance)}</p>
          <p className="text-sm text-gray-500 mt-2">Currency: {wallet.currency}</p>
        </div>

        {/* Account Details */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-base font-semibold text-gray-900">Account Details</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <Bank className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{wallet.bank_name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number (NUBAN)</p>
                <p className="text-lg font-mono font-bold text-gray-900 tracking-wider mt-1">{wallet.account_number}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:col-span-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{wallet.account_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="md:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-base font-semibold text-gray-900">Customer & Intelligence</h3>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Customer Reference</dt>
                <dd className="mt-1 text-sm text-gray-900">{wallet.customer_reference}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{wallet.first_name} {wallet.last_name}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{wallet.email}</dd>
              </div>
              <div className="sm:col-span-3">
                <dt className="text-sm font-medium text-gray-500 mb-2">AI System Prompt</dt>
                <dd className="text-sm text-gray-900 bg-gray-50 p-4 rounded-xl border border-gray-100 font-mono">
                  {wallet.system_prompt || <span className="text-gray-400 italic">No system prompt configured. AI will use default context extraction.</span>}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      
      {/* Analytics Section */}
      <WalletReportSection walletId={wallet.id} />
    </div>
  );
}
