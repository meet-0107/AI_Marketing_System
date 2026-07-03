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
