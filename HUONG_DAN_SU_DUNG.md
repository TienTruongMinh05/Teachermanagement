# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG GIÁM SÁT THỜI KHÓA BIỂU
**TRƯỜNG TRUNG HỌC PHỔ THÔNG NGUYỄN HUỆ**  
*(Dành cho Thầy Hiệu trưởng và Ban Giám hiệu nhà trường)*

---

## 1. Khởi động và Thoát Phần Mềm

### 1.1. Khởi động phần mềm
- Thầy chỉ cần bấm đúp chuột vào tệp tin **`QuanLyGiaoVien.exe`**.
- Cửa sổ phần mềm giám sát thời khóa biểu sẽ mở ra ngay lập tức dưới dạng ứng dụng chuyên dụng độc lập.
- Không cần cài đặt Python, không cần kết nối mạng Internet.

### 1.2. Thoát phần mềm
- **Cách 1**: Bấm vào nút **"Cài đặt"** ở góc trên bên phải thanh tiêu đề -> Chọn mục **"Thoát chương trình"** màu đỏ, sau đó bấm *Xác nhận Thoát*.
- **Cách 2**: Bấm nút dấu nhân **[X]** ở góc trên cùng bên phải của cửa sổ phần mềm.
- Hệ thống sẽ lưu trữ toàn bộ dữ liệu an toàn trước khi đóng.

---

## 2. Giao diện Thanh Tiêu đề & Menu Cài đặt Mới

Thanh tiêu đề phía trên cùng của ứng dụng được tối ưu hóa đồng bộ và hiện đại:

### 2.1. Hai Tab Chuyển đổi Trung tâm Quản lý
Nằm ngay ngắn ở góc trên bên phải thanh tiêu đề:
- Nút **"Giáo Viên"**: Chuyển sang trung tâm giám sát và điều hành đội ngũ 111 cán bộ, giáo viên toàn trường.
- Nút **"Lớp học"**: Chuyển sang trung tâm giám sát tiến độ học tập và thời khóa biểu của 56 lớp học (Khối 10, Khối 11, Khối 12).

### 2.2. Nút Danh mục "Cài đặt"
Toàn bộ các tác vụ cấu hình hệ thống được quy tụ gọn gàng vào nút danh mục **"Cài đặt"** (bên cạnh tab Lớp học):
- **Nạp file TKB (Excel)**: Mở hộp thoại nạp tệp thời khóa biểu mới khi trường có cập nhật lịch học.
- **Khung giờ học**: Mở cửa sổ điều chỉnh giờ vào/tan của 10 tiết học chuẩn trong ngày.
- **Hướng dẫn sử dụng**: Mở tài liệu hướng dẫn và cẩm nang chi tiết ngay trong ứng dụng.
- **Thoát chương trình**: Đóng phần mềm an toàn.

---

## 3. Đồng bộ Thời gian Thực & Xử lý Ngoài Khung Giờ Học

Hệ thống được trang bị thuật toán đồng bộ thời gian thực theo lịch đồng hồ máy tính, tự động xác định chính xác thời điểm và trạng thái hoạt động của trường:

1. **Trong giờ học**: Hệ thống hiển thị rõ ràng Tiết học đang diễn ra (ví dụ: *Tiết 2 Sáng (07:50 - 08:35)*) và thống kê chính xác số giáo viên đang đứng lớp, số lớp đang học.
2. **Sau khi kết thúc buổi học chiều / Ban đêm (Sau 17:35)**:
   - Hệ thống tự động chuyển trạng thái: *"Đã kết thúc buổi học chiều (Sau 17:35) - Hết giờ dạy"*.
   - Số lượng giáo viên đang đứng lớp và số lớp đang học được cập nhật ngay lập tức về **0**.
   - Toàn bộ giáo viên được chuyển sang trạng thái hết giờ làm việc/nghỉ ngơi, giải quyết triệt để vấn đề báo sai số lượng giáo viên giảng dạy ngoài giờ.
3. **Giờ nghỉ trưa (11:20 - 13:15)**:
   - Hệ thống thông báo rõ: *"Giờ nghỉ trưa (Buổi Chiều bắt đầu lúc 13:15)"*.
   - Số lượng đứng lớp tự động hiển thị 0 giáo viên.
