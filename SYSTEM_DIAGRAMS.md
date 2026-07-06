# AI Marketing System - Architecture Diagrams

## Week 1: Multimodal API (Synchronous Generation)

### Overview
Week 1 establishes the core multimodal AI generation layer with synchronous APIs for text and image generation.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WEEK 1: MULTIMODAL API LAYER                            │
└─────────────────────────────────────────────────────────────────────────────┘

                              CLIENT REQUEST
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   TextClient             │
                    │  (text_client.py)        │
                    └──────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ▼                    ▼
            ┌──────────────────┐  ┌──────────────────┐
            │  Primary Provider│  │ Fallback Provider│
            │  (Groq or Gemini)│  │ (OpenRouter)     │
            └──────────────────┘  └──────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
      Groq      Gemini      OpenRouter
      API        API          API
        │           │           │
        └───────────┴───────────┘
                │
                ▼
        ┌──────────────────────┐
        │ JSON Output Parser   │
        │ _clean_and_parse()   │
        └──────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
    ▼                       ▼
Extracted Fields    Fallback Generation
• product_description
• headline
• funny_slogan
• blog_post
• tweets (3x)
• image_banners (2x)


                              CLIENT REQUEST
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   ImageClient            │
                    │  (image_client.py)       │
                    └──────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ▼                    ▼
            ┌──────────────────┐  ┌──────────────────┐
            │  Layer 1: Cloud  │  │  Layer 2: Local  │
            │  Cloudflare AI   │  │  Fallback Engine │
            └──────────────────┘  └──────────────────┘
                    │                    │
        ┌───────────┼───────────┐        │
        │           │           │        │
        ▼           ▼           ▼        ▼
      Account1   Account2   FLUX v1  saved_images/
      (Primary) (Fallback)  Models   (Local cache)
        │           │           │        │
        │           │           │        ▼
        │           │           │    Keyword
        │           │           │    Matching
        │           │           │        │
        └───────────┴───────────┴────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │ Layer 3: Ultimate    │
        │ Fallback (Unsplash)  │
        └──────────────────────┘
                    │
                    ▼
            ┌──────────────────┐
            │  Image Bytes     │
            │  (in-memory)     │
            └──────────────────┘


### Data Flow: Text Generation

Input: product_name, product_description, tone, target_audience
  │
  ▼
get_system_instruction(tone) → System Prompt
format_copy_prompt(inputs)   → User Prompt
  │
  ▼
Try Primary Provider:
  • Groq API (default)
  • Gemini API (alternative)
  │
  ├─ Success? → Parse JSON → Return structured copy
  │
  ├─ Failure? → Try OpenRouter Fallback
  │              │
  │              ├─ Success? → Parse JSON → Return
  │              │
  │              └─ Failure? → Generate fallback output
  │
  └─ Return: {
       product_description,
       headline,
       funny_slogan,
       blog_post,
       tweets,
       image_banners
     }


### Data Flow: Image Generation

Input: base_prompt, tone, product_name
  │
  ▼
format_image_prompt(base_prompt, tone)
  │
  ▼
Layer 1: Try Cloudflare AI (Primary)
  │
  ├─ Try Account 1 + multiple FLUX models
  │  ├─ Success (200) → Return image bytes
  │  └─ Failure → Try next account/model
  │
  ├─ Try Account 2 + multiple FLUX models
  │  ├─ Success (200) → Return image bytes
  │  └─ Failure → Try next layer
  │
  ▼
Layer 2: Local saved_images Fallback
  │
  ├─ Does saved_images/ exist?
  │  ├─ Yes → Extract keywords from product_name
  │  │        Search for matching filenames
  │  │        Return random best match
  │  └─ No → Continue to Layer 3
  │
  ▼
Layer 3: Public Fallback (Unsplash)
  │
  ├─ Success (200) → Return image bytes
  └─ Failure → Final fallback (picsum.photos)
  │
  ▼
Return: Image bytes (in-memory, no disk)


### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| **TextClient** | `text_client.py` | Handles LLM calls for marketing copy |
| **ImageClient** | `image_client.py` | Handles image generation with multi-layer fallbacks |
| **Prompt Templates** | `prompt_templates.py` | System instructions, tone modifiers, formatting |
| **Tone Config** | `prompt_templates.py` | Predefined tones (professional, casual, luxury, etc.) |

### Error Handling Strategy

**Text Generation:**
- Primary: Groq API
- Fallback 1: Gemini API
- Fallback 2: OpenRouter API
- Fallback 3: Hardcoded templates

**Image Generation:**
- Primary: Cloudflare AI (Account 1)
- Fallback 1: Cloudflare AI (Account 2)
- Fallback 2: Local saved_images/ cache
- Fallback 3: Unsplash
- Fallback 4: Picsum.photos placeholder

---

## Week 2: Async Queue (Background Processing)

### Overview
Week 2 introduces asynchronous task processing using Celery, enabling non-blocking campaign generation requests with status tracking.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   WEEK 2: ASYNC QUEUE LAYER (Celery)                        │
└─────────────────────────────────────────────────────────────────────────────┘

                              CLIENT
                                │
                                ▼
                    ┌──────────────────────────┐
                    │    FastAPI Endpoint      │
                    │   POST /campaign         │
                    │  (main.py)               │
                    └──────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
          Validate        Extract       Enqueue Task
          Request         Fields        via Celery
            │               │               │
            └───────────────┴───────────────┘
                            │
                            ▼
                    ┌──────────────────────────┐
                    │   Celery App             │
                    │  (celery_app.py)         │
                    └──────────────────────────┘
                            │
                ┌───────────┴────────────┐
                │                        │
                ▼                        ▼
        ┌──────────────┐        ┌──────────────────┐
        │ Message      │        │ Task Definition  │
        │ Broker       │        │ generate_campaign_task
        │ (Redis)      │        │ (tasks.py)       │
        │              │        └──────────────────┘
        └──────────────┘                │
                │                       ▼
                │            ┌──────────────────────┐
                │            │  Background Worker   │
                │            │  Process (Celery)    │
                │            └──────────────────────┘
                │                       │
                │                       ▼
                │            ┌──────────────────────┐
                │            │  Task Execution:     │
                │            │  1. Generate Copy    │
                │            │  2. Generate Images  │
                │            │  3. Save to Disk     │
                │            └──────────────────────┘
                │                       │
                │            ┌──────────┴──────────┐
                │            │                     │
                │            ▼                     ▼
                │      ┌──────────────┐    ┌──────────────────┐
                │      │  TextClient  │    │  ImageClient     │
                │      │  (Week 1)    │    │  (Week 1)        │
                │      └──────────────┘    └──────────────────┘
                │            │                     │
                │            └──────────┬──────────┘
                │                       │
                │                       ▼
                │            ┌──────────────────────┐
                │            │  Result Object:      │
                │            │  • task_id           │
                │            │  • product_name      │
                │            │  • copy              │
                │            │  • image_data_uris   │
                │            │  • status            │
                │            └──────────────────────┘
                │                       │
                └───────────┬───────────┘
                            │
                            ▼
                    ┌──────────────────────────┐
                    │  Result Backend          │
                    │  (Result Store)          │
                    │  Celery stores result    │
                    └──────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        IMMEDIATE RESPONSE      POLLING FOR RESULTS
        (Async) Returns          GET /status/{task_id}
        task_id to client        Returns current status


### Request/Response Flow

#### Step 1: Client Submits Campaign Request

```
POST /campaign
{
  "product_name": "HydroGlow Smart Water Bottle",
  "product_description": "Premium hydration companion...",
  "tone": "professional",
  "target_audience": "fitness enthusiasts",
  "image_prompt": "luxury sports bottle"
}
```

#### Step 2: API Server Response (Immediate)

```
FastAPI /campaign endpoint:
  1. Validate input (CampaignRequest model)
  2. Call generate_campaign_task.delay() ← Non-blocking
  3. Return immediately:
     {
       "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
       "message": "Campaign generation started asynchronously."
     }
```

