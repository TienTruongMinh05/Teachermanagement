import openpyxl
import re
from typing import Dict, Any, List, Optional, Tuple

def clean_str(val) -> str:
    """Loại bỏ khoảng trắng thừa hoặc trả về chuỗi rỗng nếu giá trị là None."""
    if val is None:
        return ""
    return str(val).strip()

def normalize_key(val: Any) -> str:
    """Chuẩn hóa chuỗi văn bản phục vụ so sánh từ khóa (chữ thường, xóa khoảng trắng thừa)."""
    if val is None:
        return ""
    return re.sub(r'\s+', ' ', str(val).strip().lower())

def extract_primary_subject(pc_str: str) -> str:
    """
    Tự động bóc tách tên tổ môn chính từ chuỗi phân công, ví dụ:
    'Toán (10A3)' -> 'Toán'
    'Toán (10A8, 10A9) + TNHN (10A4)' -> 'Toán'
    'NNgữ (10A1, ...)' -> 'Ngoại ngữ'
    """
    if not pc_str:
        return "Khác"
    
    parts = pc_str.split('+')
    first_part = parts[0].strip()
    m = re.match(r'^([^\(]+)', first_part)
    if not m:
        return "Khác"
    
    subj = m.group(1).strip()
    mapping = {
        'NNgữ': 'Ngoại ngữ',
        'CNghệ': 'Công nghệ',
        'KTPL': 'Kinh tế & Pháp luật',
        'GDĐP': 'Giáo dục địa phương',
        'TNHN': 'Trải nghiệm hướng nghiệp',
        'GDQP': 'Giáo dục quốc phòng',
        'GDTC': 'Giáo dục thể chất',
        'Tin': 'Tin học',
        'Sinh': 'Sinh học',
        'Hóa': 'Hóa học',
        'Lý': 'Vật lí',
        'Lí': 'Vật lí',
        'Văn': 'Ngữ văn',
        'Sử': 'Lịch sử',
        'Địa': 'Địa lí'
    }
    return mapping.get(subj, subj)

def classify_cell(val: str):
    """
    Phân loại nội dung một ô thời khóa biểu:
    - Rỗng / None: 'free' (trống tiết, đang rảnh)
    - 'Chào cờ': 'salute'
    - 'Giao ban' / 'Họp' / 'SHCN': 'special'
    - 'Toán - 10A5': 'teaching' (môn: Toán, lớp: 10A5)
    """
    if not val:
        return {'activity_type': 'free', 'subject': '', 'class_name': '', 'raw': ''}
    
    val = val.strip()
    if not val:
        return {'activity_type': 'free', 'subject': '', 'class_name': '', 'raw': ''}
    
    lower_val = val.lower()
    if 'chào cờ' in lower_val or 'chao co' in lower_val:
        return {'activity_type': 'salute', 'subject': 'Chào cờ', 'class_name': 'Toàn trường', 'raw': val}
    
    if any(k in lower_val for k in ['giao ban', 'họp', 'hop', 'shcn', 'sinh hoạt', 'sinh hoat', 'chuyên đề']):
        return {'activity_type': 'special', 'subject': val, 'class_name': '', 'raw': val}
    
    if '-' in val:
        parts = [p.strip() for p in val.split('-', 1)]
        subj = parts[0]
        cls = parts[1] if len(parts) > 1 else ''
        return {'activity_type': 'teaching', 'subject': subj, 'class_name': cls, 'raw': val}
    
    return {'activity_type': 'special', 'subject': val, 'class_name': '', 'raw': val}

