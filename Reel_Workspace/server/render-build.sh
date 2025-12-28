#!/bin/bash

# Render Build Script for Node.js environment
# Install Chromium and dependencies for Puppeteer

echo "🔧 Installing Chromium and dependencies..."

# Install Chromium and required libraries
# Note: We need to use apt-get which requires sudo on Render
apt-get update || echo "⚠️  apt-get update failed (may not have permissions)"
apt-get install -y chromium chromium-driver || echo "⚠️  Chromium install failed (may not have permissions)"

# Check if Chromium was installed
if command -v chromium &> /dev/null; then
    echo "✅ Chromium installed successfully:"
    chromium --version
    CHROMIUM_PATH=$(which chromium)
    echo "   Path: $CHROMIUM_PATH"
elif command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium browser installed successfully:"
    chromium-browser --version
    CHROMIUM_PATH=$(which chromium-browser)
    echo "   Path: $CHROMIUM_PATH"
else
    echo "⚠️  Chromium not found in system, Puppeteer will download its own"
    echo "   This will increase build time and deployment size"
fi

# Verify FFmpeg (provided by Render)
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg found:"
    ffmpeg -version | head -n 1
else
    echo "⚠️  FFmpeg not found - will use fallback methods"
fi

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build complete!"
