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
    Client wrapper for interacting with the Nvidia GenAI API to generate images,
    with robust fallback to Pollinations AI.
    """
    def __init__(self, api_key: str = None, model: str = None, api_url: str = None):
        # Use provided credentials or fall back to system config
        self.api_key = api_key or config.IMAGE_API_KEY
        self.model = model or config.IMAGE_MODEL
        
        # Build API URL dynamically based on model if not provided
        self.api_url = api_url or config.IMAGE_API_URL or f"https://ai.api.nvidia.com/v1/genai/{self.model}"
        
        # Automatically fix Nvidia NIM endpoint URL structure for stable-diffusion-3.5 models
        if "stable-diffusion" in self.api_url:
            if "stabilityai/" not in self.api_url:
                clean_model = self.model.replace("3.5", "3_5").replace("3-5", "3_5")
                self.api_url = f"https://ai.api.nvidia.com/v1/genai/stabilityai/{clean_model}"
            else:
                self.api_url = self.api_url.replace("3.5", "3_5").replace("3-5", "3_5")

        if not self.api_key:
            logger.warning("IMAGE_API_KEY is not configured. Will rely on Pollinations AI fallback.")

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
            base_prompt: The core description of the image content.
            tone: The text tone to align the image style with.
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
            # Check if provider is explicitly set to pollinations or if API key is missing
            provider = os.getenv("IMAGE_PROVIDER", "nvidia").lower()
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
                
                # Universal Fallback to Pollinations AI if Nvidia fails for ANY reason (404, 401, 422, etc.)
                logger.warning("Nvidia API failed. Falling back to Pollinations AI (free tier)...")
                import urllib.parse
                safe_prompt = urllib.parse.quote(full_prompt)
                url = f"https://image.pollinations.ai/prompt/{safe_prompt}?width={width}&height={height}&nologo=true"
                fallback_resp = requests.get(url)
                if fallback_resp.status_code == 200:
                    return fallback_resp.content
                    
                raise RuntimeError(
                    f"Nvidia API and Pollinations fallback both failed (Status {response.status_code}): {response.text}"
                )
                
        except Exception as e:
            logger.error(f"Exception during Nvidia image generation, attempting emergency fallback: {e}")
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
