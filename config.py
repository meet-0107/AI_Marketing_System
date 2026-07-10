import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from the .env file in the root directory
base_dir = Path(__file__).resolve().parent
env_path = base_dir / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# API Keys
TEXT_API_KEY = os.getenv("TEXT_API_KEY")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_API_TOKEN_2 = os.getenv("CLOUDFLARE_API_TOKEN_2")
CLOUDFLARE_ACCOUNT_ID_2 = os.getenv("CLOUDFLARE_ACCOUNT_ID_2")
IMAGE_API_KEY = os.getenv("CLOUDFLARE_API_TOKEN") or os.getenv("IMAGE_API_KEY") or os.getenv("HUGGINGFACEHUB_API_TOKEN")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HUGGINGFACEHUB_API_TOKEN") or os.getenv("IMAGE_API_KEY")

# Model Configuration
TEXT_LLM_PROVIDER = os.getenv("TEXT_LLM_PROVIDER", "groq").lower()
TEXT_MODEL = os.getenv("TEXT_MODEL_NAME")
IMAGE_PROVIDER = (os.getenv("IMAGE_LLM_PROVIDER") or os.getenv("IMAGE_PROVIDER", "cloudflare")).lower()

if IMAGE_PROVIDER == "huggingface":
    IMAGE_MODEL = os.getenv("IMAGE_MODEL_NAME") or os.getenv("IMAGE_MODEL") or "krea/Krea-2-Raw"
else:
    IMAGE_MODEL = os.getenv("MODEL") or os.getenv("IMAGE_MODEL") or os.getenv("IMAGE_MODEL_NAME", "@cf/black-forest-labs/flux-1-schnell")

IMAGE_API_URL = os.getenv("IMAGE_API_URL")
GENERATE_IMAGES = os.getenv("GENERATE_IMAGES", "true").lower() == "true"
MOCK_GENERATION = os.getenv("MOCK_GENERATION", "false").lower() == "true"

# OpenRouter Fallback Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUNTER_API_KEY")
OPENROUTER_MODEL = os.getenv("MODEL_NAME") or os.getenv("OPENROUTER_MODEL_NAME") or "google/gemini-2.5-pro"

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