4. **Trước giờ vào học buổi Sáng (Trước 07:00)**:
   - Hệ thống hiển thị: *"Chưa vào học buổi Sáng (Bắt đầu lúc 07:00)"*.
5. **Ngày Chủ nhật**:
   - Hệ thống tự động nhận diện lịch: *"Chủ nhật - Toàn trường nghỉ"*.
   - Hiển thị 0 giáo viên đứng lớp và 0 lớp học, đảm bảo tính chuẩn xác và trung thực tuyệt đối.

---

## 4. Quản lý Thời Khóa Biểu Theo Giáo Viên

### 4.1. Quy ước Màu sắc Trạng thái Giáo viên
| Viền Màu | Trạng Thái | Ý Nghĩa & Mục Đích |
| :---: | :--- | :--- |
| **Viền Xanh Lá** | **Đang Đứng Lớp** | Giáo viên đang có tiết dạy. Hiển thị rõ môn học và lớp đang học (ví dụ: *Toán - 12A1*, *Văn - 10A5*). |
| **Viền Đỏ** | **Đang Rảnh / Trống Tiết** | Giáo viên không có lịch dạy tại thời điểm này. Dùng để tìm người dạy thay hoặc mời hội ý. |
| **Viền Vàng** | **Chào Cờ** | Toàn trường đang tham gia hoạt động Chào cờ đầu tuần. |
| **Viền Cam** | **Giao Ban / Hội Ý** | Tiết họp giao ban chuyên môn hoặc sinh hoạt của nhà trường. |

### 4.2. Ba Chế độ Xem Linh hoạt
- **Dạng Thẻ (Mặc định)**:
  - Thẻ đầy đủ thông tin: Họ và tên, Mã viết tắt trên TKB, **Số điện thoại liên lạc**, Tổ chuyên môn, Lớp chủ nhiệm, Định mức số tiết dạy trong tuần.
  - Dòng *Điện thoại* hiển thị số máy kèm nút **"Chép"** (sao chép nhanh số điện thoại) hoặc bấm gọi trực tiếp.
  - Nút **"Xem TKB tuần"**: Mở bảng thời khóa biểu cả tuần của riêng giáo viên đó.
- **Dạng Lưới (Album bao quát)**:
  - Các ô thẻ thu nhỏ xếp liền nhau theo dạng lưới gọn gàng.
  - Hiển thị trực tiếp **Số điện thoại** ngay dưới tên từng giáo viên.
  - Cho phép nhìn bao quát cùng lúc toàn bộ **111 giáo viên** trên một màn hình mà không cần cuộn trang nhiều lần.
- **Dạng Bảng (Bảng TKB Toàn trường)**:
  - Ma trận toàn bộ các tiết học từ Thứ 2 đến Thứ 7.
  - Ô tiết học đang diễn ra trong thực tế sẽ **phát sáng viền xanh dương**.
  - Mỗi ô hiển thị: *Đang dạy: X GV*, *Đang rảnh: Y GV*.
  - Bấm vào bất kỳ ô nào để xem danh sách chi tiết (kèm số điện thoại từng thầy cô).

### 4.3. Bố trí Dạy Thay Nhanh Chóng
1. Chuyển sang **Dạng Bảng** (hoặc chọn Thứ và Tiết cần bố trí dạy thay trên thanh điều khiển).
2. Bấm chuột vào ô tiết học đó.
3. Hộp thoại chi tiết mở ra, Thầy bấm sang tab **"Đang rảnh / Trống tiết"**.
4. Bấm nút **"Sao chép danh sách"**. Hệ thống tự động sao chép toàn bộ họ tên, tổ bộ môn, và số điện thoại của các thầy cô đang rảnh vào bộ nhớ tạm.
5. Thầy dán (Paste / `Ctrl + V`) danh sách này vào Zalo hoặc tin nhắn gửi cho bộ phận học vụ để liên hệ phân công dạy thay ngay.

---

## 5. Quản lý Thời Khóa Biểu Theo Lớp Học

Bấm vào tab **"Lớp học"** ở thanh tiêu đề trên cùng để chuyển sang giao diện điều hành học tập của học sinh:

