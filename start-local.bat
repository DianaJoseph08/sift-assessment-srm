@echo off
title SIFT AI Resume Shortlisting Engine
echo ===================================================
echo   SIFT AI Resume Shortlisting & Candidate Matcher
echo ===================================================
echo.
echo Installing dependencies (if needed)...
call npm install
echo.
echo Starting Local Dev Server (Express Backend + React Frontend)...
call npm run dev
pause
