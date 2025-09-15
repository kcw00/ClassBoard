#!/bin/bash

# ClassBoard Frontend Deployment Script
# Simple deployment to Vercel with custom domain support

set -e

echo "🚀 ClassBoard Frontend Deployment"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building frontend..."
npm run build

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps for custom domain:"
echo "1. Go to your Vercel dashboard"
echo "2. Navigate to your project settings"
echo "3. Add your custom domain (e.g., classboard.ca)"
echo "4. Update your DNS records as instructed by Vercel"
echo ""
echo "Recommended domains:"
echo "• classboard.ca"
echo "• app.classboard.ca"
echo "• my.classboard.ca"
echo ""