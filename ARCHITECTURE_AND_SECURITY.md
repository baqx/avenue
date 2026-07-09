# Architecture & Security

This document covers Avenue's system architecture, security model, authentication flows, data handling practices, webhook design, and the internal processing pipeline.

---

## Table of Contents

- [System Overview](#system-overview)
- [Component Architecture](#component-architecture)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [API Key Design](#api-key-design)
- [Inbound Webhook Pipeline](#inbound-webhook-pipeline)
- [AI Intent Parsing Engine](#ai-intent-parsing-engine)
- [Double-Entry Ledger](#double-entry-ledger)
- [Suspense Engine](#suspense-engine)
- [Outbound Webhook System](#outbound-webhook-system)
- [Data Encryption](#data-encryption)
- [Nomba Credential Handling](#nomba-credential-handling)
- [CORS & Network Policy](#cors--network-policy)
- [Error Handling](#error-handling)
- [Currency Handling](#currency-handling)

---

## System Overview

Avenue is a multi-tenant infrastructure platform. Each registered developer account is a fully isolated tenant. All data — wallets, ledger entries, suspense items, webhook configs, API keys — is scoped to and filtered by `developer_id` at the application layer.

```
Developer Account
  └── Nomba Config (account_id, client_id, encrypted_client_secret, sub_account_id)
  └── API Keys (multiple, revocable)
  └── Outbound Webhook Config (url, signing_secret)
  └── Wallets (1..N)
        └── Ledger Entries (immutable, append-only)
        └── Agents (automated rules)
  └── Suspense Items
  └── Webhook Logs
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       avenue-frontend (Next.js)                      │
│  Dashboard → RTK Query → REST API calls (Bearer JWT)                │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │ HTTPS
┌───────────────────────────────────▼─────────────────────────────────┐
│                       avenue-backend (FastAPI)                       │
│                                                                      │
│  /v1/auth/*         → signup, login, verify, password reset          │
│  /v1/wallets/*      → CRUD + freeze/close + transfer + agents        │
│  /v1/transactions/* → ledger reads + reports                         │
│  /v1/suspense/*     → suspense queue read + resolve                  │
│  /v1/banks/*        → bank list + account name resolution            │
│  /v1/developers/*   → profile, API keys, webhook config              │
│  /v1/webhooks/*     → inbound Nomba receiver + log viewer            │
│                                                                      │
│  ┌────────────────────┐    ┌────────────────────────────────────┐   │
│  │   FastAPI Routes   │    │         arq Background Workers      │   │
│  │  (async, sync IO)   │───▶│  process_inbound_webhook_task      │   │
│  └────────────────────┘    │  retry_failed_webhooks_task        │   │
│                            └──────────────┬─────────────────────┘   │
│                                           │                          │
│  ┌────────────────────────────────────────▼────────────────────┐    │
│  │                       Service Layer                          │    │
│  │  nomba.py          → Nomba API client                        │    │
│  │  ai_engine.py      → Groq LLM intent parsing                 │    │
│  │  ledger.py         → double-entry accounting                 │    │
│  │  suspense.py       → suspense item creation                  │    │
│  │  agent_runner.py   → agent condition evaluation              │    │
│  │  webhook_dispatcher.py → outbound delivery + retry           │    │
│  │  encryption.py     → AES-256 encrypt/decrypt                 │    │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          ┌────────────────────┴────────────────────┐
          │                                          │
  ┌───────▼────────┐                      ┌─────────▼──────────┐
  │  PostgreSQL 16  │                      │     Redis 7         │
  │  (primary DB)   │                      │  (arq job queue)    │
  └────────────────┘                      └────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │     Nomba API        │
                    │  (NUBANs, transfers, │
                    │   bank list, webhooks│
                    └─────────────────────┘
```

---

## Database Schema

All tables use `UUID` primary keys (PostgreSQL native `uuid` type). Foreign keys cascade on delete. All timestamps are stored in UTC.

### Core Tables

| Table | Purpose |
|---|---|
| `developers` | Developer accounts — email, hashed password, company name, verification state |
| `api_keys` | Revocable API keys — only the SHA-256 hash is stored, never the raw key |
| `nomba_configs` | Nomba credentials per developer — client secret AES-256 encrypted at rest |
| `outbound_webhooks` | Developer webhook URL and signing secret |
| `wallets` | Virtual accounts — NUBAN, customer reference, system prompt, status |
| `ledger_entries` | Immutable append-only transaction log — `nomba_reference` has a UNIQUE constraint |
| `suspense_items` | Held transactions pending manual resolution |
| `agents` | Automated wallet rules (auto-sweep, balance alerts) |
| `webhook_logs` | Delivery attempts for every outbound event with retry state |

### Key Constraints

- `ledger_entries.nomba_reference` — UNIQUE index. This is the primary idempotency guard against double-crediting from duplicate webhook deliveries.
- `api_keys.key_hash` — UNIQUE index. Lookup is done by hash, never by raw key.
- All `developer_id` foreign keys are indexed for efficient multi-tenant filtering.

---

## Authentication & Authorization

Avenue supports two authentication modes depending on the caller:

### 1. JWT Bearer Token (Dashboard)

Used by the Next.js frontend after a developer logs in.

```
POST /v1/auth/login
  { email, password }
  → { access_token: "eyJ..." }

Subsequent requests:
  Authorization: Bearer eyJ...
```

Token properties:
- Algorithm: `HS256`
- Subject: `developer_id` (UUID)
- Expiry: 7 days (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Signed with `SECRET_KEY` from environment

The `decode_access_token` function returns `None` for expired or malformed tokens. Any route using `CurrentDeveloperJWT` returns `401` for invalid tokens and `403` if the account is unverified.

### 2. API Key (External Integrations)

Used by downstream developer applications calling the Avenue REST API.

```
x-api-key: ave_live_xxxxxxxxxxxxxxxxxxxxx
```

Resolution flow:
1. Hash the incoming key with SHA-256
2. Look up `api_keys` table by `key_hash` where `revoked_at IS NULL`
3. Resolve `developer_id` from the matching key record
4. Verify `developer.is_verified = true`
5. Update `last_used_at` on the key record

The raw API key is **never stored**. The system stores only the SHA-256 hex digest. If a key is compromised, the developer revokes it and generates a new one from the dashboard.

### Dual-Mode Routes

Most `/v1/` routes use `CurrentDeveloper`, which accepts either an API key (`x-api-key`) or a JWT Bearer token. This allows the same routes to serve both the dashboard and external integrations without duplication.

### Account Verification

Developers must verify their email before any API access is granted. On signup, a unique token is emailed via Resend. The `/v1/auth/verify` endpoint validates the token and sets `is_verified = true`. Unverified accounts receive `403 Forbidden` on all authenticated routes.

---

## API Key Design

```
Format:   ave_{type}_{urlsafe_base64_32_bytes}
Example:  ave_live_UYX_VJvHse5t1hW3NLK-qzPLBLc_jAm5qSBk0V3F87A

Stored:   key_hash = sha256(full_key).hexdigest()
Shown:    key_prefix = first 16 chars + "..."  (e.g. "ave_live_UYX_VJv...")
```

The full key is shown **once** — immediately after creation in a modal. After that, only the prefix is displayed. Developers must treat the key like a password.

Key metadata stored per record:
- `type` — `live` (only supported type)
- `label` — optional developer-provided name
- `last_used_at` — updated on every authenticated request
- `revoked_at` — soft delete; non-null means revoked

---

## Inbound Webhook Pipeline

This is the most critical path in the system. It handles Nomba's payment notifications.

### Endpoint

```
POST /v1/webhooks/inbound/{developer_id}
```

This URL is unique per developer and is what gets registered in the Nomba dashboard.

### Processing Flow

```
1. Receive POST from Nomba
      ↓
2. Look up NombaConfig for developer_id
      ↓
3. Verify Nomba HMAC-SHA256 signature
   - Extract: event_type, requestId, userId, walletId, transactionId,
              type, time, responseCode, timestamp from headers/payload
   - Build hashing string:
       "{event_type}:{requestId}:{userId}:{walletId}:{transactionId}:{type}:{time}:{responseCode}:{timestamp}"
   - Compute HMAC-SHA256(secret, hashing_string) → Base64
   - Compare with "nomba-signature" header using constant-time comparison
      ↓
4. Validate event_type is "payment_success"
   (payout_success / payout_failed / payout_refund handled differently)
      ↓
5. Enqueue to arq (Redis) for async processing
   → Return 200 OK immediately (prevents Nomba timeout + retry)
      ↓
6. Background worker picks up the task:
   a. Resolve wallet by account number (aliasAccountNumber)
   b. Check wallet status:
      - CLOSED → route to suspense
      - FROZEN → route to suspense
   c. If wallet has no system_prompt → skip AI, credit directly
   d. If wallet has system_prompt → run Groq LLM intent parsing
   e. Check confidence_score against AI_CONFIDENCE_THRESHOLD (default 0.75)
      - Below threshold → route to suspense
      - At or above → write to ledger
   f. Run agent evaluation (auto-sweep, balance alert)
   g. Dispatch enriched outbound webhook to developer URL
```

### Idempotency

The `nomba_reference` (Nomba's `transactionId`) is stored with a `UNIQUE` constraint on the `ledger_entries` table. If Nomba retries the same webhook, the worker catches the `IntegrityError` and exits cleanly — no double-credit, no error surfaced to Nomba.

### Event Types Handled

| Event Type | Action |
|---|---|
| `payment_success` | Main inbound credit flow |
| `payout_success` | Update existing PENDING ledger debit entry to SETTLED |
| `payout_failed` | Mark debit entry as REVERSED, write compensatory credit |
| `payout_refund` | Same as `payout_failed` |

---

## AI Intent Parsing Engine

The AI engine is in `app/services/ai_engine.py`. It uses the Groq API to run LLM inference on bank narrations.

### Model

`openai/gpt-oss-20b` via the Groq inference endpoint. Temperature is set to `0.1` for deterministic, structured output.

### Input

```
Wallet context: {wallet.system_prompt}
Transfer amount: {amount_ngn} NGN
Raw narration: "{narration}"
```

### Output (enforced JSON schema)

```json
{
  "extracted_intent": "school fees payment",
  "confidence_score": 0.0,
  "flags": ["UNDERPAYMENT_DETECTED", "MISDIRECTION_SUSPECTED", "UNCLEAR_INTENT", "OVERPAYMENT_DETECTED"],
  "suggested_label": "School Fees — Term 1"
}
```

### Confidence Routing

| Score | Action |
|---|---|
| `>= AI_CONFIDENCE_THRESHOLD` (default 0.75) | Credit ledger directly |
| `< AI_CONFIDENCE_THRESHOLD` | Route to Suspense Queue |

### Graceful Degradation

If the Groq API call fails (timeout, API error, malformed JSON), the engine returns a synthetic low-confidence response:

```python
{
    "extracted_intent": raw_narration,
    "confidence_score": 0.3,
    "flags": ["UNCLEAR_INTENT"],
    "suggested_label": raw_narration[:50]
}
```

This routes the transaction to suspense rather than dropping it or crashing the worker.

### Wallets Without a System Prompt

If a wallet has no `system_prompt`, the AI pipeline is bypassed entirely. The transaction is credited directly with `confidence_score = 1.0`. This avoids false-positive suspense entries for generic pass-through wallets.

---

## Double-Entry Ledger

Avenue uses a classical accounting ledger. Balances are **never stored as mutable fields**. They are always derived by querying the immutable ledger.

### Balance Computation

```sql
SELECT
    COALESCE(SUM(amount) FILTER (WHERE type = 'CREDIT'), 0) -
    COALESCE(SUM(amount) FILTER (WHERE type = 'DEBIT'), 0)
FROM ledger_entries
WHERE wallet_id = $1
  AND status IN ('SETTLED', 'PENDING')
```

### Credit Write (Atomic)

```python
balance_before = await get_wallet_balance(wallet.id, db)
balance_after = balance_before + amount_kobo

entry = LedgerEntry(
    type="CREDIT",
    amount=amount_kobo,
    balance_before=balance_before,
    balance_after=balance_after,
    nomba_reference=nomba_reference,  # UNIQUE constraint
    ...
)
db.add(entry)
await db.flush()  # raises IntegrityError on duplicate nomba_reference
```

This pattern means:
- A second arrival of the same `nomba_reference` raises `IntegrityError` before any balance change occurs
- The caller catches `IntegrityError` and returns `"already_processed"` — no state is corrupted

### Debit Write (Outbound Transfer)

For outbound transfers:
1. A `PENDING` debit entry is written at initiation time
2. When Nomba fires a `payout_success` event, the entry status is updated to `SETTLED`
3. If Nomba fires `payout_failed` or `payout_refund`, the debit is marked `REVERSED` and a compensatory credit is automatically written

---

## Suspense Engine

The Suspense Engine is Avenue's safety net. Any inbound payment that cannot be automatically classified is held here until a human resolves it.

### When Payments Go to Suspense

| Trigger | Reason |
|---|---|
| Wallet status is `CLOSED` | Account was closed; no credits should be posted |
| Wallet status is `FROZEN` | Account is temporarily suspended |
| AI confidence < threshold | LLM is not confident enough to auto-credit |
| `MISDIRECTION_SUSPECTED` flag | AI thinks the money belongs to a different wallet |
| No wallet found for the account number | Transfer arrived on an unknown NUBAN |

### Suspense Item States

```
PENDING  → RESOLVED  (developer routes to correct wallet or triggers refund)
PENDING  → FLAGGED   (developer marks for manual investigation)
```

### Resolution

A suspense item can be resolved via `POST /v1/suspense/{id}/resolve` with:
- `action: "credit_wallet"` + `target_wallet_id` — credits the specified wallet
- `action: "flag"` — marks for manual review without posting any ledger entry

---

## Outbound Webhook System

Avenue dispatches enriched events to developer-registered URLs after every significant ledger event.

### Event Types Dispatched

| Event | Trigger |
|---|---|
| `ledger.credit` | Successful inbound credit to any wallet |
| `ledger.debit` | Successful outbound transfer initiated |
| `payment.misdirected` | Transaction routed to suspense |
| `agent.triggered` | An account agent condition was met and action executed |

### Payload Structure

```json
{
  "event_id": "uuid-v4",
  "event_type": "ledger.credit",
  "api_version": "2026-07-01",
  "created_at": "2026-07-07T12:00:00Z",
  "data": { ... }
}
```

### Signature (x-avenue-signature)

Every outbound request is signed:

```python
signature = HMAC-SHA256(signing_secret, json_payload_bytes).hexdigest()
```

Sent as the `X-Avenue-Signature` header. Developers should verify this header on their end before trusting the payload.

### Delivery & Retry Schedule

| Attempt | Delay |
|---|---|
| 1 | Immediate |
| 2 | 30 seconds |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |
| 6 | 24 hours (final) |

After `WEBHOOK_MAX_RETRIES` (default 5) failed attempts, the log is marked `DEAD`. All delivery attempts are stored in `webhook_logs` with `http_status_code`, `response_body` (truncated to 500 chars), and `next_retry_at`.

---

## Data Encryption

### Nomba Client Secret

The Nomba `client_secret` is sensitive credentials. It is encrypted using AES-256 (via Python's `cryptography.fernet.Fernet`) before being written to the database and decrypted only at the point of use (API calls to Nomba).

```python
# On save
encrypted_client_secret = encrypt(raw_client_secret)

# On use (inside nomba.py)
raw_secret = decrypt(nomba_config.encrypted_client_secret)
token = await _get_nomba_token(account_id, client_id, raw_secret)
```

The encryption key is a 32-byte secret held in the `ENCRYPTION_KEY` environment variable. It is never logged and never committed to source control.

### Password Hashing

Developer passwords are hashed with `bcrypt` (via the `bcrypt` Python library):

```python
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode(), salt)
```

Plain-text passwords are never stored, logged, or transmitted after the initial hash operation.

### Webhook Signing Secret

Each developer's outbound webhook signing secret is stored in plaintext in the `outbound_webhooks` table (it is not a secret that needs encryption — it is intended to be shared with the developer for verification purposes). It is generated as a cryptographically random hex string on initial setup.

---

## Nomba Credential Handling

Nomba credentials (`account_id`, `client_id`, `client_secret`) are provided by the developer through the Settings page and stored in the `nomba_configs` table.

| Field | Storage |
|---|---|
| `account_id` | Plaintext (not sensitive — used as a header identifier) |
| `client_id` | Plaintext (OAuth client ID, not a secret by itself) |
| `client_secret` | AES-256 encrypted — only the ciphertext is in the DB |
| `sub_account_id` | Plaintext (identifies sub-account for NUBAN provisioning) |

The Nomba OAuth token (short-lived bearer token obtained from `/v1/auth/token/issue`) is **not persisted**. It is obtained fresh on each operation and is not cached.

---

## CORS & Network Policy

The FastAPI backend enforces strict CORS. Only the domain specified in `FRONTEND_URL` is permitted:

```python
CORSMiddleware(
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

In production, `FRONTEND_URL` is set to the exact Vercel deployment URL. The Swagger UI (`/docs`) and ReDoc (`/redoc`) are disabled in production (`APP_ENV=production`).

---

## Error Handling

All errors follow a consistent envelope:

```json
{ "success": false, "error": { "message": "Human-readable description" } }
```

### Error Classes

| Class | HTTP Code | Use Case |
|---|---|---|
| `BadRequestError` | 400 | Invalid input, business rule violation |
| `NotFoundError` | 404 | Resource not found |
| `ConflictError` | 409 | Duplicate resource |
| `ForbiddenError` | 403 | Access denied |
| `NombaAPIError` | 400 | Nomba API returned an error |
| Unhandled exceptions | 500 | Caught by `generic_exception_handler` |

The generic exception handler catches all unhandled exceptions and returns a `500` with a safe, non-leaking message. Stack traces are never returned to clients.

Validation errors (Pydantic `RequestValidationError`) return `422` with structured field-level error details:

```json
{
  "success": false,
  "error": {
    "message": "Invalid request body.",
    "details": {
      "errors": [
        { "field": "body.amount", "message": "value is not a valid integer" }
      ]
    }
  }
}
```

---

## Currency Handling

All monetary values in the Avenue API and database are stored and transmitted in **kobo** (the smallest unit of Nigerian Naira).

```
1 NGN = 100 kobo
₦5,000 = 500000 kobo
```

Nomba sends amounts in NGN (not kobo). The conversion happens at the inbound webhook receiver boundary — before any business logic or ledger writes:

```python
# In inbound.py and tasks.py
amount_kobo = ngn_to_kobo(transaction.get("transactionAmount", 0))
```

The `currency.py` module provides:
- `ngn_to_kobo(ngn: float) -> int` — converts Nomba's NGN amounts to kobo for storage
- `kobo_to_ngn_str(kobo: int) -> str` — formats kobo as a Naira string for display

The frontend divides by 100 to display amounts in Naira. There is no ambiguity at the API boundary — all amounts in and out of `/v1/` endpoints are kobo.
