import json
import logging
from typing import Optional, Dict, Any
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

async def check_idempotency(request: Request, key_prefix: str) -> Optional[JSONResponse]:
    """
    Check if the Idempotency-Key exists in Redis. 
    If it does, return the cached JSONResponse to prevent double-spending/duplicate processing.
    """
    idem_key = request.headers.get("Idempotency-Key")
    if not idem_key:
        return None
    
    try:
        redis = request.app.state.arq_pool
        cached = await redis.get(f"idem:{key_prefix}:{idem_key}")
        if cached:
            logger.info(f"Idempotency hit for {key_prefix}:{idem_key}. Returning cached response.")
            return JSONResponse(content=json.loads(cached))
    except Exception as e:
        logger.error(f"Error checking idempotency key: {e}")
    
    return None

async def save_idempotency(request: Request, key_prefix: str, response_dict: Dict[str, Any]):
    """
    Save the successful response dict to Redis against the Idempotency-Key.
    Cached for 24 hours (86400 seconds).
    """
    idem_key = request.headers.get("Idempotency-Key")
    if not idem_key:
        return
        
    try:
        redis = request.app.state.arq_pool
        await redis.setex(f"idem:{key_prefix}:{idem_key}", 86400, json.dumps(response_dict))
    except Exception as e:
        logger.error(f"Error saving idempotency key: {e}")
