@echo off
echo ========================================
echo   Starting Local Test Server
echo ========================================
echo.

echo Checking Chrome installation...
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo ✅ Chrome found at: C:\Program Files\Google\Chrome\Application\chrome.exe
) else (
    echo ⚠️  Chrome not found at default location
    echo    Please update CHROME_PATH in .env file
    echo.
    pause
    exit /b 1
)

echo.
echo Starting server...
echo.
echo ========================================
echo   Server will start on http://localhost:5000
echo   Press Ctrl+C to stop
echo ========================================
echo.

npm run dev
