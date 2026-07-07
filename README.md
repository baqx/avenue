# Avenue

![Avenue Logo](avenue-frontend/public/logo.png)

**Intelligent Wallet-as-a-Service & Ledger Infrastructure — Built on Nomba**

> Built for the **Nomba x DevCareer Hackathon 2026** — Infrastructure Track: *Dedicated Virtual Accounts*

Avenue is a managed infrastructure layer that turns Nomba's raw payment primitives into a production-grade, AI-powered wallet system. Developers bring the users and the business logic; Avenue handles the financial state, intelligent reconciliation, and everything in between.

---

## Table of Contents

- [What is Avenue?](#what-is-avenue)
- [Hackathon Track](#hackathon-track)
- [How We Solve Everything](#how-we-solve-everything)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Live Demo](#live-demo)
- [Setup Guide](#setup-guide)
- [Environment Variables](#environment-variables)
- [API Reference & Docs](#api-reference--docs)
- [Test Credentials](#test-credentials)

---

## What is Avenue?

Building on Nomba's APIs is not the hard part. The hard part is everything *after* the webhook fires:

- **Race conditions** — Nomba may deliver the same webhook multiple times. Double-crediting a wallet is catastrophic.
- **Ledger math** — Keeping wallet balances accurate under concurrency requires ACID-compliant double-entry accounting, not ad-hoc `UPDATE balance = balance + amount` queries.
- **Unstructured narrations** — Bank transfer memos are notoriously messy. Parsing *"for rent and light bro"* reliably requires AI, not regex.
- **Edge cases** — Misdirected payments, partial payments, transfers to closed wallets — each one is a different failure mode.

Avenue is a fully managed Wallet-as-a-Service (WaaS) layer that handles all of this. One API key, and you get:

- Dedicated NUBANs per customer, provisioned instantly
- ACID-compliant double-entry ledger with immutable history
- AI narration reconciliation via LLM (Groq)
- Suspense engine for misdirected / anomalous payments
- Automated account agents (auto-sweep, balance alerts)
- Enriched, signed outbound webhooks back to your platform

---

## Hackathon Track

**Track:** Dedicated Virtual Accounts

> *Build a persistent customer-named virtual-account system where each customer receives a dedicated account number tied to identity across transactions.*

### How Avenue Meets Every Requirement

| Requirement | Avenue's Solution |
|---|---|
| **Account provisioning flow** | `POST /v1/wallets` — instantly provisions a NUBAN via Nomba and returns the account number in one API call. Customer first name, last name, and reference are stored and linked to the account. |
| **Inbound transfer reconciliation** | Nomba webhooks hit `POST /v1/webhooks/inbound/{developer_id}`. Avenue verifies the HMAC signature, offloads to an `arq` background worker, runs LLM intent extraction, performs double-entry crediting, and dispatches an enriched event back to the developer's registered URL. |
| **Customer-level statement and reporting** | `GET /v1/wallets/{wallet_id}/transactions` — returns a paginated, chronological ledger with AI-enriched metadata. `GET /v1/transactions/reports` provides aggregate analytics. |
| **Handling of misdirected payments** | The Suspense Engine catches payments to closed wallets and low-confidence AI matches. Funds are held safely in a suspense queue with full audit trail and a manual resolution API. |
| **Clean developer API for downstream integration** | API-key authenticated REST API. Structured, consistent error responses. Signed outbound webhooks. Full documentation on Mintlify. |

### Judging Criteria

| Criterion | Our Approach |
|---|---|
| **Reconciliation accuracy** | LLM-based intent extraction with configurable confidence threshold. Wallets carry a developer-authored `system_prompt` that gives the AI explicit context (e.g., *"School fees collection wallet for Adewale Okafor, JSS3"*). |
| **Identity and naming model quality** | Customer `first_name`, `last_name`, and `customer_reference` are persisted. The account name provisioned on Nomba is composed as `{company_name} {first_name} {last_name}` for a real, human-readable NUBAN. |
| **Edge-case handling** | Idempotency lock on `nomba_reference` prevents double-crediting. Closed wallet detection routes to suspense. Wallets with no system prompt bypass the AI confidence gate (no false suspense). |
| **Developer API quality** | Versioned REST API (`/v1/`), API key auth via `x-api-key`, consistent `{ success, data }` / `{ success, error }` envelope, kobo-denominated amounts throughout, detailed Mintlify docs. |

---

## How We Solve Everything

### 1. Idempotency — No Double-Credits

Every inbound Nomba webhook carries a `transactionId`. Avenue stores this as `nomba_reference` in the ledger with a unique constraint. The worker checks for an existing entry before writing — duplicate webhooks are silently dropped, never double-credited.

### 2. Double-Entry Ledger

Every credit and debit produces two ledger rows (debit + credit sides), with balance snapshots (`balance_before`, `balance_after`) computed atomically inside a DB transaction. Balances are never stored as mutable fields — they are derived from the immutable ledger history.

### 3. AI Reconciliation Pipeline

```
Nomba Webhook → HMAC Verify → arq worker → Groq LLM
  → { extracted_intent, confidence_score, flags, suggested_label }
  → confidence ≥ threshold? → Credit Ledger → Dispatch Enriched Webhook
  → confidence < threshold?  → Suspense Queue → Alert Developer
```

The LLM receives the raw narration and the wallet's `system_prompt` and returns structured JSON. No regex. No hardcoding. The confidence threshold is configurable via `AI_CONFIDENCE_THRESHOLD` (default 0.75).

### 4. Suspense Engine

Payments that cannot be automatically reconciled are never lost. They land in the Suspense Queue:
- Transfers to `CLOSED` wallets
- LLM confidence below the configured threshold
- `MISDIRECTION_SUSPECTED` flag raised by the AI

Developers can then resolve suspense items via the dashboard or API — either routing to the correct wallet or flagging for refund.

### 5. Account Agents

Wallets can have automated rules attached (Agents):
- **Auto-Sweep** — when balance exceeds a threshold, automatically initiate a transfer to a designated external bank account
- **Balance Alert** — fire a webhook when balance drops below or rises above a threshold

Agents are evaluated after every successful ledger credit.

### 6. Signed Outbound Webhooks

Every event dispatched to developer URLs is signed with HMAC-SHA256 using the developer's `signing_secret`. The signature is in the `x-avenue-signature` header. Delivery uses exponential backoff (5 retries: 30s → 5m → 30m → 2h → 24h).

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          Developer App                           │
│  (registers webhook URL, calls Avenue REST API with x-api-key)  │
└─────────────────────────┬────────────────────────────┬───────────┘
                          │                            │
              REST API calls                 Enriched Webhooks
                          │                  (signed HMAC-SHA256)
                          ▼                            ▲
┌─────────────────────────────────────────────────────────────────┐
│                        Avenue Backend                            │
│                      FastAPI + Python                            │
│                                                                  │
│  /v1/wallets    → NombaAPI → Virtual Account (NUBAN)            │
│  /v1/webhooks/inbound/{id}                                       │
│       ↓                                                          │
│    HMAC verify → arq queue → Background Worker                  │
│       ↓                                                          │
│    Groq LLM (Reconciliation) ← wallet.system_prompt             │
│       ↓                                                          │
│    Ledger Service (double-entry, ACID)                           │
│       ↓                                                          │
│    Agent Runner → Nomba Transfers (auto-sweep)                   │
│       ↓                                                          │
│    Webhook Dispatcher → Developer URL                            │
│                                                                  │
│  PostgreSQL (wallets, ledger, suspense, agents, webhook logs)   │
│  Redis (arq job queue for async processing)                      │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ NUBAN provisioning / Transfers
                          ▼
              ┌───────────────────────┐
              │       Nomba API       │
              │  (Virtual Accounts,   │
              │  Webhooks, Transfers) │
              └───────────────────────┘
```

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI 0.111 + Python 3.11 |
| Database | PostgreSQL 16 (via SQLAlchemy 2.0 async + asyncpg) |
| Migrations | Alembic |
| Job Queue | Redis 7 + arq (async background workers) |
| AI Engine | Groq API (LLM inference — `openai/gpt-oss-20b` model) |
| Auth | JWT (access tokens) + API Key (`x-api-key`) |
| Encryption | AES-256 (client secrets at rest) + HMAC-SHA256 (webhook signing) |
| Email | Resend |
| Payment Primitive | Nomba API (Virtual Accounts, Webhooks, Transfers, Banks) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State / Data | Redux Toolkit + RTK Query |
| Animations | GSAP + Motion |
| Icons | Phosphor Icons |
| Fonts | Geist |

### Docs
| Tool | Details |
|---|---|
| Documentation | Mintlify (hosted at [avenue.mintlify.app](https://avenue.mintlify.app)) |
| Format | MDX with `<ParamField>`, `<ResponseExample>`, `<Note>` components |

---

## Features

### For Developers (API)
- **API Key Management** — generate and revoke live API keys from the dashboard
- **Wallet Provisioning** — create customer-named virtual accounts (NUBANs) with one API call
- **AI Reconciliation** — LLM extracts intent from messy bank narrations, no regex required
- **Double-Entry Ledger** — immutable, ACID-compliant ledger with full transaction history
- **Suspense Engine** — misdirected or low-confidence payments are held safely for manual review
- **Account Agents** — automated rules (auto-sweep, balance alerts) per wallet
- **Enriched Webhooks** — signed outbound events with AI metadata delivered to your URL
- **Bank List & Resolve** — fetch all Nigerian banks and resolve account names via Nomba
- **Analytics** — aggregate stats: total wallets, transaction volumes, suspense counts

### For Operators (Dashboard)
- Full wallet CRUD (create, freeze, unfreeze, close)
- Per-wallet transaction statements
- Suspense queue management with resolve/flag actions
- Webhook log viewer with delivery status
- Nomba credentials management
- API key management
- Webhook configuration (URL + signing secret)

---

## Project Structure

```
avenue/
├── avenue-backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/v1/          # Route handlers
│   │   │   ├── auth.py      # Signup / login / JWT
│   │   │   ├── wallets.py   # Wallet CRUD + transfer + simulate
│   │   │   ├── ledger.py    # Transactions + statements
│   │   │   ├── suspense.py  # Suspense queue
│   │   │   ├── inbound.py   # Nomba webhook receiver
│   │   │   ├── developers.py# Profile + API keys + webhook config
│   │   │   ├── agents.py    # Account agents
│   │   │   ├── banks.py     # Bank list + account resolve
│   │   │   └── webhook_logs.py
│   │   ├── core/            # Config, security, errors, dependencies
│   │   ├── db/              # SQLAlchemy models + session
│   │   │   └── models/      # Developer, Wallet, Ledger, Suspense, Agent, ...
│   │   ├── schemas/         # Pydantic request/response models
│   │   ├── services/        # Business logic
│   │   │   ├── nomba.py     # Nomba API client
│   │   │   ├── ai_engine.py # Groq LLM reconciliation
│   │   │   ├── ledger.py    # Double-entry accounting
│   │   │   ├── suspense.py  # Suspense helpers
│   │   │   ├── agent_runner.py  # Agent evaluation
│   │   │   └── webhook_dispatcher.py # Outbound delivery + retry
│   │   ├── tasks.py         # arq background task definitions
│   │   └── worker.py        # arq worker entrypoint
│   ├── alembic/             # Database migrations
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── requirements.txt
│
├── avenue-frontend/          # Next.js dashboard
│   └── src/
│       ├── app/
│       │   ├── (marketing)/  # Landing, features, use-cases pages
│       │   └── dashboard/    # Authenticated dashboard
│       │       ├── page.tsx  # Overview / recent transactions
│       │       ├── wallets/  # Wallet list + detail
│       │       ├── transactions/ # Full ledger view
│       │       ├── suspense/ # Suspense queue
│       │       ├── agents/   # Account agents
│       │       ├── webhooks/ # Webhook config
│       │       └── settings/ # API keys + Nomba config
│       ├── components/       # Reusable UI components
│       └── lib/api/          # RTK Query API slices
│
└── docs/                     # Mintlify documentation source
    ├── mint.json             # Mintlify config
    ├── introduction.mdx
    ├── quickstart.mdx
    ├── authentication.mdx
    ├── webhooks.mdx
    ├── concepts/             # Suspense engine, agent-native infra
    └── api-reference/        # Full endpoint docs
        ├── wallets/
        ├── transactions/
        ├── suspense/
        ├── banks/
        ├── agents/
        └── webhook-logs/
```

---

## Live Demo

| Service | URL |
|---|---|
| **Dashboard** | [avenue-cloud.vercel.app](https://avenue-cloud.vercel.app) |
| **API** | [johnajayi-avenue.hf.space](https://johnajayi-avenue.hf.space) |
| **API Health** | [johnajayi-avenue.hf.space/](https://johnajayi-avenue.hf.space/) |
| **Docs** | [avenue.mintlify.app](https://avenue.mintlify.app) |

---

## Test Credentials

You can use the following pre-seeded account to explore the dashboard without signing up:

| Field | Value |
|---|---|
| **Email** | `johnajayi008@gmail.com` |
| **Password** | `1234` |

Alternatively, feel free to **[sign up for a new account](https://avenue-cloud.vercel.app/signup)** — you'll get an API key immediately upon email verification.

> **Note:** To actually provision wallets and process payments, you'll need to connect your own Nomba credentials in **Settings → Nomba Integration**.

---

## Setup Guide

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (recommended for backend)
- A Nomba developer account (for virtual account provisioning)
- A Groq API key (for AI reconciliation)

---

### Backend Setup

#### Option A: Docker Compose (Recommended)

```bash
cd avenue-backend

# 1. Copy and fill in your environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section below)

# 2. Start all services (API + Worker + Postgres + Redis)
docker compose up --build

# 3. Run database migrations
docker compose exec api alembic upgrade head
```

The API will be available at `http://localhost:8000`.

#### Option B: Local (without Docker)

```bash
cd avenue-backend

# 1. Create a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and fill in your environment variables
cp .env.example .env

# 4. Start PostgreSQL and Redis (must be running separately)

# 5. Run database migrations
alembic upgrade head

# 6. Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 7. Start the background worker (in a separate terminal)
arq app.worker.WorkerSettings
```

---

### Frontend Setup

```bash
cd avenue-frontend

# 1. Install dependencies
npm install

# 2. Set the API URL
# Create .env.local with:
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/v1" > .env.local

# 3. Start the dev server
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

---

### Docs Setup (Optional)

```bash
# Install Mintlify CLI
npm i -g mintlify

cd docs

# Start local docs server
mintlify dev
```

Docs will be available at `http://localhost:3000`.

---

## Environment Variables

Create `avenue-backend/.env` from `.env.example`:

```env
# App
APP_ENV=development
APP_NAME=Avenue
FRONTEND_URL=http://localhost:3000

# Security — generate with: openssl rand -hex 32
SECRET_KEY=<64-char-random-string>
ENCRYPTION_KEY=<32-byte-hex-string>

# Database
DATABASE_URL=postgresql+asyncpg://avenue_user:avenue_pass@localhost:5432/avenue_db

# Redis
REDIS_URL=redis://localhost:6379

# Nomba
NOMBA_BASE_URL=https://api.nomba.com

# AI (Groq — https://console.groq.com)
GROQ_API_KEY=gsk_...
AI_CONFIDENCE_THRESHOLD=0.75

# Outbound Webhooks
WEBHOOK_MAX_RETRIES=5

# Email (Resend — https://resend.com)
RESEND_API_KEY=re_...
EMAIL_FROM=hello@yourdomain.com
```

> The Docker Compose setup automatically provisions Postgres and Redis — you only need to provide the Nomba, Groq, and Resend keys.

---

## API Reference & Docs

Full documentation is available at **[avenue.mintlify.app](https://avenue.mintlify.app)**.

### Authentication

All API requests require an `x-api-key` header:

```bash
curl https://johnajayi-avenue.hf.space/v1/wallets \
  -H "x-api-key: ave_live_your_key_here"
```

### Key Endpoints

```
# Wallet Management
POST   /v1/wallets                        Create a wallet + provision NUBAN
GET    /v1/wallets                        List all wallets
GET    /v1/wallets/:id                    Get wallet + balance
PATCH  /v1/wallets/:id                    Update wallet (prompt, name)
POST   /v1/wallets/:id/freeze             Freeze wallet
POST   /v1/wallets/:id/unfreeze           Unfreeze wallet
POST   /v1/wallets/:id/close             Close wallet permanently
POST   /v1/wallets/:id/transfer          Initiate outbound bank transfer

# Transactions & Ledger
GET    /v1/transactions                   List all ledger entries
GET    /v1/transactions/:id              Get a single entry
GET    /v1/wallets/:id/transactions      Per-wallet statement
GET    /v1/transactions/reports          Aggregate analytics

# Suspense
GET    /v1/suspense                       List suspense queue
GET    /v1/suspense/:id                  Get suspense item
POST   /v1/suspense/:id/resolve          Resolve (route or flag)

# Banks
GET    /v1/banks                          List all Nigerian banks
POST   /v1/banks/resolve                 Resolve account number → name

# Agents
GET    /v1/wallets/:id/agents            List wallet agents
POST   /v1/wallets/:id/agents            Create agent
DELETE /v1/wallets/:id/agents/:agent_id  Remove agent

# Developer
GET    /v1/developers/me                 Get profile
POST   /v1/developers/keys              Generate new API key
DELETE /v1/developers/keys/:id          Revoke key
GET    /v1/developers/webhook-config    Get webhook settings
PATCH  /v1/developers/webhook-config    Update webhook URL

# Inbound (Nomba → Avenue)
POST   /v1/webhooks/inbound/:developer_id  Nomba webhook receiver
```

### Amount Convention

> ⚠️ All amounts in the API are in **kobo** (smallest NGN unit). `500000 kobo = ₦5,000.00`

---

## Webhook Integration

### Step 1: Set your inbound URL in Nomba

Find your inbound URL in the dashboard under **Webhooks**:

```
https://johnajayi-avenue.hf.space/v1/webhooks/inbound/{your_developer_id}
```

Paste this into your Nomba dashboard as the webhook destination.

### Step 2: Register your outbound webhook URL

In **Settings → Webhooks**, add the URL where Avenue should forward enriched events.

### Step 3: Verify signatures

Every outbound event includes an `x-avenue-signature` header (HMAC-SHA256). Verify it using your signing secret from the dashboard.

### Enriched Event Payload

```json
{
  "event_id": "evt_...",
  "event_type": "ledger.credit",
  "api_version": "2026-07-01",
  "created_at": "2026-07-07T12:00:00Z",
  "data": {
    "wallet_id": "wal_...",
    "amount": 2500000,
    "currency": "NGN",
    "status": "SETTLED",
    "avenue_intelligence": {
      "extracted_intent": "school fees payment",
      "confidence_score": 0.95,
      "flags": [],
      "suggested_label": "School Fees — Adewale Okafor"
    }
  }
}
```

---

## Contributing

This is a hackathon project. If you want to run it locally and experiment, follow the setup guide above. PRs are welcome.

---

## License

MIT
