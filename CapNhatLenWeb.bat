@echo off
chcp 65001 >nul
echo =================================================================
echo    ĐỒNG BỘ THỜI KHÓA BIỂU MỚI LÊN TRANG WEB THPT NGUYỄN HUỆ
echo =================================================================
echo.
echo 1. Đang kiểm tra dữ liệu thời khóa biểu mới nhất...
copy /Y tkb_database.db SourceCode\tkb_database.db >nul

echo 2. Đang gửi dữ liệu lên máy chủ Web Render...
git add tkb_database.db SourceCode/tkb_database.db
git commit -m "Cập nhật cơ sở dữ liệu Thời khóa biểu mới"
git push origin main

echo.
echo =================================================================
echo    ĐÃ ĐỒNG BỘ THÀNH CÔNG LÊN ĐÁM MÂY!
echo    Trang web https://tkb-thpt-nguyenhue.onrender.com
echo    sẽ tự động cập nhật dữ liệu mới trong khoảng 1 phút.
echo =================================================================
echo.
pause
