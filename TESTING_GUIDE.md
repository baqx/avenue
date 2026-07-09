# Avenue — Judging & Testing Guide

Welcome to the Avenue testing guide! This document outlines how to test the Avenue platform end-to-end, from provisioning a smart wallet to triggering AI intent parsing and automated agents.

## 1. Quick Links & Credentials

We have set up a testing account with Nomba credentials already configured so you can start testing immediately.

- **Dashboard URL:** [https://avenue-cloud.vercel.app](https://avenue-cloud.vercel.app)
- **API Base URL:** [https://johnajayi-avenue.hf.space/v1](https://johnajayi-avenue.hf.space/v1)
- **API Docs (Swagger):** [https://johnajayi-avenue.hf.space/docs](https://johnajayi-avenue.hf.space/docs)
- **Mintlify Docs:** [https://avenue.mintlify.app](https://avenue.mintlify.app)

### Test Account Credentials
- **Email:** `johnajayi2008@gmail.com`
- **Password:** `1234`
- **Live API Key:** *(Generate your own API key in the Dashboard under Settings -> API Keys)*

---

## 2. Testing Flow 1: The Dashboard Experience

You can test the core features directly from the Next.js dashboard.

1. **Log in** to [https://avenue-cloud.vercel.app](https://avenue-cloud.vercel.app) using the credentials above.
2. **Create a Wallet:** 
   - Navigate to the Wallets page and click "Create Wallet". 
   - Provide a name and a **System Prompt** (e.g., *"This wallet collects rent for Apartment 4B. Flag any payments that are under 50,000 NGN or mention groceries."*).
   - *Avenue will instantly call Nomba and provision a real NUBAN for this wallet.*
3. **Fund the Wallet:**
   - Use your bank app to make a **real test transfer** (e.g., 100 NGN) to the generated NUBAN account number.
4. **View AI Intent Parsing:**
   - Once the payment arrives, click on the transaction in the dashboard. 
   - You will see the AI's extracted intent, confidence score, and any flags (like `UNDERPAYMENT_DETECTED`).
5. **Test the Suspense Engine:**
   - Try sending a payment with a completely unrelated narration (e.g., if the wallet is for "school fees", send a transfer with the narration "for groceries and clothes"). The AI will detect the misdirection and flag it.
   - Alternatively, you can freeze the wallet in the dashboard and then attempt to send money to it.
   - Navigate to the **Suspense** tab to view the held payment and resolve it manually (either credit it to the wallet, or refund the sender).

---

## 3. Testing Flow 2: The Developer API

You can test Avenue as a developer integrating the API.

### Step 1: Create a Wallet via API
```bash
curl -X POST https://johnajayi-avenue.hf.space/v1/wallets \
  -H "x-api-key: <YOUR_GENERATED_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_reference": "judge_test_01",
    "first_name": "Hackathon",
    "last_name": "Judge",
    "email": "judge@devcareer.com",
    "system_prompt": "School fees collection. Flag underpayments below 100,000 NGN."
  }'
```
*Note the `account_number` and `id` in the response.*

### Step 2: Configure an Auto-Sweep Agent
Let's tell Avenue to automatically sweep any balance over 50,000 NGN to another account.
```bash
curl -X POST https://johnajayi-avenue.hf.space/v1/wallets/[WALLET_ID]/agents \
  -H "x-api-key: <YOUR_GENERATED_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auto-sweep to savings",
    "trigger": "BALANCE_ABOVE",
    "threshold": 5000000, 
    "action": "PARTIAL_SWEEP",
    "destination_wallet_id": "[ANOTHER_WALLET_ID]",
    "sweep_amount": 5000000
  }'
```
*(Note: Amounts are in kobo. 5000000 = 50,000 NGN)*

### Step 3: Simulate a Credit (To trigger the pipeline)
```bash
curl -X POST https://johnajayi-avenue.hf.space/v1/wallets/[WALLET_ID]/simulate-credit \
  -H "x-api-key: <YOUR_GENERATED_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000000,
    "narration": "Payment for school fees term 1",
    "sender_name": "John Doe"
  }'
```
*(Note: This queues a mock webhook exactly as Nomba would. Wait 2 seconds, then check the wallet balance — you'll see the credit, the AI analysis, and the agent auto-sweep execution).*
