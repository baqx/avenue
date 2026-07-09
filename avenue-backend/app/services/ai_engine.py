import json
import asyncio
import logging
from typing import Optional
from groq import AsyncGroq
from app.core.config import settings

logger = logging.getLogger(__name__)
client = AsyncGroq(api_key=settings.GROQ_API_KEY)

SYSTEM_INSTRUCTION = """
You are Avenue's deterministic financial intent parsing AI. Your job is to analyze inbound bank transfer narrations and extract structured intent objectively without hallucination.

Given:
- A raw bank narration (what the sender typed)
- A wallet context (system_prompt set by the developer indicating what this wallet is meant for)

You must respond with a JSON object with this exact structure:
{
  "extracted_intent": "short human-readable description of what this payment is for",
  "confidence_score": 0.0 to 1.0,
  "flags": [],
  "suggested_label": "concise label for this transaction"
}

Flags guidance (use exact strings):
- UNDERPAYMENT_DETECTED: only if wallet context specifies an expected amount and the transfer amount is clearly lower.
- OVERPAYMENT_DETECTED: only if wallet context specifies an expected amount and the transfer amount is clearly higher.
- MISDIRECTION_SUSPECTED: only if the narration explicitly states an intent that contradicts the wallet context (e.g. paying for electricity into a rent wallet).
- UNCLEAR_INTENT: if you cannot determine the intent with high confidence.

CRITICAL:
- Be highly deterministic. Do not guess. If it looks like a normal transfer and doesn't violate context, confidence should be 1.0.
- Always respond with valid JSON only. No explanations outside the JSON.
"""

async def parse_narration_intent(
    raw_narration: str,
    system_prompt: Optional[str],
    amount_kobo: int,
) -> dict:
    """
    Run LLM intent parsing on a bank transfer narration with retries and determinism.
    """
    wallet_context = system_prompt or "No specific context provided for this wallet. Accept any valid payment."
    user_message = f"""
Wallet context: {wallet_context}
Transfer amount: {amount_kobo / 100:.2f} NGN
Raw narration: "{raw_narration}"

Extract the intent and return JSON.
"""
    
    max_retries = 2
    for attempt in range(max_retries):
        try:
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model="llama3-70b-8192",  
                    messages=[
                        {"role": "system", "content": SYSTEM_INSTRUCTION},
                        {"role": "user", "content": user_message},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.0, 
                    max_tokens=300,
                ),
                timeout=5.0
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            logger.warning(f"AI engine attempt {attempt+1} failed: {str(e)}")
            if attempt == max_retries - 1:
                logger.error("AI engine completely failed after retries. Falling back to fail-open.")
                # Graceful degradation (Fail-Open): If the LLM is down, we should NOT route everything 
                # to suspense because it freezes all user funds. We assume 1.0 confidence.
                return {
                    "extracted_intent": raw_narration,
                    "confidence_score": 1.0, 
                    "flags": [],
                    "suggested_label": raw_narration[:50] if raw_narration else "Inbound transfer",
                    "error": str(e),
                }
