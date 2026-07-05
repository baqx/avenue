"use client";

import { useState } from "react";
import { Wallet, ShieldWarning, ArrowsLeftRight, Plus } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { SnapScroll } from "@/components/ui/SnapScroll";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";



import { useGetOverviewStatsQuery } from "@/lib/api/analyticsApi";
import { useGetGlobalTransactionsQuery } from "@/lib/api/ledgerApi";
import { CardShimmer, TableShimmer } from "@/components/ui/Shimmer";

export default function DashboardOverview() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: stats, isLoading: isStatsLoading } = useGetOverviewStatsQuery();
  const { data: txData, isLoading: isTxLoading } = useGetGlobalTransactionsQuery({ page: 1, limit: 5 });
  const recentTxs = txData?.items || [];

  return (
    <PageReveal>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#022c22] tracking-tight">Overview</h1>
          <p className="text-[#6a6c6c] mt-1">Welcome back, Zenith Pay.</p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-[#022c22] text-white hover:bg-[#064e3b]">
          <Plus weight="bold" />
          <span className="hidden sm:inline">Create Wallet</span>
        </Button>
      </div>

      {/* Metrics via SnapScroll */}
      <SnapScroll className="mb-10">
        {isStatsLoading ? (
          <>
            <CardShimmer />
            <CardShimmer />
            <CardShimmer />
          </>
        ) : (
          <>
            {/* Card 1: Balance */}
            <div className="bg-white rounded-xl border border-[#e4e7e9] p-6 shadow-sm flex flex-col justify-between h-full min-h-[140px]">
              <div className="flex items-center gap-2 text-[#6a6c6c]">
                <Wallet className="w-5 h-5" />
                <span className="font-semibold text-sm">Total Ledger Balance</span>
              </div>
              <div className="text-3xl font-bold text-[#022c22] mt-4">
                ₦{((stats?.total_volume_kobo || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Card 2: Wallets */}
            <div className="bg-white rounded-xl border border-[#e4e7e9] p-6 shadow-sm flex flex-col justify-between h-full min-h-[140px]">
              <div className="flex items-center gap-2 text-[#6a6c6c]">
                <ArrowsLeftRight className="w-5 h-5" />
                <span className="font-semibold text-sm">Active Wallets</span>
              </div>
              <div className="text-3xl font-bold text-[#022c22] mt-4">{stats?.active_wallets || 0}</div>
            </div>

            {/* Card 3: Suspense */}
            <div className="bg-[#fffbeb] rounded-xl border border-[#fcd34d] p-6 shadow-sm flex flex-col justify-between h-full min-h-[140px]">
              <div className="flex items-center gap-2 text-[#b45309]">
                <ShieldWarning className="w-5 h-5" />
                <span className="font-semibold text-sm">Action Required (Suspense)</span>
              </div>
              <div className="text-3xl font-bold text-[#b45309] mt-4">{stats?.pending_suspense_count || 0} items</div>
            </div>
          </>
        )}
      </SnapScroll>

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
                    <tr key={tx.id} className="border-b border-[#e4e7e9] last:border-0 hover:bg-[#f0fdf4]/50 transition-colors">
                      <td className="p-4 font-medium text-[#022c22] whitespace-nowrap">{tx.avenue_intelligence?.suggested_label || "Unknown Intent"}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={tx.type === "CREDIT" ? "text-[#059669] font-semibold" : "text-[#022c22]"}>
                          {tx.type === "CREDIT" ? "+" : "-"}₦{(tx.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {isSuspense ? (
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#fffbeb] text-[#b45309] border border-[#fcd34d]">
                            SUSPENSE
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#f0fdf4] text-[#059669] border border-[#10b981]/30">
                            SUCCESS
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
    </PageReveal>
  );
}