def extract_metadata_dynamically(wb: openpyxl.Workbook) -> Dict[str, str]:
    """
    Tự động quét các dòng đầu của các sheet để bóc tách thông tin trường, năm học, học kỳ, ngày áp dụng.
    Không phụ thuộc vào vị trí cố định của ô.
    """
    metadata = {
        'school_name': 'TRƯỜNG THPT NGUYỄN HUỆ',
        'school_year': '2026 - 2027',
        'semester': 'Học kỳ 1',
        'version': 'TKB Số 2',
        'effective_date': '21/09/2026'
    }
    
    # Quét tối đa 4 sheet đầu tiên, mỗi sheet quét 6 dòng đầu
    for ws in wb.worksheets[:4]:
        for r in range(1, min(7, ws.max_row + 1)):
            for c in range(1, min(12, ws.max_column + 1)):
                v = clean_str(ws.cell(r, c).value)
                if not v:
                    continue
                lines = [l.strip() for l in v.split('\n') if l.strip()]
                for line in lines:
                    l_lower = line.lower()
                    if ('trường' in l_lower or 'thpt' in l_lower or 'sở gd' in l_lower) and len(line) < 60:
                        metadata['school_name'] = line
                    elif ('năm học' in l_lower or re.search(r'20\d\d\s*-\s*20\d\d', line)) and len(line) < 50:
                        metadata['school_year'] = line
                    elif ('học kỳ' in l_lower or 'học kì' in l_lower or 'hk1' in l_lower or 'hk2' in l_lower) and len(line) < 30:
                        metadata['semester'] = line
                    elif ('thời khoá biểu' in l_lower or 'thời khóa biểu' in l_lower or 'số ' in l_lower) and len(line) < 40:
                        metadata['version'] = line
                    elif ('thực hiện từ' in l_lower or 'áp dụng từ' in l_lower) and len(line) < 60:
                        metadata['effective_date'] = line
                        
    return metadata

def find_teacher_sheet(wb: openpyxl.Workbook) -> Optional[openpyxl.worksheet.worksheet.Worksheet]:
    """
    Tự động nhận diện sheet Danh sách Giáo viên / Phân công giảng dạy (PCGD)
    bằng cách chấm điểm từ khóa trên tên sheet và nội dung các hàng đầu.
    Không quan trọng tên sheet là gì (PCGD, PhanCong, DS_GV, Sheet1...).
    """
    best_sheet = None
    best_score = -1
    
    for ws in wb.worksheets:
        score = 0
        name_lower = normalize_key(ws.title)
        
        # Điểm cộng tên sheet
        if any(k in name_lower for k in ['pcgd', 'phân công', 'phan cong', 'dsgv', 'giáo viên', 'giao vien', 'gv', 'teacher']):
            score += 20
            
        # Quét 12 dòng đầu tiên
        for r in range(1, min(12, ws.max_row + 1)):
            row_vals = [normalize_key(ws.cell(r, c).value) for c in range(1, min(25, ws.max_column + 1))]
            row_txt = ' '.join(row_vals)
            
            if any(k in row_txt for k in ['họ và tên', 'họ tên', 'giáo viên', 'cb-gv', 'tên gv']):
                score += 30
            if any(k in row_txt for k in ['phân công', 'chuyên môn', 'môn dạy']):
                score += 20
            if any(k in row_txt for k in ['số tiết', 'tổng tiết', 'định mức']):
                score += 15
            if any(k in row_txt for k in ['chủ nhiệm', 'lớp cn']):
                score += 10
            if any(k in row_txt for k in ['kiêm nhiệm', 'chức vụ']):
                score += 5
                
            # Trừ điểm nếu đây là lưới TKB có cả cột Thứ và Tiết
            if any(v in ['thứ', 'thu'] for v in row_vals) and any(v in ['tiết', 'tiet'] for v in row_vals):
                score -= 25
                
        if score > best_score:
            best_score = score
            best_sheet = ws
            
    if not best_sheet and wb.worksheets:
        best_sheet = wb.worksheets[0]
        
    return best_sheet

