import { Modal } from "@/components/ui/Modal";
import { Robot, Info } from "@phosphor-icons/react";

interface TransactionModalProps {
  transaction: any | null;
  onClose: () => void;
}

export function TransactionModal({ transaction: selectedTx, onClose }: TransactionModalProps) {
  if (!selectedTx) return null;

  return (
    <Modal 
      isOpen={!!selectedTx} 
      onClose={onClose} 
      title="Transaction Details"
    >
      <div className="space-y-6 pb-2">
        <div className="text-center pb-6 border-b border-[#e4e7e9]">
          <div className="text-xs font-semibold text-[#6a6c6c] uppercase tracking-wider mb-2">
            {selectedTx.type === 'CREDIT' ? 'Received' : 'Sent'}
          </div>
          <div className="text-4xl font-bold text-[#022c22] tracking-tighter">
            ₦{(selectedTx.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-3 inline-flex">
            {selectedTx.status === "SETTLED" ? (
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
            <span className="font-mono font-medium text-[#022c22]">{selectedTx.nomba_reference || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#e4e7e9] border-dashed">
            <span className="text-[#6a6c6c]">Wallet ID</span>
            <span className="font-mono font-medium text-[#022c22]">{selectedTx.wallet_id.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#e4e7e9] border-dashed">
            <span className="text-[#6a6c6c]">Date & Time</span>
            <span className="font-medium text-[#022c22]">{new Date(selectedTx.created_at).toLocaleString()}</span>
          </div>
          <div className="py-2 border-b border-[#e4e7e9] border-dashed">
            <span className="block text-[#6a6c6c] mb-1">Raw Narration</span>
            <span className="font-medium text-[#022c22] break-words">{selectedTx.raw_narration || "N/A"}</span>
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
        
        {selectedTx.status === "PENDING" && (
          <div className="bg-[#fffbeb] rounded-lg p-4 flex items-start gap-3 border border-[#fcd34d]">
            <Info className="w-5 h-5 text-[#b45309] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-[#b45309]">Suspense Resolution Needed</h4>
              <p className="text-sm text-[#92400e] mt-1">This transaction did not meet the AI confidence threshold for auto-reconciliation. Please resolve it in the Suspense Queue.</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
