"use client";

import { useState } from "react";
import { MagnifyingGlass, Funnel, ArrowUpRight, ArrowDownLeft, Robot, CheckCircle, Info } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

import { useGetGlobalTransactionsQuery } from "@/lib/api/ledgerApi";

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  
  const { data: txData } = useGetGlobalTransactionsQuery({ page: 1, limit: 100 });
  const rawTxs = txData?.items || [];

  const filteredTx = rawTxs.filter(t => 
    t.id.includes(searchQuery) || 
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
                  className="border-b border-[#e4e7e9] last:border-0 hover:bg-[#f0fdf4]/50 transition-colors cursor-pointer group"
                >
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'CREDIT' ? 'bg-[#f0fdf4] text-[#059669]' : 'bg-red-50 text-red-600'}`}>
                        {tx.type === 'CREDIT' ? <ArrowDownLeft weight="bold" /> : <ArrowUpRight weight="bold" />}
                      </div>
                      <div>
                        <div className="font-medium text-[#022c22]">{tx.avenue_intelligence?.suggested_label || "Unknown Intent"}</div>
                        <div className="text-xs text-[#6a6c6c] font-mono mt-0.5">{tx.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-[#022c22] whitespace-nowrap">
                    <span className={tx.type === "CREDIT" ? "text-[#059669]" : "text-[#022c22]"}>
                      {tx.type === "CREDIT" ? "+" : "-"}₦{(tx.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-medium text-[#022c22] whitespace-nowrap">
                    {tx.wallet_id.substring(0, 8)}...
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {!isSuspense && (
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#f0fdf4] text-[#059669] border border-[#10b981]/30">
                        SETTLED
                      </span>
                    )}
                    {isSuspense && (
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#fffbeb] text-[#b45309] border border-[#fcd34d]">
                        SUSPENSE
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right text-sm text-[#6a6c6c] whitespace-nowrap">{new Date(tx.created_at).toLocaleDateString()}</td>
                </tr>
              )})}
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6a6c6c]">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
                    <div className="font-medium text-[#022c22]">{tx.avenue_intelligence?.suggested_label || "Unknown Intent"}</div>
                    <div className="text-[10px] font-mono text-[#6a6c6c] mt-0.5">{tx.id}</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-end mt-4">
                <div className="text-xs text-[#6a6c6c]">
                  Wallet: <span className="font-mono text-[#022c22]">{tx.wallet_id.substring(0, 8)}...</span>
                </div>
                <span className={`font-bold ${tx.type === "CREDIT" ? "text-[#059669]" : "text-[#022c22]"}`}>
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
      <Modal 
        isOpen={!!selectedTx} 
        onClose={() => setSelectedTx(null)} 
        title="Transaction Details"
      >
        {selectedTx && (
          <div className="space-y-6 pb-2">
            <div className="text-center pb-6 border-b border-[#e4e7e9]">
              <div className="text-xs font-semibold text-[#6a6c6c] uppercase tracking-wider mb-2">
                {selectedTx.type === 'CREDIT' ? 'Received' : 'Sent'}
              </div>
              <div className="text-4xl font-bold text-[#022c22] tracking-tighter">
                ₦{(selectedTx.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-3 inline-flex">
                {!selectedTx.avenue_intelligence?.flags?.includes('suspense_queue') ? (
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#f0fdf4] text-[#059669] border border-[#10b981]/30">
                    SETTLED
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#fffbeb] text-[#b45309] border border-[#fcd34d]">
                    IN SUSPENSE
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-[#e4e7e9] border-dashed">
                <span className="text-[#6a6c6c]">Internal ID</span>
                <span className="font-mono font-medium text-[#022c22]">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#e4e7e9] border-dashed">
                <span className="text-[#6a6c6c]">Nomba Ref</span>
                <span className="font-mono font-medium text-[#022c22]">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#e4e7e9] border-dashed">
                <span className="text-[#6a6c6c]">Wallet ID</span>
                <span className="font-mono font-medium text-[#022c22]">{selectedTx.wallet_id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#e4e7e9] border-dashed">
                <span className="text-[#6a6c6c]">Date & Time</span>
                <span className="font-medium text-[#022c22]">{new Date(selectedTx.created_at).toLocaleString()}</span>
              </div>
            </div>

            {selectedTx.avenue_intelligence && (
              <div className="mt-6 bg-[#022c22] rounded-xl p-5 border border-[#10b981]">
                <div className="flex items-center gap-2 mb-4 text-[#10b981]">
                  <Robot weight="fill" className="w-5 h-5" />
                  <span className="font-bold text-sm">Avenue Intelligence Report</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-[#6ee7b7] mb-1">Raw Bank Narration</div>
                    <div className="font-mono text-sm text-white bg-[#064e3b] p-2 rounded border border-[#10b981]/30 break-all">
                      {selectedTx.raw_narration}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-[#6ee7b7] mb-1">Intent Resolution Confidence</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-[#064e3b] rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${selectedTx.avenue_intelligence.confidence_score > 0.75 ? "bg-[#10b981]" : "bg-amber-400"}`} 
                          style={{ width: `${selectedTx.avenue_intelligence.confidence_score * 100}%` }} 
                        />
                      </div>
                      <span className="font-mono text-sm text-white font-bold shrink-0">
                        {(selectedTx.avenue_intelligence.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedTx.avenue_intelligence?.flags?.includes('suspense_queue') && (
              <div className="bg-[#fffbeb] rounded-lg p-4 flex items-start gap-3 border border-[#fcd34d]">
                <Info className="w-5 h-5 text-[#b45309] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[#b45309]">Suspense Resolution Needed</h4>
                  <p className="text-sm text-[#92400e] mt-1">This transaction did not meet the AI confidence threshold for auto-reconciliation. Please resolve it in the Suspense Queue.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageReveal>
  );
}
