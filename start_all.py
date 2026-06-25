import subprocess
import sys
import time
import os

def start_services():
    print("🚀 STARTING ALL AI MARKETING SYSTEM SERVICES...")
    
    python_exe = sys.executable
    base_dir = os.path.abspath(os.path.dirname(__file__))
    
    # 1. Start Celery Worker
    print("⏳ Starting Celery Worker...")
    celery_cmd = [python_exe, "-m", "celery", "-A", "week_2_async_queue.celery_app.celery_app", "worker", "--loglevel=info", "-P", "solo"]
    celery_process = subprocess.Popen(celery_cmd, cwd=base_dir)
    time.sleep(2)
    
    # 2. Start FastAPI Backend
    print("⏳ Starting FastAPI Backend Server (Port 8000)...")
    uvicorn_cmd = [python_exe, "-m", "uvicorn", "week_4_dashboard.main:app", "--reload"]
    uvicorn_process = subprocess.Popen(uvicorn_cmd, cwd=base_dir)
    time.sleep(2)
    
    # 3. Start React Frontend
    print("⏳ Starting React Frontend Server (Vite Port 5173)...")
    frontend_dir = os.path.join(base_dir, "week_4_dashboard", "frontend")
    frontend_process = subprocess.Popen("npm run dev", shell=True, cwd=frontend_dir)
    
    print("\n" + "="*60)
    print("🎉 ALL SERVICES RUNNING SUCCESSFULLY!")
    print("👉 Dashboard URL: http://localhost:5173")
    print("👉 FastAPI Docs:  http://127.0.0.1:8000/docs")
    print("Press Ctrl+C to shut down all services.")
    print("="*60 + "\n")
    
    try:
        celery_process.wait()
        uvicorn_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 SHUTTING DOWN ALL SERVICES...")
        celery_process.terminate()
        uvicorn_process.terminate()
        frontend_process.terminate()
        print("✅ All services stopped cleanly.")

if __name__ == "__main__":
    start_services()
