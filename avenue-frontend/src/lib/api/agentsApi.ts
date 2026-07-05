import { baseApi } from './baseApi';

export interface Agent {
  id: string;
  wallet_id: string;
  developer_id: string;
  name: string;
  trigger: string;
  threshold?: number;
  action: string;
  destination_wallet_id?: string;
  sweep_amount?: number;
  is_active: boolean;
  trigger_count: number;
  last_triggered_at?: string;
  created_at: string;
}

export interface AgentListResponse {
  items: Agent[];
  total: number;
  page: number;
  limit: number;
}

export const agentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAgents: builder.query<AgentListResponse, { page?: number; limit?: number }>({
      query: (params) => ({
        url: '/agents',
        params,
      }),
      providesTags: ['Agent'],
    }),
    toggleAgent: builder.mutation<{ status: string }, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({
        url: `/agents/${id}/toggle`,
        method: 'POST',
        body: { is_active },
      }),
      invalidatesTags: ['Agent'],
    }),
  }),
});

export const { useGetAgentsQuery, useToggleAgentMutation } = agentsApi;
