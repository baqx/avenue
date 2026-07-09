"use client";

import { useState } from "react";
import { ShieldWarning, MagnifyingGlass, Robot, CheckCircle, ArrowUUpLeft, CaretRight, Info } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

import { useGetSuspenseItemsQuery, useResolveSuspenseMutation } from "@/lib/api/suspenseApi";
import { useGetWalletsQuery } from "@/lib/api/walletsApi";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { TableShimmer } from "@/components/ui/Shimmer";

export default function SuspensePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isSelectingWallet, setIsSelectingWallet] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  
  const { data: suspenseData, isLoading: isSuspenseLoading } = useGetSuspenseItemsQuery({ page: 1, limit: 100, status: 'PENDING' });
  const { data: walletsData } = useGetWalletsQuery({ page: 1, limit: 100 });
  const wallets = walletsData?.items || [];
  const [resolveSuspense, { isLoading: isResolving }] = useResolveSuspenseMutation();
  const toast = useToast();

  const rawItems = suspenseData?.items || [];
  const filteredItems = rawItems.filter(i => 
    (i.nomba_reference && i.nomba_reference.toLowerCase().includes(searchQuery.toLowerCase())) || 
    i.id.includes(searchQuery) ||
    (i.raw_narration && i.raw_narration.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (i.account_number && i.account_number.includes(searchQuery))
  );

  const handleResolve = async (action: 'CREDIT_WALLET' | 'REFUND', target_wallet_id?: string) => {
    if (!selectedItem) return;
    if (action === 'CREDIT_WALLET' && !target_wallet_id) {
      toast.error('Validation Error', 'Please select a wallet first.');
      return;
    }
    try {
      await resolveSuspense({ id: selectedItem.id, body: { action, target_wallet_id } }).unwrap();
      toast.success('Resolved', `Transaction successfully ${action === 'CREDIT_WALLET' ? 'credited' : 'refunded'}.`);
      setSelectedItem(null);
      setIsSelectingWallet(false);
      setSelectedWalletId("");
    } catch (err: any) {
      toast.error('Failed', err?.data?.error?.message || err?.data?.detail || 'Could not resolve transaction.');
    }
  };

  return (
    <PageReveal>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#022c22] tracking-tight flex items-center gap-3">
            Suspense Queue 
            <span className="bg-[#fffbeb] text-[#b45309] border border-[#fcd34d] px-2.5 py-0.5 rounded text-sm font-bold flex items-center gap-1.5">
              <ShieldWarning weight="fill" />
              {rawItems.length} Action Needed
            </span>
          </h1>
          <p className="text-[#6a6c6c] mt-1">Resolve transactions that did not meet the AI auto-reconciliation threshold.</p>
        </div>
      </div>

      {rawItems.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-[#fffbeb] to-[#fef3c7] border border-[#fcd34d] rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <ShieldWarning className="w-6 h-6 text-[#b45309] shrink-0 mt-0.5" weight="duotone" />
          <div>
            <h3 className="font-bold text-[#92400e]">Attention Required</h3>
            <p className="text-[#b45309] text-sm mt-0.5">There are transactions in the suspense queue that require manual resolution. The AI was unable to automatically reconcile them.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e4e7e9] shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#e4e7e9] flex items-center bg-[#f7f9fb]">
          <div className="relative max-w-sm w-full">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbbdbd]" />
            <input 
              type="text"
              placeholder="Search by Nomba Ref or Narration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
            />
          </div>
        </div>

        {isSuspenseLoading ? (
          <TableShimmer rows={4} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-[#e4e7e9]">
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Nomba Ref</th>
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Amount</th>
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm">Reason</th>
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    return (
                    <tr 
                      key={item.id} 
                      className="border-b border-[#e4e7e9] last:border-0 hover:bg-[#fffbeb]/50 transition-colors group"
                    >
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-mono text-sm text-[#022c22] font-semibold">{item.nomba_reference || item.id.substring(0, 8) + '...'}</div>
                        <div className="text-xs text-[#6a6c6c] mt-1">{new Date(item.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 font-bold text-[#b45309] whitespace-nowrap">
                        ₦{(item.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-sm text-[#022c22]">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                          <span>{item.reason}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <Button 
                          onClick={() => setSelectedItem(item)}
                          className="h-8 px-4 bg-[#f59e0b] hover:bg-[#d97706] text-white text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] transition-all border-none"
                        >
                          Resolve
                        </Button>
                      </td>
                    </tr>
                  )})}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-[#6a6c6c]">
                        <CheckCircle className="w-12 h-12 mx-auto text-[#10b981] mb-3 opacity-50" />
                        <div className="font-bold text-[#022c22] text-lg">Queue is clear!</div>
                        <div className="text-sm mt-1">No transactions are currently in suspense.</div>
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
          {filteredItems.map((item) => {
            return (
            <div key={item.id} className="p-4 bg-[#fffbeb]/30">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-mono text-sm text-[#022c22] font-semibold">{item.nomba_reference || item.id.substring(0, 8) + '...'}</div>
                  <div className="text-xs text-[#6a6c6c] mt-0.5">{new Date(item.created_at).toLocaleDateString()}</div>
                </div>
                <div className="font-bold text-[#b45309]">₦{(item.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="bg-white border border-[#fcd34d] p-3 rounded-lg text-sm text-[#92400e] mb-4">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Robot weight="fill" />
                  Resolution Needed
                </div>
                {item.reason}
              </div>
              <Button 
                onClick={() => setSelectedItem(item)}
                className="w-full h-10 justify-center bg-[#b45309] hover:bg-[#92400e] text-white font-bold"
              >
                Resolve Issue
              </Button>
            </div>
          )})}
          {filteredItems.length === 0 && (
            <div className="p-12 text-center text-[#6a6c6c]">
              <CheckCircle className="w-12 h-12 mx-auto text-[#10b981] mb-3 opacity-50" />
              <div className="font-bold text-[#022c22] text-lg">Queue is clear!</div>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      <Modal 
        isOpen={!!selectedItem} 
        onClose={() => {
          setSelectedItem(null);
          setIsSelectingWallet(false);
          setSelectedWalletId("");
        }} 
        title="Resolve Transaction"
      >
        {selectedItem && (
          <div className="space-y-6">
            
            {/* Context Box */}
            <div className="bg-[#f7f9fb] p-4 rounded-lg border border-[#e4e7e9]">
              <div className="text-xs font-semibold text-[#6a6c6c] uppercase tracking-wider mb-2">Raw Bank Narration</div>
              <div className="font-mono text-sm text-[#022c22] font-semibold break-all bg-white p-2 border border-[#e4e7e9] rounded">
                {selectedItem.raw_narration}
              </div>
              <div className="flex justify-between items-end mt-3">
                <div className="text-xs text-[#6a6c6c]">Intended Wallet: <span className="font-mono text-[#022c22]">{selectedItem.account_number}</span></div>
                <div className="font-bold text-lg text-[#022c22]">₦{(selectedItem.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-[#022c22]">Select Resolution Action:</div>
              
              {!isSelectingWallet ? (
                <button onClick={() => setIsSelectingWallet(true)} className="w-full text-left p-4 rounded-xl border border-[#e4e7e9] hover:border-[#10b981] hover:bg-[#f0fdf4] transition-all group flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#022c22] flex items-center gap-2">
                      <CheckCircle weight="fill" className="text-[#10b981] group-hover:scale-110 transition-transform" />
                      Force Accept to Wallet
                    </div>
                    <div className="text-sm text-[#6a6c6c] mt-1 ml-6">Credit the funds to a specific wallet.</div>
                  </div>
                  <CaretRight className="text-[#bbbdbd] group-hover:text-[#10b981]" />
                </button>
              ) : (
                <div className="p-4 rounded-xl border border-[#10b981]/50 bg-[#f0fdf4] space-y-4">
                  <div className="font-bold text-[#022c22] flex items-center gap-2">
                    <CheckCircle weight="fill" className="text-[#10b981]" />
                    Select Target Wallet
                  </div>
                  <select 
                    value={selectedWalletId} 
                    onChange={e => setSelectedWalletId(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-[#e4e7e9] text-sm outline-none bg-white focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
                  >
                    <option value="">-- Choose a wallet --</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.customer_reference} ({w.first_name} {w.last_name}) - {w.account_number}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button onClick={() => setIsSelectingWallet(false)} variant="outline" className="flex-1 bg-white" disabled={isResolving}>Cancel</Button>
                    <Button onClick={() => handleResolve('CREDIT_WALLET', selectedWalletId)} className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white" disabled={isResolving}>
                      {isResolving ? "Resolving..." : "Confirm Credit"}
                    </Button>
                  </div>
                </div>
              )}

              <button onClick={() => handleResolve('REFUND')} disabled={isResolving} className={`w-full text-left p-4 rounded-xl border border-[#e4e7e9] transition-all group flex items-center justify-between ${isResolving ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-400 hover:bg-red-50'}`}>
                <div>
                  <div className="font-bold text-[#022c22] flex items-center gap-2">
                    <ArrowUUpLeft weight="bold" className="text-red-500 group-hover:scale-110 transition-transform" />
                    Bounce / Refund
                  </div>
                  <div className="text-sm text-[#6a6c6c] mt-1 ml-6">Reverse the transaction via Nomba automatically.</div>
                </div>
                <CaretRight className="text-[#bbbdbd] group-hover:text-red-500" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageReveal>
  );
}
