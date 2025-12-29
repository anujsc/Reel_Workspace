#!/bin/bash

# Render Build Script - Install Chrome via Puppeteer

echo "🔧 Starting build process..."

# Set Puppeteer cache directory
export PUPPETEER_CACHE_DIR="${HOME}/.cache/puppeteer"
echo "📁 Puppeteer cache: $PUPPETEER_CACHE_DIR"

# Install Node dependencies (including Puppeteer)
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Install Chrome for Puppeteer
echo "🌐 Installing Chrome via Puppeteer..."
npx puppeteer browsers install chrome

# Find installed Chrome
CHROME_PATH=$(find $PUPPETEER_CACHE_DIR -name chrome -type f 2>/dev/null | head -1)

if [ -n "$CHROME_PATH" ]; then
    echo "✅ Chrome installed successfully"
    echo "📍 Chrome location: $CHROME_PATH"
    
    # Make it executable
    chmod +x "$CHROME_PATH"
    
    # Export for runtime
    export PUPPETEER_EXECUTABLE_PATH="$CHROME_PATH"
else
    echo "⚠️  Chrome not found in cache, will use auto-detect"
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
