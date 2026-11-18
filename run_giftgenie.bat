@echo off
title GiftGenie Local Server
cd /d "%~dp0"
echo ========================================================
echo   GiftGenie - Personalized Gift Recommendation System
echo ========================================================
echo Starting local development server...
echo.

:: Automatically open browser after 1 second
start "" cmd /c "timeout /t 1 /nobreak >nul && start http://localhost:8000"

:: Start the server with Node.js
node server.js

pause