### 5.1. Thống kê Toàn trường Theo Lớp Học
Ba ô chỉ số KPI trên cùng cập nhật theo thời gian thực:
- **Đang có tiết học**: Số lượng lớp đang học tập tại phòng học theo thời khóa biểu.
- **Trống tiết / Buổi nghỉ**: Số lượng lớp không có tiết học tại khung giờ hiện tại.
- **Tổng số lớp học**: Tổng số 56 lớp thuộc 3 khối (10, 11, 12).
- Thầy có thể bấm chuột trực tiếp vào từng ô chỉ số này để lọc danh sách hiển thị tương ứng.

### 5.2. Thanh Bộ Lọc Lớp Học Đa Chiều
Thầy có thể kết hợp nhiều điều kiện lọc để tra cứu tức thì:
- **Ô Tìm kiếm**: Tìm theo tên lớp (ví dụ: *10B21*, *12A1*), tên môn học (*Toán*, *Vật lí*), tên Giáo viên bộ môn (*Trào*, *Hà*), hoặc tên Giáo viên Chủ nhiệm.
- **Lọc Khối**: Phân loại theo *Khối 10*, *Khối 11*, *Khối 12*, hoặc *Tất cả các khối*.
- **Lọc Môn học**: Lọc nhanh các lớp đang học môn cụ thể (Toán, Ngữ văn, Tiếng Anh, Vật lí, Hóa học, Sinh học, Lịch sử, Địa lí, Tin học, GDTC...).
- **Lọc Giáo viên Chủ nhiệm (GVCN)**: Danh sách đầy đủ toàn bộ giáo viên chủ nhiệm của 56 lớp để Thầy dễ dàng tra cứu lớp của từng thầy cô.
- **Lọc Trạng thái**: Lọc các lớp *Đang học*, *Trống tiết*, hoặc *Tất cả*.
- **Chế độ xem**: Tùy chọn xem theo *Thời gian thực* (theo đồng hồ hiện tại) hoặc *Tùy chọn Thứ/Tiết* để xem trước lịch học của các buổi khác trong tuần.

### 5.3. Ba Chế độ Xem Lớp Học
- **Dạng Thẻ Lớp Học**:
  - Mỗi lớp hiển thị trang trọng với tên lớp, phù hiệu Khối học, tên **Giáo viên Chủ nhiệm** (kèm số điện thoại liên lạc của GVCN).
  - Chi tiết tiết học: Môn học đang diễn ra, **Giáo viên bộ môn đang giảng dạy** (kèm số điện thoại), và thông tin phòng học.
  - Nút **"Xem TKB lớp"**: Bấm vào để mở bảng thời khóa biểu cả tuần (10 tiết x 6 ngày) của riêng lớp đó.
- **Dạng Lưới Lớp Học**:
  - Giao diện cô đọng, hiển thị cùng lúc 56 lớp học trên một màn hình bao quát.
  - Viền xanh lá biểu thị lớp đang học; viền đỏ/xám biểu thị lớp đang trống tiết.
  - Bấm vào bất kỳ ô nào để mở ngay Thời khóa biểu tuần của lớp.
- **Dạng Bảng Ma Trận Lớp Học**:
  - Bảng tổng hợp toàn trường 10 tiết x 6 ngày (Thứ 2 đến Thứ 7).
  - Mỗi ô hiển thị: *Số lớp đang học*, *Số lớp trống tiết*.
  - **Bấm vào từng ô trên bảng**: Mở cửa sổ danh sách chi tiết các lớp đang học môn gì, giáo viên nào dạy, và danh sách các lớp đang trống tiết. Có sẵn nút **"Sao chép DS lớp trống"** tiện lợi.
  - **Tra cứu TKB nhanh từng lớp**: Tại góc trên Dạng Bảng có ô chọn lớp để Thầy xem trực tiếp thời khóa biểu chi tiết của lớp đó mà không cần rời khỏi màn hình.

---

## 6. Điều chỉnh Khung Giờ Học (Cấu trúc 10 Tiết Chuẩn)

Tính năng phục vụ công tác quản trị của Ban Giám hiệu khi nhà trường chuyển đổi giờ vào học, giờ tan học giữa các mùa:

