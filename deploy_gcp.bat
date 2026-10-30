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

echo 1. Staging updated project files (Dockerfile, client, server, db)...
git add .

echo 2. Committing changes...
git commit -m "Deploy latest CogniHire build to Google Cloud Run (asia-south1)"

echo 3. Pushing to GitHub (origin main)...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo =========================================================
    echo [SUCCESS] Code successfully pushed to GitHub!
    echo =========================================================
    echo.
    echo Next Steps in Google Cloud Shell (https://console.cloud.google.com/):
    echo.
    echo 1. Open Google Cloud Shell (click the [>_] icon in top-right)
    echo 2. Paste and run this command:
    echo.
    echo    cd ~/sift-assessment-srm ^&^& git pull origin main ^&^& gcloud run deploy cognihire --source . --region asia-south1 --allow-unauthenticated
    echo.
    echo If this is the first time cloning on Cloud Shell, run:
    echo.
    echo    git clone https://github.com/DianaJoseph08/sift-assessment-srm.git
    echo    cd sift-assessment-srm
    echo    gcloud run deploy cognihire --source . --region asia-south1 --allow-unauthenticated
    echo.
) else (
    echo.
    echo [NOTICE] Push failed or already up to date. Check message above.
)

pause
