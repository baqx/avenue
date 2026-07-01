# **Avenue — Product Requirements Document (PRD)**

**Product Name:** Avenue

**Tagline:** Intelligent Wallet-as-a-Service & Ledger Infrastructure

**Hackathon:** Nomba x DevCareer Hackathon 2026 — Infrastructure Track (Dedicated Virtual Accounts)

## **1\. Product Overview**

Avenue is a managed Wallet-as-a-Service, ledgering engine, and AI-driven reconciliation layer built on top of Nomba’s payment primitives. It provides downstream developers with an instant financial infrastructure to issue dedicated virtual accounts, reconcile inbound transfers, maintain ACID-compliant digital wallets, and execute automated actions—all without writing complex double-entry database logic or rigid parsing algorithms.

**Core Proposition:** Developers bring the users and the business logic; Avenue handles the financial state and intelligent reconciliation.

## **2\. Problem Statement**

While Nomba provides robust APIs for generating NUBANs and dispatching webhooks, turning those raw pipes into a production-grade, intelligent wallet system is expensive and risky. Downstream developers are forced to repeatedly build complex infrastructure to handle:

* **Race Conditions:** Managing strict idempotency during high-volume webhook delivery to prevent double-crediting.  
* **Ledger Math:** Building immutable double-entry ledger logic to ensure wallet balances are mathematically accurate.  
* **Unstructured Data:** Bank transfer memos are notoriously messy (e.g., "for rent and light"). Developers spend hours building brittle, regex-based command logic to parse these inputs for reconciliation.  
* **Operational Overhead:** Manually handling edge cases like partial payments, overpayments, and misdirected funds.

## **3\. Target Audience**

The primary users of Avenue are **Software Engineers and Product Teams** building platforms that require per-customer, per-vendor, or per-purpose payment tracking. This spans a wide variety of industries:

* SaaS builders needing subscription wallets  
* PropTech and bill-splitting applications  
* E-commerce platforms and marketplaces  
* Logistics and mobility startups  
* Schools, freelance agencies, and bespoke internal tools

## **4\. Example Use Cases**

Avenue is completely agnostic to the business model. Here is how different platforms utilize the infrastructure:

* **SaaS Subscriptions & Overages:** A cloud hosting platform creates a wallet for a user. The user tops it up. Avenue tracks the exact balance. If the user sends a transfer with a messy narration like *"server money"*, Avenue's AI understands the intent, credits the correct wallet, and updates the SaaS platform.  
* **PropTech / Communal Living:** A property app issues dedicated NUBANs to roommates. When a student transfers their share, Avenue automatically catches the webhook, updates that specific student’s ledger balance, handles underpayments, and pushes a clean notification to the platform.  
* **Marketplace Escrow:** A peer-to-peer marketplace provisions wallets for buyers and sellers. Using Avenue's "Agents", the platform sets a rule to automatically sweep funds from the buyer's wallet to the seller's wallet once an item is marked "delivered".  
* **School Fee Collection:** A school assigns accounts to students. A parent transfers partial payment with the memo *"Chidi first term part 1"*. Avenue extracts the intent, credits Chidi's ledger, and flags the transaction as an underpayment based on the wallet's expected threshold.

## **5\. Core Features & Hackathon Requirements Mapping**

