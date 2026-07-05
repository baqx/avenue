"use client";

import { useState } from "react";
import { Plus, MagnifyingGlass, GitFork, ToggleLeft, ToggleRight, Lightning, Wallet } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

import { useGetAgentsQuery, useToggleAgentMutation, useCreateAgentMutation } from "@/lib/api/agentsApi";
import { useGetWalletsQuery } from "@/lib/api/walletsApi";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { TableShimmer } from "@/components/ui/Shimmer";

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: agentsData, isLoading: isAgentsLoading } = useGetAgentsQuery({ page: 1, limit: 100 });
  const { data: walletsData } = useGetWalletsQuery({ page: 1, limit: 100 });
  const [toggleAgent] = useToggleAgentMutation();
  const [createAgent, { isLoading: isCreating }] = useCreateAgentMutation();
  const toast = useToast();

  const wallets = walletsData?.items || [];

  const [formData, setFormData] = useState({
    wallet_id: '',
    name: '',
    trigger: 'BALANCE_ABOVE',
    threshold: '',
    action: 'SWEEP_FULL',
    destination_wallet_id: '',
    sweep_amount: ''
  });

  const handleCreate = async () => {
    if (!formData.wallet_id || !formData.name) {
      toast.error('Validation Error', 'Source Wallet and Agent Name are required.');
      return;
    }
    try {
      const payload: any = {
        wallet_id: formData.wallet_id,
        name: formData.name,
        trigger: formData.trigger,
        action: formData.action
      };
      if (formData.trigger === 'BALANCE_ABOVE' || formData.trigger === 'BALANCE_BELOW') {
        payload.threshold = Number(formData.threshold);
      }
      if (formData.action === 'SWEEP_FULL' || formData.action === 'PARTIAL_SWEEP') {
        payload.destination_wallet_id = formData.destination_wallet_id;
      }
      if (formData.action === 'PARTIAL_SWEEP') {
        payload.sweep_amount = Number(formData.sweep_amount);
      }
      
      await createAgent(payload).unwrap();
      toast.success('Agent Created', 'Your automation agent is now active.');
      setIsCreateModalOpen(false);
      setFormData({
        wallet_id: '',
        name: '',
        trigger: 'BALANCE_ABOVE',
        threshold: '',
        action: 'SWEEP_FULL',
        destination_wallet_id: '',
        sweep_amount: ''
      });
    } catch (err: any) {
      toast.error('Failed', err?.data?.error?.message || err?.data?.detail || 'Could not create agent.');
    }
  };

  const rawAgents = agentsData?.items || [];
  const filteredAgents = rawAgents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.wallet_id.includes(searchQuery)
  );

  const handleToggle = async (agent: any, e?: any) => {
    if (e) e.stopPropagation();
    try {
      await toggleAgent({ walletId: agent.wallet_id, id: agent.id, is_active: !agent.is_active }).unwrap();
      toast.success('Agent Updated', `${agent.name} is now ${!agent.is_active ? 'active' : 'disabled'}.`);
      if (selectedAgent?.id === agent.id) {
        setSelectedAgent({ ...selectedAgent, is_active: !agent.is_active });
      }
    } catch (err: any) {
      toast.error('Failed', err?.data?.error?.message || err?.data?.detail || 'Could not update agent status.');
    }
  };

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

        {isAgentsLoading ? (
          <TableShimmer rows={4} />
        ) : (
          <div className="bg-[#f7f9fb] p-4 sm:p-6 min-h-[400px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredAgents.map((agent) => (
                <div 
                  key={agent.id} 
                  onClick={() => setSelectedAgent(agent)}
                  className="bg-white rounded-xl border border-[#e4e7e9] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col relative group"
                >
                  <div className="p-5 border-b border-[#e4e7e9] flex justify-between items-start bg-gradient-to-br from-white to-[#f8fafc]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-[#e4e7e9] text-[#059669] flex items-center justify-center shrink-0">
                        <GitFork weight="duotone" className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-[#022c22]">{agent.name}</div>
                        <div className="text-[11px] text-[#6a6c6c] font-mono mt-1 flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          {agent.wallet_id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.is_active && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#f0fdf4] text-[#059669] rounded border border-[#10b981]/30 text-[10px] font-bold uppercase tracking-wide">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#059669]"></span>
                          </span>
                          Active
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-center">
                    <div className="bg-[#f7f9fb] rounded-lg p-3 border border-[#e4e7e9] font-mono text-sm mb-3 text-[#022c22]">
                      <span className="text-[#64748b]">IF</span> {agent.trigger} {agent.threshold ? `> ₦${agent.threshold}` : ''}
                    </div>
                    <div className="bg-[#f7f9fb] rounded-lg p-3 border border-[#e4e7e9] font-mono text-sm text-[#022c22]">
                      <span className="text-[#10b981]">THEN</span> {agent.action}
                    </div>
                  </div>

                  <div className="p-4 border-t border-[#e4e7e9] bg-[#f8fafc] flex justify-between items-center text-xs text-[#6a6c6c]">
                    <span>{agent.last_triggered_at ? `Last fired: ${new Date(agent.last_triggered_at).toLocaleDateString()}` : "Never fired"}</span>
                    <div 
                      onClick={(e) => { e.stopPropagation(); handleToggle(agent); }}
                      className="hover:scale-110 transition-transform"
                    >
                      {agent.is_active ? (
                        <ToggleRight weight="fill" className="w-8 h-8 text-[#10b981]" />
                      ) : (
                        <ToggleLeft weight="fill" className="w-8 h-8 text-[#bbbdbd]" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAgents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-[#6a6c6c]">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-[#e4e7e9] flex items-center justify-center mb-4">
                  <GitFork weight="duotone" className="w-8 h-8 text-[#bbbdbd]" />
                </div>
                <p className="text-lg font-semibold text-[#022c22] mb-1">No agents configured</p>
                <p className="text-sm">Create an agent to automate your wallet operations.</p>
              </div>
            )}
          </div>
        )}
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
                <p className="text-sm text-[#6a6c6c] font-mono mt-1">Wallet: {selectedAgent.wallet_id.substring(0, 8)}...</p>
              </div>
              {selectedAgent.is_active ? (
                <div className="flex items-center gap-1.5 bg-[#f0fdf4] border border-[#10b981]/30 text-[#059669] px-2.5 py-1 rounded text-xs font-bold cursor-pointer" onClick={() => handleToggle(selectedAgent)}>
                  <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse" />
                  ACTIVE (Click to Disable)
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-500 px-2.5 py-1 rounded text-xs font-bold cursor-pointer" onClick={() => handleToggle(selectedAgent)}>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  DISABLED (Click to Enable)
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-[#6a6c6c] font-semibold uppercase tracking-wider mb-2">When this happens:</div>
                <div className="bg-white border border-[#e4e7e9] rounded-lg p-3 font-mono text-sm text-[#022c22]">
                  {selectedAgent.trigger} {selectedAgent.threshold ? `> ${selectedAgent.threshold}` : ''}
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
                  <span className="font-mono text-xs">{selectedAgent.last_triggered_at ? new Date(selectedAgent.last_triggered_at).toLocaleString() : "Never"}</span>
                  <span className="text-[#059669] font-bold text-xs">SUCCESS</span>
                </div>
                <p className="text-[#6a6c6c] text-xs">Action {selectedAgent.action} executed successfully. Total triggers: {selectedAgent.trigger_count}</p>
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
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Source Wallet *</label>
            <select 
              value={formData.wallet_id}
              onChange={(e) => setFormData({ ...formData, wallet_id: e.target.value })}
              className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all bg-white text-[#022c22]"
            >
              <option value="">-- Select Source Wallet --</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.customer_reference} - {w.account_number}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Agent Name *</label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
              placeholder="e.g. Sweep on Friday"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Trigger Condition *</label>
            <select 
              value={formData.trigger}
              onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
              className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all bg-white text-[#022c22]"
            >
              <option value="BALANCE_ABOVE">BALANCE_ABOVE</option>
              <option value="BALANCE_BELOW">BALANCE_BELOW</option>
              <option value="ON_CREDIT">ON_CREDIT</option>
            </select>
          </div>

          {(formData.trigger === 'BALANCE_ABOVE' || formData.trigger === 'BALANCE_BELOW') && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#022c22]">Threshold Amount *</label>
              <input 
                type="number"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
                placeholder="e.g. 50000"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#022c22]">Action to Execute *</label>
            <select 
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all bg-white text-[#022c22]"
            >
              <option value="SWEEP_FULL">SWEEP_FULL</option>
              <option value="PARTIAL_SWEEP">PARTIAL_SWEEP</option>
              <option value="LOCK_WALLET">LOCK_WALLET</option>
              <option value="WEBHOOK_NOTIFY">WEBHOOK_NOTIFY</option>
            </select>
          </div>

          {(formData.action === 'SWEEP_FULL' || formData.action === 'PARTIAL_SWEEP') && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#022c22]">Target Wallet *</label>
              <select 
                value={formData.destination_wallet_id}
                onChange={(e) => setFormData({ ...formData, destination_wallet_id: e.target.value })}
                className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all bg-white text-[#022c22]"
              >
                <option value="">-- Select Destination Wallet --</option>
                {wallets.filter(w => w.id !== formData.wallet_id).map(w => (
                  <option key={w.id} value={w.id}>{w.customer_reference} - {w.account_number}</option>
                ))}
              </select>
            </div>
          )}

          {formData.action === 'PARTIAL_SWEEP' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#022c22]">Sweep Amount *</label>
              <input 
                type="number"
                value={formData.sweep_amount}
                onChange={(e) => setFormData({ ...formData, sweep_amount: e.target.value })}
                className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
                placeholder="e.g. 10000"
              />
            </div>
          )}
          
          <Button 
            className="w-full justify-center bg-[#022c22] text-white hover:bg-[#064e3b] h-12 mt-2" 
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? "Saving..." : "Save Agent"}
          </Button>
        </div>
      </Modal>
    </PageReveal>
  );
}
