import { baseApi } from './baseApi';

export interface Wallet {
  id: string;
  customer_reference: string;
  first_name: string;
  last_name: string;
  email: string;
  label?: string;
  account_number: string;
  bank_name: string;
  account_name: string;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  system_prompt?: string;
  allow_transfers_out: boolean;
  created_at: string;
}

export interface WalletListResponse {
  items: Wallet[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateWalletRequest {
  customer_reference: string;
  first_name: string;
  last_name: string;
  email: string;
  label?: string;
  currency?: string;
  system_prompt?: string;
  allow_transfers_out?: boolean;
}

export const walletsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWallets: builder.query<WalletListResponse, { page?: number; limit?: number; status?: string }>({
      query: (params) => ({
        url: '/wallets',
        params,
      }),
      providesTags: ['Wallet'],
    }),
    getWalletDetails: builder.query<Wallet, string>({
      query: (id) => `/wallets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Wallet', id }],
    }),
    createWallet: builder.mutation<Wallet, CreateWalletRequest>({
      query: (body) => ({
        url: '/wallets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wallet'],
    }),
    closeWallet: builder.mutation<{ status: string }, string>({
      query: (id) => ({
        url: `/wallets/${id}/close`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Wallet', id }],
    }),
    freezeWallet: builder.mutation<{ status: string }, string>({
      query: (id) => ({
        url: `/wallets/${id}/freeze`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Wallet', id }],
    }),
    unfreezeWallet: builder.mutation<{ status: string }, string>({
      query: (id) => ({
        url: `/wallets/${id}/unfreeze`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Wallet', id }],
    }),
  }),
});

export const {
  useGetWalletsQuery,
  useGetWalletDetailsQuery,
  useCreateWalletMutation,
  useCloseWalletMutation,
  useFreezeWalletMutation,
  useUnfreezeWalletMutation,
} = walletsApi;
