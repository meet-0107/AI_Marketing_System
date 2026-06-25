from celery import Celery
from config import REDIS_URL

# Initialize Celery app
celery_app = Celery(
    "ai_marketing_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["week_2_async_queue.tasks"]
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    broker_use_ssl={"ssl_cert_reqs": "none"},
    redis_backend_use_ssl={"ssl_cert_reqs": "none"}
)
