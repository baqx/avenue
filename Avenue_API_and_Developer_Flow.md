# Avenue — Master Blueprint (Full Product Definition)
> **v2 — Audited & Complete.** This document is the single source of truth for everything we are building.

---

## Part 1: Developer Integration Flow

### How a Developer Uses Avenue (End-to-End)

```
[Developer App] ──signup──► [Avenue Dashboard]
                                    │
                          generates API Key + Webhook URL
                                    │
Developer pastes Avenue's inbound URL ──► [Nomba Dashboard]
                                    │
Developer registers their own app URL in Avenue (outbound)
                                    │
                           ┌────────▼────────┐
                           │   Developer App  │
                           │  calls POST /wallets
                           └────────┬────────┘
                                    │ Avenue calls Nomba → gets NUBAN
                                    │ Avenue stores wallet in DB
                                    ▼
                           Returns NUBAN to developer
                                    │
               End-user transfers money to NUBAN
                                    │
                           [Nomba fires webhook]
                                    ▼
                    ┌──── Avenue Webhook Receiver ────┐
                    │  1. Validate Nomba HMAC sig      │
                    │  2. Idempotency check             │
                    │  3. Identify target wallet        │
                    │  4. LLM Intent Extraction         │
                    │  5. Double-Entry Ledger Update    │
                    │  6. Evaluate Agent Triggers       │
                    │  7. Log + Queue outbound event    │
                    └──────────────┬──────────────────┘
                                   │
                    Fires ENRICHED webhook to Developer's App
```

### Step-by-Step Onboarding

1. **Signup** — Developer creates an account on Avenue (email + password + company name).
2. **Verification** — Email verification link sent; account is restricted until verified.
3. **API Keys Issued** — `ave_live_xxxx` and `ave_test_xxxx` keys generated automatically.
4. **Inbound Webhook URL** — Avenue generates a unique URL per developer:
   `https://api.avenue.so/v1/webhooks/inbound/dev_xxxx`
   Developer pastes this into their Nomba dashboard as the webhook destination.
5. **Nomba Credentials** — Developer provides their Nomba `client_id` + `client_secret` via the settings page so Avenue can create virtual accounts and initiate transfers on their behalf.
6. **Outbound Webhook URL** — Developer registers the URL of their own app where Avenue will push enriched events after processing.
7. **Live** — Developer starts creating wallets via the API. Full flow is active.

---

## Part 2: Backend — All Modules & Endpoints

**Base URL:** `https://api.avenue.so`
**Authentication:** All non-auth endpoints require `x-api-key: ave_live_xxxx` in the request header.
**Pagination:** All list endpoints support `?page=1&limit=20` query params.
**Filtering:** All list endpoints support relevant filter query params (documented per module).

---

### Module 1: Auth

> Handles developer signup, login, session management, and password flows.

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| `POST` | `/v1/auth/signup` | ❌ | Register a new developer account |
| `POST` | `/v1/auth/login` | ❌ | Login, returns JWT access token |
| `POST` | `/v1/auth/logout` | ✅ | Invalidate current JWT session |
| `POST` | `/v1/auth/verify-email` | ❌ | Verify email with one-time token |
| `POST` | `/v1/auth/resend-verification` | ❌ | Resend verification email |
| `POST` | `/v1/auth/forgot-password` | ❌ | Trigger password reset email |
| `POST` | `/v1/auth/reset-password` | ❌ | Submit new password with reset token |
| `DELETE` | `/v1/auth/me` | ✅ | Delete developer account (with confirmation) |

**Signup Payload:**
```json
{ "email": "dev@proptech.io", "password": "SecurePass123!", "company_name": "PropTech Inc" }
```
**Login Response:**
```json
{ "access_token": "eyJhbGciOiJIUzI1NiIs...", "developer_id": "dev_abc123", "token_type": "bearer" }
```

---

### Module 2: Developer Profile & Settings

