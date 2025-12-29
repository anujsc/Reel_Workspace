#!/bin/bash

# Render Build Script - Install Chromium and dependencies

echo "🔧 Starting build process..."

# Install Chromium and required dependencies
echo "🌐 Installing Chromium and dependencies..."
apt-get update
apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils

# Verify Chromium installation
if command -v chromium &> /dev/null; then
    echo "✅ Chromium installed successfully"
    chromium --version
    CHROME_BIN=$(which chromium)
    echo "📍 Chromium location: $CHROME_BIN"
else
    echo "❌ Chromium installation failed"
    exit 1
fi

# Install Node dependencies (including Puppeteer)
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

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
