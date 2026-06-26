import os
import base64
import requests
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import config
import config
from week_1_multimodal_api.prompt_templates import format_image_prompt

class ImageClient:
    """
    Client wrapper for interacting with Hugging Face Inference API (FLUX.1-schnell) 
    to generate images, with robust fallback to Pollinations AI.
    """
    def __init__(self, api_key: str = None, model: str = None, api_url: str = None):
        # Use provided credentials or fall back to system config
        self.api_key = api_key or config.IMAGE_API_KEY
        self.model = model or config.IMAGE_MODEL or "black-forest-labs/FLUX.1-schnell"
        
        # Build API URL dynamically based on model if not provided
        if api_url:
            self.api_url = api_url
        elif config.IMAGE_API_URL:
            self.api_url = config.IMAGE_API_URL
        else:
            self.api_url = f"https://api-inference.huggingface.co/models/{self.model}"

        if not self.api_key:
            logger.warning("HUGGINGFACEHUB_API_TOKEN is not configured. Will rely on Pollinations AI fallback.")

    def generate_image(
        self, 
        base_prompt: str, 
        tone: str, 
        width: int = 1024, 
        height: int = 1024
    ) -> bytes:
        """
        Generates an image aligned with a specified marketing tone.
        """
        # Apply prompt engineering style modifiers matching the text tone
        full_prompt = format_image_prompt(base_prompt, tone)
        logger.info(f"Generated engineered image prompt: '{full_prompt}'")
        
        try:
            # Check if provider is explicitly set to pollinations or if API key is missing
            provider = os.getenv("IMAGE_PROVIDER", "").lower()
            if provider == "pollinations" or not self.api_key:
                logger.info("Using Pollinations AI for image generation...")
                import urllib.parse
                safe_prompt = urllib.parse.quote(full_prompt)
                url = f"https://image.pollinations.ai/prompt/{safe_prompt}?width={width}&height={height}&nologo=true"
                response = requests.get(url)
                if response.status_code == 200:
                    return response.content
                else:
                    raise RuntimeError(f"Pollinations AI failed: {response.text}")

            logger.info(f"Sending image generation request using model '{self.model}' to Hugging Face endpoint: {self.api_url}")
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
            }
            
            payload = {
                "inputs": full_prompt,
                "parameters": {
                    "width": width,
                    "height": height
                }
            }
            
            response = requests.post(self.api_url, headers=headers, json=payload)
            if response.status_code == 200:
                logger.info("Successfully received image bytes from Hugging Face Inference API.")
                return response.content
            else:
                logger.error(f"Hugging Face API failed with status {response.status_code}: {response.text}")
            
            # Universal Fallback to Pollinations AI if primary API fails for ANY reason
            logger.warning("Primary Image API failed. Falling back to Pollinations AI (free tier)...")
            import urllib.parse
            safe_prompt = urllib.parse.quote(full_prompt)
            url = f"https://image.pollinations.ai/prompt/{safe_prompt}?width={width}&height={height}&nologo=true"
            fallback_resp = requests.get(url)
            if fallback_resp.status_code == 200:
                return fallback_resp.content
                
            raise RuntimeError(f"Primary API and Pollinations fallback both failed.")
                
        except Exception as e:
            logger.error(f"Exception during image generation, attempting emergency fallback: {e}")
            import urllib.parse
            safe_prompt = urllib.parse.quote(full_prompt)
            url = f"https://image.pollinations.ai/prompt/{safe_prompt}?width={width}&height={height}&nologo=true"
            fallback_resp = requests.get(url)
            if fallback_resp.status_code == 200:
                return fallback_resp.content
            raise e

    def save_image(self, image_bytes: bytes, filename: str) -> str:
        """
        Saves the generated image bytes to the outputs directory.
        """
        output_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), "outputs")
        os.makedirs(output_dir, exist_ok=True)
        file_path = os.path.join(output_dir, filename)
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        logger.info(f"Saved generated image to {file_path}")
        return file_path
