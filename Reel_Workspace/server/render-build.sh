#!/bin/bash

# Render Build Script for Node.js environment
# Render provides FFmpeg and Chromium in their Node environment

echo "🔧 Checking system dependencies..."

# Verify FFmpeg (provided by Render)
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg found:"
    ffmpeg -version | head -n 1
else
    echo "⚠️  FFmpeg not found - will use fallback methods"
fi

# Verify Chromium (provided by Render)
if command -v chromium &> /dev/null; then
    echo "✅ Chromium found:"
    chromium --version
elif command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium browser found:"
    chromium-browser --version
else
    echo "⚠️  Chromium not found - Puppeteer will download its own"
fi

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build complete!"