def find_teacher_columns(ws, max_header_row=12) -> Tuple[Dict[str, Optional[int]], int]:
    """
    Tự động quét các dòng đầu của sheet giáo viên để nhận diện:
    - Hàng tiêu đề của bảng
    - Vị trí cột: TT, Họ và tên, Điện thoại (nếu có, không có thì None), Kiêm nhiệm, Chủ nhiệm, Phân công, Số tiết
    Tự tìm theo từ khóa, không quan trọng thứ tự cột. Tuyệt đối không tự bịa dữ liệu.
    """
    col_map = {
        'tt': None,
        'full_name': None,
        'phone': None,
        'kiem_nhiem': None,
        'cn': None,
        'phan_cong': None,
        'so_tiet': None
    }
    data_start_row = 2
    best_matches = 0
    
    for r in range(1, min(max_header_row + 1, ws.max_row + 1)):
        row_cells = [normalize_key(ws.cell(r, c).value) for c in range(1, ws.max_column + 1)]
        curr_map = {}
        matches = 0
        
        for c_idx, val in enumerate(row_cells, start=1):
            if not val:
                continue
            # 1. Cột Số điện thoại
            if 'phone' not in curr_map and any(k in val for k in ['điện thoại', 'dien thoai', 'số điện thoại', 'so dien thoai', 'sđt', 'sdt', 'đt', 'phone', 'tel', 'mobile', 'liên hệ', 'contact']):
                curr_map['phone'] = c_idx
                matches += 1
            # 2. Cột Họ tên
            elif 'full_name' not in curr_map and any(k in val for k in ['họ và tên', 'họ tên', 'giáo viên', 'cb-gv', 'tên giáo viên', 'ten gv', 'họ tên giáo viên']):
                curr_map['full_name'] = c_idx
                matches += 1
            # 3. Cột Kiêm nhiệm
            elif 'kiem_nhiem' not in curr_map and any(k in val for k in ['kiêm nhiệm', 'chức danh', 'chức vụ', 'kiem nhiem', 'nhiệm vụ']):
                curr_map['kiem_nhiem'] = c_idx
                matches += 1
            # 4. Cột Chủ nhiệm (CN)
            elif 'cn' not in curr_map and (val in ['cn', 'chủ nhiệm', 'chu nhiem', 'lớp cn', 'lop cn', 'gvcn'] or 'chủ nhiệm' in val):
                curr_map['cn'] = c_idx
                matches += 1
            # 5. Cột Phân công giảng dạy
            elif 'phan_cong' not in curr_map and any(k in val for k in ['phân công', 'chuyên môn', 'môn dạy', 'phan cong', 'mon day', 'chuyen mon', 'môn']):
                curr_map['phan_cong'] = c_idx
                matches += 1
            # 6. Cột Số tiết / Định mức
            elif 'so_tiet' not in curr_map and any(k in val for k in ['số tiết', 'tổng tiết', 'định mức', 'so tiet', 'tong tiet', 'dinh muc', 'tiết/tuần', 'so_tiet']):
                curr_map['so_tiet'] = c_idx
                matches += 1
            # 7. Cột Số thứ tự (TT)
            elif 'tt' not in curr_map and val in ['tt', 'stt', 'số tt', 'số thứ tự', 'so thu tu']:
                curr_map['tt'] = c_idx
                matches += 1
                
        if 'full_name' in curr_map and matches > best_matches:
            best_matches = matches
            data_start_row = r + 1
            col_map.update(curr_map)
            
    # Mặc định an toàn
    if col_map['full_name'] is None:
        col_map['full_name'] = 2
    if col_map['tt'] is None:
        col_map['tt'] = 1 if col_map['full_name'] != 1 else None
        
    return col_map, data_start_row

