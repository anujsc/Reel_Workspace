#!/bin/bash

# Render Build Script - Install Chrome to persistent location

echo "🔧 Starting build process..."

# Use project directory for Chrome (persists from build to runtime)
export PUPPETEER_CACHE_DIR="/opt/render/project/.cache/puppeteer"
echo "📁 Puppeteer cache: $PUPPETEER_CACHE_DIR"

# Create cache directory
mkdir -p "$PUPPETEER_CACHE_DIR"

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Install Chrome to persistent location
echo "🌐 Installing Chrome via Puppeteer to persistent location..."
npx puppeteer browsers install chrome --path "$PUPPETEER_CACHE_DIR"

# Verify installation
CHROME_BIN=$(find "$PUPPETEER_CACHE_DIR" -name chrome -type f 2>/dev/null | head -1)

if [ -n "$CHROME_BIN" ]; then
    echo "✅ Chrome installed successfully"
    echo "📍 Chrome location: $CHROME_BIN"
    chmod +x "$CHROME_BIN" 2>/dev/null
else
    echo "❌ Chrome installation failed!"
    exit 1
fi

# Verify FFmpeg
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg found: $(ffmpeg -version | head -n 1)"
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build complete!"
echo "📦 Chrome will be available at runtime in: $PUPPETEER_CACHE_DIR"
