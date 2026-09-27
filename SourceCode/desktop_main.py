import os
import sys
import threading
import time
import uvicorn
import webview
from app import app
import database

def get_data_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if os.path.exists(os.path.join(parent_dir, "tkb_database.db")):
        return parent_dir
    return os.path.dirname(os.path.abspath(__file__))

# Configure DB path to remain beside the executable
database.DB_PATH = os.path.join(get_data_dir(), "tkb_database.db")

def run_uvicorn():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

if __name__ == "__main__":
    os.environ["DESKTOP_MODE"] = "true"
    # Start FastAPI server in a daemon thread
    server_thread = threading.Thread(target=run_uvicorn, daemon=True)
    server_thread.start()
    time.sleep(1.2)

    # Launch Native Windows Desktop Window (Cách 2)
    window = webview.create_window(
        title="TRƯỜNG THPT NGUYỄN HUỆ - GIÁM SÁT THỜI KHÓA BIỂU",
        url="http://127.0.0.1:8000",
        width=1280,
        height=820,
        min_size=(1024, 700),
        confirm_close=False
    )
    
    webview.start()
    os._exit(0)