> Manages the developer's account settings, API keys, Nomba credentials, and webhook configuration.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/developers/me` | Get developer profile (name, email, created_at) |
| `PATCH` | `/v1/developers/me` | Update company name or email |
| `PATCH` | `/v1/developers/me/password` | Change password (requires current_password) |
| `GET` | `/v1/developers/me/keys` | List all API keys (live + test, masked) |
| `POST` | `/v1/developers/me/keys` | Generate a new API key with a label |
| `DELETE` | `/v1/developers/me/keys/:key_id` | Revoke/delete an API key |
| `POST` | `/v1/developers/me/nomba-config` | Save Nomba `account_id`, `client_id`, `client_secret` (encrypted at rest), `webhook_signature_key`, and optional `sub_account_id` |
| `GET` | `/v1/developers/me/nomba-config` | View connected Nomba config (`account_id`, `client_id`, and `sub_account_id` shown, secret masked) |
| `DELETE` | `/v1/developers/me/nomba-config` | Remove Nomba credentials |
| `GET` | `/v1/developers/me/inbound-webhook-url` | Get the unique Nomba-facing inbound URL for this developer |
| `POST` | `/v1/developers/me/outbound-webhook` | Set/update the developer's outbound webhook URL + optional signing secret |
| `GET` | `/v1/developers/me/outbound-webhook` | View current outbound webhook config |
| `DELETE` | `/v1/developers/me/outbound-webhook` | Remove the outbound webhook URL |
| `POST` | `/v1/developers/me/outbound-webhook/test` | Send a test `ping` event to the configured outbound URL |

---

### Module 3: Wallet Management

> Core wallet CRUD. Developers provision one wallet per customer/purpose.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/wallets` | Create a new wallet + provision a NUBAN via Nomba |
| `GET` | `/v1/wallets` | List all wallets (filterable: `?status=ACTIVE`, `?customer_reference=x`) |
| `GET` | `/v1/wallets/:wallet_id` | Get full wallet details (balance, NUBAN, status, system_prompt, agents count) |
| `PATCH` | `/v1/wallets/:wallet_id` | Update wallet metadata (label, system_prompt, customer_reference) |
| `POST` | `/v1/wallets/:wallet_id/close` | Deactivate a wallet — sets status to `CLOSED`, future payments go to suspense |
| `POST` | `/v1/wallets/:wallet_id/freeze` | Temporarily freeze a wallet — sets status to `FROZEN` |
| `POST` | `/v1/wallets/:wallet_id/unfreeze` | Reactivate a frozen wallet back to `ACTIVE` |
| `POST` | `/v1/wallets/:wallet_id/transfer` | **End-User Transfer API:** Transfer money out of this wallet to another Avenue wallet (internal) or a standard bank account (external). Fails if `allow_transfers_out` is false. |
| `GET` | `/v1/wallets/:wallet_id/balance` | Get only the current balance (lightweight endpoint for polling) |
| `GET` | `/v1/wallets/:wallet_id/account` | Get the virtual account details (account_number, bank_name, account_name) |

**Wallet Statuses:** `ACTIVE` | `FROZEN` | `CLOSED`

**Create Wallet Payload:**
```json
{
  "customer_reference": "user_987",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "label": "John Doe — School Fees",
  "currency": "NGN",
  "system_prompt": "This wallet collects school fees. Expected amount: 50,000 NGN per term. Flag anything under 50,000 as an underpayment.",
  "allow_transfers_out": true,
  "sub_account_id": "sub_12345"
}
```
**Create Wallet Response:**
```json
{
  "wallet_id": "wal_abc123",
  "customer_reference": "user_987",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "label": "John Doe — School Fees",
  "account_number": "2211334455",
  "bank_name": "Nomba MFB",
  "account_name": "PropTech Inc / John Doe",
  "balance": 0,
  "currency": "NGN",
  "status": "ACTIVE",
  "system_prompt": "This wallet collects school fees...",
  "created_at": "2026-07-01T11:00:00Z"
}
```

---

### Module 4: Ledger & Transactions

> The immutable double-entry ledger. Every debit/credit is a permanent, append-only record.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/wallets/:wallet_id/statement` | Paginated bank-style statement (date, type, amount, running balance) |
| `GET` | `/v1/wallets/:wallet_id/transactions` | Full transaction list with AI metadata (filterable: `?type=CREDIT`, `?flag=UNDERPAYMENT_DETECTED`) |
| `GET` | `/v1/wallets/:wallet_id/transactions/:tx_id` | Get a single transaction with complete AI intelligence breakdown |
| `GET` | `/v1/transactions` | List ALL transactions across ALL wallets (global view, with filters) |
| `GET` | `/v1/transactions/:tx_id` | Get a single transaction by ID (global) |

**Transaction Object:**
```json
{
  "transaction_id": "tx_xyz999",
  "wallet_id": "wal_abc123",
  "developer_id": "dev_abc123",
  "type": "CREDIT",
  "amount": 25000,
  "balance_before": 0,
  "balance_after": 25000,
  "currency": "NGN",
  "status": "SETTLED",
  "nomba_reference": "NOM-TXN-12345",
  "sender_name": "Emeka Okafor",
  "sender_account": "0123456789",
  "avenue_intelligence": {
    "raw_narration": "From papa for chidi school fees term 1 part 1",
    "extracted_intent": "Partial payment for Term 1 school fees",
    "confidence_score": 0.97,
    "flags": ["UNDERPAYMENT_DETECTED"],
    "suggested_label": "School Fees — Term 1 (Partial)"
  },
  "created_at": "2026-07-01T12:00:00Z"
}
```

