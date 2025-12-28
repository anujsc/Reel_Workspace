#!/bin/bash

# Render Build Script
# This script installs FFmpeg and Chromium, then builds the app

echo "🔧 Installing system dependencies..."

# Update package list
apt-get update

# Install FFmpeg for audio extraction
echo "📦 Installing FFmpeg..."
apt-get install -y ffmpeg

# Install Chromium for Puppeteer
echo "📦 Installing Chromium..."
apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils

# Verify installations
echo "✅ Verifying FFmpeg installation..."
ffmpeg -version | head -n 1

echo "✅ Verifying Chromium installation..."
chromium --version

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build complete!"
