@echo off
echo ========================================
echo   Deploying to Render - FIXED
echo ========================================
echo.

echo Step 1: Committing changes...
git add .
git commit -m "Fix: Match Puppeteer cache paths for Render"

echo.
echo Step 2: Pushing to GitHub...
git push origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Git push failed!
    echo Please check your GitHub credentials and try again.
    pause
    exit /b 1
)

echo.
echo ✅ Code pushed to GitHub successfully!
echo.
echo ========================================
echo   IMPORTANT: Manual Steps Required
echo ========================================
echo.
echo Step 3: Go to Render Dashboard
echo   URL: https://dashboard.render.com
echo.
echo Step 4: Add environment variable:
echo   Key: PUPPETEER_CACHE_DIR
echo   Value: /opt/render/.cache/puppeteer
echo.
echo Step 5: Remove OLD environment variables (if present):
echo   - CHROME_PATH (delete this)
echo   - PUPPETEER_EXECUTABLE_PATH (delete this)
echo   - PUPPETEER_SKIP_CHROMIUM_DOWNLOAD (delete this)
echo.
echo Step 6: Wait for auto-deploy to complete
echo   (or click "Manual Deploy" button)
echo.
echo Step 7: Check build logs for:
echo   ✅ Chrome installed successfully
echo   📍 Chrome location: /opt/render/.cache/puppeteer/chrome/...
echo.
echo Step 8: Check runtime logs for:
echo   [Puppeteer] Using auto-detected Chrome from cache
echo   [Puppeteer] ✓ Browser launched successfully
echo.
echo ========================================
pause
