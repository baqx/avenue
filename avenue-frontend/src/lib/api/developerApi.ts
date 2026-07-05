import { baseApi } from './baseApi';

export interface OutboundWebhookConfig {
  id: string;
  url: string;
  is_active: boolean;
  created_at: string;
}

export const developerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWebhookConfig: builder.query<OutboundWebhookConfig, void>({
      query: () => '/developers/webhook',
      providesTags: ['WebhookConfig'],
    }),
    configureWebhook: builder.mutation<OutboundWebhookConfig, { url: string }>({
      query: (body) => ({
        url: '/developers/webhook',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WebhookConfig'],
    }),
  }),
});

export const { useGetWebhookConfigQuery, useConfigureWebhookMutation } = developerApi;
