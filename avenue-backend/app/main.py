from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException
from contextlib import asynccontextmanager
from urllib.parse import urlparse
from arq import create_pool
from arq.connections import RedisSettings

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import (
    generic_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)


def create_app() -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        url_parts = urlparse(settings.REDIS_URL)
        redis_host = url_parts.hostname or "localhost"
        redis_port = url_parts.port or 6379
        redis_password = url_parts.password
        
        app.state.arq_pool = await create_pool(
            RedisSettings(host=redis_host, port=redis_port, password=redis_password)
        )
        yield
        await app.state.arq_pool.close()

    app = FastAPI(
        title="Avenue API",
        description="Intelligent Wallet-as-a-Service & Ledger Infrastructure",
        version="1.0.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception Handlers ───────────────────────────────────────────────────
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(api_router, prefix="/v1")

    @app.get("/", tags=["Health"])
    async def health_check():
        return {"status": "ok", "service": "Avenue API", "version": "1.0.0"}

    return app


app = create_app()
