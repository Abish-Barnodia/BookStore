@echo off
REM Starts backend, frontend, and admin in separate windows
cd /d "%~dp0"
echo Starting BACKEND on port 8000...
start "Ecommerce API" /D "%~dp0backend" cmd /k npm run dev
REM Wait until API port is up so Vite proxy (/api/health) does not get ECONNREFUSED
timeout /t 5 /nobreak >nul
echo Starting FRONTEND (Vite) on port 5173...
start "Ecommerce Frontend" /D "%~dp0frontend" cmd /k npm run dev
echo Starting ADMIN (Vite) on port 5174...
start "Ecommerce Admin" /D "%~dp0admin" cmd /k npm run dev
echo.
echo Three windows opened. Leave them running while you use the site.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo Admin: http://localhost:5174
pause
