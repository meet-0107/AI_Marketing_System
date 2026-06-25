import os
from pathlib import Path
from celery import shared_task
import logging

from week_1_multimodal_api.text_client import TextClient
from week_1_multimodal_api.image_client import ImageClient

logger = logging.getLogger(__name__)

# Ensure outputs directory exists
OUTPUTS_DIR = Path(__file__).resolve().parent.parent / "week_1_multimodal_api" / "outputs"
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

@shared_task(bind=True, name="generate_campaign_task")
def generate_campaign_task(
    self, 
    product_name: str, 
    product_description: str, 
    tone: str, 
    target_audience: str = None,
    image_prompt: str = None
):
    """
    Background task to generate a marketing campaign (copy + image).
    """
    try:
        # 1. Initialize Clients
        text_client = TextClient()
        image_client = ImageClient()

        # 2. Generate Copy
        logger.info(f"Generating copy for {product_name}...")
        copy_result = text_client.generate_copy(
            product_name=product_name,
            product_description=product_description,
            tone=tone,
            target_audience=target_audience
        )

        # 3. Generate Image
        # If no explicit image prompt is provided, create a simple one from the product name
        if not image_prompt:
            image_prompt = f"A professional product shot of {product_name}"
            
        logger.info(f"Generating image for {product_name}...")
        image_bytes = image_client.generate_image(
            base_prompt=image_prompt,
            tone=tone
        )

        # 4. Save Image
        # Using the task ID to ensure a unique filename
        image_filename = f"campaign_{self.request.id}.jpg"
        image_path = OUTPUTS_DIR / image_filename
        
        with open(image_path, "wb") as f:
            f.write(image_bytes)
            
        logger.info(f"Saved image to {image_path}")

        # 5. Return Results
        return {
            "status": "completed",
            "task_id": self.request.id,
            "copy": copy_result,
            "image_path": str(image_path)
        }

    except Exception as e:
        logger.error(f"Error in generate_campaign_task: {e}")
        # Re-raise to let Celery handle the failure state
        raise e
