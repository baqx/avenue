"use client";

import { useState } from "react";
import { Plus, MagnifyingGlass, GitFork, ToggleLeft, ToggleRight, Lightning } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

// Mock data
const AGENTS = [
  { 
    id: "agt_1", 
    name: "Auto-sweep to Main", 
    walletNuban: "0012345678", 
    trigger: "BALANCE_ABOVE ₦1,000,000", 
    action: "SWEEP_FULL", 
    status: "ACTIVE",
    lastFired: "Oct 24, 10:45 AM"
  },
  { 
    id: "agt_2", 
    name: "Lock on negative", 
    walletNuban: "0012345679", 
    trigger: "BALANCE_BELOW ₦0", 
    action: "LOCK_WALLET", 
    status: "DISABLED",
    lastFired: "Never"
  },
  { 
    id: "agt_3", 
    name: "Notify Large Deposit", 
    walletNuban: "0012345680", 
    trigger: "ON_CREDIT > ₦500k", 
    action: "WEBHOOK_NOTIFY", 
    status: "ACTIVE",
    lastFired: "Oct 21, 02:12 PM"
  },
];

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<typeof AGENTS[0] | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredAgents = AGENTS.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.walletNuban.includes(searchQuery)
  );

  return (
    <PageReveal>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#022c22] tracking-tight">Account Agents</h1>
          <p className="text-[#6a6c6c] mt-1">Automate actions based on wallet triggers.</p>
        </div>
        
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 bg-[#022c22] text-white hover:bg-[#064e3b] shrink-0">
          <Plus weight="bold" />
          <span>Create Agent</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#e4e7e9] shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#e4e7e9] flex items-center bg-[#f7f9fb]">
          <div className="relative max-w-sm w-full">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbbdbd]" />
            <input 
              type="text"
              placeholder="Search by Agent name or Wallet NUBAN..."
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
                <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Agent Name</th>
                <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Trigger Condition</th>
                <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Action</th>
                <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Status</th>
                <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap text-right">Last Fired</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent) => (
                <tr 
                  key={agent.id} 
                  onClick={() => setSelectedAgent(agent)}
                  className="border-b border-[#e4e7e9] last:border-0 hover:bg-[#f0fdf4]/50 transition-colors cursor-pointer group"
                >
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f0fdf4] text-[#059669] flex items-center justify-center shrink-0">
                        <GitFork weight="bold" />
                      </div>
                      <div>
                        <div className="font-medium text-[#022c22]">{agent.name}</div>
                        <div className="text-xs text-[#6a6c6c] font-mono mt-0.5">Wallet: {agent.walletNuban}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="font-mono text-xs bg-[#f7f9fb] text-[#022c22] border border-[#e4e7e9] px-2 py-1 rounded">
                      {agent.trigger}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-[#022c22] whitespace-nowrap text-sm">
                    {agent.action}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {agent.status === "ACTIVE" ? (
                      <ToggleRight weight="fill" className="w-8 h-8 text-[#10b981]" />
                    ) : (
                      <ToggleLeft weight="fill" className="w-8 h-8 text-[#bbbdbd]" />
                    )}
                  </td>
                  <td className="p-4 text-right text-sm text-[#6a6c6c] whitespace-nowrap">{agent.lastFired}</td>
                </tr>
              ))}
              {filteredAgents.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6a6c6c]">No agents found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[#e4e7e9]">
          {filteredAgents.map((agent) => (
            <div 
              key={agent.id} 
              onClick={() => setSelectedAgent(agent)}
              className="p-4 hover:bg-[#f0fdf4]/50 transition-colors active:bg-[#f0fdf4] cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f0fdf4] text-[#059669] flex items-center justify-center shrink-0">
                    <GitFork weight="bold" />
                  </div>
                  <div>
                    <div className="font-medium text-[#022c22]">{agent.name}</div>
                    <div className="text-[10px] font-mono text-[#6a6c6c] mt-0.5">Wallet: {agent.walletNuban}</div>
                  </div>
                </div>
                {agent.status === "ACTIVE" ? (
                  <ToggleRight weight="fill" className="w-7 h-7 text-[#10b981]" />
                ) : (
                  <ToggleLeft weight="fill" className="w-7 h-7 text-[#bbbdbd]" />
                )}
              </div>
              <div className="flex flex-col gap-2 mt-4 text-xs">
                <div className="flex justify-between border-b border-dashed border-[#e4e7e9] pb-1">
                  <span className="text-[#6a6c6c]">Trigger:</span>
                  <span className="font-mono text-[#022c22]">{agent.trigger}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6a6c6c]">Action:</span>
                  <span className="font-semibold text-[#022c22]">{agent.action}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredAgents.length === 0 && (
            <div className="p-8 text-center text-[#6a6c6c]">No agents found.</div>
          )}
        </div>
      </div>

      {/* Agent Detail Modal */}
      <Modal 
        isOpen={!!selectedAgent} 
        onClose={() => setSelectedAgent(null)} 
        title="Agent Details"
      >
        {selectedAgent && (
          <div className="space-y-6">
            <div className="bg-[#f7f9fb] p-4 rounded-lg border border-[#e4e7e9] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-[#022c22]">{selectedAgent.name}</h4>
                <p className="text-sm text-[#6a6c6c] font-mono mt-1">Wallet: {selectedAgent.walletNuban}</p>
              </div>
              {selectedAgent.status === "ACTIVE" ? (
                <div className="flex items-center gap-1.5 bg-[#f0fdf4] border border-[#10b981]/30 text-[#059669] px-2.5 py-1 rounded text-xs font-bold">
                  <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse" />
                  ACTIVE
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-500 px-2.5 py-1 rounded text-xs font-bold">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  DISABLED
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-[#6a6c6c] font-semibold uppercase tracking-wider mb-2">When this happens:</div>
                <div className="bg-white border border-[#e4e7e9] rounded-lg p-3 font-mono text-sm text-[#022c22]">
                  {selectedAgent.trigger}
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-0.5 h-4 bg-[#bbbdbd]" />
              </div>
              <div>
                <div className="text-xs text-[#6a6c6c] font-semibold uppercase tracking-wider mb-2">Do this:</div>
                <div className="bg-[#022c22] border border-[#022c22] rounded-lg p-3 font-semibold text-white flex items-center gap-2">
                  <Lightning weight="fill" className="text-[#10b981]" />
                  {selectedAgent.action}
                </div>
              </div>
            </div>

            <div className="border-t border-[#e4e7e9] pt-4">
              <div className="text-sm text-[#6a6c6c] mb-2">Recent Executions</div>
              <div className="bg-[#f7f9fb] border border-[#e4e7e9] rounded-lg p-3 text-sm text-[#022c22]">
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-xs">{selectedAgent.lastFired}</span>
                  <span className="text-[#059669] font-bold text-xs">SUCCESS</span>
                </div>
                <p className="text-[#6a6c6c] text-xs">Action {selectedAgent.action} executed successfully.</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Agent Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Create Account Agent"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Agent Name</label>
            <input 
              type="text"
              className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
              placeholder="e.g. Sweep on Friday"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Trigger Condition</label>
            <select className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all bg-white text-[#022c22]">
              <option>BALANCE_ABOVE</option>
              <option>BALANCE_BELOW</option>
              <option>ON_CREDIT</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Action to Execute</label>
            <select className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all bg-white text-[#022c22]">
              <option>SWEEP_FULL</option>
              <option>PARTIAL_SWEEP</option>
              <option>LOCK_WALLET</option>
              <option>WEBHOOK_NOTIFY</option>
            </select>
          </div>
          
          <Button 
            className="w-full justify-center bg-[#022c22] text-white hover:bg-[#064e3b] h-12 mt-2" 
            onClick={() => setIsCreateModalOpen(false)}
          >
            Save Agent
          </Button>
        </div>
      </Modal>
    </PageReveal>
  );
}