---

### Module 5: Agents (Automated Rules Engine)

> Attach automated trigger-action rules to individual wallets.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/wallets/:wallet_id/agents` | Create and attach a new agent to a wallet |
| `GET` | `/v1/wallets/:wallet_id/agents` | List all agents on a specific wallet |
| `GET` | `/v1/wallets/:wallet_id/agents/:agent_id` | Get a single agent's config |
| `PATCH` | `/v1/wallets/:wallet_id/agents/:agent_id` | Update agent (threshold, action, name) |
| `PATCH` | `/v1/wallets/:wallet_id/agents/:agent_id/toggle` | Enable or disable an agent without deleting it |
| `DELETE` | `/v1/wallets/:wallet_id/agents/:agent_id` | Permanently remove an agent |
| `GET` | `/v1/agents` | List ALL agents across ALL wallets (for the global agents dashboard page) |
| `GET` | `/v1/agents/:agent_id/logs` | Get execution history for an agent (when it fired, what it did, result) |

**Supported Triggers:**
| Trigger | Description |
|---------|-------------|
| `BALANCE_ABOVE` | Fires when wallet balance exceeds a threshold |
| `BALANCE_BELOW` | Fires when balance drops below a threshold |
| `ON_CREDIT` | Fires on every successful credit event |
| `ON_CREDIT_AMOUNT_ABOVE` | Fires when a single credit amount exceeds a value |

**Supported Actions:**
| Action | Description |
|--------|-------------|
| `SWEEP` | Transfer full balance to a destination wallet |
| `PARTIAL_SWEEP` | Transfer a fixed amount to a destination wallet |
| `WEBHOOK_NOTIFY` | Fire a custom webhook notification to developer's URL |
| `LOCK_WALLET` | Freeze the wallet from receiving further credits |

**Create Agent Payload (External Sweep):**
```json
{
  "name": "Auto-Sweep to Escrow Bank",
  "trigger": "BALANCE_ABOVE",
  "threshold": 50000,
  "action": "SWEEP",
  "destination_account_number": "0123456789",
  "destination_bank_code": "058",
  "destination_account_name": "PropTech Escrow"
}
```

---

### Module 6: Suspense Engine

> Catches and holds anomalous or unroutable payments for manual review.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/suspense` | List all suspense items (filterable: `?status=PENDING`, `?reason=WALLET_CLOSED`) |
| `GET` | `/v1/suspense/:suspense_id` | Get details of a specific suspense item with raw Nomba payload |
| `POST` | `/v1/suspense/:suspense_id/resolve` | Resolve: manually credit to a wallet, refund to sender, or dismiss |
| `POST` | `/v1/suspense/:suspense_id/flag` | Add a manual note/flag for record-keeping without resolving |

**Suspense Statuses:** `PENDING` | `RESOLVED` | `FLAGGED`

**Suspense Reasons:**
| Reason | Description |
|--------|-------------|
| `WALLET_CLOSED` | Payment arrived at a deactivated (`CLOSED`) wallet |
| `WALLET_FROZEN` | Payment arrived at a `FROZEN` wallet |
| `NO_WALLET_FOUND` | Payment arrived at an account number not in Avenue's system |
| `AI_LOW_CONFIDENCE` | AI confidence score below threshold; narration too ambiguous to auto-process |
| `AI_MISDIRECTION_SUSPECTED` | AI detected the narration strongly suggests a different wallet |
| `DUPLICATE_REFERENCE` | Nomba reference already exists in the ledger (caught before processing) |

**Resolve Payload:**
```json
{
  "action": "CREDIT_WALLET",
  "target_wallet_id": "wal_abc123",
  "note": "Manually verified payment belongs to John Doe"
}
```
*Note: `action` can be `CREDIT_WALLET`, `DISMISS`, or `REFUND`. If `REFUND` is selected, Avenue automatically initiates a transfer back to the original sender's bank account.*

---

### Module 7: Inbound Webhooks (Nomba → Avenue)

