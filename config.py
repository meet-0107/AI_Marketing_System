import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from the .env file in the root directory
base_dir = Path(__file__).resolve().parent
env_path = base_dir / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# API Keys
TEXT_API_KEY = os.getenv("TEXT_API_KEY")
IMAGE_API_KEY = os.getenv("IMAGE_API_KEY") or os.getenv("HUGGINGFACEHUB_API_TOKEN")

# Model Configuration
TEXT_MODEL = os.getenv("TEXT_MODEL_NAME")
IMAGE_MODEL = os.getenv("IMAGE_MODEL") or os.getenv("IMAGE_MODEL_NAME", "imagen-3.0-generate-002")
IMAGE_PROVIDER = os.getenv("IMAGE_LLM_PROVIDER") or os.getenv("IMAGE_PROVIDER", "gemini")
IMAGE_API_URL = os.getenv("IMAGE_API_URL")

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
