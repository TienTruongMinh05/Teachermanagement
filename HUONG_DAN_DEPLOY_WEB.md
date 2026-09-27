# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG THỜI KHÓA BIỂU LÊN WEB
**TRƯỜNG TRUNG HỌC PHỔ THÔNG NGUYỄN HUỆ**  
*(Sử dụng Render.com & Xác thực Google Login - Miễn phí 100%)*

---

## 1. Tổng Quan Kiến Trúc Khi Lên Web

Hệ thống được thiết kế theo đúng yêu cầu tối giản và an toàn nhất cho nhà trường:
- **Chế độ quan sát (View-Only)**: Giáo viên và Ban Giám hiệu có thể mở link trên điện thoại hoặc máy tính để tra cứu thời gian thực mọi lúc, mọi nơi.
- **Bảo mật nội bộ bằng Google Login**: Chỉ những ai có tài khoản Google được cấp phép (hoặc email giáo viên nhà trường) mới xem được bảng thời khóa biểu.
- **Độc lập với bản Desktop**: Bản phần mềm máy tính (`QuanLyGiaoVien.exe`) vẫn hoạt động offline bình thường mà không cần đăng nhập Google.

---

## 2. Phần A: Lấy Mã Google Client ID (Mất 3 Phút)

Để người dùng có thể bấm nút **"Đăng nhập bằng Google"**, Thầy chỉ cần tạo một khóa xác thực Google Client ID miễn phí từ Google:

