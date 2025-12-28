#!/bin/bash

echo "🔍 Pre-Deployment Checklist for Frontend"
echo "=========================================="
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check if VITE_API_BASE_URL is set
    if grep -q "VITE_API_BASE_URL" .env; then
        API_URL=$(grep "VITE_API_BASE_URL" .env | cut -d '=' -f2)
        echo "✅ VITE_API_BASE_URL is set to: $API_URL"
        
        # Check if it's the production URL
        if [[ $API_URL == *"onrender.com"* ]]; then
            echo "✅ Using production backend URL"
        else
            echo "⚠️  Warning: Not using production URL"
        fi
    else
        echo "❌ VITE_API_BASE_URL not found in .env"
        exit 1
    fi
else
    echo "❌ .env file not found"
    exit 1
fi

echo ""
echo "📦 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📊 Build output:"
    ls -lh dist/
    echo ""
    echo "🎉 Ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "1. git add ."
    echo "2. git commit -m 'Prepare frontend for deployment'"
    echo "3. git push origin main"
    echo "4. Deploy on Render dashboard"
else
    echo "❌ Build failed. Fix errors before deploying."
    exit 1
fi