### 6.1. Cấu trúc 10 tiết cố định
- Hệ thống **giữ nguyên cấu trúc chuẩn 10 tiết/ngày** (Buổi Sáng: Tiết 1 đến Tiết 5; Buổi Chiều: Tiết 1 đến Tiết 5).
- Chỉ cho phép chỉnh sửa khung thời gian (giờ bắt đầu và giờ kết thúc), đảm bảo tính toàn vẹn của chương trình học vụ.

### 6.2. Hai cách điều chỉnh linh hoạt
- **Cách 1: Sửa nhanh trực tiếp trên bảng (Dạng Bảng)**:
  1. Chuyển sang chế độ xem **Dạng Bảng**.
  2. Bấm chuột trực tiếp vào ô **Tiết** (ví dụ: *Tiết 1*) hoặc ô **Khung giờ** (ví dụ: *07:00 - 07:45*) ở cột bên trái.
  3. Ngay tại ô đó sẽ hiện hộp nhập giờ: Thầy gõ trực tiếp giờ bắt đầu và giờ kết thúc.
  4. Bấm nút **Lưu** (hoặc nhấn phím **Enter**) để lưu ngay lập tức.
- **Cách 2: Quản lý toàn bộ 10 tiết trong hộp thoại chuyên dụng**:
  1. Bấm vào nút **"Cài đặt"** trên thanh tiêu đề -> Chọn **"Khung giờ học"** (hoặc bấm nút *Chỉnh sửa khung giờ* ở Dạng Bảng).
  2. Cửa sổ mở ra hiển thị đầy đủ danh sách 10 tiết học của ca Sáng và ca Chiều.
  3. Thầy có thể nhập thủ công bàn phím định dạng `HH:MM` (ví dụ: `07:15`, `08:00`) cho từng tiết.
  4. Bấm nút **"Lưu tất cả thay đổi"** ở góc dưới để áp dụng đồng loạt.

### 6.3. Tự động tính toán giờ ra chơi & nghỉ trưa
- Ngay khi thay đổi giờ học của các tiết, hệ thống tự động tính toán lại:
  - Giờ ra chơi buổi Sáng (hết Tiết 2 đến bắt đầu Tiết 3 Sáng).
  - Giờ nghỉ trưa (hết Tiết 5 Sáng đến bắt đầu Tiết 1 Chiều).
  - Giờ ra chơi buổi Chiều (hết Tiết 2 đến bắt đầu Tiết 3 Chiều).
- Đồng hồ giám sát và huy hiệu nhận diện thời gian thực trên thanh tiêu đề sẽ tự động chuyển tiết chuẩn xác theo khung giờ mới.

### 6.4. Khôi phục giờ chuẩn mặc định
- Nếu nhập nhầm hoặc muốn quay lại khung giờ gốc ban đầu (Sáng: 07:00 - 11:20; Chiều: 13:15 - 17:35), Thầy chỉ cần mở hộp thoại Khung giờ học và bấm nút **"Khôi phục giờ chuẩn"** màu đỏ.

---

## 7. Nạp File Thời Khóa Biểu Mới & Tự Động Nhận Diện Dữ Liệu

Khi nhà trường ban hành thời khóa biểu mới:
1. Bấm nút **"Cài đặt"** trên thanh tiêu đề -> Chọn **"Nạp file TKB (Excel)"**.
2. Bấm nút **"Chọn file Excel"** (hoặc kéo thả file Excel mới vào ô).
3. Bấm **"Bắt đầu Nạp file"**.
4. **Cơ chế nhận diện thông minh & trung thực**:
   - Hệ thống quét động toàn bộ các bảng trong tệp Excel: tự động nhận diện danh sách giáo viên, danh sách lớp học, phân công giảng dạy và phân công chủ nhiệm.
   - Tự động tìm kiếm cột số điện thoại dựa trên các từ khóa thông dụng (*Điện thoại*, *SĐT*, *Phone*, *Mobile*, *Liên hệ*...).
   - Nếu tệp Excel không có thông tin số điện thoại, hệ thống sẽ hiển thị *Không tìm thấy* màu xám trang nhã. Tuyệt đối **không tự tạo hoặc suy đoán số điện thoại ngẫu nhiên**, bảo đảm tính chuẩn xác và trung thực tuyệt đối.

---

**Bản quyền hệ thống**:  
&copy; Trương Minh Tiến - Eastern International University  
*Hệ thống giám sát thời khóa biểu chuyên biệt - THPT Nguyễn Huệ*
