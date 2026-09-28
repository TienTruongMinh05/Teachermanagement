import os
import sys
import shutil
import tempfile
import signal
import threading
import time
import hmac
import hashlib
import json
import base64
import datetime
import requests
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Header
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import database
import excel_parser

app = FastAPI(title="Hệ thống Quản lý & Giám sát Thời khóa biểu THPT")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication & Session Security
SESSION_SECRET = os.environ.get("SESSION_SECRET", "tkb_nguyenhue_secure_session_key_2026")

def is_auth_active() -> bool:
    if os.environ.get("DESKTOP_MODE", "false").lower() == "true":
        return False
    explicit = os.environ.get("AUTH_ENABLED", "").strip().lower()
    if explicit == "true":
        return True
    if explicit == "false":
        return False
    # Auto-detect web environment (Render, cloud port)
    return bool(os.environ.get("RENDER") or os.environ.get("PORT"))

def create_session_token(user_data: dict, max_age: int = 86400 * 7) -> str:
    payload = {
        "user": user_data,
        "exp": int(time.time()) + max_age
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode('utf-8')).decode('utf-8').rstrip('=')
    sig = hmac.new(SESSION_SECRET.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"

def verify_session_token(token: str) -> Optional[dict]:
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return None
        payload_b64, sig = parts
        expected_sig = hmac.new(SESSION_SECRET.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        padding = '=' * (4 - len(payload_b64) % 4) if len(payload_b64) % 4 != 0 else ''
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + padding).decode('utf-8'))
        if payload.get("exp", 0) < time.time():
            return None
        return payload.get("user")
    except Exception:
        return None

def verify_google_token(credential: str) -> Optional[dict]:
    try:
        resp = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}", timeout=10)
        if resp.status_code != 200:
            return None
        info = resp.json()
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
        if client_id and info.get("aud") != client_id:
            return None
        if str(info.get("email_verified", "")).lower() != "true":
            return None
        return {
            "email": info.get("email", "").lower(),
            "name": info.get("name", "Người dùng Google"),
            "picture": info.get("picture", ""),
            "sub": info.get("sub", "")
        }
    except Exception as e:
        print(f"Lỗi xác thực Google token: {e}")
        return None

def is_email_authorized(email: str) -> bool:
    allowed_emails_str = os.environ.get("ALLOWED_EMAILS", "").strip()
    allowed_domains_str = os.environ.get("ALLOWED_DOMAINS", "ninhthuan.edu.vn").strip()
    
    if allowed_emails_str == "*":
        return True
    if not allowed_emails_str and not allowed_domains_str:
        return True
        
    email = email.lower().strip()
    if allowed_emails_str:
        allowed_list = [e.strip().lower() for e in allowed_emails_str.split(",") if e.strip()]
        if email in allowed_list:
            return True
            
    if allowed_domains_str:
        allowed_domains = [d.strip().lower().lstrip("@") for d in allowed_domains_str.split(",") if d.strip()]
        domain = email.split("@")[-1] if "@" in email else ""
        if domain in allowed_domains:
            return True
            
    return False

# Pydantic models for Auth
class GoogleLoginRequest(BaseModel):
    credential: str

class DemoLoginRequest(BaseModel):
    email: Optional[str] = "giaovien.demo@ninhthuan.edu.vn"
    name: Optional[str] = "Thầy Cô (Demo - Sở GD&ĐT Ninh Thuận)"

# Health check endpoints (for UptimeRobot / Render keep-alive / Monitoring)
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "tkb-thpt-nguyenhue",
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

@app.get("/api/auth/config")
def get_auth_config():
    auth_active = is_auth_active()
    allowed_domains = os.environ.get("ALLOWED_DOMAINS", "ninhthuan.edu.vn").strip()
    return {
        "auth_enabled": auth_active,
        "google_client_id": os.environ.get("GOOGLE_CLIENT_ID", "").strip(),
        "allow_demo_login": os.environ.get("ALLOW_DEMO_LOGIN", "true").lower() == "true",
        "allowed_domains": allowed_domains,
        "is_web": bool(os.environ.get("RENDER") or os.environ.get("PORT")),
        "school_name": "TRƯỜNG THPT NGUYỄN HUỆ"
    }

@app.post("/api/auth/google")
def auth_google(payload: GoogleLoginRequest):
    if not is_auth_active():
        return {
            "success": True,
            "token": "desktop-bypass-token",
            "user": {"name": "Ban Giám Hiệu", "email": "admin@local", "picture": ""}
        }
    user_info = verify_google_token(payload.credential)
    if not user_info:
        raise HTTPException(status_code=401, detail="Xác thực tài khoản Google không thành công hoặc token đã hết hạn.")
    
    if not is_email_authorized(user_info["email"]):
        raise HTTPException(
            status_code=403,
            detail=f"Email '{user_info['email']}' không thuộc tên miền ngành Giáo dục Ninh Thuận (@ninhthuan.edu.vn). Vui lòng đăng nhập bằng email công vụ do ngành/trường cấp."
        )
    
    token = create_session_token(user_info)
    return {
        "success": True,
        "token": token,
        "user": user_info
    }

