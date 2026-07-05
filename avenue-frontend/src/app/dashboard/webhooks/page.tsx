"use client";

import { useState, useEffect } from "react";
import { Copy, CheckCircle, Warning, PaperPlaneRight, PlugsConnected, ArrowClockwise, CodeBlock } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

import { useGetWebhookLogsQuery } from "@/lib/api/webhooksApi";
import { useGetWebhookConfigQuery, useConfigureWebhookMutation } from "@/lib/api/developerApi";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { TableShimmer, CardShimmer } from "@/components/ui/Shimmer";

export default function WebhooksPage() {
  const [activeTab, setActiveTab] = useState<"config" | "logs">("config");
  const [copied, setCopied] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: logsData, isLoading: isLogsLoading } = useGetWebhookLogsQuery({ page: 1, limit: 100 });
  const { data: configData, isLoading: isConfigLoading } = useGetWebhookConfigQuery();
  const [configureWebhook, { isLoading: isSaving }] = useConfigureWebhookMutation();
  const toast = useToast();

  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    if (configData?.url) {
      setWebhookUrl(configData.url);
    }
  }, [configData]);

  const logs = logsData?.items || [];

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.avenue.so/v1";
  const inboundUrl = `${baseUrl}/webhooks/inbound/dev_8f92j29x`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inboundUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = async () => {
    try {
      await configureWebhook({ url: webhookUrl }).unwrap();
      toast.success('Saved', 'Webhook configuration updated.');
    } catch (err: any) {
      toast.error('Failed', err?.data?.error?.message || err?.data?.detail || 'Could not save webhook configuration.');
    }
  };

  return (
    <PageReveal>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#022c22] tracking-tight">Webhooks</h1>
          <p className="text-[#6a6c6c] mt-1">Configure event routing and monitor delivery logs.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e4e7e9] shadow-sm overflow-hidden flex flex-col mb-8">
        <div className="flex border-b border-[#e4e7e9] bg-[#f7f9fb] px-4 pt-4 gap-6">
          <button 
            onClick={() => setActiveTab("config")}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === "config" ? "border-[#10b981] text-[#022c22]" : "border-transparent text-[#6a6c6c] hover:text-[#022c22]"}`}
          >
            Configuration
          </button>
          <button 
            onClick={() => setActiveTab("logs")}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === "logs" ? "border-[#10b981] text-[#022c22]" : "border-transparent text-[#6a6c6c] hover:text-[#022c22]"}`}
          >
            Delivery Logs
          </button>
        </div>

        <div className="p-6">
          {activeTab === "config" && (
            <div className="space-y-8 max-w-3xl">
              
              {/* Inbound Config */}
              <div>
                <h3 className="text-lg font-bold text-[#022c22] mb-1">Inbound Webhook (From Nomba)</h3>
                <p className="text-sm text-[#6a6c6c] mb-4">Paste this URL into your Nomba dashboard. Nomba will send all raw transactions here for Avenue to process.</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#f7f9fb] border border-[#e4e7e9] rounded-lg p-3 font-mono text-sm text-[#022c22] overflow-x-auto whitespace-nowrap hide-scrollbar">
                    {inboundUrl}
                  </div>
                  <Button onClick={handleCopy} variant="outline" className="shrink-0 gap-2 border-[#e4e7e9] text-[#022c22]">
                    {copied ? <CheckCircle weight="fill" className="text-[#10b981]" /> : <Copy weight="bold" />}
                    {copied ? "Copied" : "Copy URL"}
                  </Button>
                </div>
              </div>

              <div className="h-px bg-[#e4e7e9] w-full" />

              {/* Outbound Config */}
              {isConfigLoading ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#022c22] mb-1">Outbound Webhook (To Your App)</h3>
                  <CardShimmer />
                  <CardShimmer />
                </div>
              ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#022c22] mb-1">Outbound Webhook (To Your App)</h3>
                    <p className="text-sm text-[#6a6c6c]">Avenue will send enriched, processed events to this URL.</p>
                  </div>
                  <div className="bg-[#f0fdf4] text-[#059669] border border-[#10b981]/30 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
                    <PlugsConnected weight="bold" /> ACTIVE
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#022c22]">Endpoint URL</label>
                    <input 
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder={configData?.url || "https://your-api.com/webhooks"}
                      className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#022c22]">Signing Secret</label>
                    <div className="relative">
                      <input 
                        type="password"
                        defaultValue="whsec_8f92j29x8f92j29x8f92j29x"
                        readOnly
                        className="w-full h-11 pl-3.5 pr-24 rounded-lg border border-[#e4e7e9] text-sm bg-[#f7f9fb] outline-none text-[#6a6c6c]"
                      />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#022c22] bg-white border border-[#e4e7e9] px-2 py-1 rounded hover:bg-[#f7f9fb]">
                        Reveal
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      className="bg-[#022c22] text-white hover:bg-[#064e3b]"
                      onClick={handleSaveConfig}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" className="gap-2 border-[#e4e7e9] text-[#022c22]">
                      <PaperPlaneRight weight="fill" />
                      Send Test Event
                    </Button>
                  </div>
                </div>
              </div>
              )}

            </div>
          )}

          {activeTab === "logs" && (
            <div className="-mx-6 -my-6">
              {isLogsLoading ? (
                <div className="p-6">
                  <TableShimmer rows={5} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f7f9fb] border-b border-[#e4e7e9]">
                        <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Event Type</th>
                        <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Status</th>
                        <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap">Retries</th>
                        <th className="p-4 font-semibold text-[#6a6c6c] text-sm whitespace-nowrap text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr 
                          key={log.id} 
                          onClick={() => setSelectedLog(log)}
                          className="border-b border-[#e4e7e9] last:border-0 hover:bg-[#f7f9fb] transition-colors cursor-pointer"
                        >
                          <td className="p-4 font-mono text-sm text-[#022c22] font-semibold whitespace-nowrap">
                            {log.event_type}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {log.status === "DELIVERED" ? (
                              <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#f0fdf4] text-[#059669] border border-[#10b981]/30 flex items-center gap-1.5 w-max">
                                <CheckCircle weight="fill" /> DELIVERED
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1.5 w-max">
                                <Warning weight="fill" /> FAILED
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-sm text-[#6a6c6c] whitespace-nowrap">
                            {log.attempt_count > 0 ? log.attempt_count : "-"}
                          </td>
                          <td className="p-4 text-right text-sm text-[#6a6c6c] whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-[#6a6c6c]">No logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        title="Event Delivery Details"
        className="sm:max-w-xl"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-mono font-bold text-[#022c22]">{selectedLog.event_type}</h4>
                <p className="text-sm text-[#6a6c6c] mt-1">{selectedLog.id} • {new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
              {selectedLog.status === "DELIVERED" ? (
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#f0fdf4] text-[#059669] border border-[#10b981]/30">
                  DELIVERED (200 OK)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                  FAILED ({selectedLog.http_status_code || 500})
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#6a6c6c] uppercase tracking-wider">Target URL</div>
              <div className="bg-[#f7f9fb] border border-[#e4e7e9] rounded-lg p-3 font-mono text-sm text-[#022c22] break-all">
                {configData?.url || "No target URL"}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#6a6c6c] uppercase tracking-wider">Payload Snippet</div>
              <div className="bg-[#022c22] rounded-lg p-4 font-mono text-xs text-[#10b981] overflow-x-auto">
                <pre>{JSON.stringify(selectedLog.payload, null, 2)}</pre>
              </div>
            </div>

            {selectedLog.status === "FAILED" && (
              <Button className="w-full justify-center gap-2 bg-[#022c22] text-white hover:bg-[#064e3b]">
                <ArrowClockwise weight="bold" />
                Retry Delivery Now
              </Button>
            )}
          </div>
        )}
      </Modal>

    </PageReveal>
  );
}
