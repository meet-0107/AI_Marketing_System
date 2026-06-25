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
    - 2 distinct AI promotional images via Nvidia NIM / Pollinations fallback
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
    
    # Define two distinct high-converting luxury enterprise promotional prompts
    prompt_1 = image_prompt if image_prompt else (
        f"Create a high-converting promotional advertisement for {product_name}, featuring a bold luxury marketing headline "
        "with elegant typography hierarchy, exclusive offer badge with discount highlight, premium brand logo placement "
        "in strategic position, hero product centered with dramatic cinematic lighting and realistic shadows and reflections, "
        "dynamic floating design accents, premium color palette with sophisticated gradient background, call-to-action button "
        "with conversion-focused design, luxury lifestyle atmosphere, professional advertising layout with strategic white space, "
        "magazine-style commercial poster quality, photorealistic product rendering with ultra-sharp details, "
        "Fortune 500 campaign standards, award-winning creative direction, 8K ultra HD resolution."
    )
    prompt_2 = (
        f"Design a luxury enterprise promotional campaign visual for {product_name}, featuring a sophisticated multi-layer "
        "advertising layout with cinematic hero product showcase at center, dramatic studio lighting with premium reflections "
        "and depth, bold attention-grabbing headline with modern typographic system, product benefits highlights in elegant "
        "visual hierarchy, exclusive promotional offer element, premium corporate brand identity integration, dynamic background "
        "with floating geometric accents and luxury texture overlays, high-end e-commerce aesthetic meeting commercial billboard "
        "standards, realistic photorealistic product rendering with magazine-quality color grading, conversion-focused composition "
        "built for social media, print and digital campaigns, ultra-detailed award-winning advertising agency execution, 8K photorealistic quality."
    )
    
    image_paths = []
    
    # Generate Image 1 independently
    try:
        logger.info(f"[{self.request.id}] Generating Image 1: {prompt_1}")
        img1_bytes = image_client.generate_image(prompt_1, tone=tone)
        filename_1 = f"campaign_{self.request.id}_1.jpg"
        save_path_1 = image_client.save_image(img1_bytes, filename_1)
        image_paths.append(save_path_1)
    except Exception as e:
        logger.error(f"[{self.request.id}] Image 1 generation failed: {e}")
        
    # Generate Image 2 independently
    try:
        logger.info(f"[{self.request.id}] Generating Image 2: {prompt_2}")
        img2_bytes = image_client.generate_image(prompt_2, tone=tone)
        filename_2 = f"campaign_{self.request.id}_2.jpg"
        save_path_2 = image_client.save_image(img2_bytes, filename_2)
        image_paths.append(save_path_2)
    except Exception as e:
        logger.error(f"[{self.request.id}] Image 2 generation failed: {e}")
        
    logger.info(f"[{self.request.id}] Campaign generation completed successfully!")
    
    return {
        "task_id": self.request.id,
        "product_name": product_name,
        "tone": tone,
        "copy": copy_result,
        "image_paths": image_paths,
        "status": "SUCCESS"
    }
