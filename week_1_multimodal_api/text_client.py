import os
import re
import json
import logging
from typing import Dict, Any
from groq import Groq
import google.generativeai as genai

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
    def __init__(self, api_key: str = None, model: str = None, provider: str = None):
        # Use provided credentials or fall back to system config
        self.api_key = api_key or config.TEXT_API_KEY
        self.model = model or config.TEXT_MODEL
        self.provider = provider or getattr(config, 'TEXT_LLM_PROVIDER', 'groq')
        
        if not self.api_key:
            raise ValueError(
                "TEXT_API_KEY is not configured. Please set it in your environment or .env file."
            )
        
        # Initialize client based on provider
        if self.provider == 'gemini':
            genai.configure(api_key=self.api_key)
            if self.model and self.model.lower() == "gemini 1.5 flash":
                self.model = "gemini-1.5-flash"
            self.model = self.model or 'gemini-1.5-flash'
        else:
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
            logger.info(f"Sending text generation request to {self.provider} using model: {self.model}")
            
            if self.provider == 'gemini':
                genai_model = genai.GenerativeModel(
                    model_name=self.model,
                    system_instruction=system_instruction
                )
                
                completion = genai_model.generate_content(
                    user_prompt,
                    generation_config=genai.GenerationConfig(
                        temperature=temperature,
                        max_output_tokens=1800,
                        response_mime_type="application/json"
                    )
                )
                response_text = completion.text.strip()
            else:
                completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=temperature,
                    max_tokens=1800,
                    response_format={"type": "json_object"}
                )
                response_text = completion.choices[0].message.content.strip()
                
            logger.info(f"Successfully received response from {self.provider}.")
            
            # Parse response
            parsed_data = self._clean_and_parse_json(response_text, product_name, product_description)
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error generating copy from {self.provider}: {e}")
            # Fallback output in case of failure so downstream components don't crash
            desc_words = product_description.split() if product_description else ["Premium", "Quality", "Build"]
            desc_short = " ".join(desc_words[:3])
            fallback_desc = product_description or f"Experience the best of {product_name}. Designed for excellence and engineered to elevate your daily routine, this innovative solution brings unparalleled convenience and performance right to your fingertips."
            return {
                "product_description": fallback_desc,
                "headline": f"Discover {product_name} today!",
                "blog_post": f"Experience the best of {product_name}. {fallback_desc}. Designed for excellence and engineered to elevate your daily routine, this innovative solution brings unparalleled convenience and performance right to your fingertips.",
                "tweets": [
                    f"Transform your workflow with {product_name}! 🚀 #Innovation",
                    f"Looking for the ultimate upgrade? Discover {product_name} today. ✨ #Tech",
                    f"Don't settle for less. Experience premium quality with {product_name}. 🔥 #Excellence"
                ],
                "image_banners": [
                    {
                        "badge": "✨ EXCLUSIVE EDITION",
                        "title": f"ULTRA PREMIUM {product_name.upper()[:12]}" if product_name else "ULTRA PREMIUM BUILD",
                        "bullet1": desc_short,
                        "bullet2": "Next-Gen Innovation",
                        "extra_tag": "98% Customer Satisfaction"
                    },
                    {
                        "badge": "🏆 100% QUALITY INSPECTED",
                        "title": f"UNMATCHED ELEGANCE",
                        "bullet1": "Claim Your Upgrade",
                        "bullet2": "Offer Ends Soon",
                        "extra_tag": "Limited Time Exclusive",
                        "supporting_message": "An elegant addition that complements your modern lifestyle and enhances daily workflow."
                    }
                ]
            }

    def _clean_and_parse_json(self, raw_text: str, product_name: str = "", product_description: str = "") -> Dict[str, Any]:
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
            
        desc_words = product_description.split() if product_description else ["Premium", "Quality", "Build"]
        desc_short = " ".join(desc_words[:3])
        
        try:
            data = json.loads(cleaned)
            # Ensure required keys exist
            if "product_description" not in data or not data["product_description"]:
                data["product_description"] = product_description or f"Experience the future of innovation and performance with {product_name}. Our latest solution brings unparalleled quality and elegance directly to your workflow."
            if "headline" not in data:
                data["headline"] = f"Transform Your Routine with {product_name}" if product_name else "Elevate Your Everyday Life Today"
            if "funny_slogan" not in data:
                data["funny_slogan"] = f"Sleek and Clever Solution Now"
            if "blog_post" not in data:
                data["blog_post"] = f"Experience the future of innovation and performance with {product_name}. {data['product_description']}. Our latest solution brings unparalleled quality and elegance directly to your workflow."
            if "tweets" not in data or not isinstance(data["tweets"], list):
                data["tweets"] = [
                    "Experience premium innovation today! ✨ #Excellence",
                    "Elevate your daily workflow with our groundbreaking solution. 🚀 #Tech",
                    "Don't wait to upgrade your lifestyle. Discover the future now. 🔥 #Innovation"
                ]
            if "image_banners" not in data or not isinstance(data["image_banners"], list) or len(data["image_banners"]) < 2:
                data["image_banners"] = [
                    {
                        "badge": "✨ EXCLUSIVE EDITION",
                        "title": f"ULTRA PREMIUM {product_name.upper()[:12]}" if product_name else "ULTRA PREMIUM BUILD",
                        "bullet1": desc_short,
                        "bullet2": "Next-Gen Innovation",
                        "extra_tag": "98% Customer Satisfaction",
                        "supporting_message": "A premium solution engineered to enhance comfort, style, and daily productivity."
                    },
                    {
                        "badge": "🏆 100% QUALITY INSPECTED",
                        "title": "UNMATCHED ELEGANCE",
                        "bullet1": "Claim Your Upgrade",
                        "bullet2": "Offer Ends Soon",
                        "extra_tag": "Limited Time Exclusive",
                        "supporting_message": "An elegant addition that complements your modern lifestyle and enhances daily workflow."
                    }
                ]
            if len(data["image_banners"]) >= 2 and "supporting_message" not in data["image_banners"][0]:
                data["image_banners"][0]["supporting_message"] = "A premium solution engineered to enhance comfort, style, and daily productivity."
            if len(data["image_banners"]) >= 2 and "supporting_message" not in data["image_banners"][1]:
                data["image_banners"][1]["supporting_message"] = "An elegant addition that complements your modern lifestyle and enhances daily workflow."
            final_data = data
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON response: {e}. Raw content: {raw_text}")
            # Return basic structure on error
            fallback_desc = product_description or f"Experience cutting-edge innovation designed to streamline your life. {product_name} is built to meet your everyday needs."
            final_data = {
                "product_description": fallback_desc,
                "headline": f"Ignite Your Vision with {product_name}" if product_name else "Ignite Your Vision Today Now",
                "funny_slogan": f"Witty Premium Solution For You",
                "blog_post": raw_text[:500] if raw_text else f"Experience cutting-edge innovation designed to streamline your life. {fallback_desc}",
                "tweets": [
                    "Ignite your vision with our latest release! ✨ #Innovation",
                    "Transform the way you work and live. 🚀 #Excellence",
                    "Experience the premium standard in technology today. 🔥 #Tech"
                ],
                "image_banners": [
                    {
                        "badge": "✨ EXCLUSIVE EDITION",
                        "title": f"ULTRA PREMIUM {product_name.upper()[:12]}" if product_name else "ULTRA PREMIUM BUILD",
                        "bullet1": desc_short,
                        "bullet2": "Next-Gen Innovation",
                        "extra_tag": "98% Customer Satisfaction",
                        "supporting_message": "A premium solution engineered to enhance comfort, style, and daily productivity."
                    },
                    {
                        "badge": "🏆 100% QUALITY INSPECTED",
                        "title": "UNMATCHED ELEGANCE",
                        "bullet1": "Claim Your Upgrade",
                        "bullet2": "Offer Ends Soon",
                        "extra_tag": "Limited Time Exclusive",
                        "supporting_message": "An elegant addition that complements your modern lifestyle and enhances daily workflow."
                    }
                ]
            }

        # Enforce exactly 5-6 words on headline/slogan
        headline_text = str(final_data.get("headline", "")).strip().strip('"').strip("'").strip()
        if headline_text.endswith("."):
            headline_text = headline_text[:-1].strip()
        headline_words = headline_text.split()
        if len(headline_words) > 6:
            headline_text = " ".join(headline_words[:6])
        elif len(headline_words) < 5:
            extra_words = ["Today", "Now", "Ready", "Today"]
            while len(headline_words) < 5:
                headline_words.append(extra_words[len(headline_words) % len(extra_words)])
            headline_text = " ".join(headline_words)
        final_data["headline"] = headline_text

        # Enforce exactly 5-6 words on funny_slogan
        funny_text = str(final_data.get("funny_slogan", "")).strip().strip('"').strip("'").strip()
        if funny_text.endswith("."):
            funny_text = funny_text[:-1].strip()
        funny_words = funny_text.split()
        if len(funny_words) > 6:
            funny_text = " ".join(funny_words[:6])
        elif len(funny_words) < 5:
            extra_words = ["Today", "Now", "Great", "Success"]
            while len(funny_words) < 5:
                funny_words.append(extra_words[len(funny_words) % len(extra_words)])
            funny_text = " ".join(funny_words)
        final_data["funny_slogan"] = funny_text

        # Ensure all tweet variants contain at least 2 relevant hashtags
        tweets = final_data.get("tweets", [])
        if isinstance(tweets, list):
            cleaned_tweets = []
            prod_tag = "".join(c for c in str(product_name).title() if c.isalnum()) if product_name else "Brand"
            if not prod_tag:
                prod_tag = "Brand"
            default_tags = f" #{prod_tag} #Innovation #NewProduct"
            for t in tweets:
                t_str = str(t).strip()
                if "#" not in t_str:
                    t_str = f"{t_str} {default_tags}"
                cleaned_tweets.append(t_str)
            final_data["tweets"] = cleaned_tweets

        return final_data

