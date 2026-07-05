'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGetSuspenseDetailsQuery, useResolveSuspenseMutation } from '@/lib/api/suspenseApi';
import { useGetWalletsQuery } from '@/lib/api/walletsApi';
import { useToast } from '@/components/ui/toast/ToastProvider';
import { CardShimmer } from '@/components/ui/Shimmer';
import { ArrowLeft, CircleNotch, WarningCircle } from '@phosphor-icons/react';

export default function SuspenseResolutionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const toast = useToast();
  
  const { data: item, isLoading, isError } = useGetSuspenseDetailsQuery(resolvedParams.id);
  const { data: wallets } = useGetWalletsQuery({ limit: 100 }); // Basic way to get a list for dropdown
  const [resolveSuspense, { isLoading: isResolving }] = useResolveSuspenseMutation();

  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [note, setNote] = useState('');

  const formatCurrency = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);
  };

  const handleResolve = async (action: 'CREDIT_WALLET' | 'DISMISS') => {
    if (action === 'CREDIT_WALLET' && !selectedWalletId) {
      toast.error('Validation Error', 'Please select a destination wallet.');
      return;
    }

    try {
      await resolveSuspense({
        id: resolvedParams.id,
        body: {
          action,
          target_wallet_id: action === 'CREDIT_WALLET' ? selectedWalletId : undefined,
          note
        }
      }).unwrap();
      
      toast.success('Resolved successfully', `The suspense item was ${action === 'CREDIT_WALLET' ? 'credited' : 'dismissed'}.`);
      router.push('/dashboard/suspense');
    } catch (err: any) {
      toast.error('Resolution failed', err?.data?.error?.message || err?.data?.detail || 'Could not resolve the item.');
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto space-y-6"><CardShimmer /><CardShimmer /></div>;
  }

  if (isError || !item) {
    return <div className="p-6 text-center text-red-600 bg-red-50 rounded-2xl max-w-4xl mx-auto">Failed to load suspense item details.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/suspense" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Queue
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Resolve Suspense Item</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-200 bg-red-50 flex items-center gap-3">
          <WarningCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-base font-semibold text-red-900">Reason: {item.reason}</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Transaction Details</h4>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-gray-500">Amount Received</dt>
                <dd className="font-bold text-gray-900 text-lg mt-1">{formatCurrency(item.amount)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Sender Name</dt>
                <dd className="font-medium text-gray-900 mt-1">{item.sender_name || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Raw Bank Narration</dt>
                <dd className="text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-100 font-mono mt-1">
                  {item.raw_narration || 'No narration provided'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Destination Account Number</dt>
                <dd className="font-medium text-gray-900 mt-1">{item.account_number}</dd>
              </div>
            </dl>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Resolution Action</h4>
            {item.status === 'PENDING' ? (
              <div className="space-y-5">
                <div>
                  <label htmlFor="wallet" className="block text-sm font-medium text-gray-700 mb-1">Target Wallet to Credit</label>
                  <select
                    id="wallet"
                    className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border shadow-sm"
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                  >
                    <option value="">-- Select a wallet --</option>
                    {wallets?.items.map(w => (
                      <option key={w.id} value={w.id}>{w.label || w.account_number} ({w.first_name} {w.last_name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Resolution Note</label>
                  <textarea
                    id="note"
                    rows={2}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    placeholder="E.g. Verified payment over phone call..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <div className="pt-2 flex flex-col gap-3">
                  <button
                    onClick={() => handleResolve('CREDIT_WALLET')}
                    disabled={isResolving || !selectedWalletId}
                    className="w-full inline-flex justify-center items-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isResolving && <CircleNotch className="w-4 h-4 mr-2 animate-spin" />}
                    Credit to Selected Wallet
                  </button>
                  <button
                    onClick={() => handleResolve('DISMISS')}
                    disabled={isResolving}
                    className="w-full inline-flex justify-center items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70"
                  >
                    Dismiss / Ignore
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-2">
                  Already Resolved
                </span>
                <p className="text-sm text-gray-500 mt-2">Note: {item.resolution_note || 'None'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
