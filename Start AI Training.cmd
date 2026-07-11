@echo off
setlocal
cd /d "%~dp0"
title AI Practice Lab

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo AI Practice Lab needs Node.js 22 or newer.
  echo Install Node.js, then double-click this file again.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo npm was not found. Reinstall Node.js with npm included, then try again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Preparing AI Practice Lab for first use...
  call npm install
  if errorlevel 1 (
    echo.
    echo Setup did not finish. Review the message above, then try again.
    pause
    exit /b 1
  )
)

echo.
echo Starting AI Practice Lab at http://localhost:3000
echo Keep this window open while you use the training.
echo Press Ctrl+C here when you are finished.
echo.

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000'"
call npm run dev

