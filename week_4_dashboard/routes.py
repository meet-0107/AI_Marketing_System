import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from celery.result import AsyncResult

from week_2_async_queue.celery_app import celery_app
from week_2_async_queue.tasks import generate_campaign_task

router = APIRouter()

# Output directory for generated images
OUTPUTS_DIR = Path(__file__).resolve().parent.parent / "week_1_multimodal_api" / "outputs"

class CampaignRequest(BaseModel):
    product_name: str
    product_description: Optional[str] = None
    tone: str
    target_audience: Optional[str] = None
    image_prompt: Optional[str] = None
    image_reference: Optional[str] = None
    generate_text: bool = True
    generate_images: bool = True

class CampaignResponse(BaseModel):
    task_id: str
    message: str

@router.post("/campaign", response_model=CampaignResponse)
async def create_campaign(request: CampaignRequest):
    """
    Submit a background task to generate a marketing campaign (Blog Post, 3 Tweets, 2 Images).
    Returns immediately with a task_id for polling.
    """
    task = generate_campaign_task.delay(
        product_name=request.product_name,
        product_description=request.product_description,
        tone=request.tone,
        target_audience=request.target_audience,
        image_prompt=request.image_prompt,
        image_reference=request.image_reference,
        generate_text=request.generate_text,
        generate_images=request.generate_images
    )
    
    return CampaignResponse(
        task_id=task.id,
        message="Campaign generation started asynchronously."
    )

