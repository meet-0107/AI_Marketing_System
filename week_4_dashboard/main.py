from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from week_4_dashboard.routes import router

app = FastAPI(
    title="AI Marketing Dashboard API",
    description="Production-ready Backend API for the AI Marketing Dashboard with Asynchronous Task Polling.",
    version="1.0.0"
)

# Configure CORS to allow communication with the React/Vite frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (e.g. http://localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes under /api prefix
app.include_router(router, prefix="/api", tags=["dashboard"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("week_4_dashboard.main:app", host="127.0.0.1", port=8000, reload=True)
