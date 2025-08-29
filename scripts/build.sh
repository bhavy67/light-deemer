#!/bin/bash

# Build script for Light Deemer extension

set -e

echo "🏗️  Building Light Deemer extension..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -f light-deemer.zip

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run type checking
echo "🔍 Running type checking..."
npm run type-check

# Build the extension
echo "🏗️  Building extension..."
npm run build

# Verify build output
echo "✅ Verifying build output..."
if [ ! -f "dist/manifest.json" ]; then
    echo "❌ Build failed: manifest.json not found in dist/"
    exit 1
fi

if [ ! -f "dist/background.js" ]; then
    echo "❌ Build failed: background.js not found in dist/"
    exit 1
fi

if [ ! -f "dist/contentScript.js" ]; then
    echo "❌ Build failed: contentScript.js not found in dist/"
    exit 1
fi

if [ ! -f "dist/popup.html" ]; then
    echo "❌ Build failed: popup.html not found in dist/"
    exit 1
fi

if [ ! -f "dist/options.html" ]; then
    echo "❌ Build failed: options.html not found in dist/"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Built files are in the dist/ directory"
echo ""
echo "To load the extension in Chrome:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select the dist/ folder"
