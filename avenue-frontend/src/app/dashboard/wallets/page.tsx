"use client";

import { useState } from "react";
import { Plus, MagnifyingGlass, Wallet, LockKey, LockKeyOpen, Trash, Copy } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

import { useGetWalletsQuery, useCreateWalletMutation } from "@/lib/api/walletsApi";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { useRouter } from "next/navigation";
import { TableShimmer } from "@/components/ui/Shimmer";

export default function WalletsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: walletsData, isLoading: isWalletsLoading } = useGetWalletsQuery({ page: 1, limit: 100 });
  const [createWallet, { isLoading: isCreating }] = useCreateWalletMutation();
  const [formData, setFormData] = useState({ customer_reference: '', first_name: '', last_name: '', email: '', label: '', system_prompt: '' });
  const toast = useToast();
  const router = useRouter();

  const rawWallets = walletsData?.items || [];
  const filteredWallets = rawWallets.filter(w => 
    w.account_number.includes(searchQuery) || (w.label && w.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleProvision = async () => {
    try {
      await createWallet(formData).unwrap();
      toast.success('Wallet created', 'NUBAN provisioned successfully.');
      setIsModalOpen(false);
      setFormData({ customer_reference: '', first_name: '', last_name: '', email: '', label: '', system_prompt: '' });
    } catch (err: any) {
      toast.error('Failed', err?.data?.error?.message || err?.data?.detail || 'Could not provision wallet.');
    }
  };

  return (
    <PageReveal>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#022c22] tracking-tight">Virtual Wallets</h1>
          <p className="text-[#6a6c6c] mt-1">Manage provisioned NUBANs and their balances.</p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-[#022c22] text-white hover:bg-[#064e3b] shrink-0">
          <Plus weight="bold" />
          <span>Provision Wallet</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#e4e7e9] shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#e4e7e9] flex items-center bg-[#f7f9fb]">
          <div className="relative max-w-sm w-full">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbbdbd]" />
            <input 
              type="text"
              placeholder="Search by NUBAN or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
            />
          </div>
        </div>

        {isWalletsLoading ? (
          <TableShimmer rows={5} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-[#e4e7e9]">
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">NUBAN</th>
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Label</th>
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Status</th>
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Balance</th>
                    <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap text-right">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWallets.map((wallet) => (
                    <tr key={wallet.id} onClick={() => router.push(`/dashboard/wallets/${wallet.id}`)} className="border-b border-[#e4e7e9] last:border-0 hover:bg-[#f0fdf4] hover:-translate-y-[1px] hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition-all duration-200 group cursor-pointer relative z-0 hover:z-10">
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-[#022c22]">{wallet.account_number}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(wallet.account_number); toast.success("Copied", "NUBAN copied to clipboard."); }}
                            className="text-[#bbbdbd] hover:text-[#022c22] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Copy NUBAN"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-[#022c22] whitespace-nowrap font-medium">{wallet.label}</td>
                      <td className="p-4 whitespace-nowrap">
                        {wallet.status === "ACTIVE" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f0fdf4] text-[#059669] border border-[#10b981]/30 uppercase tracking-wider">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#059669]"></span>
                            </span>
                            ACTIVE
                          </span>
                        )}
                        {wallet.status === "FROZEN" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wider">
                            FROZEN
                          </span>
                        )}
                        {wallet.status === "CLOSED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider">
                            CLOSED
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-[#022c22] whitespace-nowrap">₦{(wallet.balance / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right text-sm text-[#6a6c6c] whitespace-nowrap">{new Date(wallet.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {filteredWallets.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-16 text-center">
                        <div className="flex flex-col items-center justify-center text-[#6a6c6c]">
                          <Wallet className="w-12 h-12 mb-4 text-[#bbbdbd]" weight="duotone" />
                          <p className="text-lg font-semibold text-[#022c22] mb-1">No wallets found</p>
                          <p className="text-sm">Get started by provisioning a new NUBAN.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (Instead of overflowing table) */}
            <div className="md:hidden divide-y divide-[#e4e7e9]">
              {filteredWallets.map((wallet) => (
                <div key={wallet.id} onClick={() => router.push(`/dashboard/wallets/${wallet.id}`)} className="p-4 hover:bg-[#f7f9fb] transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-[#022c22]">{wallet.label}</div>
                      <div className="font-mono text-sm text-[#6a6c6c] mt-0.5">{wallet.account_number}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#022c22]">₦{(wallet.balance / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="mt-1">
                        {wallet.status === "ACTIVE" && <span className="text-[10px] font-bold text-[#059669] bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#10b981]/30">ACTIVE</span>}
                        {wallet.status === "FROZEN" && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">FROZEN</span>}
                        {wallet.status === "CLOSED" && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">CLOSED</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredWallets.length === 0 && (
                <div className="p-8 text-center text-[#6a6c6c]">No wallets found.</div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Provision New Wallet"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#6a6c6c]">
            A dedicated NUBAN will be provisioned on Nomba instantly.
          </p>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Customer Reference</label>
            <input 
              type="text"
              value={formData.customer_reference}
              onChange={(e) => setFormData({ ...formData, customer_reference: e.target.value })}
              className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
              placeholder="e.g. user_987"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#022c22]">First Name</label>
              <input 
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
                placeholder="e.g. John"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#022c22]">Last Name</label>
              <input 
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
                placeholder="e.g. Doe"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Email Address</label>
            <input 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
              placeholder="e.g. john@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Label</label>
            <input 
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
              placeholder="e.g. User #981 Wallet"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">AI System Prompt (Optional)</label>
            <textarea 
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              className="w-full h-24 p-3.5 rounded-lg border border-[#e4e7e9] text-sm resize-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
              placeholder="Context for the AI reconciliation engine..."
            />
          </div>
          
          <Button 
            className="w-full justify-center bg-[#022c22] text-white hover:bg-[#064e3b] h-12 mt-2" 
            onClick={handleProvision}
            disabled={isCreating}
          >
            {isCreating ? "Provisioning..." : "Provision NUBAN"}
          </Button>
        </div>
      </Modal>
    </PageReveal>
  );
}
