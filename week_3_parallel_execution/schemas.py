from pydantic import BaseModel, Field
from typing import List, Optional

class ImageBannerSchema(BaseModel):
    badge: str = Field(description="A short tag line or exclusive offer label")
    title: str = Field(description="Title of the image banner ad")
    bullet1: str = Field(description="Key highlight benefit bullet 1")
    bullet2: str = Field(description="Key highlight benefit bullet 2")
    extra_tag: str = Field(description="Credibility note or urgency tagline")
    supporting_message: str = Field(description="Supporting brand narrative sentence")

class CampaignCopySchema(BaseModel):
    product_description: str = Field(description="Refined/inferred description of the product")
    headline: str = Field(description="A catchy advertising slogan/headline of exactly 5 to 6 words")
    funny_slogan: str = Field(description="A witty advertising slogan of exactly 5 to 6 words")
    features: List[str] = Field(description="List of 6 short product features")
    blog_post: str = Field(description="A complete markdown blog post following the specified template")
    tweets: List[str] = Field(description="Three distinct Twitter/X variants with emojis and hashtags")
    seo_tags: List[str] = Field(description="A list of 5-6 high-traffic SEO keywords/tags")
    image_banners: List[ImageBannerSchema] = Field(description="Two distinct image banner copy definitions")

class CampaignResultSchema(BaseModel):
    task_id: str
    product_name: str
    product_description: str
    tone: str
    copy: CampaignCopySchema
    image_data_uris: List[str]
    warnings: List[str]
    status: str
