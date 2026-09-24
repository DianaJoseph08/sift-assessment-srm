@echo off
title Push CogniHire to GitHub for Google Cloud Deployment
echo =========================================================
echo   CogniHire - Google Cloud Deployment Assistant
echo   Target Account: sureshscience@gmail.com
echo =========================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not found in PATH.
    pause
    exit /b
)

echo 1. Staging updated project files (Dockerfile, client, server)...
git add .

echo 2. Committing changes...
git commit -m "Configure CogniHire for Google Cloud Run / Compute Engine deployment"

echo 3. Pushing to GitHub (origin main)...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo =========================================================
    echo [SUCCESS] Code successfully pushed to GitHub!
    echo =========================================================
    echo.
    echo Next Steps in Google Cloud (sureshscience@gmail.com):
    echo.
    echo OPTION A: Google Cloud Run (Fastest Serverless)
    echo 1. Open Google Cloud Console: https://console.cloud.google.com/
    echo 2. Click the Cloud Shell icon [>_] in the top right.
    echo 3. Run:
    echo    git clone https://github.com/DianaJoseph08/sift-assessment-srm.git
    echo    cd sift-assessment-srm
    echo    gcloud run deploy cognihire --source . --region us-central1 --allow-unauthenticated
    echo.
    echo OPTION B: Compute Engine (Free Tier VM with permanent SQLite)
    echo Refer to GCP_DEPLOYMENT_GUIDE.md for step-by-step instructions.
    echo.
) else (
    echo.
    echo [NOTICE] Push failed or already up to date. Check message above.
)

pause