def find_teacher_timetable_sheets(wb: openpyxl.Workbook):
    """
    Tự động tìm kiếm sheet(s) thời khóa biểu giáo viên:
    - Tìm sheet có lưới TKB: có cột Thứ và cột Tiết ở các cột đầu, và hàng tiêu đề tên giáo viên.
    - Tách biệt với sheet TKB Lớp (sheet TKB lớp có tiêu đề cột là tên lớp 10A1, 11A2...).
    - Trả về:
      + combined_sheets: Sheet có cả 2 ca Sáng & Chiều (mỗi GV có 2 cột)
      + session_sheets: Các sheet ca lẻ (Sáng riêng, Chiều riêng)
    """
    combined_sheets = []
    session_sheets = []
    
    for ws in wb.worksheets:
        name_lower = normalize_key(ws.title)
        
        # Tìm vị trí cột Thứ và Tiết
        grid_info = None
        for r in range(1, min(15, ws.max_row + 1)):
            for c in range(1, min(6, ws.max_column + 1)):
                v = normalize_key(ws.cell(r, c).value)
                if 'thứ' in v or v == 'thu' or v == 'day':
                    for c2 in range(1, min(6, ws.max_column + 1)):
                        if c2 == c:
                            continue
                        v2 = normalize_key(ws.cell(r, c2).value)
                        if 'tiết' in v2 or v2 == 'tiet' or v2 == 'period':
                            grid_info = (r, c, c2)
                            break
                if grid_info:
                    break
            if grid_info:
                break
                
        if not grid_info:
            continue
            
        r_hdr, c_thu, c_tiet = grid_info
        
        # Kiểm tra xem đây là sheet TKB Giáo viên hay sheet TKB Lớp
        # Nếu tiêu đề cột bắt đầu bằng tên lớp (10A..., 11A..., 12A...) thì đây là sheet lớp
        header_vals = [clean_str(ws.cell(r_hdr, col).value) for col in range(max(c_thu, c_tiet) + 1, min(max(c_thu, c_tiet) + 15, ws.max_column + 1)) if ws.cell(r_hdr, col).value]
        is_class_sheet = sum(1 for hv in header_vals if re.match(r'^(10|11|12)[a-zA-Z]', hv.strip())) >= 2 or 'lop' in name_lower or 'lớp' in name_lower
        
        if is_class_sheet:
            continue
            
        # Kiểm tra nếu hàng r_hdr + 1 có các ô 'Sáng' và 'Chiều' (bảng tổng hợp SC)
        has_subrow = False
        if r_hdr + 1 <= ws.max_row:
            sub_vals = [normalize_key(ws.cell(r_hdr + 1, col).value) for col in range(max(c_thu, c_tiet) + 1, min(max(c_thu, c_tiet) + 12, ws.max_column + 1))]
            if any('sáng' in x or 'sang' in x for x in sub_vals) and any('chiều' in x or 'chieu' in x for x in sub_vals):
                has_subrow = True
                
        if has_subrow:
            combined_sheets.append((ws, grid_info))
        else:
            # Nhận diện buổi Sáng hoặc Chiều
            sheet_text = ' '.join(normalize_key(ws.cell(r, 1).value) for r in range(1, r_hdr))
            is_chieu = any(k in name_lower for k in ['chiều', 'chieu', '_c', '-c']) or 'buổi chiều' in sheet_text
            session = 'chieu' if is_chieu else 'sang'
            session_sheets.append((ws, grid_info, session))
            
    return combined_sheets, session_sheets

