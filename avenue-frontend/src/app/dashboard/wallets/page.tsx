"use client";

import { useState } from "react";
import { Plus, MagnifyingGlass, Wallet, LockKey, LockKeyOpen, Trash } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

// Mock data
const WALLETS = [
  { id: "wal_1", nuban: "0012345678", label: "Apt 4B Rent", status: "ACTIVE", balance: "₦450,000.00", created: "2024-01-12" },
  { id: "wal_2", nuban: "0012345679", label: "John Doe Subs", status: "ACTIVE", balance: "₦12,500.00", created: "2024-01-15" },
  { id: "wal_3", nuban: "0012345680", label: "Escrow - TX_09", status: "FROZEN", balance: "₦1,200,000.00", created: "2024-02-01" },
  { id: "wal_4", nuban: "0012345681", label: "Marketing Fund", status: "CLOSED", balance: "₦0.00", created: "2023-11-20" },
];

export default function WalletsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWallets = WALLETS.filter(w => 
    w.nuban.includes(searchQuery) || w.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <tr key={wallet.id} className="border-b border-[#e4e7e9] last:border-0 hover:bg-[#f0fdf4]/50 transition-colors group cursor-pointer">
                  <td className="p-4 font-mono font-medium text-[#022c22] whitespace-nowrap">{wallet.nuban}</td>
                  <td className="p-4 text-[#022c22] whitespace-nowrap font-medium">{wallet.label}</td>
                  <td className="p-4 whitespace-nowrap">
                    {wallet.status === "ACTIVE" && (
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#f0fdf4] text-[#059669] border border-[#10b981]/30">
                        ACTIVE
                      </span>
                    )}
                    {wallet.status === "FROZEN" && (
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                        FROZEN
                      </span>
                    )}
                    {wallet.status === "CLOSED" && (
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                        CLOSED
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-semibold text-[#022c22] whitespace-nowrap">{wallet.balance}</td>
                  <td className="p-4 text-right text-sm text-[#6a6c6c] whitespace-nowrap">{wallet.created}</td>
                </tr>
              ))}
              {filteredWallets.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6a6c6c]">No wallets found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (Instead of overflowing table) */}
        <div className="md:hidden divide-y divide-[#e4e7e9]">
          {filteredWallets.map((wallet) => (
            <div key={wallet.id} className="p-4 hover:bg-[#f0fdf4]/50 transition-colors active:bg-[#f0fdf4]">
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono font-medium text-[#022c22]">{wallet.nuban}</span>
                {wallet.status === "ACTIVE" && <span className="text-[10px] uppercase font-bold text-[#059669]">ACTIVE</span>}
                {wallet.status === "FROZEN" && <span className="text-[10px] uppercase font-bold text-blue-600">FROZEN</span>}
                {wallet.status === "CLOSED" && <span className="text-[10px] uppercase font-bold text-red-600">CLOSED</span>}
              </div>
              <div className="font-medium text-[#022c22] mb-1">{wallet.label}</div>
              <div className="flex justify-between items-end mt-4">
                <span className="text-[#6a6c6c] text-xs">{wallet.created}</span>
                <span className="font-semibold text-[#022c22]">{wallet.balance}</span>
              </div>
            </div>
          ))}
          {filteredWallets.length === 0 && (
            <div className="p-8 text-center text-[#6a6c6c]">No wallets found.</div>
          )}
        </div>
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
              className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
              placeholder="e.g. user_987"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#022c22]">First Name</label>
              <input 
                type="text"
                className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
                placeholder="e.g. John"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#022c22]">Last Name</label>
              <input 
                type="text"
                className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
                placeholder="e.g. Doe"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Email Address</label>
            <input 
              type="email"
              className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
              placeholder="e.g. john@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Label</label>
            <input 
              type="text"
              className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
              placeholder="e.g. User #981 Wallet"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">AI System Prompt (Optional)</label>
            <textarea 
              className="w-full h-24 p-3.5 rounded-lg border border-[#e4e7e9] text-sm resize-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
              placeholder="Context for the AI reconciliation engine..."
            />
          </div>
          
          <Button 
            className="w-full justify-center bg-[#022c22] text-white hover:bg-[#064e3b] h-12 mt-2" 
            onClick={() => setIsModalOpen(false)}
          >
            Provision NUBAN
          </Button>
        </div>
      </Modal>
    </PageReveal>
  );
}
