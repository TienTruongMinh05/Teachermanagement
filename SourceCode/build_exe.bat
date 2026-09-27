@echo off
chcp 65001 >nul
title ĐÓNG GÓI ỨNG DỤNG QUẢN LÝ GIÁO VIÊN
echo =======================================================================
echo          BẮT ĐẦU ĐÓNG GÓI QUANLYGIAOVIEN.EXE (STANDALONE)
echo =======================================================================
echo.
echo [1/3] Đang biên dịch mã nguồn với PyInstaller...
pyinstaller --noconfirm --onefile --windowed --name "QuanLyGiaoVien" --add-data "static;static" --collect-all uvicorn --collect-all webview desktop_main.py

echo.
echo [2/3] Đang sao chép file thực thi ra thư mục chính...
copy /y dist\QuanLyGiaoVien.exe ..\QuanLyGiaoVien.exe

echo.
echo [3/3] Đang dọn dẹp các tệp tin tạm thời...
rmdir /s /q build
rmdir /s /q dist

echo.
echo =======================================================================
echo  ĐÃ ĐÓNG GÓI THÀNH CÔNG! File mới đã được cập nhật tại thư mục gốc:
echo  ..\QuanLyGiaoVien.exe
echo =======================================================================
pause
