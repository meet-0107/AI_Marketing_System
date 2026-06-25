import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from the .env file in the root directory
base_dir = Path(__file__).resolve().parent
env_path = base_dir / ".env"
load_dotenv(dotenv_path=env_path)

# API Keys
TEXT_API_KEY = os.getenv("TEXT_API_KEY")
IMAGE_API_KEY = os.getenv("IMAGE_API_KEY")

# Model Configuration
TEXT_MODEL = os.getenv("TEXT_MODEL_NAME")
IMAGE_MODEL = os.getenv("IMAGE_MODEL_NAME")
IMAGE_API_URL = os.getenv("IMAGE_API_URL")

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