> Internal endpoint. Nomba calls this; developers never call it directly.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/webhooks/inbound/:developer_id` | Developer-specific Nomba webhook receiver |

**Internal Processing Pipeline (sequential, atomic):**
1. Validate Nomba HMAC-SHA256 signature against stored `webhook_signature_key`
2. Parse and log the raw payload
3. Route based on event type:
   - For `payment_success` (inbound transfer):
     a. Idempotency check — if `nomba_reference` exists in `ledger_entries`, return `200 OK` immediately (silent skip)
     b. Look up target wallet by `account_number` — if not found, route to Suspense (`NO_WALLET_FOUND`)
     c. Check wallet status — if `CLOSED` or `FROZEN`, route to Suspense
     d. Run AI reconciliation engine: narration + `system_prompt` → intent + flags
     e. If AI confidence < threshold, route to Suspense (`AI_LOW_CONFIDENCE`)
     f. Execute atomic double-entry ledger write (credit wallet)
     g. Evaluate all active agents on the wallet — execute triggered actions
     h. Dispatch `ledger.credit` outbound webhook event to developer's registered URL
   - For `payout_success` (outbound transfer success):
     a. Update `PENDING` debit ledger entry to `SETTLED`
     b. Dispatch `transfer.success` outbound webhook event to developer
   - For `payout_failed` / `payout_refund` (outbound transfer failure):
     a. Update `PENDING` debit ledger entry to `REVERSED`
     b. Record compensatory credit to wallet to refund the failed transfer amount
     c. Dispatch `transfer.failed` outbound webhook event to developer
4. Return `200 OK` to Nomba

---

### Module 8: Outbound Webhook Logs (Avenue → Developer)

> Tracks every enriched event Avenue attempts to deliver to developer apps.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/webhook-logs` | List all outbound webhook delivery attempts (filterable: `?event_type=ledger.credit`, `?status=FAILED`) |
| `GET` | `/v1/webhook-logs/:log_id` | View a specific attempt: full payload, response code, response body, duration |
| `POST` | `/v1/webhook-logs/:log_id/retry` | Manually trigger a retry for a failed delivery |

**Delivery Retry Logic:**
- Avenue automatically retries failed deliveries with exponential backoff: 30s → 5m → 30m → 2h → 24h (5 attempts total)
- After 5 failures, the log is marked `DEAD` and no more automatic retries occur
- Manual retry via the endpoint above resets the counter

**Outbound Event Types:**
| Event | Description |
|-------|-------------|
| `ledger.credit` | Wallet successfully credited |
| `ledger.debit` | Wallet debited (e.g., via agent sweep) |
| `wallet.created` | New wallet provisioned |
| `wallet.closed` | Wallet deactivated |
| `wallet.frozen` | Wallet frozen |
| `wallet.unfrozen` | Wallet unfrozen |
| `transfer.success` | External transfer succeeded and funds arrived |
| `transfer.failed` | External transfer failed and funds were refunded |
| `agent.triggered` | An agent rule fired and executed an action |
| `suspense.created` | A payment routed to suspense |
| `suspense.resolved` | A suspense item resolved |
| `payment.misdirected` | AI detected narration mismatch |
| `ping` | Test event sent from dashboard |

**Enriched Outbound Webhook Payload:**
```json
{
  "event_id": "evt_001",
  "event_type": "ledger.credit",
  "api_version": "2026-07-01",
  "created_at": "2026-07-01T12:01:00Z",
  "data": {
    "wallet_id": "wal_abc123",
    "customer_reference": "user_987",
    "transaction_id": "tx_xyz999",
    "amount": 25000,
    "new_balance": 50000,
    "currency": "NGN",
    "sender_name": "Emeka Okafor",
    "avenue_intelligence": {
      "raw_narration": "From papa for chidi school fees term 1 part 1",
      "extracted_intent": "Partial payment for Term 1 school fees",
      "confidence_score": 0.97,
      "flags": ["UNDERPAYMENT_DETECTED"]
    }
  }
}
```

**Suspense Created Webhook Payload (`suspense.created`):**
```json
{
  "event_id": "evt_002",
  "event_type": "suspense.created",
  "api_version": "2026-07-01",
  "created_at": "2026-07-01T12:05:00Z",
  "data": {
    "suspense_id": "890022ce-bae0-45c1-9b9d-ee7872e6ca27",
    "reason": "AI_LOW_CONFIDENCE",
    "amount": 5000,
    "currency": "NGN",
    "sender_name": "John Doe",
    "account_number": "1234567890"
  }
}
```

**Suspense Resolved Webhook Payload (`suspense.resolved`):**
```json
{
  "event_id": "evt_003",
  "event_type": "suspense.resolved",
  "api_version": "2026-07-01",
  "created_at": "2026-07-01T12:15:00Z",
  "data": {
    "suspense_id": "890022ce-bae0-45c1-9b9d-ee7872e6ca27",
    "action_taken": "REFUND",
    "resolved_by": "manual",
    "target_wallet_id": null
  }
}
```

---

### Module 9: Analytics & Reporting