def find_class_timetable_sheets(wb: openpyxl.Workbook):
    """
    Tự động tìm kiếm sheet(s) thời khóa biểu lớp học để bóc tách danh sách lớp và GVCN.
    """
    class_sheets = []
    for ws in wb.worksheets:
        name_lower = normalize_key(ws.title)
        
        grid_info = None
        for r in range(1, min(15, ws.max_row + 1)):
            for c in range(1, min(6, ws.max_column + 1)):
                v = normalize_key(ws.cell(r, c).value)
                if 'thứ' in v or v == 'thu' or v == 'day':
                    for c2 in range(1, min(6, ws.max_column + 1)):
                        if c2 == c:
                            continue
                        v2 = normalize_key(ws.cell(r, c2).value)
                        if 'tiết' in v2 or v2 == 'tiet' or v2 == 'period':
                            grid_info = (r, c, c2)
                            break
                if grid_info:
                    break
            if grid_info:
                break
                
        if not grid_info:
            continue
            
        r_hdr, c_thu, c_tiet = grid_info
        header_vals = [clean_str(ws.cell(r_hdr, col).value) for col in range(max(c_thu, c_tiet) + 1, min(max(c_thu, c_tiet) + 15, ws.max_column + 1)) if ws.cell(r_hdr, col).value]
        is_class_sheet = sum(1 for hv in header_vals if re.match(r'^(10|11|12)[a-zA-Z]', hv.strip())) >= 2 or 'lop' in name_lower or 'lớp' in name_lower
        
        if is_class_sheet:
            class_sheets.append((ws, grid_info))
            
    return class_sheets

