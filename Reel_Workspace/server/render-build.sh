#!/bin/bash

# Render Build Script - Install Puppeteer with Chromium

echo "🔧 Starting build process..."

# Install Node dependencies (including Puppeteer)
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Install Chromium for Puppeteer
echo "🌐 Installing Chromium for Puppeteer..."
npx puppeteer browsers install chrome

# Verify Chromium installation
if [ -d "/opt/render/.cache/puppeteer" ]; then
    echo "✅ Chromium installed successfully"
    ls -la /opt/render/.cache/puppeteer/
else
    echo "⚠️  Chromium cache directory not found"
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
