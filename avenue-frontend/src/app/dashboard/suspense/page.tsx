"use client";

import { useState } from "react";
import { ShieldWarning, MagnifyingGlass, Robot, CheckCircle, ArrowUUpLeft, CaretRight, Info } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

// Mock data
const SUSPENSE_ITEMS = [
  { 
    id: "tx_10925", 
    ref: "nomba_119920386", 
    walletNuban: "0012345679",
    amount: "₦2,500.00", 
    rawNarration: "TRF/GTB/JOHN_DOE/1293810293",
    aiConfidence: 0.31,
    time: "Oct 23, 04:12 PM",
    reason: "Low Confidence: Unrecognized sender name format."
  },
  { 
    id: "tx_10940", 
    ref: "nomba_119920555", 
    walletNuban: "0012345681",
    amount: "₦400,000.00", 
    rawNarration: "TRF/WEMA/XYZ_CORP/PAYMENT_01",
    aiConfidence: 0.55,
    time: "Oct 24, 08:30 AM",
    reason: "Low Confidence: Overlapping intent signatures."
  },
];

export default function SuspensePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<typeof SUSPENSE_ITEMS[0] | null>(null);

  const filteredItems = SUSPENSE_ITEMS.filter(i => 
    i.ref.includes(searchQuery) || 
    i.rawNarration.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageReveal>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#022c22] tracking-tight flex items-center gap-3">
            Suspense Queue 
            <span className="bg-[#fffbeb] text-[#b45309] border border-[#fcd34d] px-2.5 py-0.5 rounded text-sm font-bold flex items-center gap-1.5">
              <ShieldWarning weight="fill" />
              {SUSPENSE_ITEMS.length} Action Needed
            </span>
          </h1>
          <p className="text-[#6a6c6c] mt-1">Resolve transactions that did not meet the AI auto-reconciliation threshold.</p>
        </div>
      </div>

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

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#e4e7e9]">
                <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Nomba Ref</th>
                <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Amount</th>
                <th className="p-4 font-semibold text-[#6a6c6c] text-sm">Reason</th>
                <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">AI Confidence</th>
                <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr 
                  key={item.id} 
                  className="border-b border-[#e4e7e9] last:border-0 hover:bg-[#fffbeb]/50 transition-colors group"
                >
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-mono text-sm text-[#022c22] font-semibold">{item.ref}</div>
                    <div className="text-xs text-[#6a6c6c] mt-1">{item.time}</div>
                  </td>
                  <td className="p-4 font-bold text-[#b45309] whitespace-nowrap">
                    {item.amount}
                  </td>
                  <td className="p-4 text-sm text-[#022c22]">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                      <span>{item.reason}</span>
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Robot weight="fill" className={item.aiConfidence > 0.5 ? "text-amber-500" : "text-red-500"} />
                      <span className="font-mono text-xs font-bold text-[#022c22]">
                        {(item.aiConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <Button 
                      onClick={() => setSelectedItem(item)}
                      className="h-8 px-3 bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-bold shadow-none"
                    >
                      Resolve
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#6a6c6c]">
                    <CheckCircle className="w-12 h-12 mx-auto text-[#10b981] mb-3 opacity-50" />
                    <div className="font-bold text-[#022c22] text-lg">Queue is clear!</div>
                    <div className="text-sm mt-1">No transactions are currently in suspense.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[#e4e7e9]">
          {filteredItems.map((item) => (
            <div key={item.id} className="p-4 bg-[#fffbeb]/30">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-mono text-sm text-[#022c22] font-semibold">{item.ref}</div>
                  <div className="text-xs text-[#6a6c6c] mt-0.5">{item.time}</div>
                </div>
                <div className="font-bold text-[#b45309]">{item.amount}</div>
              </div>
              <div className="bg-white border border-[#fcd34d] p-3 rounded-lg text-sm text-[#92400e] mb-4">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Robot weight="fill" />
                  AI Confidence: {(item.aiConfidence * 100).toFixed(0)}%
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
          ))}
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
        onClose={() => setSelectedItem(null)} 
        title="Resolve Transaction"
      >
        {selectedItem && (
          <div className="space-y-6">
            
            {/* Context Box */}
            <div className="bg-[#f7f9fb] p-4 rounded-lg border border-[#e4e7e9]">
              <div className="text-xs font-semibold text-[#6a6c6c] uppercase tracking-wider mb-2">Raw Bank Narration</div>
              <div className="font-mono text-sm text-[#022c22] font-semibold break-all bg-white p-2 border border-[#e4e7e9] rounded">
                {selectedItem.rawNarration}
              </div>
              <div className="flex justify-between items-end mt-3">
                <div className="text-xs text-[#6a6c6c]">Intended Wallet: <span className="font-mono text-[#022c22]">{selectedItem.walletNuban}</span></div>
                <div className="font-bold text-lg text-[#022c22]">{selectedItem.amount}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-[#022c22]">Select Resolution Action:</div>
              
              <button className="w-full text-left p-4 rounded-xl border border-[#e4e7e9] hover:border-[#10b981] hover:bg-[#f0fdf4] transition-all group flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#022c22] flex items-center gap-2">
                    <CheckCircle weight="fill" className="text-[#10b981] group-hover:scale-110 transition-transform" />
                    Force Accept to Wallet
                  </div>
                  <div className="text-sm text-[#6a6c6c] mt-1 ml-6">Credit the funds to NUBAN {selectedItem.walletNuban}.</div>
                </div>
                <CaretRight className="text-[#bbbdbd] group-hover:text-[#10b981]" />
              </button>

              <button className="w-full text-left p-4 rounded-xl border border-[#e4e7e9] hover:border-red-400 hover:bg-red-50 transition-all group flex items-center justify-between">
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
