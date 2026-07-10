import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, List
from week_1_multimodal_api.text_client import TextClient
from week_1_multimodal_api.image_client import ImageClient

logger = logging.getLogger(__name__)

def run_parallel_campaign(
    text_client: TextClient,
    image_client: ImageClient,
    product_name: str,
    product_description: str,
    tone: str,
    target_audience: str,
    image_prompt: str,
    image_reference: str,
    generate_text: bool,
    generate_images: bool,
    prompt_1: str,
    prompt_2: str,
    warnings: list
) -> Dict[str, Any]:
    """
    Executes text copy generation and multiple image generation calls in parallel
    using a ThreadPoolExecutor to cut down overall campaign generation time.
    """
    results = {
        "copy": None,
        "image_1": None,
        "image_2": None
    }
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {}
        
        if generate_text:
            logger.info("Scheduling Text Generation task in parallel thread...")
            futures[executor.submit(
                text_client.generate_copy,
                product_name=product_name,
                product_description=product_description,
                tone=tone,
                target_audience=target_audience
            )] = "copy"
            
        if generate_images:
            logger.info("Scheduling Image 1 Generation task in parallel thread...")
            futures[executor.submit(
                image_client.generate_image,
                base_prompt=prompt_1,
                tone=tone,
                product_name=product_name,
                image_reference=image_reference,
                warnings=warnings
            )] = "image_1"
            
            logger.info("Scheduling Image 2 Generation task in parallel thread...")
            futures[executor.submit(
                image_client.generate_image,
                base_prompt=prompt_2,
                tone=tone,
                product_name=product_name,
                image_reference=image_reference,
                warnings=warnings
            )] = "image_2"
            
        for future in as_completed(futures):
            task_type = futures[future]
            try:
                val = future.result()
                results[task_type] = val
                logger.info(f"Parallel task '{task_type}' completed successfully.")
            except Exception as e:
                logger.error(f"Parallel task '{task_type}' failed with error: {e}")
                if warnings is not None:
                    warnings.append(f"Parallel execution error ({task_type}): {e}")
                    
    return results