#### Step 3: Background Worker Processes Task

```
Celery Worker:
  1. Pull task from Redis queue
  2. Execute generate_campaign_task():
     - update_state(PROGRESS, "Generating structured marketing copy...")
     - text_client.generate_copy() → Returns copy dict
     - update_state(PROGRESS, "Generating 2 AI promotional images...")
     - image_client.generate_image() × 2 → Returns image bytes
     - save_image_to_disk() → Stores PNG files
     - Return SUCCESS result
  3. Store result in Redis
```

#### Step 4: Client Polls for Status

```
GET /status/a1b2c3d4-e5f6-7890-abcd-ef1234567890

Responses:

PENDING:
{
  "task_id": "a1b2c3d4...",
  "status": "PENDING"
}

PROGRESS:
{
  "task_id": "a1b2c3d4...",
  "status": "PROGRESS",
  "progress_step": "Generating structured marketing copy...",
  "result": {
    "product_name": "HydroGlow Smart Water Bottle",
    "tone": "professional",
    "copy": { ... partial results ... },
    "asset_urls": []
  }
}

SUCCESS:
{
  "task_id": "a1b2c3d4...",
  "status": "SUCCESS",
  "result": {
    "task_id": "a1b2c3d4...",
    "product_name": "HydroGlow Smart Water Bottle",
    "product_description": "...",
    "tone": "professional",
    "copy": {
      "product_description": "...",
      "headline": "...",
      "funny_slogan": "...",
      "blog_post": "...",
      "tweets": ["tweet1", "tweet2", "tweet3"],
      "image_banners": [{ ... }, { ... }]
    },
    "image_data_uris": ["data:image/jpeg;base64,...", "data:image/jpeg;base64,..."],
    "status": "SUCCESS"
  }
}

FAILURE:
{
  "task_id": "a1b2c3d4...",
  "status": "FAILURE",
  "error": "Error message..."
}
```

### Task Execution Stages

```
generate_campaign_task() Execution Pipeline:

┌─────────────────────────────────────┐
│ Stage 1: Initialization             │
│ • Slug product name                 │
│ • Check MOCK_GENERATION flag        │
│ • update_state(PROGRESS, ...)       │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Stage 2: Generate Copy              │
│ • If generate_text=True:            │
│   - TextClient.generate_copy()      │
│   - Returns: headline, blog_post,   │
│     tweets, image_banners, etc.     │
│ • Else: Use fallback structure      │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Stage 3: Update Progress            │
│ • update_state(PROGRESS, meta)      │
│ • Include partial copy results      │
│ • Client can poll for incremental   │
│   results                           │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Stage 4: Generate Image 1           │
│ • Construct diverse prompt 1        │
│ • Call ImageClient.generate_image() │
│ • Save to disk with filename        │
│ • Encode to base64 data URI         │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Stage 5: Generate Image 2           │
│ • Construct diverse prompt 2        │
│ • Call ImageClient.generate_image() │
│ • Save to disk with filename        │
│ • Encode to base64 data URI         │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Stage 6: Return Result              │
│ • Status: "SUCCESS"                 │
│ • Include all assets                │
│ • Result stored in Redis            │
└─────────────────────────────────────┘
```

### Image Generation Prompts (Week 2 Specific)

**Image 1: Studio Product Hero Shot**
- Environment: Marble pedestal, zero-gravity showcase, metal surface, architectural wall, slate countertop, or glass pavilion
- Lighting: Rim lighting, chiaroscuro, Scandinavian daylight, ring-light, or editorial
- Composition: Macro hero shot, centered editorial, low-angle heroic, or tilted catalog view
- **Purpose:** Premium product showcase with empty space for text overlay