> Aggregated metrics for the developer's overview dashboard.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/analytics/overview` | Total wallets, total volume (today/7d/30d/all-time), total transactions, suspense count |
| `GET` | `/v1/analytics/transactions` | Transaction volume timeseries (filterable: `?period=7d|30d|90d`) |
| `GET` | `/v1/analytics/wallets` | Wallet breakdown by status (`ACTIVE`, `FROZEN`, `CLOSED`) |
| `GET` | `/v1/analytics/suspense` | Suspense count by reason, resolution rate, average time-to-resolve |
| `GET` | `/v1/analytics/webhooks` | Webhook delivery success rate, failure rate, dead letters |

---

## Part 3: Database Schema (PostgreSQL)

> All tables include `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ` (auto-updated via trigger). All `id` fields are UUIDs.

### `developers`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | |
| `hashed_password` | TEXT | NOT NULL | bcrypt |
| `company_name` | VARCHAR(255) | NOT NULL | |
| `is_verified` | BOOLEAN | DEFAULT false | |
| `verified_at` | TIMESTAMPTZ | NULLABLE | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | | |

### `api_keys`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `developer_id` | UUID | FK → developers | |
| `key_hash` | TEXT | NOT NULL | SHA-256 hash of the actual key |
| `key_prefix` | VARCHAR(12) | NOT NULL | e.g. `ave_live_xxxx` for display |
| `label` | VARCHAR(100) | | |
| `type` | ENUM | `live`, `test` | |
| `last_used_at` | TIMESTAMPTZ | NULLABLE | |
| `revoked_at` | TIMESTAMPTZ | NULLABLE | NULL = active |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

### `nomba_configs`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `developer_id` | UUID | FK → developers, UNIQUE | One config per developer |
| `account_id` | VARCHAR(64) | NOT NULL | Nomba parent account ID |
| `client_id` | TEXT | NOT NULL | Stored in plaintext (safe) |
| `encrypted_client_secret` | TEXT | NOT NULL | AES-256 encrypted |
| `webhook_signature_key` | VARCHAR(255) | NOT NULL | Key from Nomba dashboard to verify HMAC signatures |
| `sub_account_id` | VARCHAR(255) | NULLABLE | Default Nomba Sub-Account |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | | |

### `outbound_webhooks`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `developer_id` | UUID | FK → developers, UNIQUE | One outbound config per developer |
| `url` | TEXT | NOT NULL | The developer's app endpoint |
| `signing_secret` | TEXT | NOT NULL | Used to sign Avenue → Developer payloads |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | | |

### `wallets`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `developer_id` | UUID | FK → developers | |
| `customer_reference` | VARCHAR(255) | NOT NULL | Developer's user ID |
| `first_name` | VARCHAR(100) | NOT NULL | User's first name |
| `last_name` | VARCHAR(100) | NOT NULL | User's last name |
| `email` | VARCHAR(255) | NOT NULL | User's email |
| `label` | VARCHAR(255) | | Human-readable wallet name |
| `nomba_account_id` | TEXT | UNIQUE, NOT NULL | Nomba's internal virtual account ID |
| `nomba_sub_account_id` | VARCHAR(255) | NULLABLE | Bound Sub-Account ID |
| `account_number` | VARCHAR(20) | UNIQUE, NOT NULL | The NUBAN |
| `bank_name` | VARCHAR(100) | NOT NULL | |
| `account_name` | VARCHAR(255) | NOT NULL | e.g. "PropTech Inc / John Doe" |
| `currency` | VARCHAR(3) | DEFAULT `NGN` | |
| `status` | ENUM | `ACTIVE`, `FROZEN`, `CLOSED` | DEFAULT `ACTIVE` |
| `system_prompt` | TEXT | NULLABLE | AI instruction for this wallet |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | | |

**Index:** `(developer_id, customer_reference)` — fast lookups by developer + customer.

### `ledger_entries`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `wallet_id` | UUID | FK → wallets | |
| `developer_id` | UUID | FK → developers | Denormalized for fast global queries |
| `type` | ENUM | `CREDIT`, `DEBIT` | |
| `amount` | BIGINT | NOT NULL | In kobo (smallest unit), never floats |
| `balance_before` | BIGINT | NOT NULL | Snapshot of balance before this entry |
| `balance_after` | BIGINT | NOT NULL | Snapshot of balance after this entry |
| `currency` | VARCHAR(3) | DEFAULT `NGN` | |
| `status` | ENUM | `SETTLED`, `PENDING`, `REVERSED` | DEFAULT `SETTLED` |
| `nomba_reference` | TEXT | UNIQUE | Idempotency key; NULL for internal debits |
| `sender_name` | VARCHAR(255) | NULLABLE | |
| `sender_account` | VARCHAR(20) | NULLABLE | |
| `raw_narration` | TEXT | NULLABLE | Original bank narration |
| `ai_metadata` | JSONB | NULLABLE | Full AI output: intent, flags, confidence |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Immutable — no `updated_at` |

