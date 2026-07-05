'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGetWalletsQuery } from '@/lib/api/walletsApi';
import { TableShimmer } from '@/components/ui/Shimmer';
import { Plus, CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export default function WalletsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetWalletsQuery({ page, limit: 20 });

  const formatCurrency = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'FROZEN': return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Wallets</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all provisioned virtual accounts and their balances.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/wallets/new"
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Provision Wallet
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200 flex items-center justify-between">
          <div className="relative rounded-md max-w-sm w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlass className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
              placeholder="Search by customer reference or name..."
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-4">
            <TableShimmer rows={5} />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-red-600 bg-red-50">
            Failed to load wallets. Please try again.
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center text-gray-500">
            <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No wallets provisioned</h3>
            <p className="mt-1">Get started by provisioning a new virtual account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{wallet.account_number}</div>
                      <div className="text-sm text-gray-500">{wallet.bank_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{wallet.first_name} {wallet.last_name}</div>
                      <div className="text-sm text-gray-500">{wallet.customer_reference}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusColor(wallet.status))}>
                        {wallet.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(wallet.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/dashboard/wallets/${wallet.id}`} className="text-blue-600 hover:text-blue-900 inline-flex items-center">
                        View <CaretRight className="ml-1 w-4 h-4" />
                      </Link>
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
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
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
