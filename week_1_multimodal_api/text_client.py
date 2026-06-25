import os
import json
import logging
from typing import Dict, Any
from groq import Groq

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import config
import config
from week_1_multimodal_api.prompt_templates import get_system_instruction, format_copy_prompt

class TextClient:
    """
    Client wrapper for interacting with the Groq API to generate marketing copy.
    """
    def __init__(self, api_key: str = None, model: str = None):
        # Use provided credentials or fall back to system config
        self.api_key = api_key or config.TEXT_API_KEY
        self.model = model or config.TEXT_MODEL
        
        if not self.api_key:
            raise ValueError(
                "TEXT_API_KEY is not configured. Please set it in your environment or .env file."
            )
        
        # Initialize Groq client
        self.client = Groq(api_key=self.api_key)

    def generate_copy(
        self, 
        product_name: str, 
        product_description: str, 
        tone: str, 
        target_audience: str = None,
        temperature: float = 0.7
    ) -> Dict[str, str]:
        """
        Generate a structured marketing copy (headline, body_copy, call_to_action) for a given product and tone.
        
        Returns:
            A dictionary containing 'headline', 'body_copy', and 'call_to_action'.
        """
        system_instruction = get_system_instruction(tone)
        user_prompt = format_copy_prompt(product_name, product_description, target_audience)

        try:
            logger.info(f"Sending text generation request to Groq using model: {self.model}")
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=temperature,
                max_tokens=600,
                response_format={"type": "json_object"}
            )
            
            response_text = completion.choices[0].message.content.strip()
            logger.info("Successfully received response from Groq.")
            
            # Parse response
            parsed_data = self._clean_and_parse_json(response_text)
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error generating copy from Groq: {e}")
            # Fallback output in case of failure so downstream components don't crash
            return {
                "headline": f"Discover {product_name} today!",
                "blog_post": f"Experience the best of {product_name}. {product_description}. Designed for excellence and engineered to elevate your daily routine, this innovative solution brings unparalleled convenience and performance right to your fingertips.",
                "tweets": [
                    f"Transform your workflow with {product_name}! 🚀 #Innovation",
                    f"Looking for the ultimate upgrade? Discover {product_name} today. ✨ #Tech",
                    f"Don't settle for less. Experience premium quality with {product_name}. 🔥 #Excellence"
                ]
            }

    def _clean_and_parse_json(self, raw_text: str) -> Dict[str, Any]:
        """
        Cleans markdown wrappers and parses the raw text into a dictionary.
        """
        cleaned = raw_text
        if cleaned.startswith("```"):
            # Strip markdown block indicator if present
            lines = cleaned.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()
            
        try:
            data = json.loads(cleaned)
            # Ensure required keys exist
            if "headline" not in data:
                data["headline"] = "Transform Your Routine"
            if "blog_post" not in data:
                data["blog_post"] = "Experience the future of innovation and performance. Our latest solution brings unparalleled quality and elegance directly to your workflow."
            if "tweets" not in data or not isinstance(data["tweets"], list):
                data["tweets"] = [
                    "Experience premium innovation today! ✨ #Excellence",
                    "Elevate your daily workflow with our groundbreaking solution. 🚀 #Tech",
                    "Don't wait to upgrade your lifestyle. Discover the future now. 🔥 #Innovation"
                ]
            return data
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON response: {e}. Raw content: {raw_text}")
            # Return basic structure on error
            return {
                "headline": "Ignite Your Vision",
                "blog_post": raw_text[:500] if raw_text else "Experience cutting-edge innovation designed to streamline your life.",
                "tweets": [
                    "Ignite your vision with our latest release! ✨ #Innovation",
                    "Transform the way you work and live. 🚀 #Excellence",
                    "Experience the premium standard in technology today. 🔥 #Tech"
                ]
            }