**Index:** `(wallet_id, created_at DESC)` — fast statement queries.
**Constraint:** `nomba_reference` UNIQUE enforces idempotency at the DB level.

### `agents`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `wallet_id` | UUID | FK → wallets | |
| `developer_id` | UUID | FK → developers | Denormalized for global agents list |
| `name` | VARCHAR(255) | NOT NULL | |
| `trigger` | ENUM | `BALANCE_ABOVE`, `BALANCE_BELOW`, `ON_CREDIT`, `ON_CREDIT_AMOUNT_ABOVE` | |
| `threshold` | BIGINT | NULLABLE | In kobo |
| `action` | ENUM | `SWEEP`, `PARTIAL_SWEEP`, `WEBHOOK_NOTIFY`, `LOCK_WALLET` | |
| `destination_wallet_id` | UUID | FK → wallets, NULLABLE | For SWEEP/PARTIAL_SWEEP |
| `sweep_amount` | BIGINT | NULLABLE | For PARTIAL_SWEEP only |
| `is_active` | BOOLEAN | DEFAULT true | |
| `trigger_count` | INTEGER | DEFAULT 0 | How many times this agent has fired |
| `last_triggered_at` | TIMESTAMPTZ | NULLABLE | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | | |

### `agent_logs`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `agent_id` | UUID | FK → agents | |
| `wallet_id` | UUID | FK → wallets | |
| `developer_id` | UUID | FK → developers | |
| `trigger_event` | TEXT | NOT NULL | e.g. "balance reached 50000" |
| `action_taken` | TEXT | NOT NULL | e.g. "swept 50000 to wal_master" |
| `result` | ENUM | `SUCCESS`, `FAILED` | |
| `error_message` | TEXT | NULLABLE | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

### `suspense_items`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `developer_id` | UUID | FK → developers | |
| `account_number` | VARCHAR(20) | NOT NULL | The destination account that received the money |
| `amount` | BIGINT | NOT NULL | In kobo |
| `sender_name` | VARCHAR(255) | NULLABLE | |
| `raw_narration` | TEXT | NULLABLE | |
| `reason` | ENUM | `WALLET_CLOSED`, `WALLET_FROZEN`, `NO_WALLET_FOUND`, `AI_LOW_CONFIDENCE`, `AI_MISDIRECTION_SUSPECTED`, `DUPLICATE_REFERENCE` | |
| `status` | ENUM | `PENDING`, `RESOLVED`, `FLAGGED` | DEFAULT `PENDING` |
| `raw_payload` | JSONB | NOT NULL | Full Nomba webhook payload |
| `nomba_reference` | TEXT | NULLABLE | |
| `resolved_at` | TIMESTAMPTZ | NULLABLE | |
| `resolved_by` | TEXT | NULLABLE | "auto" or developer action |
| `resolution_note` | TEXT | NULLABLE | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

### `webhook_logs`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `developer_id` | UUID | FK → developers | |
| `event_id` | UUID | UNIQUE, NOT NULL | Avenue-generated event identifier |
| `event_type` | VARCHAR(50) | NOT NULL | e.g. `ledger.credit` |
| `payload` | JSONB | NOT NULL | Full enriched payload sent |
| `status` | ENUM | `DELIVERED`, `FAILED`, `PENDING`, `DEAD` | |
| `http_status_code` | INTEGER | NULLABLE | Response code from developer's server |
| `response_body` | TEXT | NULLABLE | Developer's server response (first 500 chars) |
| `attempt_count` | INTEGER | DEFAULT 0 | |
| `next_retry_at` | TIMESTAMPTZ | NULLABLE | Scheduled time for next retry |
| `delivered_at` | TIMESTAMPTZ | NULLABLE | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | | |

---

## Part 4: Backend Project Structure

