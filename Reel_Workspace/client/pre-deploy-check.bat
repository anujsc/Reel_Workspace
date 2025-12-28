@echo off
echo.
echo 🔍 Pre-Deployment Checklist for Frontend
echo ==========================================
echo.

REM Check if .env exists
if exist ".env" (
    echo ✅ .env file exists
    
    REM Check if VITE_API_BASE_URL is set
    findstr /C:"VITE_API_BASE_URL" .env >nul
    if %errorlevel% equ 0 (
        echo ✅ VITE_API_BASE_URL is configured
        
        REM Show the URL
        for /f "tokens=2 delims==" %%a in ('findstr "VITE_API_BASE_URL" .env') do (
            echo    URL: %%a
        )
    ) else (
        echo ❌ VITE_API_BASE_URL not found in .env
        exit /b 1
    )
) else (
    echo ❌ .env file not found
    exit /b 1
)

echo.
echo 📦 Testing build...
call npm run build

if %errorlevel% equ 0 (
    echo.
    echo ✅ Build successful!
    echo.
    echo 📊 Build output:
    dir dist
    echo.
    echo 🎉 Ready for deployment!
    echo.
    echo Next steps:
    echo 1. git add .
    echo 2. git commit -m "Prepare frontend for deployment"
    echo 3. git push origin main
    echo 4. Deploy on Render dashboard
) else (
    echo.
    echo ❌ Build failed. Fix errors before deploying.
    exit /b 1
)
