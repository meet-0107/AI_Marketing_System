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
    Client wrapper for interacting with the Nvidia GenAI API to generate images.
    """
    def __init__(self, api_key: str = None, model: str = None, api_url: str = None):
        # Use provided credentials or fall back to system config
        self.api_key = api_key or config.IMAGE_API_KEY
        self.model = model or config.IMAGE_MODEL
        
        # Build API URL dynamically based on model if not provided
        self.api_url = api_url or config.IMAGE_API_URL or f"https://ai.api.nvidia.com/v1/genai/{self.model}"

        if not self.api_key:
            raise ValueError(
                "IMAGE_API_KEY is not configured. Please set it in your environment or .env file."
            )

    def generate_image(
        self, 
        base_prompt: str, 
        tone: str, 
        width: int = 1024, 
        height: int = 1024
    ) -> bytes:
        """
        Generates an image aligned with a specified marketing tone.
        
        Args:
            base_prompt: The core description of the image content (e.g. 'A sleek coffee machine on a kitchen counter').
            tone: The text tone to align the image style with (e.g. 'minimalist', 'futuristic').
            width: Width of the generated image. Default is 1024.
            height: Height of the generated image. Default is 1024.
            
        Returns:
            The raw bytes of the generated JPEG image.
        """
        # Apply prompt engineering style modifiers matching the text tone
        full_prompt = format_image_prompt(base_prompt, tone)
        logger.info(f"Generated engineered image prompt: '{full_prompt}'")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }
        
        payload = {
            "prompt": full_prompt,
            "width": width,
            "height": height
        }
        
        try:
            logger.info(f"Sending image generation request using model '{self.model}' to Nvidia NIM endpoint: {self.api_url}")
            response = requests.post(self.api_url, headers=headers, json=payload)
            
            if response.status_code == 200:
                response_data = response.json()
                artifacts = response_data.get("artifacts", [])
                
                if not artifacts:
                    raise ValueError("No image artifacts returned in response.")
                
                # Get the base64-encoded image string and decode it
                b64_str = artifacts[0]["base64"]
                image_bytes = base64.b64decode(b64_str)
                logger.info("Successfully received and decoded image from Nvidia NIM.")
                return image_bytes
            else:
                logger.error(
                    f"Nvidia NIM API request failed with status code {response.status_code}. "
                    f"Response: {response.text}"
                )
                raise RuntimeError(
                    f"Nvidia API failed (Status {response.status_code}): {response.text}"
                )
                
        except Exception as e:
            logger.error(f"Exception during image generation: {e}")
            raise e
