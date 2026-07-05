import { baseApi } from './baseApi';

export interface WebhookLog {
  id: string;
  event_id: string;
  event_type: string;
  payload: any;
  status: string;
  http_status_code?: number;
  response_body?: string;
  attempt_count: number;
  next_retry_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface WebhookLogListResponse {
  items: WebhookLog[];
  total: number;
  page: number;
  limit: number;
}

export const webhooksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWebhookLogs: builder.query<WebhookLogListResponse, { page?: number; limit?: number; status?: string }>({
      query: (params) => ({
        url: '/webhook-logs',
        params,
      }),
      providesTags: ['WebhookLog'],
    }),
  }),
});

export const { useGetWebhookLogsQuery } = webhooksApi;
