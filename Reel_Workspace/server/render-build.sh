#!/bin/bash

# Render Build Script - Install backend and free CLI extractors

echo "🔧 Starting build process..."

# Ensure Python tools are available for extractor fallbacks
if command -v python3 &> /dev/null; then
    PYTHON_BIN="python3"
elif command -v python &> /dev/null; then
    PYTHON_BIN="python"
else
    echo "❌ Python is required for yt-dlp and Instaloader"
    exit 1
fi

echo "🐍 Python detected: $($PYTHON_BIN --version 2>&1)"

export PATH="$HOME/.local/bin:$PATH"

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Install free extraction tools for Instagram fallback chain
echo "⬇️  Installing yt-dlp and Instaloader..."
$PYTHON_BIN -m pip install --user --no-cache-dir yt-dlp instaloader

echo "✅ yt-dlp: $($PYTHON_BIN -m yt_dlp --version 2>/dev/null || echo unavailable)"
echo "✅ instaloader: $($PYTHON_BIN -m instaloader --version 2>/dev/null || echo unavailable)"

# Verify FFmpeg is available in the Render runtime image.
if ! command -v ffmpeg &> /dev/null || ! command -v ffprobe &> /dev/null; then
    echo "❌ FFmpeg and FFprobe are required for audio, frame, and thumbnail processing"
    exit 1
fi

echo "✅ FFmpeg found: $(ffmpeg -version | head -n 1)"
echo "✅ FFprobe found: $(ffprobe -version | head -n 1)"

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build complete!"