| Feature | Hackathon "Must Include" Mapping | Description |
| :---- | :---- | :---- |
| **Instant Provisioning** | Account provisioning flow | A REST endpoint allowing developer platforms to instantly request and assign a dedicated NUBAN to any end-user identity. |
| **Intelligent Wallets (System Prompts)** | Innovation / Differentiator | Wallets can accept natural-language instructions (e.g., "This wallet is for Order \#102") to guide how incoming funds are processed. |
| **Immutable Ledger** | Inbound transfer reconciliation | A PostgreSQL-backed double-entry ledger that processes Nomba webhooks, strictly enforces idempotency, and mathematically derives wallet balances. |
| **AI Contextual Reconciliation** | Inbound transfer reconciliation | An LLM-driven conversational engine that extracts intent from raw bank narrations, automatically categorizing inbound webhooks before updating the ledger. |
| **Ledger Statements** | Customer-level statement | A reporting endpoint that returns paginated, bank-grade transaction logs (credits/debits) for any given wallet. |
| **Account Agents** | Innovation / Differentiator | Automated triggers attached to wallets (e.g., "Auto-Sweep" or "Threshold Alerts") that execute actions via Nomba's APIs when conditions are met. |
| **Suspense Engine & AI Flagging** | Handling misdirected payments | A system to catch anomalous webhooks (e.g., transfers to deactivated accounts or narrations intended for another user) and route them to an internal "suspense wallet" for manual resolution. |
| **Enriched Event Webhooks** | Clean developer API | Avenue emits predictable webhooks back to the downstream app whenever a ledger balance changes, wrapping raw data in an avenue\_intelligence payload containing the AI's extracted context. |

## **6\. Technical Architecture**

* **Backend Framework:** Python for a structured, scalable microservice architecture.  
* **Database:** PostgreSQL for ACID-compliant transactional guarantees, ledger immutability, and logical data isolation across different developer applications.  
* **Core API:** Nomba API (Virtual Accounts, Webhooks, Transfers) serving as the raw financial primitive.  
* **AI Engine:** LLM-driven intent recognition pipeline replacing rigid command logic for real-time parsing of transaction metadata and system prompt evaluation.  
* **Message Queue (Optional):** Redis to asynchronously queue incoming Nomba webhooks to prevent timeout failures during traffic spikes.

## **7\. API Specification (MVP Scope)**

Avenue will expose a clean REST API secured via x-api-key headers.

* POST /v1/wallets  
  * **Action:** Calls Nomba to generate a NUBAN, creates a ledger wallet in Avenue, links it to a customer\_reference, and securely stores the wallet's optional AI system\_prompt.  
* GET /v1/wallets/:wallet\_id  
  * **Action:** Returns the current computed balance and account status.  
* POST /v1/wallets/:wallet\_id/agents  
  * **Action:** Attaches an automated rule (e.g., Auto-Sweep threshold) to the specific wallet.  
* GET /v1/wallets/:wallet\_id/statement  
  * **Action:** Returns a chronological list of ledger entries for UI display, including AI-categorized labels.  
* POST /v1/webhooks/nomba  
  * **Action:** Internal endpoint. Ingests raw Nomba webhooks, runs the LLM intent extraction, processes the ledger math, evaluates Agent triggers, and queues the enriched outbound webhook to the developer.

## **8\. Edge Cases & Error Handling (Judging Differentiators)**

1. **Idempotency Locks:** Avenue caches the Nomba transaction\_reference. If Nomba fires the same webhook twice, the database constraint silently ignores the duplicate to prevent double-crediting.  
2. **Deactivated Accounts:** If a developer deletes a user, the wallet status changes to CLOSED. If money somehow arrives to a closed wallet, it bypasses the user ledger and goes directly to a SUSPENSE ledger, triggering a payment.misdirected webhook alert.  
3. **Narration Misdirection:** If a payment arrives at an active wallet, but the AI intent recognition detects the narration strongly matches a different user's context, the transaction is flagged in the Suspense Engine for review before the ledger is permanently updated.  
4. **Partial / Overpayments:** Since Avenue acts as a continuous wallet rather than a rigid invoice, all inbound funds are accepted. The downstream app is responsible for comparing the Avenue wallet balance against the user's specific debt/invoice.

## **9\. Out of Scope (For Hackathon)**

* Physical card issuing.  
* Complex KYC document upload APIs (Avenue will rely on Nomba's default limits for the MVP).  
* A complex frontend dashboard (The API itself is the primary product; a simple Next.js visualization dashboard will be built only if time permits to showcase the ledger UI).