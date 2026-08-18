@echo off
title SIFT AI Resume Shortlisting Engine
echo ===================================================
echo   SIFT AI Resume Shortlisting Engine
echo ===================================================
echo.

where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo [!] Node.js / npm is NOT installed on this laptop.
  echo [!] Please download and install Node.js from: https://nodejs.org
  echo [!] After installing Node.js, restart your laptop and run start-local.bat again.
  echo.
  pause
  exit /b
)

echo Installing dependencies (if needed)...
call npm install
echo.
echo Starting Local Dev Server (Express Backend + React Frontend)...
call npm run dev
pause
