'use client';

import React, { useState } from 'react';
import { useGetGlobalTransactionsQuery } from '@/lib/api/ledgerApi';
import { TableShimmer } from '@/components/ui/Shimmer';
import { ArrowDownLeft, ArrowUpRight, Sparkle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetGlobalTransactionsQuery({ page, limit: 20 });

  const formatCurrency = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric'
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Global Ledger</h1>
          <p className="mt-2 text-sm text-gray-700">All inbound credits and outbound debits across all wallets.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <TableShimmer rows={10} />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-red-600 bg-red-50">
            Failed to load transactions. Please try again.
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center text-gray-500">
            <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avenue AI Context</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={cn("p-2 rounded-full", tx.type === 'CREDIT' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                        {tx.type === 'CREDIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{tx.sender_name || 'System / Internal'}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1 text-wrap max-w-xs">{tx.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      {tx.avenue_intelligence ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-900">
                            <Sparkle className="w-4 h-4 text-purple-500" weight="fill" />
                            {tx.avenue_intelligence.extracted_intent || tx.avenue_intelligence.suggested_label}
                          </div>
                          {tx.avenue_intelligence.flags?.map(flag => (
                            <span key={flag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 w-fit">
                              {flag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No AI Context</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                      <span className={tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>
                        {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination placeholder */}
        {data && data.total > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to <span className="font-medium">{Math.min(page * 20, data.total)}</span> of{' '}
                  <span className="font-medium">{data.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Next</button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