```text
avenue-backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py              # POST /auth/* — signup, login, verify, reset
│   │       ├── developers.py        # GET/PATCH /developers/me, keys, nomba-config, webhooks
│   │       ├── wallets.py           # Full wallet CRUD + freeze/close/unfreeze
│   │       ├── ledger.py            # Statement & transaction read endpoints
│   │       ├── agents.py            # Agent CRUD, toggle, global list, agent logs
│   │       ├── suspense.py          # Suspense list, detail, resolve, flag
│   │       ├── inbound.py           # POST /webhooks/inbound/:developer_id (Nomba receiver)
│   │       ├── webhook_logs.py      # GET /webhook-logs, retry
│   │       └── analytics.py        # GET /analytics/*
│   │
│   ├── core/
│   │   ├── config.py                # Settings via pydantic-settings (.env loader)
│   │   ├── security.py              # API key hashing, JWT encode/decode, HMAC validation
│   │   ├── dependencies.py          # FastAPI dependency: get_current_developer()
│   │   └── errors.py                # Global exception handlers + custom error classes
│   │
│   ├── db/
│   │   ├── session.py               # SQLAlchemy async engine + session factory
│   │   ├── base.py                  # Base declarative model
│   │   └── models/
│   │       ├── developer.py         # Developer, ApiKey models
│   │       ├── nomba_config.py      # NombaConfig, OutboundWebhook models
│   │       ├── wallet.py            # Wallet model
│   │       ├── ledger.py            # LedgerEntry model
│   │       ├── agent.py             # Agent, AgentLog models
│   │       ├── suspense.py          # SuspenseItem model
│   │       └── webhook_log.py       # WebhookLog model
│   │
│   ├── schemas/
│   │   ├── auth.py                  # SignupRequest, LoginRequest, TokenResponse
│   │   ├── developer.py             # DeveloperProfile, UpdateDeveloper, ApiKeyResponse
│   │   ├── wallet.py                # CreateWalletRequest, WalletResponse, UpdateWalletRequest
│   │   ├── ledger.py                # TransactionResponse, StatementEntry
│   │   ├── agent.py                 # CreateAgentRequest, AgentResponse, AgentLogResponse
│   │   ├── suspense.py              # SuspenseResponse, ResolveRequest
│   │   ├── webhook.py               # WebhookLogResponse, OutboundWebhookConfig
│   │   └── analytics.py             # OverviewStats, TransactionTimeseries
│   │
│   ├── services/
│   │   ├── nomba.py                 # Nomba API client: create NUBAN, initiate transfer
│   │   ├── ledger.py                # Atomic double-entry write, balance computation
│   │   ├── ai_engine.py             # LLM reconciliation pipeline (narration → intent + flags)
│   │   ├── agent_runner.py          # Evaluates and executes agent triggers post-credit
│   │   ├── suspense.py              # Routes anomalous payments; creates suspense records
│   │   ├── webhook_dispatcher.py    # Sends outbound events; handles retry queue
│   │   ├── email.py                 # Transactional email (verification, password reset)
│   │   └── encryption.py           # AES-256 encrypt/decrypt Nomba client secrets
│   │
│   └── main.py                      # FastAPI app factory: create_app(), include routers, CORS
│
├── alembic/
│   ├── env.py
│   └── versions/                    # Migration files
│
├── tests/
│   ├── test_auth.py
│   ├── test_wallets.py
│   ├── test_ledger.py
│   ├── test_inbound_webhook.py
│   └── test_ai_engine.py
│
├── .env.example
├── requirements.txt
├── Dockerfile
└── docker-compose.yml               # App + PostgreSQL + Redis for local dev
```

---

## Part 5: Frontend Dashboard (Developer Portal)

> Next.js SPA. Design modelled on Paystack/Squad/Nomba dashboards.

### Auth Pages
| Page | Route | Description |
|------|-------|-------------|
| Signup | `/signup` | Company name, email, password + terms checkbox |
| Login | `/login` | Email + password |
| Email Verification | `/verify-email` | One-time token confirm page |
| Forgot Password | `/forgot-password` | Email input → triggers reset link |
| Reset Password | `/reset-password?token=xxx` | New password form |

### Dashboard
| Page | Route | Description |
|------|-------|-------------|
| Overview | `/dashboard` | Stats cards (wallets, volume, transactions, suspense count), recent transactions table, webhook health indicator, quick-start guide for new users |

### Wallets
| Page | Route | Description |
|------|-------|-------------|
| Wallet List | `/dashboard/wallets` | Searchable, filterable table (status, customer_reference, balance range) |
| Wallet Detail | `/dashboard/wallets/:id` | NUBAN card, balance display, system_prompt, agents list, ledger statement tab, quick actions (freeze/close) |
| Create Wallet | `/dashboard/wallets/new` | Form — for testing purposes |

### Transactions
| Page | Route | Description |
|------|-------|-------------|
| All Transactions | `/dashboard/transactions` | Global log, filterable by date, type (CREDIT/DEBIT), flag |
| Transaction Detail | `/dashboard/transactions/:id` | Full details + Avenue Intelligence panel with narration, intent, confidence score, flags |