@router.get("/status/{task_id}")
async def get_task_status(task_id: str) -> Dict[str, Any]:
    """
    Poll the status of a previously submitted campaign task.
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    response = {
        "task_id": task_id,
        "status": task_result.status,
    }
    
    if task_result.state == "PROGRESS":
        info = task_result.info
        if isinstance(info, dict):
            response["progress_step"] = info.get("step", "Processing...")
            if "copy" in info:
                response["result"] = {
                    "product_name": info.get("product_name"),
                    "tone": info.get("tone"),
                    "copy": info["copy"],
                    "asset_urls": []
                }
        else:
            response["progress_step"] = str(info)
    else:
        response["progress_step"] = None
        
    if task_result.state == "SUCCESS":
        result_data = task_result.result
        if result_data:
            # Directly pass base64 image data URIs to asset_urls without reading from disk
            asset_urls = result_data.get("image_data_uris", [])
            result_data["asset_urls"] = asset_urls
        response["result"] = result_data
    elif task_result.state == "FAILURE":
        response["error"] = str(task_result.info)
        
    return response

@router.get("/assets/{filename}")
async def get_asset(filename: str):
    """
    Serve generated campaign image assets to the frontend dashboard.
    """
    file_path = OUTPUTS_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(file_path)

class RegenerateRequest(BaseModel):
    product_name: str
    product_description: Optional[str] = None
    tone: str
    target_audience: Optional[str] = None
    element_type: str  # 'blog_post' | 'tweets' | 'image_1' | 'image_2'
    image_prompt: Optional[str] = None
    image_reference: Optional[str] = None
    refinement_instruction: Optional[str] = None
    current_content: Optional[str] = None

@router.post("/regenerate")
async def regenerate_element(request: RegenerateRequest):
    """
    Regenerate or refine a specific campaign marketing asset (blog post, tweet group, individual tweet, or promotional image)
    on demand, supporting refinement instructions.
    """
    import base64
    import random
    
    element_type = request.element_type
    
    if element_type in ('blog_post', 'tweets') or element_type.startswith('tweet_'):
        try:
            from week_1_multimodal_api.text_client import TextClient
            import config
            
            # Mock mode
            if getattr(config, "MOCK_GENERATION", False):
                import time
                time.sleep(1.0)
                if request.refinement_instruction:
                    if element_type == 'blog_post':
                        current = request.current_content or "Blog content text"
                        return {"blog_post": f"{current}\n\n*[AI Refined with instruction: '{request.refinement_instruction}']*"}
                    elif element_type == 'tweets':
                        return {"tweets": [
                            f"Variant 1 refined: {request.refinement_instruction} #{request.product_name.split()[0]}",
                            f"Variant 2 refined: {request.refinement_instruction} #Premium",
                            f"Variant 3 refined: {request.refinement_instruction} #Upgrade"
                        ]}
                    else:
                        current = request.current_content or "Tweet variant text"
                        return {"tweet": f"{current} ✨ [Refined: {request.refinement_instruction}]"}
                else:
                    if element_type == 'blog_post':
                        new_blog_post = (
                            f"# {request.product_name}: The Ultimate Edition\n\n"
                            f"## Overview\n\n"
                            f"Welcome to the official showcase of {request.product_name}! Engineered to perfection, "
                            f"it sets new standards for durability, functionality, and professional design.\n\n"
                            f"## Highlights\n\n"
                            f"* **Elite Engineering** — Built using resilient, high-grade materials.\n"
                            f"* **Exceptional Value** — Offers outstanding productivity and comfort daily."
                        )
                        return {"blog_post": new_blog_post}
                    elif element_type == 'tweets':
                        new_tweets = [
                            f"Elevate your lifestyle with {request.product_name}! 🚀 #{request.product_name.split()[0]} #Premium",
                            f"Crafted with perfection in mind. Say hello to {request.product_name}! ✨ #Style #NewArrival",
                            f"Tired of compromise? Get the best of both worlds with {request.product_name}! 🔥 #Upgrade"
                        ]
                        return {"tweets": new_tweets}
                    else:
                        mock_tweets = [
                            f"Upgrade your day with {request.product_name}. Designed for pros. ⚡ #Innovation #SmartStyle",
                            f"The ultimate essential is here: {request.product_name}. Discover why! 🌟 #MustHave #Elite",
                            f"Elevate your lifestyle with {request.product_name}! 🚀 #{request.product_name.split()[0]} #Premium",
                            f"Crafted with perfection in mind. Say hello to {request.product_name}! ✨ #Style #NewArrival",
                            f"Tired of compromise? Get the best of both worlds with {request.product_name}! 🔥 #Upgrade"
                        ]
                        return {"tweet": random.choice(mock_tweets)}
            
            # Real generation
            text_client = TextClient()
            if request.refinement_instruction and request.current_content:
                refined_text = text_client.refine_copy(
                    current_content=request.current_content,
                    instruction=request.refinement_instruction
                )
                if element_type == 'blog_post':
                    return {"blog_post": refined_text}
                else:
                    return {"tweet": refined_text}
            else:
                copy_res = text_client.generate_copy(
                    product_name=request.product_name,
                    product_description=request.product_description or "",
                    tone=request.tone,
                    target_audience=request.target_audience
                )
                if element_type == 'blog_post':
                    blog_content = copy_res.get("blog_post") or copy_res.get("body_copy") or ""
                    return {"blog_post": blog_content}
                elif element_type == 'tweets':
                    tweets_content = copy_res.get("tweets") or []
                    return {"tweets": tweets_content}
                else:
                    tweets_content = copy_res.get("tweets") or []
                    idx = int(element_type.split('_')[1]) - 1
                    if idx < len(tweets_content):
                        return {"tweet": tweets_content[idx]}
                    elif tweets_content:
                        return {"tweet": random.choice(tweets_content)}
                    else:
                        return {"tweet": f"Discover the excellence of {request.product_name}! ✨ #Tech #Premium"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Regeneration failed: {str(e)}")
            
    elif element_type in ('image_1', 'image_2'):
        try:
            import config
            from week_1_multimodal_api.image_client import ImageClient
            
            # Mock mode
            if getattr(config, "MOCK_GENERATION", False):
                import time
                time.sleep(2.0)
                project_root = Path(__file__).resolve().parent.parent
                folder = project_root / "saved_images"
                local_img_bytes = None
                
                if folder.exists() and folder.is_dir():
                    files = [f for f in os.listdir(folder) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
                    if files:
                        chosen_file = random.choice(files)
                        with open(folder / chosen_file, "rb") as fh:
                            local_img_bytes = fh.read()
                            
                if not local_img_bytes:
                    local_img_bytes = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")
                
                b64_img = base64.b64encode(local_img_bytes).decode("utf-8")
                return {"image_url": f"data:image/png;base64,{b64_img}"}
            
            # Real generation
            image_client = ImageClient()
            
            environments_1 = [
                "on a pristine polished marble display pedestal with soft geometric shadow patterns in the background",
                "floating effortlessly in a clean, modern zero-gravity minimalist showcase with subtle mist and rim lighting",
                "placed elegantly on a brushed metal exhibition surface with dramatic spotlighting and rich contrasting backdrops",
                "set against an organic, high-end architectural concrete wall with warm morning sunlight streaming through window blinds",
                "rested on a dark luxurious slate countertop with subtle moody ambient lighting and crisp reflections",
                "showcased inside a futuristic pristine glass display pavilion with soft volumetric lighting"
            ]
            lighting_1 = [
                "crisp, cinematic studio spotlighting with delicate high-end rim lights",
                "clean, diffused warm gallery lighting highlighting product contours",
                "sleek, futuristic cool-toned cybernetic glow with sharp highlights",
                "natural sun rays filtering from the side with dramatic soft shadow contrast"
            ]
            
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
            
            base_desc = request.image_prompt if request.image_prompt else request.product_name
            product_visual_desc = (
                f"an ultra-premium, sleek luxury commercial edition of {base_desc} "
                f"featuring exquisite craftsmanship, high-end materials (like brushed metal, polished glass, or matte carbon-fiber), "
                f"and state-of-the-art professional industrial design details"
            )
            if request.refinement_instruction:
                product_visual_desc += f", modified with custom user refinement request: {request.refinement_instruction}"
            
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
            
            if element_type == 'image_1':
                env1 = random.choice(environments_1)
                light1 = random.choice(lighting_1)
                prompt = (
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
            else:
                env2 = random.choice(environments_2)
                light2 = random.choice(lighting_2)
                prompt = (
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
                
            img_bytes = image_client.generate_image(
                base_prompt=prompt,
                tone=request.tone,
                product_name=request.product_name,
                image_reference=request.image_reference
            )
            if not img_bytes:
                raise ValueError("Image generation returned no bytes.")
                
            b64_img = base64.b64encode(img_bytes).decode("utf-8")
            return {"image_url": f"data:image/png;base64,{b64_img}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
            
    else:
        raise HTTPException(status_code=400, detail="Invalid element type.")
