from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from celery.result import AsyncResult

from week_2_async_queue.celery_app import celery_app
from week_2_async_queue.tasks import generate_campaign_task

app = FastAPI(
    title="AI Marketing Async API",
    description="API for asynchronously generating marketing campaigns.",
    version="1.0.0"
)

class CampaignRequest(BaseModel):
    product_name: str
    product_description: str
    tone: str
    target_audience: Optional[str] = None
    image_prompt: Optional[str] = None

class CampaignResponse(BaseModel):
    task_id: str
    message: str

@app.post("/campaign", response_model=CampaignResponse)
async def create_campaign(request: CampaignRequest):
    """
    Submit a background task to generate a marketing campaign.
    Returns immediately with a task_id.
    """
    # Push the heavy AI generation logic to the background worker
    task = generate_campaign_task.delay(
        product_name=request.product_name,
        product_description=request.product_description,
        tone=request.tone,
        target_audience=request.target_audience,
        image_prompt=request.image_prompt
    )
    
    return CampaignResponse(
        task_id=task.id,
        message="Campaign generation started asynchronously."
    )

@app.get("/status/{task_id}")
async def get_task_status(task_id: str) -> Dict[str, Any]:
    """
    Check the status of a previously submitted campaign task.
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    response = {
        "task_id": task_id,
        "status": task_result.status,
    }
    
    if task_result.state == "SUCCESS":
        response["result"] = task_result.result
    elif task_result.state == "FAILURE":
        response["error"] = str(task_result.info)
    elif task_result.state == "PROGRESS":
        info = task_result.info or {}
        if isinstance(info, dict):
            response["progress_step"] = info.get("step")
            if "copy" in info:
                response["result"] = {
                    "product_name": info.get("product_name"),
                    "tone": info.get("tone"),
                    "copy": info["copy"],
                    "asset_urls": []
                }
        else:
            response["progress_step"] = str(info)
        
    return response
