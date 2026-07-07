"use client";

import { useState } from "react";
import { Wallet, ShieldWarning, ArrowsLeftRight, Plus } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { SnapScroll } from "@/components/ui/SnapScroll";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";



import { useGetOverviewStatsQuery } from "@/lib/api/analyticsApi";
import { useGetGlobalTransactionsQuery } from "@/lib/api/ledgerApi";
import { useGetProfileQuery } from "@/lib/api/developerApi";
import { CardShimmer, TableShimmer } from "@/components/ui/Shimmer";
import { TransactionModal } from "@/components/dashboard/TransactionModal";

export default function DashboardOverview() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const { data: profile } = useGetProfileQuery();
  const { data: stats, isLoading: isStatsLoading } = useGetOverviewStatsQuery();
  const { data: txData, isLoading: isTxLoading } = useGetGlobalTransactionsQuery({ page: 1, limit: 5 });
  const recentTxs = txData?.items || [];

  return (
    <PageReveal>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#022c22] tracking-tight">Overview</h1>
          <p className="text-[#6a6c6c] mt-1">Welcome back{profile?.company_name ? `, ${profile.company_name}` : ''}.</p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-[#022c22] text-white hover:bg-[#064e3b]">
          <Plus weight="bold" />
          <span className="hidden sm:inline">Create Wallet</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {isStatsLoading ? (
          <>
            <CardShimmer />
            <CardShimmer />
            <CardShimmer />
          </>
        ) : (
          <>
            {/* Card 1: Balance */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#022c22] to-[#064e3b] p-6 shadow-md flex flex-col justify-between h-full min-h-[150px] border border-[#022c22]">
              {/* Doodle Pattern */}
              <div 
                className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
              />
              <div className="relative z-10 flex items-center gap-2 text-[#a7f3d0]">
                <Wallet className="w-5 h-5" />
                <span className="font-semibold text-sm">Total Ledger Balance</span>
              </div>
              <div className="relative z-10 text-3xl font-bold text-white mt-4 drop-shadow-sm">
                ₦{((stats?.total_volume_kobo || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Card 2: Wallets */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-[#f8fafc] p-6 shadow-sm flex flex-col justify-between h-full min-h-[150px] border border-[#e2e8f0]">
              {/* Doodle Pattern */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230f172a' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}
              />
              <div className="relative z-10 flex items-center gap-2 text-[#64748b]">
                <ArrowsLeftRight className="w-5 h-5" />
                <span className="font-semibold text-sm">Active Wallets</span>
              </div>
              <div className="relative z-10 text-3xl font-bold text-[#0f172a] mt-4">{stats?.active_wallets || 0}</div>
            </div>

            {/* Card 3: Suspense */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] p-6 shadow-sm flex flex-col justify-between h-full min-h-[150px] border border-[#fcd34d]">
              {/* Doodle Pattern */}
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%23d97706' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
              />
              <div className="relative z-10 flex items-center gap-2 text-[#b45309]">
                <ShieldWarning className="w-5 h-5" />
                <span className="font-semibold text-sm">Action Required (Suspense)</span>
              </div>
              <div className="relative z-10 text-3xl font-bold text-[#92400e] mt-4 drop-shadow-sm">{stats?.pending_suspense_count || 0} items</div>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity Table */}
      {/* Recent Activity Table */}
      {isTxLoading ? (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-[#022c22] mb-4">Recent Activity</h2>
          <TableShimmer rows={5} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e4e7e9] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#e4e7e9]">
            <h2 className="text-lg font-bold text-[#022c22]">Recent Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f9fb] border-b border-[#e4e7e9]">
                  <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Description</th>
                  <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Amount</th>
                  <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Status</th>
                  <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTxs.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-[#6a6c6c]">No recent activity</td></tr>
                ) : recentTxs.map((tx) => {
                  const isSuspense = tx.avenue_intelligence?.flags?.includes('suspense_queue');
                  return (
                    <tr 
                      key={tx.id} 
                      className="border-b border-[#e4e7e9] last:border-0 hover:bg-[#f0fdf4]/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <td className="p-4 font-medium text-[#022c22] whitespace-nowrap truncate max-w-[200px]">
                        {tx.avenue_intelligence?.suggested_label || tx.raw_narration || "Unknown Intent"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={tx.type === "CREDIT" ? "text-[#059669] font-semibold" : "text-[#022c22]"}>
                          {tx.type === "CREDIT" ? "+" : "-"}₦{(tx.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {tx.status === "SETTLED" && (
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#f0fdf4] text-[#059669] border border-[#10b981]/30">
                            SETTLED
                          </span>
                        )}
                        {tx.status === "PENDING" && (
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#fffbeb] text-[#b45309] border border-[#fcd34d]">
                            PENDING
                          </span>
                        )}
                        {tx.status === "REVERSED" && (
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
                            REVERSED
                          </span>
                        )}
                        {!["SETTLED", "PENDING", "REVERSED"].includes(tx.status) && (
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">
                            {tx.status}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right text-sm text-[#6a6c6c] whitespace-nowrap">{new Date(tx.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reusable Modal Demo */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create new wallet"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#6a6c6c]">
            Provision a new virtual NUBAN instantly on Nomba. This account can receive transfers immediately.
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
              placeholder="e.g. Apartment 4B Rent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Account Context (AI System Prompt)</label>
            <textarea 
              className="w-full h-24 p-3 rounded-lg border border-[#e4e7e9] text-sm resize-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
              placeholder="e.g. This wallet receives rent payments for Apartment 4B..."
            />
          </div>
          <Button 
            className="w-full justify-center bg-[#022c22] text-white hover:bg-[#064e3b]" 
            onClick={() => setIsModalOpen(false)}
          >
            Provision Wallet
          </Button>
        </div>
      </Modal>

      <TransactionModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </PageReveal>
  );
}
