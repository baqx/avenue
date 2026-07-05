'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGetSuspenseItemsQuery } from '@/lib/api/suspenseApi';
import { TableShimmer } from '@/components/ui/Shimmer';
import { CaretRight, WarningCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export default function SuspensePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetSuspenseItemsQuery({ page, limit: 20 });

  const formatCurrency = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric'
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Pending Review</span>;
      case 'RESOLVED': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Resolved</span>;
      case 'FLAGGED': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Flagged</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Suspense Queue</h1>
          <p className="mt-2 text-sm text-gray-700">Payments that require manual review due to low AI confidence or closed accounts.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <TableShimmer rows={10} />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-red-600 bg-red-50">
            Failed to load suspense queue. Please try again.
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <WarningCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Queue is empty</h3>
            <p className="mt-1">All payments have been successfully routed by the AI engine.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Resolve</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.sender_name || 'Unknown Sender'}</div>
                      <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{item.raw_narration}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">{item.reason}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/dashboard/suspense/${item.id}`} className="text-blue-600 hover:text-blue-900 inline-flex items-center">
                        Review <CaretRight className="ml-1 w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
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
