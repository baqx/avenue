import { baseApi } from './baseApi';

export interface OutboundWebhookConfig {
  id: string;
  url: string;
  signing_secret: string;
  is_active: boolean;
  created_at: string;
}

export interface DeveloperProfile {
  id: string;
  email: string;
  company_name: string;
  is_verified: boolean;
  created_at: string;
}

export interface ApiKeyResponse {
  id: string;
  key_prefix: string;
  label?: string;
  type: string;
  last_used_at?: string;
  created_at: string;
}

export interface NewApiKeyResponse extends ApiKeyResponse {
  full_key: string;
}

export interface NombaConfigResponse {
  account_id: string;
  client_id: string;
  client_secret_masked: string;
  inbound_webhook_url: string;
  sub_account_id?: string;
}

export const developerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWebhookConfig: builder.query<OutboundWebhookConfig, void>({
      query: () => '/developers/me/outbound-webhook',
      providesTags: ['WebhookConfig'],
    }),
    configureWebhook: builder.mutation<OutboundWebhookConfig, { url: string }>({
      query: (body) => ({
        url: '/developers/me/outbound-webhook',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WebhookConfig'],
    }),

    // Profile Endpoints
    getProfile: builder.query<DeveloperProfile, void>({
      query: () => '/developers/me',
      providesTags: ['DeveloperProfile'],
    }),
    updateProfile: builder.mutation<DeveloperProfile, { company_name?: string; email?: string }>({
      query: (body) => ({
        url: '/developers/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['DeveloperProfile'],
    }),
    changePassword: builder.mutation<void, any>({
      query: (body) => ({
        url: '/developers/me/password',
        method: 'PATCH',
        body,
      }),
    }),

    // API Keys Endpoints
    getApiKeys: builder.query<ApiKeyResponse[], void>({
      query: () => '/developers/me/keys',
      providesTags: ['ApiKeys'],
    }),
    createApiKey: builder.mutation<NewApiKeyResponse, { label?: string; type: string }>({
      query: (body) => ({
        url: '/developers/me/keys',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ApiKeys'],
    }),
    deleteApiKey: builder.mutation<void, string>({
      query: (keyId) => ({
        url: `/developers/me/keys/${keyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ApiKeys'],
    }),

    // Nomba Config Endpoints
    getNombaConfig: builder.query<NombaConfigResponse, void>({
      query: () => '/developers/me/nomba-config',
      providesTags: ['NombaConfig'],
    }),
    configureNomba: builder.mutation<NombaConfigResponse, any>({
      query: (body) => ({
        url: '/developers/me/nomba-config',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['NombaConfig'],
    }),
  }),
});

export const { 
  useGetWebhookConfigQuery, 
  useConfigureWebhookMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useDeleteApiKeyMutation,
  useGetNombaConfigQuery,
  useConfigureNombaMutation,
} = developerApi;