def parse_timetable_file(filepath: str) -> Dict[str, Any]:
    """
    HÀM BÓC TÁCH THỜI KHÓA BIỂU TOÀN DIỆN & TỰ ĐỘNG NHẬN DIỆN ĐỘNG:
    1. Quét tìm Metadata từ khóa động.
    2. Tự tìm sheet Giáo viên / PCGD và xác định các cột bằng từ khóa (không quan trọng tên sheet / thứ tự cột).
    3. Tự tìm sheet Thời khóa biểu Giáo viên và bóc tách lưới tiết học linh hoạt.
    4. Tự tìm sheet Lớp học hoặc bóc tách lớp chéo từ phân công và các tiết dạy.
    """
    wb = openpyxl.load_workbook(filepath, data_only=True)
    
    # 1. Bóc tách Metadata động
    metadata = extract_metadata_dynamically(wb)
    
    # 2. Tìm và bóc tách Sheet Giáo viên
    teachers: List[Dict[str, Any]] = []
    ws_teacher = find_teacher_sheet(wb)
    
    if ws_teacher:
        col_map, data_start_row = find_teacher_columns(ws_teacher)
        
        for r in range(data_start_row, ws_teacher.max_row + 1):
            fname = clean_str(ws_teacher.cell(r, col_map['full_name']).value) if col_map['full_name'] else ""
            if not fname or len(fname) < 2 or fname.lower() in ['tổng cộng', 'ghi chú']:
                continue
                
            tt = ws_teacher.cell(r, col_map['tt']).value if col_map['tt'] else len(teachers) + 1
            phone = clean_str(ws_teacher.cell(r, col_map['phone']).value) if col_map['phone'] else ""
            kn = clean_str(ws_teacher.cell(r, col_map['kiem_nhiem']).value) if col_map['kiem_nhiem'] else ""
            cn = clean_str(ws_teacher.cell(r, col_map['cn']).value) if col_map['cn'] else ""
            pc = clean_str(ws_teacher.cell(r, col_map['phan_cong']).value) if col_map['phan_cong'] else ""
            so_tiet = ws_teacher.cell(r, col_map['so_tiet']).value if col_map['so_tiet'] else 0
            try:
                so_tiet = int(so_tiet) if so_tiet is not None else 0
            except:
                so_tiet = 0
                
            teachers.append({
                'tt': tt if tt else len(teachers) + 1,
                'full_name': fname,
                'short_name': '',  # sẽ được điền từ bảng TKB
                'phone': phone,
                'homeroom_class': cn,
                'kiem_nhiem': kn,
                'subject_group': extract_primary_subject(pc),
                'details': pc,
                'periods_count': so_tiet
            })

    # 3. Tìm và bóc tách Sheet Thời khóa biểu Giáo viên
    entries: List[Dict[str, Any]] = []
    combined_sheets, session_sheets = find_teacher_timetable_sheets(wb)
    
    # Ưu tiên bảng tổng hợp Sáng-Chiều (SC) nếu có
    target_gv_sheets: List[Tuple[openpyxl.worksheet.worksheet.Worksheet, Tuple[int, int, int], Optional[str]]] = []
    if combined_sheets:
        for ws, ginfo in combined_sheets:
            target_gv_sheets.append((ws, ginfo, None))
    elif session_sheets:
        for ws, ginfo, sess in session_sheets:
            target_gv_sheets.append((ws, ginfo, sess))
            
    for ws_gv, (r_hdr, c_thu, c_tiet), fixed_session in target_gv_sheets:
        is_combined = (fixed_session is None)
        step = 2 if is_combined else 1
        data_start = r_hdr + 2 if is_combined else r_hdr + 1
        
        # Nhận diện cột ứng với giáo viên nào
        col_to_teacher: Dict[int, Tuple[Dict[str, Any], str]] = {}
        short_names_in_sheet: List[Tuple[int, str]] = []
        
        for c in range(max(c_thu, c_tiet) + 1, ws_gv.max_column + 1, step):
            sname = clean_str(ws_gv.cell(r_hdr, c).value)
            if sname:
                short_names_in_sheet.append((c, sname))
                
        # Khớp short name với danh sách giáo viên
        p_idx = 0
        for col_idx, sname in short_names_in_sheet:
            matched_teacher = None
            for i in range(p_idx, len(teachers)):
                t = teachers[i]
                words = t['full_name'].split()
                last_word = words[-1] if words else ''
                if (sname == last_word or 
                    sname.startswith(last_word) or 
                    sname.lower() in t['full_name'].lower().replace(' ', '')):
                    matched_teacher = t
                    t['short_name'] = sname
                    p_idx = i + 1
                    break
                    
            if not matched_teacher and p_idx < len(teachers):
                matched_teacher = teachers[p_idx]
                matched_teacher['short_name'] = sname
                p_idx += 1
                
            if matched_teacher:
                if is_combined:
                    col_to_teacher[col_idx] = (matched_teacher, 'sang')
                    col_to_teacher[col_idx + 1] = (matched_teacher, 'chieu')
                else:
                    col_to_teacher[col_idx] = (matched_teacher, fixed_session)
                    
        # Đọc dữ liệu các hàng tiết học
        current_day = 2
        for r in range(data_start, ws_gv.max_row + 1):
            day_val = ws_gv.cell(r, c_thu).value
            if day_val is not None:
                d_str = str(day_val).strip()
                # Có thể là "2", "Thứ 2", "Hai"...
                m_day = re.search(r'([2-7])', d_str)
                if m_day:
                    current_day = int(m_day.group(1))
                    
            period_val = ws_gv.cell(r, c_tiet).value
            try:
                current_period = int(str(period_val).strip())
            except:
                continue
                
            for c, (teacher, sess_key) in col_to_teacher.items():
                cell_val = clean_str(ws_gv.cell(r, c).value)
                info = classify_cell(cell_val)
                entries.append({
                    'teacher_short_name': teacher['short_name'],
                    'teacher_full_name': teacher['full_name'],
                    'day_of_week': current_day,
                    'session': sess_key,
                    'period': current_period,
                    'cell_text': cell_val,
                    'subject': info['subject'],
                    'class_name': info['class_name'],
                    'activity_type': info['activity_type']
                })

    # 4. Tìm và bóc tách Lớp học (Kết hợp 3 nguồn: sheet Lớp, cột CN của GV, và các tiết dạy)
    classes_dict: Dict[str, Dict[str, Any]] = {}
    class_sheets = find_class_timetable_sheets(wb)
    
    # Nguồn 1: Từ các sheet TKB Lớp học
    for ws_lop, (r_hdr, c_thu, c_tiet) in class_sheets:
        has_subrow = False
        if r_hdr + 1 <= ws_lop.max_row:
            sub_vals = [normalize_key(ws_lop.cell(r_hdr + 1, col).value) for col in range(max(c_thu, c_tiet) + 1, min(max(c_thu, c_tiet) + 12, ws_lop.max_column + 1))]
            if any('sáng' in x or 'sang' in x for x in sub_vals) and any('chiều' in x or 'chieu' in x for x in sub_vals):
                has_subrow = True
        step = 2 if has_subrow else 1
        
        for c in range(max(c_thu, c_tiet) + 1, ws_lop.max_column + 1, step):
            raw_cname = re.sub(r'\s+', ' ', clean_str(ws_lop.cell(r_hdr, c).value))
            if raw_cname and not raw_cname.lower().startswith('thứ') and not raw_cname.lower().startswith('tiết'):
                m = re.match(r'^([^\(\s]+)(?:\s*\((.*)\))?', raw_cname)
                c_name = m.group(1) if m else raw_cname
                c_gvcn = m.group(2) if (m and m.group(2)) else ''
                grade = c_name[:2] if len(c_name) >= 2 and c_name[:2].isdigit() else '10'
                shift = 'sang' if grade in ['11', '12'] else 'chieu'
                if c_name not in classes_dict:
                    classes_dict[c_name] = {
                        'name': c_name,
                        'full_label': raw_cname,
                        'grade': grade,
                        'shift': shift,
                        'homeroom_teacher': c_gvcn
                    }

    # Nguồn 2: Từ phân công Chủ nhiệm (CN) của các giáo viên
    for t in teachers:
        cn = t.get('homeroom_class')
        if cn and cn not in classes_dict:
            grade = cn[:2] if len(cn) >= 2 and cn[:2].isdigit() else '10'
            shift = 'sang' if grade in ['11', '12'] else 'chieu'
            short = t.get('short_name') or (t['full_name'].split()[-1] if t['full_name'] else '')
            classes_dict[cn] = {
                'name': cn,
                'full_label': f"{cn} ({short})" if short else cn,
                'grade': grade,
                'shift': shift,
                'homeroom_teacher': short
            }
        elif cn and cn in classes_dict and not classes_dict[cn]['homeroom_teacher']:
            short = t.get('short_name') or (t['full_name'].split()[-1] if t['full_name'] else '')
            classes_dict[cn]['homeroom_teacher'] = short
            classes_dict[cn]['full_label'] = f"{cn} ({short})" if short else cn

    # Nguồn 3: Từ các tiết dạy trong TKB (Toán - 10A5)
    for e in entries:
        cls = e.get('class_name')
        if cls and cls not in ['Toàn trường', 'Toan truong'] and cls not in classes_dict:
            grade = cls[:2] if len(cls) >= 2 and cls[:2].isdigit() else '10'
            shift = 'sang' if grade in ['11', '12'] else 'chieu'
            classes_dict[cls] = {
                'name': cls,
                'full_label': cls,
                'grade': grade,
                'shift': shift,
                'homeroom_teacher': ''
            }

    # Sắp xếp danh sách lớp có thứ tự: Khối 10, Khối 11, Khối 12, theo tên A->Z
    def class_sort_key(c):
        grade_num = int(c['grade']) if c['grade'].isdigit() else 99
        return (grade_num, c['name'])

    sorted_classes = sorted(classes_dict.values(), key=class_sort_key)

    return {
        'metadata': metadata,
        'teachers': teachers,
        'entries': entries,
        'classes': sorted_classes
    }

if __name__ == '__main__':
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    data = parse_timetable_file('Mau_ThoiKhoaBieu_Excel/TKB_Mau_THPT_NguyenHue.xlsx')
    print("Parsed Metadata:", data['metadata'])
    print(f"Parsed Teachers: {len(data['teachers'])}")
    print(f"Parsed Timetable Entries: {len(data['entries'])}")
    print(f"Parsed Classes: {len(data['classes'])}")
