import { baseApi } from './baseApi';

export interface AvenueIntelligence {
  raw_narration?: string;
  extracted_intent?: string;
  confidence_score?: number;
  flags: string[];
  suggested_label?: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balance_before: number;
  balance_after: number;
  currency: string;
  status: string;
  nomba_reference?: string;
  sender_name?: string;
  sender_account?: string;
  raw_narration?: string;
  avenue_intelligence?: AvenueIntelligence;
  created_at: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export const ledgerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGlobalTransactions: builder.query<TransactionListResponse, { page?: number; limit?: number; type?: string }>({
      query: (params) => ({
        url: '/transactions',
        params,
      }),
      providesTags: ['Ledger'],
    }),
    getWalletTransactions: builder.query<TransactionListResponse, { walletId: string; page?: number; limit?: number }>({
      query: ({ walletId, ...params }) => ({
        url: `/wallets/${walletId}/transactions`,
        params,
      }),
      providesTags: (result, error, { walletId }) => [{ type: 'Ledger', id: walletId }],
    }),
  }),
});

export const { useGetGlobalTransactionsQuery, useGetWalletTransactionsQuery } = ledgerApi;
