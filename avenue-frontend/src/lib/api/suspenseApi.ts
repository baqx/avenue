import { baseApi } from './baseApi';

export interface SuspenseItem {
  id: string;
  developer_id: string;
  account_number: string;
  amount: number;
  sender_name?: string;
  raw_narration?: string;
  nomba_reference?: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'FLAGGED';
  raw_payload: any;
  resolved_at?: string;
  resolution_note?: string;
  created_at: string;
}

export interface SuspenseListResponse {
  items: SuspenseItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ResolveSuspenseRequest {
  action: 'CREDIT_WALLET' | 'DISMISS';
  target_wallet_id?: string;
  note?: string;
}

export const suspenseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuspenseItems: builder.query<SuspenseListResponse, { page?: number; limit?: number; status?: string }>({
      query: (params) => ({
        url: '/suspense',
        params,
      }),
      providesTags: ['Suspense'],
    }),
    getSuspenseDetails: builder.query<SuspenseItem, string>({
      query: (id) => `/suspense/${id}`,
      providesTags: (result, error, id) => [{ type: 'Suspense', id }],
    }),
    resolveSuspense: builder.mutation<SuspenseItem, { id: string; body: ResolveSuspenseRequest }>({
      query: ({ id, body }) => ({
        url: `/suspense/${id}/resolve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Suspense', id }, 'Suspense', 'Ledger', 'Wallet'],
    }),
  }),
});

export const { useGetSuspenseItemsQuery, useGetSuspenseDetailsQuery, useResolveSuspenseMutation } = suspenseApi;
