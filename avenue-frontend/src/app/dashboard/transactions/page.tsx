"use client";

import { useState } from "react";
import { MagnifyingGlass, Funnel, ArrowUpRight, ArrowDownLeft, Robot, CheckCircle, Info } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

import { useGetGlobalTransactionsQuery } from "@/lib/api/ledgerApi";
import { TableShimmer } from "@/components/ui/Shimmer";
import { TransactionModal } from "@/components/dashboard/TransactionModal";

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  
  const { data: txData, isLoading: isTxLoading } = useGetGlobalTransactionsQuery({ page: 1, limit: 100 });
  const rawTxs = txData?.items || [];

  const filteredTx = rawTxs.filter(t => 
    t.id.includes(searchQuery) || 
    (t.nomba_reference && t.nomba_reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.raw_narration && t.raw_narration.toLowerCase().includes(searchQuery.toLowerCase())) ||
    t.wallet_id.includes(searchQuery)
  );

  return (
    <PageReveal>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#022c22] tracking-tight">Global Ledger</h1>
          <p className="text-[#6a6c6c] mt-1">Immutable double-entry log of all debits and credits.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e4e7e9] shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#e4e7e9] flex flex-col sm:flex-row items-center gap-4 bg-[#f7f9fb]">
          <div className="relative w-full sm:max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbbdbd]" />
            <input 
              type="text"
              placeholder="Search by Nomba Ref, Wallet NUBAN, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
            />
          </div>
          <Button variant="outline" className="h-10 text-sm gap-2 border-[#e4e7e9] text-[#022c22] w-full sm:w-auto shrink-0">
            <Funnel size={16} />
            Filter by Wallet
          </Button>
        </div>

        {isTxLoading ? (
          <TableShimmer rows={6} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-[#e4e7e9]">
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Transaction</th>
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Amount</th>
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Wallet (NUBAN)</th>
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Status</th>
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map((tx) => {
                    const isSuspense = tx.avenue_intelligence?.flags?.includes('suspense_queue');
                    return (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="border-b border-[#e4e7e9] last:border-0 hover:bg-[#f0fdf4] hover:-translate-y-[1px] hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition-all duration-200 cursor-pointer group relative z-0 hover:z-10"
                    >
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'CREDIT' ? 'bg-[#f0fdf4] text-[#059669]' : 'bg-red-50 text-red-600'}`}>
                            {tx.type === 'CREDIT' ? <ArrowDownLeft weight="bold" /> : <ArrowUpRight weight="bold" />}
                          </div>
                          <div>
                            <div className="font-medium text-[#022c22] truncate max-w-[200px]">
                              {tx.avenue_intelligence?.suggested_label || tx.raw_narration || "Unknown Intent"}
                            </div>
                            <div className="text-xs text-[#6a6c6c] font-mono mt-0.5">{tx.nomba_reference || tx.id.substring(0, 8) + '...'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold whitespace-nowrap">
                        <span className={tx.type === "CREDIT" ? "text-[#059669]" : "text-[#6a6c6c]"}>
                          {tx.type === "CREDIT" ? "+" : "-"}₦{(tx.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-medium text-[#022c22] whitespace-nowrap">
                        {tx.wallet_id.substring(0, 8)}...
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {tx.status === "SETTLED" ? (
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#f0fdf4] text-[#059669] border border-[#10b981]/30">
                            SETTLED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#fffbeb] text-[#b45309] border border-[#fcd34d]">
                            PENDING (SUSPENSE)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right text-sm text-[#6a6c6c] whitespace-nowrap">{new Date(tx.created_at).toLocaleDateString()}</td>
                    </tr>
                  )})}
                  {filteredTx.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-16 text-center">
                        <div className="flex flex-col items-center justify-center text-[#6a6c6c]">
                          <svg className="w-16 h-16 mb-4 text-[#e4e7e9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-lg font-semibold text-[#022c22] mb-1">No transactions found</p>
                          <p className="text-sm">The ledger is currently empty.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[#e4e7e9]">
          {filteredTx.map((tx) => {
            const isSuspense = tx.avenue_intelligence?.flags?.includes('suspense_queue');
            return (
            <div 
              key={tx.id} 
              onClick={() => setSelectedTx(tx)}
              className="p-4 hover:bg-[#f0fdf4]/50 transition-colors active:bg-[#f0fdf4] cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'CREDIT' ? 'bg-[#f0fdf4] text-[#059669]' : 'bg-red-50 text-red-600'}`}>
                    {tx.type === 'CREDIT' ? <ArrowDownLeft weight="bold" /> : <ArrowUpRight weight="bold" />}
                  </div>
                  <div>
                    <div className="font-medium text-[#022c22] line-clamp-1">{tx.avenue_intelligence?.suggested_label || tx.raw_narration || "Unknown Intent"}</div>
                    <div className="text-[10px] font-mono text-[#6a6c6c] mt-0.5">{tx.nomba_reference || tx.id.substring(0, 8) + '...'}</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-end mt-4">
                <div className="text-xs text-[#6a6c6c]">
                  Wallet: <span className="font-mono text-[#022c22]">{tx.wallet_id.substring(0, 8)}...</span>
                </div>
                <span className={`font-bold ${tx.type === "CREDIT" ? "text-[#059669]" : "text-[#6a6c6c]"}`}>
                  {tx.type === "CREDIT" ? "+" : "-"}₦{(tx.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )})}
          {filteredTx.length === 0 && (
            <div className="p-8 text-center text-[#6a6c6c]">No transactions found.</div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </PageReveal>
  );
}
