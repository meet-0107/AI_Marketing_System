import os
import time
import random
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
    product_description: str = None,
    tone: str = "professional",
    target_audience: str = None,
    image_prompt: str = None
) -> Dict[str, Any]:
    """
    Celery background task that generates a complete campaign package:
    - Structured copy (Headline, Blog Post, 3 Tweet Variants) via Groq LLM
    - 2 distinct AI promotional images via Google Gemini API (Imagen 3)
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
    
    # Diverse pools for Image 1 (Studio & Artistic Hero Shots)
    environments_1 = [
        "on a pristine polished marble display pedestal with soft geometric shadow patterns in the background",
        "floating effortlessly in a clean, modern zero-gravity minimalist showcase with subtle mist and rim lighting",
        "placed elegantly on a brushed metal exhibition surface with dramatic spotlighting and rich contrasting backdrops",
        "set against an organic, high-end architectural concrete wall with warm morning sunlight streaming through window blinds",
        "rested on a dark luxurious slate countertop with subtle moody ambient lighting and crisp reflections",
        "showcased inside a futuristic pristine glass display pavilion with soft volumetric lighting"
    ]
    lighting_1 = [
        "cinematic studio rim lighting with sharp highlights",
        "dramatic chiaroscuro lighting creating rich depth and elegance",
        "bright, airy Scandinavian natural daylight with soft wraparound illumination",
        "ultra-modern commercial ring-light illumination showcasing every pristine texture",
        "sophisticated high-contrast editorial lighting with subtle colored gels"
    ]
    composition_1 = [
        "An extreme, crisp macro-infused hero shot focusing on the exquisite texture and premium craftsmanship",
        "A striking, perfectly centered 50mm editorial photograph capturing the entire product in perfect proportion",
        "An artistic low-angle commercial composition giving the product a monumental, heroic presence",
        "A dynamic, slightly tilted high-end catalog view emphasizing sleek lines and modern curves"
    ]

    # Diverse pools for Image 2 (Lifestyle & Contextual Scenes)
    environments_2 = [
        "placed perfectly on an executive oak desk in a luxury penthouse office overlooking a softly blurred city skyline",
        "integrated flawlessly into a warm, high-end contemporary designer living room with rich wooden textures and lush indoor plants",
        "held or displayed within an elite, ultra-modern creative studio environment with soft bokeh depth of field",
        "staged on a sunlit modern balcony terrace with premium architectural glass and a serene outdoor backdrop",
        "situated in a high-end luxury boutique display area with warm ambient gallery spotlights",
        "showcased within a sophisticated, premium hospitality lounge setting with elegant blurred background elements"
    ]
    lighting_2 = [
        "golden hour sunset rays filtering through large architectural windows",
        "warm, inviting ambient gallery lighting creating a premium lifestyle mood",
        "sleek, professional daylight with beautiful bokeh and soft environmental reflections",
        "moody, sophisticated evening lounge lighting with gentle practical background lights"
    ]
    composition_2 = [
        "A captivating corporate lifestyle commercial photograph showcasing the product in its natural premium environment",
        "An editorial magazine cover composition balancing the stunning product hero shot with an elegant environmental backdrop",
        "A dynamic, high-converting e-commerce lifestyle scene emphasizing real-world elegance and scale",
        "An immersive, cinematic wide-angle shot capturing both the flawless product and its sophisticated surroundings"
    ]

    product_detail = f"{product_name} ({product_description or ''})"
    
    env1 = random.choice(environments_1)
    light1 = random.choice(lighting_1)
    comp1 = random.choice(composition_1)
    
    env2 = random.choice(environments_2)
    light2 = random.choice(lighting_2)
    comp2 = random.choice(composition_2)

    # Ensure both prompts describe the product consistently as an ultra-premium, high-end luxury version.
    base_desc = image_prompt if image_prompt else product_name
    product_visual_desc = (
        f"an ultra-premium, sleek luxury commercial edition of {base_desc} "
        f"featuring exquisite craftsmanship, high-end materials (like brushed metal, polished glass, or matte carbon-fiber), "
        f"and state-of-the-art professional industrial design details"
    )

    prompt_1 = (
        f"A professional commercial studio product photograph featuring {product_visual_desc} as the main central focus. "
        f"The product must be positioned in the center and upper-middle of the frame, well above the bottom edge, leaving the bottom 30% of the frame as empty background space (copy space) for text overlays. "
        f"The product is placed {env1}. "
        f"Crisp, clear, ultra-detailed shot with {light1}, realistic reflections, soft shadows, and clean luxury retail styling. "
        f"The product is fully and clearly visible, perfectly centered, showing its entire design. "
        f"High-end 8K digital studio photograph finish. "
        "Important requirement: Clean pure photography only. No text, no words, no letters, no typography, no logos, no watermarks, no banners, no buttons."
    )
    prompt_2 = (
        f"A professional premium lifestyle contextual photograph featuring the exact same {product_visual_desc} as the main central focus. "
        f"The product must be positioned in the center and upper-middle of the frame, well above the bottom edge, leaving the bottom 30% of the frame as empty background space (copy space) for text overlays. "
        f"The product is fully and clearly visible, placed or being used naturally {env2}. "
        f"The scene shows {product_visual_desc} integrated seamlessly into the environment, emphasizing its design in everyday life. "
        f"Cinematic atmosphere with {light2}, beautiful bokeh, shallow depth of field, realistic textures and warm colors. "
        f"The product remains in sharp clear focus and fully visible in the center. "
        f"High-end 8K advertising photography finish. "
        "Important requirement: Clean pure photography only. No text, no words, no letters, no typography, no logos, no watermarks, no banners, no buttons."
    )
    
    image_data_uris = []
    
    # Generate Image 1 independently without saving to disk
    try:
        logger.info(f"[{self.request.id}] Generating Image 1: {prompt_1}")
        img1_bytes = image_client.generate_image(prompt_1, tone=tone, width=1024, height=1024)
        import base64
        b64_img1 = base64.b64encode(img1_bytes).decode("utf-8")
        image_data_uris.append(f"data:image/jpeg;base64,{b64_img1}")
    except Exception as e:
        logger.error(f"[{self.request.id}] Image 1 generation failed: {e}")
        
    # Generate Image 2 independently without saving to disk
    try:
        logger.info(f"[{self.request.id}] Generating Image 2: {prompt_2}")
        img2_bytes = image_client.generate_image(prompt_2, tone=tone, width=1024, height=1024)
        import base64
        b64_img2 = base64.b64encode(img2_bytes).decode("utf-8")
        image_data_uris.append(f"data:image/jpeg;base64,{b64_img2}")
    except Exception as e:
        logger.error(f"[{self.request.id}] Image 2 generation failed: {e}")
        
    logger.info(f"[{self.request.id}] Campaign generation completed successfully!")
    
    return {
        "task_id": self.request.id,
        "product_name": product_name,
        "product_description": copy_result.get("product_description", product_description) or "AI Generated Premium Product",
        "tone": tone,
        "copy": copy_result,
        "image_data_uris": image_data_uris,
        "status": "SUCCESS"
    }
