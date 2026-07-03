import os
import time
import random
import logging
from typing import Dict, Any

from week_2_async_queue.celery_app import celery_app
from week_1_multimodal_api.text_client import TextClient
from week_1_multimodal_api.image_client import ImageClient
import config

logger = logging.getLogger(__name__)

text_client = TextClient()
image_client = ImageClient()

def slugify(text: str) -> str:
    import re
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

def save_image_to_disk(img_bytes: bytes, filename: str):
    try:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        folder = os.path.join(project_root, "saved_images")
        os.makedirs(folder, exist_ok=True)
        filepath = os.path.join(folder, filename)
        with open(filepath, "wb") as f:
            f.write(img_bytes)
        logger.info(f"Saved generated image copy to local file: {filepath}")
    except Exception as e:
        logger.error(f"Failed to save image copy to disk: {e}")

@celery_app.task(bind=True, name="generate_campaign_task_v2")
def generate_campaign_task(
    self,
    product_name: str,
    product_description: str = None,
    tone: str = "professional",
    target_audience: str = None,
    image_prompt: str = None,
    generate_text: bool = True,
    generate_images: bool = True
) -> Dict[str, Any]:
    """
    Celery background task that generates a complete campaign package:
    - Structured copy (Headline, Blog Post, 3 Tweet Variants) via Groq LLM
    - 2 distinct AI promotional images via Google Gemini API (Imagen 3)
    """
    logger.info(f"[{self.request.id}] Starting asynchronous campaign generation for '{product_name}' (Tone: {tone})")
    product_slug = slugify(product_name)
    
    if getattr(config, "MOCK_GENERATION", False):
        logger.info(f"[{self.request.id}] MOCK GENERATION ACTIVE. Bypassing external APIs.")
        self.update_state(state="PROGRESS", meta={"step": "Generating campaign package..."})
        time.sleep(5.0)
        
        mock_desc = product_description or f"Experience the future of innovation and performance with {product_name}."
        mock_copy = {
            "product_description": mock_desc,
            "headline": f"Discover {product_name} Today Now",
            "funny_slogan": f"Sleek and Clever Solution Now",
            "features": [
                "Feature 1: Premium Build Quality",
                "Feature 2: Next-Gen Innovation",
                "Feature 3: Dynamic Operations",
                "Feature 4: High Performance",
                "Feature 5: Sleek Minimalist Design",
                "Feature 6: 100% Quality Inspected"
            ],
            "blog_post": f"# {product_name}: The Future of Innovation\\n\\n## Introduction\\n\\nLooking for a premium B2C solution that combines style, performance, and efficiency? The **{product_name}** is designed to deliver outstanding value. Whether you are a professional or enthusiast, this product is built to fit seamlessly into your everyday life.\\n\\n---\\n\\n## Key Features\\n\\n* **Premium Build** – Designed using high-quality materials.\\n* **Smart Performance** – Delivers speed and reliability.\\n* **Modern Style** – Enhances your daily aesthetic.\\n* **Easy to Use** – Unparalleled convenience at your fingertips.\\n\\n---\\n\\n## Benefits\\n\\n* Improves your daily experience\\n* Excellent value for money\\n* Stylish and modern design",
            "tweets": [
                f"Upgrade your routine with {product_name}! 🚀 #Innovation #NewProduct",
                f"Sleek design meets premium performance. Discover the future today. ✨ #Tech #NewProduct",
                f"Don't settle for less. Experience premium quality. 🔥 #Brand #Innovation"
            ],
            "image_banners": [
                {
                    "badge": "✨ EXCLUSIVE EDITION",
                    "title": f"ULTRA PREMIUM {product_name.upper()[:12]}",
                    "bullet1": "Next-Gen Design",
                    "bullet2": "Elite Innovation",
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
        
        # Fetch mock/fallback images from local saved_images
        image_data_uris = []
        try:
            import base64
            # Attempt to find local fallback image
            for idx in range(2):
                img_bytes = image_client.generate_image(
                    base_prompt="", 
                    tone=tone, 
                    product_name=product_name
                )
                if img_bytes:
                    save_image_to_disk(img_bytes, f"{product_slug}_img{idx+1}_{self.request.id}.png")
                    b64_img = base64.b64encode(img_bytes).decode("utf-8")
                    image_data_uris.append(f"data:image/jpeg;base64,{b64_img}")
        except Exception as e:
            logger.error(f"Mock image generation failed: {e}")
            
        if not image_data_uris:
            tiny_grey_pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
            image_data_uris = [tiny_grey_pixel, tiny_grey_pixel]
            
        return {
            "task_id": self.request.id,
            "product_name": product_name,
            "product_description": mock_desc,
            "tone": tone,
            "copy": mock_copy,
            "image_data_uris": image_data_uris,
            "status": "SUCCESS"
        }
    
    # 1. Generate Structured Copy (Blog Post + 3 Tweets)
    if generate_text:
        self.update_state(state="PROGRESS", meta={"step": "Generating structured marketing copy..."})
        logger.info(f"[{self.request.id}] Generating copy via TextClient...")
        
        copy_result = text_client.generate_copy(
            product_name=product_name,
            product_description=product_description,
            tone=tone,
            target_audience=target_audience
        )
    else:
        logger.info(f"[{self.request.id}] Skipping copy generation as generate_text is set to False.")
        copy_result = {
            "product_description": product_description or f"Experience the excellence of {product_name}.",
            "headline": f"Discover {product_name} today!",
            "funny_slogan": "Premium and sleek lifestyle upgrades.",
            "features": [],
            "blog_post": "",
            "tweets": [],
            "image_banners": []
        }
    
    # 2. Generate 2 AI Promotional Images
    self.update_state(
        state="PROGRESS", 
        meta={
            "step": "Generating 2 AI promotional images...",
            "copy": copy_result,
            "product_name": product_name,
            "tone": tone
        }
    )
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

    avoid_list = (
        "Avoid:\n"
        "- blurry images\n"
        "- cropped product\n"
        "- duplicate objects\n"
        "- distorted text\n"
        "- watermark\n"
        "- logos\n"
        "- low resolution\n"
        "- unrealistic reflections\n"
        "- excessive saturation\n"
        "- cluttered background\n"
        "- people\n"
        "- humans\n"
        "- faces\n"
        "- hands\n"
        "- man\n"
        "- woman\n"
        "- text\n"
        "- words\n"
        "- typography\n"
        "- letters"
    )

    prompt_1 = (
        f"A professional commercial studio product photograph featuring {product_visual_desc} as the main central focus. "
        f"The product must be positioned perfectly centered, occupying only the central 50% of the image width and upper-middle of the image height. "
        f"Keep the left 25% and right 25% of the frame width completely clean and empty as clear background space (copy space) for overlay text columns. "
        f"Keep the bottom 30% of the image height empty as clear copy space. "
        f"The product is placed {env1}. "
        f"Crisp, clear, ultra-detailed shot with {light1}, realistic reflections, soft shadows, and clean luxury retail styling. "
        f"The product is fully and clearly visible, perfectly centered, showing its entire design. "
        f"High-end 8K digital studio photograph finish.\n\n"
        f"{avoid_list}"
    )
    prompt_2 = (
        f"A professional premium lifestyle contextual photograph. "
        f"{env2} "
        f"The product must be positioned perfectly centered, occupying only the central 50% of the image width and upper-middle of the image height. "
        f"Keep the left 25% and right 25% of the frame width completely clean and empty as clear background space (copy space) for overlay text columns. "
        f"Keep the bottom 30% of the image height empty as clear copy space. "
        f"The product is fully and clearly visible, showing {product_visual_desc} integrated into everyday life. "
        f"Cinematic atmosphere with {light2}, beautiful bokeh, shallow depth of field, realistic textures and warm colors. "
        f"The product remains in sharp clear focus and fully visible. "
        f"High-end 8K advertising photography finish.\n\n"
        f"{avoid_list}"
    )
    
    image_data_uris = []
    
    if generate_images and getattr(config, "GENERATE_IMAGES", True):
        # Generate Image 1 independently
        try:
            logger.info(f"[{self.request.id}] Generating Image 1: {prompt_1}")
            img1_bytes = image_client.generate_image(prompt_1, tone=tone, width=1024, height=1024, product_name=product_name)
            save_image_to_disk(img1_bytes, f"{product_slug}_img1_{self.request.id}.png")
            import base64
            b64_img1 = base64.b64encode(img1_bytes).decode("utf-8")
            image_data_uris.append(f"data:image/jpeg;base64,{b64_img1}")
        except Exception as e:
            logger.error(f"[{self.request.id}] Image 1 generation failed: {e}")
            
        # Generate Image 2 independently
        try:
            logger.info(f"[{self.request.id}] Generating Image 2: {prompt_2}")
            img2_bytes = image_client.generate_image(prompt_2, tone=tone, width=1024, height=1024, product_name=product_name)
            save_image_to_disk(img2_bytes, f"{product_slug}_img2_{self.request.id}.png")
            import base64
            b64_img2 = base64.b64encode(img2_bytes).decode("utf-8")
            image_data_uris.append(f"data:image/jpeg;base64,{b64_img2}")
        except Exception as e:
            logger.error(f"[{self.request.id}] Image 2 generation failed: {e}")
    else:
        logger.info(f"[{self.request.id}] Skipping image generation as GENERATE_IMAGES is set to False or generate_images flag is False.")
        
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
