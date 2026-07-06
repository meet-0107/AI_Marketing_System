# AI Marketing System

The ai_marketing_system is a multi-modal AI content generation engine designed to streamline digital marketing workflows by processing a single product brief to simultaneously generate platform-optimized copywriting, SEO metadata, and complementary visual assets. Under the hood, it leverages a decoupled, highly scalable architecture combining a modern React frontend with a high-performance Python FastAPI backend. To ensure a seamless user experience without server timeouts, long-running AI API calls are intelligently offloaded to an asynchronous Celery and Redis task queue. Ultimately, this tool acts as a digital force multiplier, drastically reducing campaign creation time while maintaining consistent, multi-platform brand messaging.

---

## 📁 File System Diagram

```
AI_Marketing_System/
│
├── .env
├── .gitignore
├── config.py
├── requirements.txt
├── start_all.py
├── test_system.py
├── response_output.json
├── README.md
├── saved_images/
│
├── week_1_multimodal_api/               ← Multimodal API Integration Layer
│   ├── __init__.py
│   ├── prompt_templates.py
│   ├── text_client.py
│   └── image_client.py
│
├── week_2_async_queue/                  ← Async Task Queue (FastAPI + Celery + Redis)
│   ├── __init__.py
│   ├── celery_app.py
│   ├── tasks.py
│   ├── main.py
│   └── worker.py
│
├── week_3_parallel_execution/           ← Parallel Execution (upcoming)
│
└── week_4_dashboard/                    ← React Frontend Dashboard (upcoming)
```

---

## 📅 Week 1 — Foundation & API Integration

During Week 1, our main goal was to lay a strong foundation.
* Established the backend infrastructure, secured our API keys, and initialized the Redis database.
* Developed the Python services needed to connect with external AI text and image generation models.
* Refined prompt instructions to ensure the generated visual assets match the tone of the marketing copy.

---

## 📅 Week 2 — Async Queue & Stability

During Week 2, our focus shifted to making the system smooth and crash-proof.
* Set up Redis and a background worker to help the system run smoothly and handle more work.
* Updated the system to instantly give a ticket number while heavy AI tasks run in the background.
* Added a new feature to easily check the ticket status to see when the work is finished.

---

## 🏗️ System Architecture


```mermaid
flowchart TD
    A([👤 User / Frontend<br/>React App]) -->|POST /campaign| B

    subgraph API ["⚡ FastAPI  —  main.py"]
        B[POST /campaign<br/>Returns task_id instantly]
        C[GET /status/task_id<br/>Returns progress & result]
    end

    B -->|task.delay| D[(🔴 Redis<br/>Message Broker +<br/>Result Backend)]
    D -->|poll result| C
    C --> A

    D -->|picks up task| E

    subgraph WORKER ["⚙️ Celery Worker  —  tasks.py"]
        E[generate_campaign_task]
        E --> F[Phase 1: TextClient]
        E --> G[Phase 2: ImageClient]
    end

    subgraph TEXT ["✍️ Text Generation"]
        F --> T1[Groq API<br/>primary]
        F --> T2[Gemini API<br/>fallback 1]
        F --> T3[OpenRouter<br/>fallback 2]
    end

    subgraph IMAGE ["🖼️ Image Generation"]
        G --> I1[Cloudflare Workers AI<br/>primary]
        G --> I2[Hugging Face API<br/>fallback 1]
        G --> I3[Local saved_images/<br/>fallback 2]
        G --> I4[Unsplash / Picsum<br/>fallback 3]
    end

    WORKER -->|stores result| D
```

---

## 🛠️ Tools & Technology

| Category | Tool / Technology | Purpose |
|---|---|---|
| **Backend Framework** | FastAPI | High-performance async REST API server |
| **Task Queue** | Celery | Distributed background task processing |
| **Message Broker** | Redis | Task queue broker + result storage |
| **LLM (Primary)** | Groq API | Ultra-fast text generation |
| **LLM (Alternative)** | Google Gemini API | Text generation (gemini-flash / pro) |
| **LLM (Fallback)** | OpenRouter API | Unified gateway to 100+ AI models |
| **Image Gen (Primary)** | Cloudflare Workers AI | FLUX / Stable Diffusion image generation |
| **Image Gen (Fallback)** | Hugging Face Inference API | Text-to-image & image-to-image generation |
| **Frontend** | React + Vite | Interactive campaign dashboard UI |
| **Config Management** | python-dotenv | Environment variable loading from `.env` |
| **Data Validation** | Pydantic | Request/response schema validation |
| **Language** | Python 3.x | Backend logic and API clients |