@echo off
title Push SIFT to GitHub
echo ===================================================
echo   SIFT GitHub Deployment Assistant
echo ===================================================
echo.

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed on your computer.
    echo Please download and install Git from: https://git-scm.com/
    pause
    exit /b
)

:: Prompt for GitHub repository URL
set /p REPO_URL="Enter your GitHub Repository URL (e.g., https://github.com/username/repo-name.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] Repository URL cannot be empty.
    pause
    exit /b
)

echo.
echo Initializing local Git repository...
if not exist .git (
    git init
)

:: Setup default user identity if not already configured
git config user.email >nul 2>nul
if %errorlevel% neq 0 (
    echo Configuring local user identity for Git...
    git config user.email "candidate-assessor@srm.edu"
    git config user.name "SRM Assessment Admin"
)

echo Adding files to git...
git add .

echo Creating initial commit...
git commit -m "Configure SIFT for Render deployment"

echo Renaming branch to main...
git branch -M main

echo Setting remote origin...
git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

echo Pushing code to GitHub...
echo (If prompted, please log in to your GitHub account in the popup window)
git push -u origin main -f

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo [SUCCESS] Code successfully pushed to GitHub!
    echo ===================================================
    echo.
    echo Next steps:
    echo 1. Go to https://dashboard.render.com/ and click "New Web Service".
    echo 2. Connect your GitHub repository.
    echo 3. Set Build Command: npm run build
    echo 4. Set Start Command: npm start
    echo 5. Add Environment Variable:
    echo    LLM_PROVIDER = anthropic
    echo    ANTHROPIC_API_KEY = (your Claude API key)
    echo.
) else (
    echo.
    echo [ERROR] Failed to push code to GitHub. Please check the error message above.
)

pause