@app.post("/api/auth/demo-login")
def auth_demo(payload: DemoLoginRequest):
    allow_demo = os.environ.get("ALLOW_DEMO_LOGIN", "true").lower() == "true"
    if not allow_demo and is_auth_active():
        raise HTTPException(status_code=403, detail="Chế độ đăng nhập thử nghiệm đã tắt trên máy chủ này.")
    
    demo_user = {
        "email": payload.email.lower() if payload.email else "giaovien.demo@thptnguyenhue.edu.vn",
        "name": payload.name or "Thầy Cô Giáo Viên (Demo)",
        "picture": "",
        "sub": "demo-user-id"
    }
    token = create_session_token(demo_user)
    return {
        "success": True,
        "token": token,
        "user": demo_user
    }

@app.get("/api/auth/me")
def auth_me(authorization: Optional[str] = Header(None)):
    if not is_auth_active():
        return {"authenticated": True, "user": {"name": "Ban Giám Hiệu", "email": "admin@local", "picture": ""}}
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Chưa đăng nhập.")
    
    token = authorization.split("Bearer ")[1].strip()
    user = verify_session_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập đã hết hạn hoặc không hợp lệ.")
    return {"authenticated": True, "user": user}

@app.post("/api/shutdown")
def shutdown_server():
    """Tắt máy chủ an toàn theo yêu cầu của người dùng"""
    if os.environ.get("RENDER") or os.environ.get("PORT"):
        raise HTTPException(status_code=403, detail="Tính năng tắt máy chủ chỉ áp dụng trên phần mềm máy tính.")
    def do_exit():
        time.sleep(0.6)
        os.kill(os.getpid(), signal.SIGINT)
    threading.Thread(target=do_exit, daemon=True).start()
    return {"success": True, "message": "Máy chủ đang tắt an toàn..."}

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def get_data_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    cur_dir = os.path.dirname(os.path.abspath(__file__))
    if os.path.exists(os.path.join(cur_dir, "tkb_database.db")):
        return cur_dir
    parent_dir = os.path.dirname(cur_dir)
    if os.path.exists(os.path.join(parent_dir, "tkb_database.db")):
        return parent_dir
    return cur_dir

# Configure DB path
database.DB_PATH = os.path.join(get_data_dir(), "tkb_database.db")

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    database.init_db()
    # Check if DB has data, if not load from TKB-21092026.xlsx
    conn = database.get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as cnt FROM teachers")
    count = c.fetchone()['cnt']
    conn.close()
    
    init_file = os.path.join(get_data_dir(), "TKB-21092026.xlsx")
    if not os.path.exists(init_file):
        init_file = os.path.join(get_base_dir(), "TKB-21092026.xlsx")

    if count == 0 and os.path.exists(init_file):
        try:
            print(f"Loading initial data from {init_file}...")
            data = excel_parser.parse_timetable_file(init_file)
            database.save_timetable_data(data)
            print("Initial data loaded successfully.")
        except Exception as e:
            print(f"Failed to load initial data: {e}")

# API: Status & Realtime
@app.get("/api/status")
def get_status():
    period_info = database.determine_current_period()
    day = period_info['day_of_week']
    session = period_info['session']
    period = period_info['period']
    is_school_time = period_info['is_school_time']
    
    teachers = database.get_teachers_status_at(day, session, period, is_school_time=is_school_time)
    counts = {
        'total': len(teachers),
        'teaching': sum(1 for t in teachers if t['status_code'] == 'teaching'),
        'free': sum(1 for t in teachers if t['status_code'] == 'free'),
        'salute': sum(1 for t in teachers if t['status_code'] == 'salute'),
        'special': sum(1 for t in teachers if t['status_code'] == 'special')
    }
    
    classes_res = database.get_classes_status_at(day, session, period, is_school_time=is_school_time)
    
    return {
        'period_info': period_info,
        'counts': counts,
        'class_counts': classes_res['counts']
    }