### Agents
| Page | Route | Description |
|------|-------|-------------|
| All Agents | `/dashboard/agents` | Global list of all agents across all wallets, status toggle |
| Agent Detail | `/dashboard/agents/:id` | Agent config, execution history (agent_logs), enable/disable |

### Suspense
| Page | Route | Description |
|------|-------|-------------|
| Suspense Queue | `/dashboard/suspense` | List of `PENDING` items, sortable by reason, amount, date |
| Suspense Detail | `/dashboard/suspense/:id` | Raw Nomba payload viewer, resolve form (credit wallet / dismiss) |

### Webhooks
| Page | Route | Description |
|------|-------|-------------|
| Webhook Config | `/dashboard/webhooks` | Display inbound URL (copy button), set outbound URL, send test event |
| Webhook Logs | `/dashboard/webhooks/logs` | Delivery attempts table with status badges, payload preview modal, retry button |

### Settings
| Page | Route | Description |
|------|-------|-------------|
| API Keys | `/dashboard/settings/keys` | Live/Test key display (masked), generate, label, revoke |
| Nomba Integration | `/dashboard/settings/nomba` | Connect Nomba credentials form, connection status badge |
| Profile | `/dashboard/settings/profile` | Company name, email, change password |

---

## Part 6: Documentation — Mintlify (Free Tier)

> Mintlify renders from a `docs/` folder via GitHub integration. Zero hosting cost. Custom domain: `docs.avenue.so`.

```text
docs/
├── mint.json                         # Mintlify config (nav, colors, logo)
├── introduction.mdx                  # What is Avenue? The value prop.
├── quickstart.mdx                    # 5-minute guide: signup → wallet → live
├── authentication.mdx                # API keys, test vs. live mode, headers
├── webhooks.mdx                      # Inbound URL setup + outbound events reference
├── idempotency.mdx                   # How Avenue prevents double-crediting
├── api-reference/
│   ├── auth/signup.mdx
│   ├── auth/login.mdx
│   ├── wallets/create.mdx
│   ├── wallets/list.mdx
│   ├── wallets/get.mdx
│   ├── wallets/update.mdx
│   ├── wallets/close.mdx
│   ├── wallets/freeze.mdx
│   ├── transactions/list.mdx
│   ├── transactions/get.mdx
│   ├── transactions/statement.mdx
│   ├── agents/create.mdx
│   ├── agents/list.mdx
│   ├── agents/toggle.mdx
│   ├── suspense/list.mdx
│   ├── suspense/resolve.mdx
│   ├── webhook-logs/list.mdx
│   └── webhook-logs/retry.mdx
└── concepts/
    ├── wallets-and-nubans.mdx        # How NUBANs work
    ├── the-ledger.mdx                # Double-entry ledger explained
    ├── ai-reconciliation.mdx         # How the AI narration engine works
    ├── agents.mdx                    # Automations and triggers
    └── suspense-engine.mdx           # Edge case handling and misdirection
```

---

## Part 7: Environment Variables (.env)

```env
# ── App ───────────────────────────────────────────
APP_ENV=development
APP_NAME=Avenue
FRONTEND_URL=http://localhost:3000          # For CORS allow-list

# ── Security ──────────────────────────────────────
SECRET_KEY=change_me_super_long_random_string_here
ENCRYPTION_KEY=32_byte_hex_string_for_aes256

# ── Database ──────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/avenue_db

# ── Redis (webhook retry queue) ───────────────────
REDIS_URL=redis://localhost:6379

# ── Nomba ─────────────────────────────────────────
NOMBA_BASE_URL=https://api.nomba.com

# ── AI Engine ─────────────────────────────────────
GROQ_API_KEY=gsk-...
AI_CONFIDENCE_THRESHOLD=0.75              # Below this → suspense

# ── Outbound Webhooks ─────────────────────────────
WEBHOOK_MAX_RETRIES=5

# ── Email (Transactional) ─────────────────────────
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASSWORD=re_xxxxxxxxxxxxxx
EMAIL_FROM=hello@avenue.so
```

---

## Part 8: Key Technical Decisions & Rationale

| Decision | Choice | Reason |
|----------|--------|--------|
| Currency storage | BIGINT (kobo) | Eliminates all floating-point rounding errors in financial math |
| Idempotency | DB UNIQUE constraint on `nomba_reference` | Enforced at the database level — impossible to double-credit even under race conditions |
| Secret storage | AES-256 encrypted at rest | Nomba client secrets must never be stored in plaintext |
| AI confidence threshold | Configurable via env var | Allows tuning without code deployments |
| Async framework | FastAPI + asyncpg | Handles many concurrent webhook deliveries without blocking |
| Amounts in responses | Always in kobo (integer) | Consistent; frontend divides by 100 for display |