**Image 2: Lifestyle Contextual Scene**
- Environment: Executive office, designer living room, creative studio, balcony terrace, boutique display, or hospitality lounge
- Lighting: Golden hour rays, warm gallery lighting, professional daylight, or moody evening
- Composition: Corporate lifestyle, magazine cover, high-converting e-commerce, or cinematic wide-angle
- **Purpose:** Real-world integration showing product in aspirational context

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| **FastAPI App** | `main.py` | REST API endpoints for campaign submission & status |
| **CampaignRequest** | `main.py` | Pydantic model for input validation |
| **CampaignResponse** | `main.py` | Pydantic model for immediate response |
| **Celery App** | `celery_app.py` | Celery configuration (broker, backend, etc.) |
| **generate_campaign_task** | `tasks.py` | Main background task (Text + Image generation) |
| **TextClient** | (imported from Week 1) | Text generation logic |
| **ImageClient** | (imported from Week 1) | Image generation logic |

### Configuration Options

```python
# In config.py:

# Redis (Message Broker & Result Store)
CELERY_BROKER_URL = "redis://localhost:6379/0"
CELERY_RESULT_BACKEND = "redis://localhost:6379/0"

# Generation Flags
MOCK_GENERATION = False          # If True, skip API calls (for testing)
GENERATE_IMAGES = True           # If False, skip image generation

# Text API (from Week 1)
TEXT_API_KEY = "..."
TEXT_MODEL = "mixtral-8x7b-32768" or "gemini-3.5-flash"
TEXT_LLM_PROVIDER = "groq" or "gemini"

# Image API (from Week 1)
CLOUDFLARE_API_TOKEN = "..."
CLOUDFLARE_ACCOUNT_ID = "..."
CLOUDFLARE_API_TOKEN_2 = "..."  # Optional secondary account
CLOUDFLARE_ACCOUNT_ID_2 = "..."
```

---

## Integration Between Week 1 & Week 2

```
┌────────────────────────────────────────────────────────────┐
│              WEEK 1 ◄────────► WEEK 2                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Week 1 (Sync APIs)              Week 2 (Async Tasks)     │
│  ┌──────────────────┐            ┌──────────────────┐     │
│  │ TextClient       │ ◄─ uses ─│ generate_campaign │     │
│  │ ImageClient      │         │ _task()           │     │
│  │ Prompt Templates │ ◄─ uses ─│                   │     │
│  └──────────────────┘          └──────────────────┘     │
│                                                            │
│  When Week 2 background worker executes:                  │
│  1. Import TextClient from week_1_multimodal_api          │
│  2. Import ImageClient from week_1_multimodal_api         │
│  3. Call text_client.generate_copy() → uses Week 1        │
│  4. Call image_client.generate_image() → uses Week 1      │
│  5. All error handling & fallbacks from Week 1 apply      │
│                                                            │
│  Result: Single synchronous API call (Week 1) becomes     │
│          background task (Week 2) without changing logic  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Scaling Progression

```
Week 1 (Direct)           Week 2 (Queue)           Week 3+ (Planned)
────────────────          ──────────────           ────────────────
Client                    Client                   Client
  │                         │                        │
  ▼                         ▼                        ▼
TextClient              FastAPI /campaign       Dashboard/Batch
  │                         │                        │
  ▼                         ▼                        ▼
Groq API              Celery Worker            Parallel Workers
  │                    (Single process)         (Multi-process)
  ▼                         │                        │
Return                   TextClient              TextClient
(Blocking)               ImageClient             ImageClient
                            │                        │
                            ▼                        ▼
                      Redis Result Store       Database + Cache
                            │
                            ▼
                      Client Polls
                      (Async response)
```

---

## Summary

- **Week 1:** Establishes reusable multimodal API clients with sophisticated fallback chains
- **Week 2:** Wraps Week 1 components in Celery tasks, enabling asynchronous processing at scale
- **Integration:** Week 2 directly imports and uses Week 1 components, building on proven abstractions
- **Error Resilience:** Multi-layer fallbacks ensure reliable content generation despite API failures
- **Scalability:** Async queue foundation enables future parallel processing and dashboard integration (Weeks 3-4)