1. **Truy cập**: Vào trang quản trị Google Cloud: [https://console.cloud.google.com/](https://console.cloud.google.com/) và đăng nhập bằng tài khoản Google của Thầy.
2. **Tạo Dự Án Mới (Project)**:
   - Bấm vào menu chọn dự án ở góc trên bên trái -> Bấm **"New Project"** (Dự án mới).
   - Đặt tên: `TKB THPT Nguyen Hue` -> Bấm **Create**.
3. **Cấu Hình Màn Hình Đồng Ý (OAuth Consent Screen)**:
   - Tại menu bên trái, vào **APIs & Services** -> Chọn **OAuth consent screen**.
   - **Lựa chọn loại người dùng (User Type)**:
     - **Nếu Thầy dùng tài khoản Google do Sở cấp (@ninhthuan.edu.vn)**: Chọn **Internal (Nội bộ)** -> Bấm **Create**. *(Google sẽ tự động khóa, chỉ tài khoản @ninhthuan.edu.vn mới đăng nhập được, hoàn toàn tự động)*.
     - **Nếu Thầy dùng Gmail cá nhân để tạo dự án**: Chọn **External (Bên ngoài)** -> Bấm **Create**. *(Code máy chủ của trường chúng ta đã lập trình sẵn để chặn các email khác, chỉ cho phép @ninhthuan.edu.vn)*.
   - Nhập:
     - **App name**: `TKB Nguyen Hue`
     - **User support email**: Chọn email của Thầy.
     - **Developer contact information**: Nhập email của Thầy.
   - Bấm **Save and Continue** qua các bước tiếp theo đến khi hoàn thành.
   - Nếu chọn External: Tại mục *Publishing status*, bấm nút **"Publish App"** để chuyển sang trạng thái hoạt động công khai (Production).
4. **Tạo Khóa OAuth Client ID**:
   - Vào mục **Credentials** (Thông tin xác thực) -> Bấm **+ Create Credentials** -> Chọn **OAuth client ID**.
   - **Application type**: Chọn **Web application**.
   - **Name**: `TKB Web Client`.
   - **Authorized JavaScript origins** (Nguồn gốc JavaScript được phép):
     - Bấm *+ Add URI* và thêm:
       - `http://localhost:8000` (để thử nghiệm trên máy)
       - `https://tkb-nguyenhue.onrender.com` (hoặc tên miền Render của trường sau khi tạo ở Phần B)
   - Bấm **Create**.
5. **Lưu Lại Client ID**:
   - Google sẽ hiển thị một chuỗi ký tự dạng:  
     `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - Thầy sao chép (Copy) lại chuỗi này để dán vào cấu hình máy chủ ở Phần B.

---

## 3. Phần B: Triển Khai Lên Render.com (Miễn Phí 100%)

Render.com là nền tảng máy chủ đám mây hiện đại, hỗ trợ tự động chạy ứng dụng Python FastAPI 24/7.

### Bước 1: Đưa mã nguồn lên GitHub (Chế độ Riêng tư / Private)
1. Đăng ký/đăng nhập tài khoản tại [https://github.com/](https://github.com/).
2. Tạo một kho lưu trữ mới (**New repository**):
   - Đặt tên: `tkb-thpt-nguyenhue`.
   - Chọn chế độ **Private** (Riêng tư - chỉ Thầy mới xem được code và dữ liệu).
3. Mở cửa sổ dòng lệnh (Terminal / PowerShell) tại thư mục phần mềm trên máy và gõ các lệnh sau để tải code lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "Khoi tao he thong TKB Nguyen Hue Web"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan-github-cua-thay>/tkb-thpt-nguyenhue.git
   git push -u origin main
   ```

### Bước 2: Tạo Dịch Vụ Web Trên Render.com
1. Đăng nhập vào [https://render.com/](https://render.com/) (có thể chọn đăng nhập nhanh bằng GitHub).
2. Tại trang tổng quan (Dashboard), bấm nút **New +** ở góc trên -> Chọn **Web Service**.
3. Chọn kho lưu trữ GitHub `tkb-thpt-nguyenhue` mà Thầy vừa tạo -> Bấm **Connect**.
4. Điền các thông số cấu hình cơ bản:
   - **Name**: `tkb-nguyenhue` (hoặc tên viết tắt tùy ý của trường).
   - **Region**: Chọn **Singapore** (vị trí gần Việt Nam nhất, tốc độ tải nhanh nhất).
   - **Root Directory**: `SourceCode`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Chọn gói **Free** ($0/tháng).

### Bước 3: Cài Đặt Biến Môi Trường (Environment Variables)
Cuộn xuống phần **Environment Variables**, bấm **Add Environment Variable** để thêm các dòng sau:

| Tên Biến (Key) | Giá Trị (Value) | Giải Thích |
| :--- | :--- | :--- |
| `AUTH_ENABLED` | `true` | Bật chế độ bắt buộc đăng nhập tài khoản khi vào web |
| `GOOGLE_CLIENT_ID` | `<Chuỗi Client ID lấy ở Phần A>` | Mã xác thực đăng nhập Google |
| `ALLOWED_DOMAINS` | `ninhthuan.edu.vn` | **Chỉ chấp nhận email có đuôi `@ninhthuan.edu.vn`** (Đã được đặt sẵn mặc định trong hệ thống) |
| `ALLOWED_EMAILS` | *(để trống hoặc `*`)* | Để trống để dùng bộ lọc tên miền ở trên; hoặc nhập `*` nếu muốn mở quyền cho mọi Gmail; hoặc nhập danh sách email chỉ định |
| `ALLOW_DEMO_LOGIN` | `true` *(hoặc `false`)* | Bật/tắt nút đăng nhập thử nghiệm (dành cho Ban Giám hiệu kiểm tra) |
| `SESSION_SECRET` | `tkb_nguyenhue_mat_khau_bao_mat_2026` | Chuỗi khóa bí mật mã hóa phiên làm việc |

5. Bấm nút **Create Web Service** ở cuối trang.
6. Render sẽ tiến hành cài đặt trong khoảng 2 phút. Khi màn hình hiện chữ **`Live`** màu xanh lá, trang web của trường đã chính thức hoạt động!
7. Đường dẫn web chính thức sẽ có dạng:  
   **`https://tkb-nguyenhue.onrender.com`**

> [!NOTE]
> Sau khi có đường dẫn chính thức (ví dụ: `https://tkb-nguyenhue.onrender.com`), Thầy nhớ quay lại Google Cloud Console (Phần A - bước 4) thêm đường dẫn này vào mục **Authorized JavaScript origins** để Google cho phép đăng nhập từ tên miền này.

---

## 4. Phần C: Cách Dùng Như Một Ứng Dụng Trên Điện Thoại

Thầy cô và Ban Giám hiệu không cần cài app từ App Store hay CH Play:
1. Mở trình duyệt (Safari trên iPhone hoặc Chrome trên Android).
2. Truy cập vào địa chỉ web của trường: `https://tkb-nguyenhue.onrender.com`.
3. Bấm **"Đăng nhập bằng Google"**.
4. **Cài icon ra màn hình chính (Dùng như App)**:
   - Trên **iPhone (Safari)**: Bấm nút **Chia sẻ** (biểu tượng ô vuông mũi tên chỉ lên) -> Chọn **"Thêm vào MH chính"** (Add to Home Screen).
   - Trên **Android (Chrome)**: Bấm nút **3 dấu chấm** ở góc trên -> Chọn **"Thêm vào màn hình chính"** (Add to Home screen).
5. Ngay lập tức trên màn hình điện thoại sẽ xuất hiện biểu tượng thời khóa biểu của trường. Mỗi lần bấm vào sẽ mở toàn màn hình mượt mà như một ứng dụng độc lập.

---

**Bản quyền hệ thống**:  
&copy; Trương Minh Tiến - Eastern International University  
*Hệ thống giám sát thời khóa biểu chuyên biệt - THPT Nguyễn Huệ*
