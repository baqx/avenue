'use client';

import React, { useState } from 'react';
import { useGetWebhookConfigQuery, useConfigureWebhookMutation } from '@/lib/api/developerApi';
import { useGetWebhookLogsQuery } from '@/lib/api/webhooksApi';
import { TableShimmer } from '@/components/ui/Shimmer';
import { useToast } from '@/components/ui/toast/ToastProvider';
import { PlugsConnected, CheckCircle, XCircle, CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export default function WebhooksPage() {
  const toast = useToast();
  const [urlInput, setUrlInput] = useState('');
  
  const { data: config, isLoading: isConfigLoading } = useGetWebhookConfigQuery();
  const [configureWebhook, { isLoading: isConfiguring }] = useConfigureWebhookMutation();
  
  const [page, setPage] = useState(1);
  const { data: logs, isLoading: isLogsLoading } = useGetWebhookLogsQuery({ page, limit: 20 });

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await configureWebhook({ url: urlInput }).unwrap();
      toast.success('Webhook configured', 'Your endpoint has been updated.');
      setUrlInput('');
    } catch (err: any) {
      toast.error('Configuration failed', err?.data?.detail || 'Could not update webhook URL.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Webhooks</h1>
        <p className="mt-2 text-sm text-gray-700">Configure your endpoint to receive real-time event notifications from Avenue.</p>
      </div>

      {/* Configuration Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center gap-3">
          <PlugsConnected className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Endpoint Configuration</h3>
        </div>
        <div className="p-6">
          {isConfigLoading ? (
            <div className="animate-pulse flex space-x-4">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Webhook URL
                </label>
                <input
                  type="url"
                  id="webhookUrl"
                  placeholder={config?.url || "https://api.yourdomain.com/webhooks/avenue"}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                />
              </div>
              <button
                type="submit"
                disabled={isConfiguring || !urlInput}
                className="inline-flex justify-center items-center rounded-lg border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 h-[38px]"
              >
                {isConfiguring ? <CircleNotch className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Endpoint
              </button>
            </form>
          )}
          {config?.url && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100 w-fit">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Active routing to: <span className="font-mono text-xs ml-1">{config.url}</span>
            </div>
          )}
        </div>
      </div>

      {/* Logs Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Delivery Logs</h3>
        </div>
        
        {isLogsLoading ? (
          <div className="p-4"><TableShimmer rows={5} /></div>
        ) : !logs?.items.length ? (
          <div className="p-12 text-center text-gray-500">
            <p>No webhook deliveries recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.items.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800 font-mono">
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === 'DELIVERED' ? (
                        <span className="flex items-center text-sm font-medium text-green-700">
                          <CheckCircle className="w-4 h-4 mr-1.5" weight="fill" /> Delivered
                        </span>
                      ) : log.status === 'FAILED' ? (
                        <span className="flex items-center text-sm font-medium text-yellow-700">
                          <CircleNotch className="w-4 h-4 mr-1.5 animate-spin" /> Retrying
                        </span>
                      ) : (
                        <span className="flex items-center text-sm font-medium text-red-700">
                          <XCircle className="w-4 h-4 mr-1.5" weight="fill" /> Dead
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.attempt_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {log.http_status_code ? (
                        <span className={cn(
                          "px-2 py-1 rounded",
                          log.http_status_code >= 200 && log.http_status_code < 300 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          HTTP {log.http_status_code}
                        </span>
                      ) : 'Timeout'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
