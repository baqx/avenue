'use client';

import React, { useState } from 'react';
import { useGetAgentsQuery, useToggleAgentMutation } from '@/lib/api/agentsApi';
import { TableShimmer } from '@/components/ui/Shimmer';
import { Robot, Power } from '@phosphor-icons/react';
import { useToast } from '@/components/ui/toast/ToastProvider';
import { cn } from '@/lib/utils';

export default function AgentsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetAgentsQuery({ page, limit: 20 });
  const [toggleAgent, { isLoading: isToggling }] = useToggleAgentMutation();

  const handleToggle = async (agentId: string, currentStatus: boolean) => {
    try {
      await toggleAgent({ id: agentId, is_active: !currentStatus }).unwrap();
      toast.success(
        !currentStatus ? 'Agent Activated' : 'Agent Paused',
        `The agent has been successfully ${!currentStatus ? 'activated' : 'paused'}.`
      );
      refetch();
    } catch (err: any) {
      toast.error('Toggle failed', err?.data?.detail || 'Could not change agent status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Autonomous Agents</h1>
          <p className="mt-2 text-sm text-gray-700">Define AI-driven rules to sweep funds, notify endpoints, or lock wallets automatically.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <TableShimmer rows={5} />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-red-600 bg-red-50">
            Failed to load agents. Please try again.
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center text-gray-500">
            <Robot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No agents configured</h3>
            <p className="mt-1">Agents are created via API. See documentation to deploy your first agent.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger Count</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Robot className={cn("w-5 h-5", agent.is_active ? "text-blue-500" : "text-gray-400")} />
                        {agent.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">{agent.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-mono">
                        {agent.trigger}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-800 text-xs font-mono">
                        {agent.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.trigger_count} times
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleToggle(agent.id, agent.is_active)}
                        disabled={isToggling}
                        className={cn(
                          "inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50",
                          agent.is_active 
                            ? "border-gray-300 bg-white text-red-700 hover:bg-gray-50 focus:ring-red-500" 
                            : "border-transparent bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                        )}
                      >
                        <Power className="w-3.5 h-3.5 mr-1.5" />
                        {agent.is_active ? 'Pause Agent' : 'Activate Agent'}
                      </button>
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
