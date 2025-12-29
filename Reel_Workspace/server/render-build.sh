#!/bin/bash

# Render Build Script - Use system Chromium

echo "🔧 Starting build process..."

# Install Node dependencies (including Puppeteer)
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Check for system Chromium (provided by Render)
if [ -f "/usr/bin/chromium" ]; then
    echo "✅ System Chromium found at /usr/bin/chromium"
    /usr/bin/chromium --version 2>/dev/null || echo "⚠️  Could not get Chromium version"
else
    echo "⚠️  System Chromium not found at /usr/bin/chromium"
    echo "    Make sure CHROME_PATH=/usr/bin/chromium is set in Render environment variables"
fi

# Verify FFmpeg (provided by Render)
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg found:"
    ffmpeg -version | head -n 1
else
    echo "⚠️  FFmpeg not found - will use fallback methods"
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build complete!"
