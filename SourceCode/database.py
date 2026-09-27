import sqlite3
import datetime
import os
import re
from typing import List, Dict, Any, Optional

def _resolve_db_path():
    parent_db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'tkb_database.db')
    if os.path.exists(parent_db):
        return parent_db
    local_db = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tkb_database.db')
    if os.path.exists(local_db):
        return local_db
    return 'tkb_database.db'

DB_PATH = _resolve_db_path()

DEFAULT_BELL_SCHEDULE = [
    # Buổi Sáng
    {'session': 'sang', 'period': 1, 'start_time': '07:00', 'end_time': '07:45', 'label': 'Tiết 1 Sáng'},
    {'session': 'sang', 'period': 2, 'start_time': '07:50', 'end_time': '08:35', 'label': 'Tiết 2 Sáng'},
    {'session': 'sang', 'period': 3, 'start_time': '08:55', 'end_time': '09:40', 'label': 'Tiết 3 Sáng'},
    {'session': 'sang', 'period': 4, 'start_time': '09:45', 'end_time': '10:30', 'label': 'Tiết 4 Sáng'},
    {'session': 'sang', 'period': 5, 'start_time': '10:35', 'end_time': '11:20', 'label': 'Tiết 5 Sáng'},
    # Buổi Chiều
    {'session': 'chieu', 'period': 1, 'start_time': '13:15', 'end_time': '14:00', 'label': 'Tiết 1 Chiều'},
    {'session': 'chieu', 'period': 2, 'start_time': '14:05', 'end_time': '14:50', 'label': 'Tiết 2 Chiều'},
    {'session': 'chieu', 'period': 3, 'start_time': '15:10', 'end_time': '15:55', 'label': 'Tiết 3 Chiều'},
    {'session': 'chieu', 'period': 4, 'start_time': '16:00', 'end_time': '16:45', 'label': 'Tiết 4 Chiều'},
    {'session': 'chieu', 'period': 5, 'start_time': '16:50', 'end_time': '17:35', 'label': 'Tiết 5 Chiều'},
]

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Metadata
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    ''')
    
    # 2. Bell schedule
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS bell_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session TEXT,
        period INTEGER,
        start_time TEXT,
        end_time TEXT,
        label TEXT,
        UNIQUE(session, period)
    )
    ''')
    
    # 3. Teachers
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tt INTEGER,
        full_name TEXT NOT NULL,
        short_name TEXT,
        phone TEXT DEFAULT '',
        homeroom_class TEXT,
        kiem_nhiem TEXT,
        subject_group TEXT,
        details TEXT,
        periods_count INTEGER DEFAULT 0
    )
    ''')
    
    # Check if phone column exists (migration)
    cursor.execute("PRAGMA table_info(teachers)")
    cols = [r['name'] for r in cursor.fetchall()]
    if 'phone' not in cols:
        cursor.execute("ALTER TABLE teachers ADD COLUMN phone TEXT DEFAULT ''")
    
    # 4. Classes
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        full_label TEXT,
        grade TEXT,
        shift TEXT,
        homeroom_teacher TEXT
    )
    ''')
    
    # 5. Timetable entries
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS timetable_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER,
        teacher_short_name TEXT,
        day_of_week INTEGER,
        session TEXT,
        period INTEGER,
        cell_text TEXT,
        subject TEXT,
        class_name TEXT,
        activity_type TEXT,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    )
    ''')
    
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_entry_lookup ON timetable_entries(day_of_week, session, period)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_entry_teacher ON timetable_entries(teacher_id)')
    
    # Seed default bell schedule if not exists
    cursor.execute('SELECT COUNT(*) as cnt FROM bell_schedule')
    if cursor.fetchone()['cnt'] == 0:
        for b in DEFAULT_BELL_SCHEDULE:
            cursor.execute('''
            INSERT INTO bell_schedule (session, period, start_time, end_time, label)
            VALUES (?, ?, ?, ?, ?)
            ''', (b['session'], b['period'], b['start_time'], b['end_time'], b['label']))
            
    conn.commit()
    conn.close()

def save_timetable_data(data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Save metadata
        for k, v in data.get('metadata', {}).items():
            cursor.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', (k, str(v)))
            
        cursor.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', 
                       ('last_updated', datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
        
        # Preserve existing phone numbers if any
        cursor.execute('SELECT full_name, phone FROM teachers WHERE phone IS NOT NULL AND phone != ""')
        existing_phones = {r['full_name']: r['phone'] for r in cursor.fetchall()}
        
        # Clear existing teachers, classes, and entries
        cursor.execute('DELETE FROM timetable_entries')
        cursor.execute('DELETE FROM classes')
        cursor.execute('DELETE FROM teachers')
        
        # Insert teachers
        short_to_id = {}
        for t in data.get('teachers', []):
            phone = t.get('phone') or existing_phones.get(t.get('full_name')) or ""
            cursor.execute('''
            INSERT INTO teachers (tt, full_name, short_name, phone, homeroom_class, kiem_nhiem, subject_group, details, periods_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                t.get('tt'),
                t.get('full_name'),
                t.get('short_name'),
                phone,
                t.get('homeroom_class'),
                t.get('kiem_nhiem'),
                t.get('subject_group'),
                t.get('details'),
                t.get('periods_count', 0)
            ))
            t_id = cursor.lastrowid
            if t.get('short_name'):
                short_to_id[t['short_name']] = t_id
            short_to_id[t['full_name']] = t_id
            
        # Insert classes
        for c in data.get('classes', []):
            cursor.execute('''
            INSERT OR IGNORE INTO classes (name, full_label, grade, shift, homeroom_teacher)
            VALUES (?, ?, ?, ?, ?)
            ''', (
                c.get('name'),
                c.get('full_label'),
                c.get('grade'),
                c.get('shift'),
                c.get('homeroom_teacher')
            ))
            
        # Insert timetable entries
        for e in data.get('entries', []):
            t_id = short_to_id.get(e.get('teacher_short_name')) or short_to_id.get(e.get('teacher_full_name'))
            cursor.execute('''
            INSERT INTO timetable_entries (teacher_id, teacher_short_name, day_of_week, session, period, cell_text, subject, class_name, activity_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                t_id,
                e.get('teacher_short_name'),
                e.get('day_of_week'),
                e.get('session'),
                e.get('period'),
                e.get('cell_text'),
                e.get('subject'),
                e.get('class_name'),
                e.get('activity_type')
            ))
            
        conn.commit()
    except Exception as ex:
        conn.rollback()
        raise ex
    finally:
        conn.close()

def get_bell_schedule() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT session, period, start_time, end_time, label FROM bell_schedule ORDER BY session DESC, period ASC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_bell_schedule(items: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    for item in items:
        cursor.execute('''
        UPDATE bell_schedule 
        SET start_time = ?, end_time = ?, label = ?
        WHERE session = ? AND period = ?
        ''', (item['start_time'], item['end_time'], item.get('label', ''), item['session'], item['period']))
    conn.commit()
    conn.close()

def reset_bell_schedule_to_default():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM bell_schedule')
    for b in DEFAULT_BELL_SCHEDULE:
        cursor.execute('''
        INSERT INTO bell_schedule (session, period, start_time, end_time, label)
        VALUES (?, ?, ?, ?, ?)
        ''', (b['session'], b['period'], b['start_time'], b['end_time'], b['label']))
    conn.commit()
    conn.close()

def determine_current_period(dt: Optional[datetime.datetime] = None) -> Dict[str, Any]:
    """
    Determine what period is currently active based on current time or provided datetime.
    Day of week: Monday=2, Tuesday=3, ..., Saturday=7, Sunday=8.
    """
    if dt is None:
        dt = datetime.datetime.now()
        
    weekday = dt.weekday() # 0 = Monday, ..., 5 = Saturday, 6 = Sunday
    vn_day = weekday + 2   # 2 = Thứ 2, ..., 7 = Thứ 7, 8 = Chủ nhật
    time_str = dt.strftime('%H:%M')
    date_str = dt.strftime('%d/%m/%Y')
    
    day_names = {
        2: 'Thứ Hai',
        3: 'Thứ Ba',
        4: 'Thứ Tư',
        5: 'Thứ Năm',
        6: 'Thứ Sáu',
        7: 'Thứ Bảy',
        8: 'Chủ nhật'
    }
    day_name = day_names.get(vn_day, f"Thứ {vn_day}")
    
    # Chủ nhật - Toàn trường nghỉ học
    if vn_day > 7:
        return {
            'is_school_time': False,
            'status_label': 'Chủ nhật - Toàn trường nghỉ',
            'day_of_week': 8,
            'day_name': 'Chủ nhật',
            'date_str': date_str,
            'session': None,
            'period': None,
            'time_str': time_str,
            'period_label': 'Nghỉ Chủ nhật'
        }
        
    schedules = get_bell_schedule()
    morning_scheds = [s for s in schedules if s['session'] == 'sang']
    afternoon_scheds = [s for s in schedules if s['session'] == 'chieu']
    
    # 1. Kiểm tra chính xác trong tiết học
    for b in schedules:
        if b['start_time'] <= time_str <= b['end_time']:
            return {
                'is_school_time': True,
                'status_label': f"Đang học: {b['label']} ({b['start_time']} - {b['end_time']})",
                'day_of_week': vn_day,
                'day_name': day_name,
                'date_str': date_str,
                'session': b['session'],
                'period': b['period'],
                'time_str': time_str,
                'period_label': b['label']
            }
            
    # 2. Trước giờ học buổi Sáng
    if morning_scheds and time_str < morning_scheds[0]['start_time']:
        return {
            'is_school_time': False,
            'status_label': f"Chưa vào học buổi Sáng (Bắt đầu lúc {morning_scheds[0]['start_time']})",
            'day_of_week': vn_day,
            'day_name': day_name,
            'date_str': date_str,
            'session': None,
            'period': None,
            'upcoming_session': 'sang',
            'upcoming_period': 1,
            'time_str': time_str,
            'period_label': 'Chưa vào giờ học'
        }
        
    # 3. Giờ nghỉ trưa (giữa Tiết 5 Sáng và Tiết 1 Chiều)
    if morning_scheds and afternoon_scheds and morning_scheds[-1]['end_time'] < time_str < afternoon_scheds[0]['start_time']:
        return {
            'is_school_time': False,
            'status_label': f"Giờ nghỉ trưa (Buổi Chiều bắt đầu lúc {afternoon_scheds[0]['start_time']})",
            'day_of_week': vn_day,
            'day_name': day_name,
            'date_str': date_str,
            'session': None,
            'period': None,
            'upcoming_session': 'chieu',
            'upcoming_period': 1,
            'time_str': time_str,
            'period_label': 'Nghỉ trưa'
        }
        
    # 4. Sau khi kết thúc buổi học chiều (hết giờ học, ban đêm)
    if afternoon_scheds and time_str > afternoon_scheds[-1]['end_time']:
        return {
            'is_school_time': False,
            'status_label': f"Đã kết thúc buổi học chiều (Sau {afternoon_scheds[-1]['end_time']}) - Hết giờ dạy",
            'day_of_week': vn_day,
            'day_name': day_name,
            'date_str': date_str,
            'session': None,
            'period': None,
            'time_str': time_str,
            'period_label': 'Đã hết giờ học'
        }
        
    # 5. Giờ ra chơi buổi Sáng
    for i in range(len(morning_scheds) - 1):
        if morning_scheds[i]['end_time'] < time_str < morning_scheds[i+1]['start_time']:
            return {
                'is_school_time': False,
                'status_label': f"Giờ ra chơi buổi Sáng ({morning_scheds[i]['end_time']} - {morning_scheds[i+1]['start_time']})",
                'day_of_week': vn_day,
                'day_name': day_name,
                'date_str': date_str,
                'session': None,
                'period': None,
                'upcoming_session': 'sang',
                'upcoming_period': morning_scheds[i+1]['period'],
                'time_str': time_str,
                'period_label': f"Ra chơi (Sắp vào Tiết {morning_scheds[i+1]['period']})"
            }
            
    # 6. Giờ ra chơi buổi Chiều
    for i in range(len(afternoon_scheds) - 1):
        if afternoon_scheds[i]['end_time'] < time_str < afternoon_scheds[i+1]['start_time']:
            return {
                'is_school_time': False,
                'status_label': f"Giờ ra chơi buổi Chiều ({afternoon_scheds[i]['end_time']} - {afternoon_scheds[i+1]['start_time']})",
                'day_of_week': vn_day,
                'day_name': day_name,
                'date_str': date_str,
                'session': None,
                'period': None,
                'upcoming_session': 'chieu',
                'upcoming_period': afternoon_scheds[i+1]['period'],
                'time_str': time_str,
                'period_label': f"Ra chơi (Sắp vào Tiết {afternoon_scheds[i+1]['period']})"
            }

    return {
        'is_school_time': False,
        'status_label': 'Ngoài khung giờ học',
        'day_of_week': vn_day,
        'day_name': day_name,
        'date_str': date_str,
        'session': None,
        'period': None,
        'time_str': time_str,
        'period_label': 'Ngoài giờ học'
    }

def get_teachers_status_at(
    day_of_week: int,
    session: Optional[str],
    period: Optional[int],
    search: str = "",
    subject_filter: str = "",
    status_filter: str = "",
    class_filter: str = "",
    is_school_time: bool = True
) -> List[Dict[str, Any]]:
    """
    Get all teachers with their activity at the specified (day, session, period).
    If is_school_time is False, all teachers are on off-duty/free status (teaching count is 0).
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # If outside school time or Sunday or session/period is None
    if not is_school_time or day_of_week > 7 or not session or not period:
        cursor.execute('''
        SELECT id, tt, full_name, short_name, phone, homeroom_class, kiem_nhiem, subject_group, details, periods_count
        FROM teachers
        ORDER BY tt ASC
        ''')
        rows = cursor.fetchall()
        conn.close()
        
        off_label = 'Chủ nhật - Ngày nghỉ toàn trường' if day_of_week > 7 else 'Ngoài giờ học / Hết giờ dạy'
        teachers = []
        for r in rows:
            cf = class_filter.strip().lower() if class_filter and class_filter != 'all' else None
            is_homeroom_of_this_class = False
            is_subject_teacher_of_this_class = False
            if cf:
                is_homeroom_of_this_class = (r['homeroom_class'] or '').lower() == cf
                is_subject_teacher_of_this_class = bool(re.search(r'\b' + re.escape(cf) + r'\b', (r['details'] or '').lower()))
                if not (is_homeroom_of_this_class or is_subject_teacher_of_this_class):
                    continue
                    
            t_dict = {
                'id': r['id'],
                'tt': r['tt'],
                'full_name': r['full_name'],
                'short_name': r['short_name'],
                'phone': r['phone'] or '',
                'homeroom_class': r['homeroom_class'],
                'kiem_nhiem': r['kiem_nhiem'],
                'subject_group': r['subject_group'],
                'details': r['details'],
                'periods_count': r['periods_count'],
                'status_code': 'free',
                'status_label': off_label,
                'color_border': 'border-red',
                'badge_color': 'badge-red',
                'current_subject': '',
                'current_class': '',
                'cell_text': ''
            }
            
            # Filters
            if search:
                kw = search.lower().strip()
                clean_phone = (t_dict['phone'] or '').replace(' ', '')
                if (kw not in t_dict['full_name'].lower() and 
                    kw not in (t_dict['short_name'] or '').lower() and
                    kw not in clean_phone and
                    kw not in (t_dict['phone'] or '')):
                    continue
                    
            if subject_filter and subject_filter != 'all':
                if t_dict['subject_group'] != subject_filter:
                    continue
                    
            if status_filter and status_filter != 'all':
                if status_filter == 'teaching':
                    continue # outside school hours, 0 teachers teaching
                elif status_filter == 'homeroom':
                    if cf:
                        if not is_homeroom_of_this_class:
                            continue
                    else:
                        if not t_dict['homeroom_class']:
                            continue
                elif status_filter == 'special':
                    continue
                    
            teachers.append(t_dict)
        return teachers

    # In school time
    query = '''
    SELECT 
        t.id, t.tt, t.full_name, t.short_name, t.phone, t.homeroom_class, t.kiem_nhiem, 
        t.subject_group, t.details, t.periods_count,
        e.activity_type, e.cell_text, e.subject, e.class_name
    FROM teachers t
    LEFT JOIN timetable_entries e 
        ON t.id = e.teacher_id 
        AND e.day_of_week = ? 
        AND e.session = ? 
        AND e.period = ?
    ORDER BY t.tt ASC
    '''
    cursor.execute(query, (day_of_week, session, period))
    rows = cursor.fetchall()
    conn.close()
    
    teachers = []
    for r in rows:
        act = r['activity_type'] or 'free'
        cell_txt = r['cell_text'] or ''
        
        # Color coding & status determination:
        cf = class_filter.strip().lower() if class_filter and class_filter != 'all' else None
        
        is_teaching_this_class = False
        is_homeroom_of_this_class = False
        is_subject_teacher_of_this_class = False
        
        if cf:
            is_teaching_this_class = (r['class_name'] or '').lower() == cf
            is_homeroom_of_this_class = (r['homeroom_class'] or '').lower() == cf
            is_subject_teacher_of_this_class = bool(re.search(r'\b' + re.escape(cf) + r'\b', (r['details'] or '').lower()))
            
            # If filtering by a specific class and teacher has no relationship to this class, skip immediately
            if not (is_teaching_this_class or is_homeroom_of_this_class or is_subject_teacher_of_this_class):
                continue
                
            if is_teaching_this_class:
                status_code = 'teaching'
                status_label = f"Đang trực tiếp dạy {class_filter}: {r['subject']}"
                color_border = 'border-green'
                badge_color = 'badge-green'
            elif act == 'teaching':
                # Teacher teaches a subject for this class, but at this moment is teaching ANOTHER class
                status_code = 'other_class'
                status_label = f"Đang dạy lớp khác: {r['subject']} - {r['class_name']}"
                color_border = 'border-slate'
                badge_color = 'badge-slate'
            elif is_homeroom_of_this_class and (not cell_txt or act == 'free'):
                status_code = 'free'
                status_label = f"GVCN lớp {class_filter} (Đang rảnh)"
                color_border = 'border-red'
                badge_color = 'badge-red'
            elif not cell_txt or act == 'free':
                status_code = 'free'
                status_label = 'Không có tiết / Đang rảnh'
                color_border = 'border-red'
                badge_color = 'badge-red'
            elif act == 'salute':
                status_code = 'salute'
                status_label = 'Chào cờ toàn trường'
                color_border = 'border-yellow'
                badge_color = 'badge-yellow'
            elif act == 'special':
                status_code = 'special'
                status_label = cell_txt
                color_border = 'border-orange'
                badge_color = 'badge-orange'
            else:
                status_code = 'free'
                status_label = 'Không có tiết'
                color_border = 'border-red'
                badge_color = 'badge-red'
        else:
            status_code = act
            if not cell_txt:
                status_code = 'free'
                status_label = 'Không có tiết / Đang rảnh'
                color_border = 'border-red'
                badge_color = 'badge-red'
            elif act == 'salute':
                status_code = 'salute'
                status_label = 'Chào cờ toàn trường'
                color_border = 'border-yellow'
                badge_color = 'badge-yellow'
            elif act == 'special':
                status_code = 'special'
                status_label = cell_txt
                color_border = 'border-orange'
                badge_color = 'badge-orange'
            elif act == 'teaching':
                status_code = 'teaching'
                status_label = f"Đang dạy: {r['subject']} - {r['class_name']}"
                color_border = 'border-green'
                badge_color = 'badge-green'
            else:
                status_code = 'free'
                status_label = 'Không có tiết'
                color_border = 'border-red'
                badge_color = 'badge-red'
            
        t_dict = {
            'id': r['id'],
            'tt': r['tt'],
            'full_name': r['full_name'],
            'short_name': r['short_name'],
            'phone': r['phone'] or '',
            'homeroom_class': r['homeroom_class'],
            'kiem_nhiem': r['kiem_nhiem'],
            'subject_group': r['subject_group'],
            'details': r['details'],
            'periods_count': r['periods_count'],
            'status_code': status_code,
            'status_label': status_label,
            'color_border': color_border,
            'badge_color': badge_color,
            'current_subject': r['subject'] or '',
            'current_class': r['class_name'] or '',
            'cell_text': cell_txt
        }
        
        # Filters
        if search:
            kw = search.lower().strip()
            clean_phone = (t_dict['phone'] or '').replace(' ', '')
            if (kw not in t_dict['full_name'].lower() and 
                kw not in (t_dict['short_name'] or '').lower() and
                kw not in clean_phone and
                kw not in (t_dict['phone'] or '')):
                continue
                
        if subject_filter and subject_filter != 'all':
            if t_dict['subject_group'] != subject_filter:
                continue
                
        if status_filter and status_filter != 'all':
            if status_filter == 'teaching':
                # If filtering by a specific class, MUST be teaching THIS class!
                if cf:
                    if status_code != 'teaching':
                        continue
                else:
                    if status_code != 'teaching':
                        continue
            elif status_filter == 'free':
                if status_code != 'free':
                    continue
            elif status_filter == 'special':
                if status_code not in ['special', 'salute']:
                    continue
            elif status_filter == 'homeroom':
                if cf:
                    if not is_homeroom_of_this_class:
                        continue
                else:
                    if not t_dict['homeroom_class']:
                        continue
                
        teachers.append(t_dict)
        
    # If filtered by class, sort prioritized:
    # 1. Currently teaching this class
    # 2. Homeroom teacher of this class
    # 3. Other subject teachers of this class
    if class_filter and class_filter != 'all':
        cf = class_filter.strip().lower()
        def class_sort_key(t):
            if (t['current_class'] or '').lower() == cf:
                return (0, t['tt'])
            if (t['homeroom_class'] or '').lower() == cf:
                return (1, t['tt'])
            return (2, t['tt'])
        teachers.sort(key=class_sort_key)
        
    return teachers

def get_timetable_matrix() -> Dict[str, Any]:
    """
    Returns the timetable matrix: Monday (2) to Saturday (7)
    Sessions: sang (1..5), chieu (1..5)
    For each cell: summary count of teachers teaching, free, special, salute
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Total teachers
    cursor.execute('SELECT COUNT(*) as total FROM teachers')
    total_teachers = cursor.fetchone()['total']
    
    cursor.execute('''
    SELECT day_of_week, session, period, activity_type, COUNT(*) as cnt
    FROM timetable_entries
    WHERE cell_text IS NOT NULL AND cell_text != ''
    GROUP BY day_of_week, session, period, activity_type
    ''')
    rows = cursor.fetchall()
    conn.close()
    
    # Build grid structure
    # Days: 2..7
    # Periods: sang_1..5, chieu_1..5
    grid = {}
    for day in range(2, 8):
        grid[day] = {
            'sang': {p: {'teaching': 0, 'free': total_teachers, 'special': 0, 'salute': 0, 'total': total_teachers} for p in range(1, 6)},
            'chieu': {p: {'teaching': 0, 'free': total_teachers, 'special': 0, 'salute': 0, 'total': total_teachers} for p in range(1, 6)}
        }
        
    for r in rows:
        d = r['day_of_week']
        s = r['session']
        p = r['period']
        act = r['activity_type']
        cnt = r['cnt']
        
        if d in grid and s in grid[d] and p in grid[d][s]:
            if act == 'teaching':
                grid[d][s][p]['teaching'] += cnt
            elif act == 'salute':
                grid[d][s][p]['salute'] += cnt
            elif act == 'special':
                grid[d][s][p]['special'] += cnt
                
            # Recalculate free
            occupied = grid[d][s][p]['teaching'] + grid[d][s][p]['salute'] + grid[d][s][p]['special']
            grid[d][s][p]['free'] = max(0, total_teachers - occupied)
            
    return {
        'total_teachers': total_teachers,
        'grid': grid
    }

def get_cell_details(day_of_week: int, session: str, period: int) -> Dict[str, Any]:
    """
    Detailed lists of teaching teachers vs free teachers for a specific period.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    query = '''
    SELECT 
        t.id, t.tt, t.full_name, t.short_name, t.phone, t.homeroom_class, t.subject_group, t.periods_count,
        e.activity_type, e.cell_text, e.subject, e.class_name
    FROM teachers t
    LEFT JOIN timetable_entries e 
        ON t.id = e.teacher_id 
        AND e.day_of_week = ? 
        AND e.session = ? 
        AND e.period = ?
    ORDER BY t.tt ASC
    '''
    cursor.execute(query, (day_of_week, session, period))
    rows = cursor.fetchall()
    conn.close()
    
    teaching = []
    free = []
    special = []
    salute = []
    
    for r in rows:
        act = r['activity_type']
        item = {
            'id': r['id'],
            'tt': r['tt'],
            'full_name': r['full_name'],
            'short_name': r['short_name'],
            'phone': r['phone'] or '',
            'homeroom_class': r['homeroom_class'] or '',
            'subject_group': r['subject_group'] or '',
            'periods_count': r['periods_count'] or 0,
            'subject': r['subject'] or '',
            'class_name': r['class_name'] or '',
            'cell_text': r['cell_text'] or ''
        }
        
        if not r['cell_text']:
            free.append(item)
        elif act == 'teaching':
            teaching.append(item)
        elif act == 'salute':
            salute.append(item)
        elif act == 'special':
            special.append(item)
        else:
            free.append(item)
            
    return {
        'day_of_week': day_of_week,
        'session': session,
        'period': period,
        'teaching': teaching,
        'free': free,
        'special': special,
        'salute': salute,
        'counts': {
            'teaching': len(teaching),
            'free': len(free),
            'special': len(special),
            'salute': len(salute),
            'total': len(rows)
        }
    }

def get_teacher_schedule(teacher_id: int) -> Dict[str, Any]:
    """
    Returns full weekly timetable for a specific teacher.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM teachers WHERE id = ?', (teacher_id,))
    t_row = cursor.fetchone()
    if not t_row:
        conn.close()
        return {}
        
    t_info = dict(t_row)
    
    cursor.execute('''
    SELECT day_of_week, session, period, cell_text, subject, class_name, activity_type
    FROM timetable_entries
    WHERE teacher_id = ?
    ORDER BY day_of_week, session, period
    ''', (teacher_id,))
    entries = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    # Matrix structure: days 2..7, session sang/chieu, period 1..5
    schedule = {d: {'sang': {p: '' for p in range(1, 6)}, 'chieu': {p: '' for p in range(1, 6)}} for d in range(2, 8)}
    for e in entries:
        d = e['day_of_week']
        s = e['session']
        p = e['period']
        txt = e['cell_text']
        if d in schedule and s in schedule[d]:
            schedule[d][s][p] = txt
            
    return {
        'teacher': t_info,
        'schedule': schedule
    }

def get_metadata() -> Dict[str, str]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT key, value FROM metadata')
    rows = cursor.fetchall()
    conn.close()
    return {r['key']: r['value'] for r in rows}

def get_subject_groups() -> List[str]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT DISTINCT subject_group FROM teachers WHERE subject_group IS NOT NULL AND subject_group != "" ORDER BY subject_group')
    rows = cursor.fetchall()
    conn.close()
    return [r['subject_group'] for r in rows]

def update_teacher_phone(teacher_id: int, phone: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE teachers SET phone = ? WHERE id = ?', (phone.strip(), teacher_id))
    conn.commit()
    conn.close()

def get_classes_list() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT cl.name, cl.full_label, cl.grade, cl.shift,
           ht.full_name as gvcn_name, ht.short_name as gvcn_short, ht.phone as gvcn_phone
    FROM classes cl
    LEFT JOIN teachers ht ON (cl.name = ht.homeroom_class)
    ORDER BY cl.grade ASC, cl.name ASC
    ''')
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_classes_status_at(
    day_of_week: int,
    session: Optional[str],
    period: Optional[int],
    search: str = "",
    grade_filter: str = "all",
    subject_filter: str = "all",
    homeroom_filter: str = "all",
    status_filter: str = "all",
    is_school_time: bool = True
) -> Dict[str, Any]:
    """
    Lấy danh sách trạng thái của tất cả các lớp học tại thời điểm (day_of_week, session, period).
    Nếu is_school_time là False hoặc Chủ nhật, số lớp đang học = 0.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Lấy danh sách tất cả các lớp kèm thông tin GVCN
    cursor.execute('''
    SELECT 
        cl.id, cl.name, cl.full_label, cl.grade, cl.shift,
        ht.id as gvcn_id, ht.full_name as gvcn_name, ht.short_name as gvcn_short, ht.phone as gvcn_phone
    FROM classes cl
    LEFT JOIN teachers ht ON (cl.name = ht.homeroom_class)
    ORDER BY cl.grade ASC, cl.name ASC
    ''')
    all_classes_rows = cursor.fetchall()
    
    # 2. Nếu đang trong khung giờ học hợp lệ, lấy các tiết dạy tương ứng
    entry_by_class = {}
    if is_school_time and 2 <= day_of_week <= 7 and session and period:
        cursor.execute('''
        SELECT 
            e.class_name, e.subject, e.activity_type, e.cell_text,
            t.id as teacher_id, t.full_name as teacher_name, t.short_name as teacher_short, t.phone as teacher_phone
        FROM timetable_entries e
        LEFT JOIN teachers t ON e.teacher_id = t.id
        WHERE e.day_of_week = ? AND e.session = ? AND e.period = ? 
          AND e.class_name IS NOT NULL AND e.class_name != ''
        ''', (day_of_week, session, period))
        for r in cursor.fetchall():
            c_name = r['class_name']
            if c_name not in entry_by_class:
                entry_by_class[c_name] = dict(r)
                
    conn.close()
    
    off_label = 'Chủ nhật - Nghỉ cuối tuần' if day_of_week > 7 else 'Ngoài giờ học / Hết giờ học'
    classes_list = []
    
    for r in all_classes_rows:
        c_name = r['name']
        gvcn_full = r['gvcn_name'] or ''
        gvcn_short = r['gvcn_short'] or ''
        gvcn_ph = r['gvcn_phone'] or ''
        
        if not is_school_time or day_of_week > 7 or not session or not period:
            status_code = 'free'
            status_label = off_label
            color_border = 'border-red'
            badge_color = 'badge-red'
            current_subject = ''
            teacher_name = ''
            teacher_short = ''
            teacher_phone = ''
            cell_text = ''
        else:
            e = entry_by_class.get(c_name)
            if e:
                act = e['activity_type']
                if act == 'teaching':
                    status_code = 'learning'
                    t_display = e['teacher_name'] or e['teacher_short'] or 'Chưa rõ GV'
                    status_label = f"Đang học: {e['subject']} - GV: {t_display}"
                    color_border = 'border-green'
                    badge_color = 'badge-green'
                    current_subject = e['subject'] or ''
                    teacher_name = e['teacher_name'] or ''
                    teacher_short = e['teacher_short'] or ''
                    teacher_phone = e['teacher_phone'] or ''
                    cell_text = e['cell_text'] or ''
                elif act == 'salute':
                    status_code = 'salute'
                    status_label = 'Chào cờ toàn trường'
                    color_border = 'border-yellow'
                    badge_color = 'badge-yellow'
                    current_subject = 'Chào cờ'
                    teacher_name = ''
                    teacher_short = ''
                    teacher_phone = ''
                    cell_text = 'Chào cờ'
                elif act == 'special':
                    status_code = 'special'
                    status_label = e['cell_text'] or 'Sinh hoạt'
                    color_border = 'border-orange'
                    badge_color = 'badge-orange'
                    current_subject = e['subject'] or e['cell_text'] or 'Sinh hoạt'
                    teacher_name = e['teacher_name'] or ''
                    teacher_short = e['teacher_short'] or ''
                    teacher_phone = e['teacher_phone'] or ''
                    cell_text = e['cell_text'] or ''
                else:
                    status_code = 'free'
                    status_label = 'Trống tiết / Không có lịch học'
                    color_border = 'border-red'
                    badge_color = 'badge-red'
                    current_subject = ''
                    teacher_name = ''
                    teacher_short = ''
                    teacher_phone = ''
                    cell_text = ''
            else:
                status_code = 'free'
                status_label = 'Trống tiết / Không có lịch học'
                color_border = 'border-red'
                badge_color = 'badge-red'
                current_subject = ''
                teacher_name = ''
                teacher_short = ''
                teacher_phone = ''
                cell_text = ''
                
        c_dict = {
            'id': r['id'],
            'name': c_name,
            'full_label': r['full_label'] or c_name,
            'grade': r['grade'] or '',
            'shift': r['shift'] or '',
            'gvcn_name': gvcn_full,
            'gvcn_short': gvcn_short,
            'gvcn_phone': gvcn_ph,
            'status_code': status_code,
            'status_label': status_label,
            'color_border': color_border,
            'badge_color': badge_color,
            'current_subject': current_subject,
            'teacher_name': teacher_name,
            'teacher_short': teacher_short,
            'teacher_phone': teacher_phone,
            'cell_text': cell_text
        }
        classes_list.append(c_dict)
        
    # Tính tổng số thống kê TRƯỚC KHI áp dụng lọc tìm kiếm/trạng thái (để cập nhật 4 ô KPI)
    # Nhưng có tính theo bộ lọc Khối/GVCN nếu được chọn
    kpi_base = classes_list
    if grade_filter and grade_filter != 'all':
        kpi_base = [c for c in kpi_base if c['grade'] == grade_filter]
    if homeroom_filter and homeroom_filter != 'all':
        hf = homeroom_filter.lower().strip()
        kpi_base = [c for c in kpi_base if hf in c['gvcn_name'].lower() or hf in c['gvcn_short'].lower()]
        
    counts = {
        'total': len(kpi_base),
        'learning': sum(1 for c in kpi_base if c['status_code'] == 'learning'),
        'free': sum(1 for c in kpi_base if c['status_code'] == 'free'),
        'special': sum(1 for c in kpi_base if c['status_code'] in ['special', 'salute'])
    }
    
    # Áp dụng các bộ lọc danh sách
    filtered = []
    for c in classes_list:
        # Lọc khối
        if grade_filter and grade_filter != 'all':
            if c['grade'] != grade_filter:
                continue
                
        # Lọc môn
        if subject_filter and subject_filter != 'all':
            if c['current_subject'].lower() != subject_filter.lower():
                continue
                
        # Lọc GVCN
        if homeroom_filter and homeroom_filter != 'all':
            hf = homeroom_filter.lower().strip()
            if hf not in c['gvcn_name'].lower() and hf not in c['gvcn_short'].lower():
                continue
                
        # Lọc trạng thái
        if status_filter and status_filter != 'all':
            if status_filter == 'learning' and c['status_code'] != 'learning':
                continue
            elif status_filter == 'free' and c['status_code'] != 'free':
                continue
            elif status_filter == 'special' and c['status_code'] not in ['special', 'salute']:
                continue
                
        # Tìm kiếm tự do
        if search:
            kw = search.lower().strip()
            clean_t_phone = c['teacher_phone'].replace(' ', '')
            clean_g_phone = c['gvcn_phone'].replace(' ', '')
            if (kw not in c['name'].lower() and
                kw not in c['current_subject'].lower() and
                kw not in c['teacher_name'].lower() and
                kw not in c['gvcn_name'].lower() and
                kw not in c['teacher_phone'] and
                kw not in clean_t_phone and
                kw not in c['gvcn_phone'] and
                kw not in clean_g_phone):
                continue
                
        filtered.append(c)
        
    return {
        'counts': counts,
        'classes': filtered
    }

def get_class_schedule(class_name: str) -> Dict[str, Any]:
    """
    Lấy thời khóa biểu tuần đầy đủ của 1 lớp học.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT cl.name, cl.full_label, cl.grade, cl.shift,
           ht.full_name as gvcn_name, ht.short_name as gvcn_short, ht.phone as gvcn_phone
    FROM classes cl
    LEFT JOIN teachers ht ON (cl.name = ht.homeroom_class)
    WHERE cl.name = ?
    ''', (class_name,))
    c_row = cursor.fetchone()
    if not c_row:
        conn.close()
        return {}
    class_info = dict(c_row)
    
    cursor.execute('''
    SELECT e.day_of_week, e.session, e.period, e.cell_text, e.subject, e.activity_type,
           t.full_name as teacher_name, t.short_name as teacher_short_name, t.phone as teacher_phone
    FROM timetable_entries e
    LEFT JOIN teachers t ON e.teacher_id = t.id
    WHERE e.class_name = ?
    ORDER BY e.day_of_week, e.session, e.period
    ''', (class_name,))
    entries = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    schedule = {d: {'sang': {p: None for p in range(1, 6)}, 'chieu': {p: None for p in range(1, 6)}} for d in range(2, 8)}
    for e in entries:
        d = e['day_of_week']
        s = e['session']
        p = e['period']
        if d in schedule and s in schedule[d]:
            schedule[d][s][p] = {
                'subject': e['subject'] or '',
                'teacher_name': e['teacher_name'] or '',
                'teacher_short': e['teacher_short_name'] or '',
                'teacher_phone': e['teacher_phone'] or '',
                'activity_type': e['activity_type'] or '',
                'cell_text': e['cell_text'] or ''
            }
            
    return {
        'class_info': class_info,
        'schedule': schedule,
        'total_periods': len([e for e in entries if e['activity_type'] == 'teaching'])
    }

def get_classes_matrix() -> Dict[str, Any]:
    """
    Ma trận TKB của toàn bộ các lớp (Thứ 2..Thứ 7, Sáng/Chiều 1..5).
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) as total FROM classes')
    total_classes = cursor.fetchone()['total']
    
    cursor.execute('''
    SELECT day_of_week, session, period, activity_type, COUNT(DISTINCT class_name) as cnt
    FROM timetable_entries
    WHERE class_name IS NOT NULL AND class_name != '' AND class_name NOT IN ('Toàn trường', 'Toan truong')
    GROUP BY day_of_week, session, period, activity_type
    ''')
    rows = cursor.fetchall()
    conn.close()
    
    grid = {}
    for day in range(2, 8):
        grid[day] = {
            'sang': {p: {'learning': 0, 'free': total_classes, 'special': 0, 'salute': 0, 'total': total_classes} for p in range(1, 6)},
            'chieu': {p: {'learning': 0, 'free': total_classes, 'special': 0, 'salute': 0, 'total': total_classes} for p in range(1, 6)}
        }
        
    for r in rows:
        d = r['day_of_week']
        s = r['session']
        p = r['period']
        act = r['activity_type']
        cnt = r['cnt']
        
        if d in grid and s in grid[d] and p in grid[d][s]:
            if act == 'teaching':
                grid[d][s][p]['learning'] += cnt
            elif act == 'salute':
                grid[d][s][p]['salute'] += cnt
            elif act == 'special':
                grid[d][s][p]['special'] += cnt
                
            occupied = grid[d][s][p]['learning'] + grid[d][s][p]['salute'] + grid[d][s][p]['special']
            grid[d][s][p]['free'] = max(0, total_classes - occupied)
            
    return {
        'total_classes': total_classes,
        'grid': grid
    }

def get_class_cell_details(day_of_week: int, session: str, period: int) -> Dict[str, Any]:
    """
    Chi tiết danh sách các lớp đang học vs các lớp trống tiết tại một tiết học cụ thể.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT 
        cl.name, cl.grade, cl.shift,
        ht.full_name as gvcn_name, ht.short_name as gvcn_short, ht.phone as gvcn_phone,
        e.subject, e.activity_type, e.cell_text,
        t.full_name as teacher_name, t.short_name as teacher_short, t.phone as teacher_phone
    FROM classes cl
    LEFT JOIN teachers ht ON (cl.name = ht.homeroom_class)
    LEFT JOIN timetable_entries e ON (cl.name = e.class_name AND e.day_of_week = ? AND e.session = ? AND e.period = ?)
    LEFT JOIN teachers t ON (e.teacher_id = t.id)
    ORDER BY cl.grade ASC, cl.name ASC
    ''', (day_of_week, session, period))
    rows = cursor.fetchall()
    conn.close()
    
    learning = []
    free = []
    special = []
    salute = []
    
    for r in rows:
        act = r['activity_type']
        item = {
            'name': r['name'],
            'grade': r['grade'],
            'shift': r['shift'],
            'gvcn_name': r['gvcn_name'] or '',
            'gvcn_short': r['gvcn_short'] or '',
            'gvcn_phone': r['gvcn_phone'] or '',
            'subject': r['subject'] or '',
            'activity_type': act or 'free',
            'cell_text': r['cell_text'] or '',
            'teacher_name': r['teacher_name'] or r['teacher_short'] or '',
            'teacher_phone': r['teacher_phone'] or ''
        }
        
        if not r['cell_text'] or act == 'free':
            free.append(item)
        elif act == 'teaching':
            learning.append(item)
        elif act == 'salute':
            salute.append(item)
        elif act == 'special':
            special.append(item)
        else:
            free.append(item)
            
    return {
        'day_of_week': day_of_week,
        'session': session,
        'period': period,
        'learning': learning,
        'free': free,
        'special': special,
        'salute': salute,
        'counts': {
            'learning': len(learning),
            'free': len(free),
            'special': len(special),
            'salute': len(salute),
            'total': len(rows)
        }
    }

def get_homeroom_teachers_list() -> List[Dict[str, str]]:
    """
    Danh sách GVCN kèm thông tin lớp và số điện thoại.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT t.full_name, t.short_name, t.homeroom_class, t.phone, c.grade
    FROM teachers t
    LEFT JOIN classes c ON t.homeroom_class = c.name
    WHERE t.homeroom_class IS NOT NULL AND t.homeroom_class != ''
    ORDER BY c.grade ASC, t.homeroom_class ASC
    ''')
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_class_subjects() -> List[str]:
    """
    Danh sách các môn học được giảng dạy.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT DISTINCT subject FROM timetable_entries 
    WHERE subject IS NOT NULL AND subject != '' AND activity_type = 'teaching'
    ORDER BY subject ASC
    ''')
    rows = cursor.fetchall()
    conn.close()
    return [r['subject'] for r in rows]


