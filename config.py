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
TEXT_MODEL = os.getenv("TEXT_MODEL", "llama-3.3-70b-versatile")
IMAGE_MODEL = os.getenv("IMAGE_MODEL", "black-forest-labs/flux.1-schnell")
IMAGE_API_URL = os.getenv("IMAGE_API_URL", "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell")
