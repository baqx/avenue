"""
AI Engine — LLM-powered narration reconciliation.
Sends the raw bank narration + wallet system_prompt to OpenAI and returns
structured intent extraction output.
"""
import json
from typing import Optional
from groq import AsyncGroq
from app.core.config import settings

client = AsyncGroq(api_key=settings.GROQ_API_KEY)

SYSTEM_INSTRUCTION = """
You are Avenue's financial reconciliation AI. Your job is to analyze inbound bank transfer narrations
and extract structured intent.

Given:
- A raw bank narration (what the sender typed)
- A wallet context (system_prompt set by the developer)

You must respond with a JSON object with this exact structure:
{
  "extracted_intent": "short human-readable description of what this payment is for",
  "confidence_score": 0.0 to 1.0,
  "flags": [],  // array of: UNDERPAYMENT_DETECTED, OVERPAYMENT_DETECTED, MISDIRECTION_SUSPECTED, UNCLEAR_INTENT
  "suggested_label": "concise label for this transaction"
}

Flags guidance:
- UNDERPAYMENT_DETECTED: only if wallet context specifies an expected amount and the transfer narration implies a partial payment
- MISDIRECTION_SUSPECTED: if the narration strongly suggests this payment was meant for a different person/wallet
- UNCLEAR_INTENT: if confidence is low (< 0.5)
Always respond with valid JSON only. No explanations outside the JSON.
"""


async def reconcile_narration(
    raw_narration: str,
    system_prompt: Optional[str],
    amount_kobo: int,
) -> dict:
    """
    Run LLM reconciliation on a bank transfer narration.
    Returns the AI output dict.
    """
    wallet_context = system_prompt or "No specific context provided for this wallet."
    user_message = f"""
Wallet context: {wallet_context}
Transfer amount: {amount_kobo / 100:.2f} NGN
Raw narration: "{raw_narration}"

Extract the intent and return JSON.
"""
    try:
        response = await client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": SYSTEM_INSTRUCTION},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=300,
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        # Graceful degradation: return a low-confidence result instead of crashing
        return {
            "extracted_intent": raw_narration,
            "confidence_score": 0.3,
            "flags": ["UNCLEAR_INTENT"],
            "suggested_label": raw_narration[:50] if raw_narration else "Inbound transfer",
            "error": str(e),
        }
