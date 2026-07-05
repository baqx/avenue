import { baseApi } from './baseApi';

export interface OverviewStats {
  total_wallets: number;
  active_wallets: number;
  frozen_wallets: number;
  closed_wallets: number;
  total_volume_kobo: number;
  volume_today_kobo: number;
  volume_7d_kobo: number;
  volume_30d_kobo: number;
  total_transactions: number;
  pending_suspense_count: number;
  webhook_delivery_rate: number;
}

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOverviewStats: builder.query<OverviewStats, void>({
      query: () => '/analytics/overview',
    }),
  }),
});

export const { useGetOverviewStatsQuery } = analyticsApi;
