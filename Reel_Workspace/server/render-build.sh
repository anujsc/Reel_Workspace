#!/bin/bash

# Render Build Script - Install Chrome via Puppeteer

echo "🔧 Starting build process..."

# Set Puppeteer cache directory to match Render's persistent storage
export PUPPETEER_CACHE_DIR="/opt/render/.cache/puppeteer"
echo "📁 Puppeteer cache: $PUPPETEER_CACHE_DIR"

# Create cache directory if it doesn't exist
mkdir -p "$PUPPETEER_CACHE_DIR"

# Install Node dependencies (including Puppeteer)
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Install Chrome for Puppeteer with explicit cache path
echo "🌐 Installing Chrome via Puppeteer..."
npx puppeteer browsers install chrome --path "$PUPPETEER_CACHE_DIR"

# Verify Chrome installation
echo "🔍 Verifying Chrome installation..."
if [ -d "$PUPPETEER_CACHE_DIR" ]; then
    echo "📂 Cache directory contents:"
    ls -la "$PUPPETEER_CACHE_DIR" || echo "  (empty or inaccessible)"
    
    # Find Chrome binary
    CHROME_PATH=$(find "$PUPPETEER_CACHE_DIR" -name chrome -type f 2>/dev/null | head -1)
    
    if [ -n "$CHROME_PATH" ]; then
        echo "✅ Chrome installed successfully"
        echo "📍 Chrome location: $CHROME_PATH"
        
        # Make it executable
        chmod +x "$CHROME_PATH" 2>/dev/null || echo "⚠️  Could not chmod (may not be needed)"
    else
        echo "⚠️  Chrome binary not found in cache"
        echo "    Puppeteer will attempt auto-detection at runtime"
    fi
else
    echo "⚠️  Cache directory not created"
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
