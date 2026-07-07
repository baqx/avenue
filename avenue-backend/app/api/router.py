from fastapi import APIRouter

from app.api.v1 import auth, developers, wallets, ledger, agents, suspense, inbound, webhook_logs, analytics, banks

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(developers.router, prefix="/developers", tags=["Developers"])
api_router.include_router(wallets.router, prefix="/wallets", tags=["Wallets"])
api_router.include_router(ledger.router, tags=["Ledger & Transactions"])
api_router.include_router(agents.router, tags=["Agents"])
api_router.include_router(suspense.router, prefix="/suspense", tags=["Suspense"])
api_router.include_router(inbound.router, prefix="/webhooks", tags=["Inbound Webhooks"])
api_router.include_router(webhook_logs.router, prefix="/webhook-logs", tags=["Webhook Logs"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(banks.router, prefix="/banks", tags=["Banks"])
