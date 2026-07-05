from arq.connections import RedisSettings
from app.core.config import settings
from app.tasks import process_inbound_webhook_task
from urllib.parse import urlparse

# Parse REDIS_URL to get host, port, db, etc.
# redis://localhost:6379 or redis://default:password@host:port
url_parts = urlparse(settings.REDIS_URL)
redis_host = url_parts.hostname or "localhost"
redis_port = url_parts.port or 6379
redis_password = url_parts.password

class WorkerSettings:
    functions = [process_inbound_webhook_task]
    redis_settings = RedisSettings(
        host=redis_host,
        port=redis_port,
        password=redis_password,
    )
    # Customize max_jobs, keep_result, etc., if needed
    max_jobs = 10
    keep_result = 3600  # 1 hour