# API: Teachers list
@app.get("/api/teachers")
def get_teachers(
    mode: str = Query("realtime", description="realtime or custom"),
    day: Optional[int] = Query(None, description="2..7"),
    session: Optional[str] = Query(None, description="sang or chieu"),
    period: Optional[int] = Query(None, description="1..5"),
    search: str = Query("", description="search name"),
    subject: str = Query("all", description="subject filter"),
    class_name: str = Query("all", description="class filter"),
    status: str = Query("all", description="status filter")
):
    cur = database.determine_current_period()
    if mode == "realtime":
        target_day = cur['day_of_week']
        target_session = cur['session']
        target_period = cur['period']
        is_school_time = cur['is_school_time']
    else:
        target_day = day if day and 2 <= day <= 7 else 2
        target_session = session if session in ['sang', 'chieu'] else 'sang'
        target_period = period if period and 1 <= period <= 5 else 1
        is_school_time = True

    teachers = database.get_teachers_status_at(
        day_of_week=target_day,
        session=target_session,
        period=target_period,
        search=search,
        subject_filter=subject,
        status_filter=status,
        class_filter=class_name,
        is_school_time=is_school_time
    )
    
    # Calculate summary counts for this specific view (unfiltered by search/status for tabs)
    if not is_school_time or target_day > 7 or not target_session or not target_period:
        all_teachers_raw = database.get_teachers_status_at(
            target_day, target_session, target_period,
            class_filter=class_name if class_name != 'all' else "",
            subject_filter=subject if subject != 'all' else "",
            is_school_time=False
        )
        counts = {
            'total': len(all_teachers_raw),
            'teaching': 0,
            'free': len(all_teachers_raw),
            'salute': 0,
            'special': 0,
            'homeroom': sum(1 for t in all_teachers_raw if t['homeroom_class'])
        }
    else:
        all_at_time = database.get_teachers_status_at(
            target_day, target_session, target_period,
            class_filter=class_name if class_name != 'all' else "",
            subject_filter=subject if subject != 'all' else "",
            is_school_time=True
        )
        counts = {
            'total': len(all_at_time),
            'teaching': sum(1 for t in all_at_time if t['status_code'] == 'teaching'),
            'free': sum(1 for t in all_at_time if t['status_code'] == 'free'),
            'salute': sum(1 for t in all_at_time if t['status_code'] == 'salute'),
            'special': sum(1 for t in all_at_time if t['status_code'] == 'special'),
            'homeroom': sum(1 for t in all_at_time if t['homeroom_class'])
        }
    
    day_names = {2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật'}
    session_names = {'sang': 'Buổi Sáng', 'chieu': 'Buổi Chiều'}
    
    if target_session and target_period:
        period_label = f"Tiết {target_period} ({session_names.get(target_session, '')})"
    else:
        period_label = cur.get('period_label', 'Ngoài giờ học')
    
    return {
        'target_time': {
            'day': target_day,
            'day_name': day_names.get(target_day, f"Thứ {target_day}"),
            'session': target_session,
            'session_name': session_names.get(target_session, target_session or ''),
            'period': target_period,
            'period_label': period_label,
            'is_school_time': is_school_time
        },
        'counts': counts,
        'teachers': teachers
    }

# API: Classes list & status
@app.get("/api/classes/status")
def get_classes_status_api(
    mode: str = Query("realtime", description="realtime or custom"),
    day: Optional[int] = Query(None, description="2..7"),
    session: Optional[str] = Query(None, description="sang or chieu"),
    period: Optional[int] = Query(None, description="1..5"),
    search: str = Query("", description="search class/subject/teacher"),
    grade: str = Query("all", description="grade 10/11/12 or all"),
    subject: str = Query("all", description="subject filter"),
    homeroom: str = Query("all", description="homeroom teacher filter"),
    status: str = Query("all", description="status filter: all, learning, free, special")
):
    cur = database.determine_current_period()
    if mode == "realtime":
        target_day = cur['day_of_week']
        target_session = cur['session']
        target_period = cur['period']
        is_school_time = cur['is_school_time']
    else:
        target_day = day if day and 2 <= day <= 7 else 2
        target_session = session if session in ['sang', 'chieu'] else 'sang'
        target_period = period if period and 1 <= period <= 5 else 1
        is_school_time = True

    res = database.get_classes_status_at(
        day_of_week=target_day,
        session=target_session,
        period=target_period,
        search=search,
        grade_filter=grade,
        subject_filter=subject,
        homeroom_filter=homeroom,
        status_filter=status,
        is_school_time=is_school_time
    )
    
    day_names = {2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật'}
    session_names = {'sang': 'Buổi Sáng', 'chieu': 'Buổi Chiều'}
    
    if target_session and target_period:
        period_label = f"Tiết {target_period} ({session_names.get(target_session, '')})"
    else:
        period_label = cur.get('period_label', 'Ngoài giờ học')

    return {
        'target_time': {
            'day': target_day,
            'day_name': day_names.get(target_day, f"Thứ {target_day}"),
            'session': target_session,
            'session_name': session_names.get(target_session, target_session or ''),
            'period': target_period,
            'period_label': period_label,
            'is_school_time': is_school_time
        },
        'counts': res['counts'],
        'classes': res['classes']
    }

# API: Single Class schedule
@app.get("/api/class/{class_name}/schedule")
def get_class_schedule_api(class_name: str):
    res = database.get_class_schedule(class_name)
    if not res:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin lớp học")
    return res

# API: Classes Matrix
@app.get("/api/classes/matrix")
def get_classes_matrix_api():
    return database.get_classes_matrix()

# API: Classes Cell Detail
@app.get("/api/classes/matrix/cell")
def get_class_cell_detail_api(
    day: int = Query(..., ge=2, le=7),
    session: str = Query(..., pattern="^(sang|chieu)$"),
    period: int = Query(..., ge=1, le=5)
):
    return database.get_class_cell_details(day, session, period)

# API: Homeroom Teachers list for filter
@app.get("/api/homeroom-teachers")
def get_homeroom_teachers_api():
    return database.get_homeroom_teachers_list()

# API: Class Subjects
@app.get("/api/class-subjects")
def get_class_subjects_api():
    return database.get_class_subjects()

# API: Matrix
@app.get("/api/matrix")
def get_matrix():
    return database.get_timetable_matrix()

# API: Cell detail
@app.get("/api/matrix/cell")
def get_cell_detail(
    day: int = Query(..., ge=2, le=7),
    session: str = Query(..., pattern="^(sang|chieu)$"),
    period: int = Query(..., ge=1, le=5)
):
    return database.get_cell_details(day, session, period)

# API: Teacher schedule
@app.get("/api/teacher/{teacher_id}/schedule")
def get_teacher_schedule(teacher_id: int):
    res = database.get_teacher_schedule(teacher_id)
    if not res:
        raise HTTPException(status_code=404, detail="Không tìm thấy giáo viên")
    return res

class UpdatePhoneRequest(BaseModel):
    phone: str

@app.post("/api/teacher/{teacher_id}/phone")
def update_teacher_phone_api(teacher_id: int, req: UpdatePhoneRequest):
    try:
        database.update_teacher_phone(teacher_id, req.phone)
        return {"success": True, "message": "Cập nhật số điện thoại thành công!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# API: Subjects
@app.get("/api/subjects")
def get_subjects():
    return database.get_subject_groups()

# API: Classes
@app.get("/api/classes")
def get_classes():
    return database.get_classes_list()

# API: Metadata
@app.get("/api/metadata")
def get_metadata():
    return database.get_metadata()

# API: Bell schedule
@app.get("/api/bell-schedule")
def get_bell_schedule():
    return database.get_bell_schedule()

class BellScheduleItem(BaseModel):
    session: str
    period: int
    start_time: str
    end_time: str
    label: Optional[str] = ""

@app.post("/api/bell-schedule")
def update_bell_schedule(items: List[BellScheduleItem]):
    try:
        dict_items = [item.dict() for item in items]
        database.update_bell_schedule(dict_items)
        return {"success": True, "message": "Cập nhật toàn bộ khung giờ thành công!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bell-schedule/period")
def update_single_bell_schedule(item: BellScheduleItem):
    try:
        dict_item = item.dict()
        if not dict_item.get('label'):
            s_name = 'Sáng' if dict_item['session'] == 'sang' else 'Chiều'
            dict_item['label'] = f"Tiết {dict_item['period']} {s_name}"
        database.update_bell_schedule([dict_item])
        return {"success": True, "message": f"Cập nhật khung giờ {dict_item['label']} ({dict_item['start_time']} - {dict_item['end_time']}) thành công!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bell-schedule/reset")
def reset_bell_schedule():
    try:
        database.reset_bell_schedule_to_default()
        return {"success": True, "message": "Đã khôi phục khung giờ chuẩn mặc định thành công!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# API: Upload Excel
@app.post("/api/upload")
async def upload_timetable_file(file: UploadFile = File(...)):
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file định dạng Excel (.xlsx, .xls)")
        
    # Save temporary file
    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, file.filename)
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse Excel
        parsed_data = excel_parser.parse_timetable_file(temp_file_path)
        
        if not parsed_data['teachers']:
            raise HTTPException(status_code=400, detail="Không tìm thấy danh sách giáo viên hoặc bảng thời khóa biểu có từ khóa hợp lệ trong file Excel")
            
        # Save to database
        database.save_timetable_data(parsed_data)
        
        # Also backup as current TKB file
        backup_path = "TKB_HIENTHOI.xlsx"
        shutil.copyfile(temp_file_path, backup_path)
        
        return {
            "success": True,
            "message": f"Nạp file thành công! Đã cập nhật {len(parsed_data['teachers'])} giáo viên và {len(parsed_data['entries'])} tiết dạy.",
            "metadata": parsed_data['metadata'],
            "teachers_count": len(parsed_data['teachers']),
            "entries_count": len(parsed_data['entries']),
            "classes_count": len(parsed_data['classes'])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi đọc file: {str(e)}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

# Mount static files
static_dir = os.path.join(get_base_dir(), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
