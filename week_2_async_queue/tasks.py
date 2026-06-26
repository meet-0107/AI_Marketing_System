import os
import time
import logging
from typing import Dict, Any

from week_2_async_queue.celery_app import celery_app
from week_1_multimodal_api.text_client import TextClient
from week_1_multimodal_api.image_client import ImageClient

logger = logging.getLogger(__name__)

text_client = TextClient()
image_client = ImageClient()

@celery_app.task(bind=True, name="generate_campaign_task")
def generate_campaign_task(
    self,
    product_name: str,
    product_description: str,
    tone: str = "professional",
    target_audience: str = None,
    image_prompt: str = None
) -> Dict[str, Any]:
    """
    Celery background task that generates a complete campaign package:
    - Structured copy (Headline, Blog Post, 3 Tweet Variants) via Groq LLM
    - 2 distinct AI promotional images via Hugging Face FLUX / Pollinations fallback
    """
    logger.info(f"[{self.request.id}] Starting asynchronous campaign generation for '{product_name}' (Tone: {tone})")
    
    # 1. Generate Structured Copy (Blog Post + 3 Tweets)
    self.update_state(state="PROGRESS", meta={"step": "Generating structured marketing copy (Blog Post + 3 Tweets)..."})
    logger.info(f"[{self.request.id}] Generating copy via TextClient...")
    
    copy_result = text_client.generate_copy(
        product_name=product_name,
        product_description=product_description,
        tone=tone,
        target_audience=target_audience
    )
    
    # 2. Generate 2 AI Promotional Images
    self.update_state(state="PROGRESS", meta={"step": "Generating 2 AI promotional images..."})
    logger.info(f"[{self.request.id}] Generating 2 promotional images via ImageClient...")
    
    # Define two distinct high-converting premium graphic design advertisement poster prompts
    # Replaced ambiguous "placeholder" keywords with explicit visual banner descriptions and sample text so AI generates a true poster layout
    prompt_1 = image_prompt if image_prompt else (
        f"A luxury commercial advertisement marketing poster for {product_name} ({product_description}). "
        "Layout Structure: At the very top, a large bold typography banner displaying 'PREMIUM EXCLUSIVE COLLECTION'. "
        "In the top-right corner, an eye-catching promotional offer badge displaying 'SPECIAL OFFER'. "
        f"In the center, a spectacular photorealistic hero shot of {product_name}, occupying 65% of the design with cinematic studio lighting and realistic reflections. "
        "Directly below the product, a key features section featuring 4 elegant graphical feature icons with clean subtitle labels. "
        "Near the bottom, a prominent high-converting call-to-action button displaying 'DISCOVER MORE'. "
        "In the footer, a sophisticated dark horizontal banner containing website and social media icons. "
        "Design Style: Luxury commercial advertising, enterprise-level branding, modern corporate aesthetic, premium visual hierarchy, clean graphic design composition, magazine-quality artwork, 8K ultra HD."
    )
    prompt_2 = (
        f"A sleek modern corporate advertisement promotional poster for {product_name} ({product_description}). "
        "Layout Structure: At the very top, an elegant clean typography header displaying 'INNOVATION & EXCELLENCE'. "
        "In the top-right corner, a vibrant premium quality guarantee badge displaying '100% GUARANTEE'. "
        f"In the center, an ultra-detailed, flawless hero photograph of {product_name}, occupying 65% of the canvas with dramatic lighting and soft shadows. "
        "Below the product, a structured grid of 4 sleek circular feature icons with crisp descriptive labels. "
        "Near the bottom, a bold conversion-focused call-to-action button displaying 'EXPLORE NOW'. "
        "In the footer, a pristine contrasting banner with contact details and social media icons. "
        "Design Style: High-end e-commerce campaign, elegant corporate branding, pristine visual hierarchy, flawless advertisement composition, professional promotional graphics, 8K ultra HD."
    )
    
    image_data_uris = []
    
    # Generate Image 1 independently without saving to disk
    try:
        logger.info(f"[{self.request.id}] Generating Image 1: {prompt_1}")
        img1_bytes = image_client.generate_image(prompt_1, tone=tone)
        import base64
        b64_img1 = base64.b64encode(img1_bytes).decode("utf-8")
        image_data_uris.append(f"data:image/jpeg;base64,{b64_img1}")
    except Exception as e:
        logger.error(f"[{self.request.id}] Image 1 generation failed: {e}")
        
    # Generate Image 2 independently without saving to disk
    try:
        logger.info(f"[{self.request.id}] Generating Image 2: {prompt_2}")
        img2_bytes = image_client.generate_image(prompt_2, tone=tone)
        import base64
        b64_img2 = base64.b64encode(img2_bytes).decode("utf-8")
        image_data_uris.append(f"data:image/jpeg;base64,{b64_img2}")
    except Exception as e:
        logger.error(f"[{self.request.id}] Image 2 generation failed: {e}")
        
    logger.info(f"[{self.request.id}] Campaign generation completed successfully!")
    
    return {
        "task_id": self.request.id,
        "product_name": product_name,
        "tone": tone,
        "copy": copy_result,
        "image_data_uris": image_data_uris,
        "status": "SUCCESS"
    }
