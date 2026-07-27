@echo off
setlocal
title Meituan Trial Demo Launcher
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto no_node

if exist "node_modules\" goto start_demo

echo.
echo [1/2] Installing dependencies. Internet access is required...
call npm install
if errorlevel 1 goto install_failed

:start_demo
echo.
echo [2/2] Starting the web app, API, and local database...
echo Keep the service window open while using the demo.
start "Meituan Trial Demo Service" cmd /k "cd /d ""%~dp0"" && npm run dev"
ping 127.0.0.1 -n 7 >nul
start "" "http://127.0.0.1:5173/#/trial"
echo.
echo Demo started. Close the service window to stop it.
ping 127.0.0.1 -n 4 >nul
exit /b 0

:no_node
echo.
echo [ERROR] Node.js was not found.
echo Install Node.js 20.19 or newer, then run this file again.
echo Download: https://nodejs.org/
echo.
pause
exit /b 1

:install_failed
echo.
echo [ERROR] Dependency installation failed.
echo Check your network connection and run this file again.
echo.
pause
exit /b 1
