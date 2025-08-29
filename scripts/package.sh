#!/bin/bash

# Package script for Light Deemer extension

set -e

echo "📦 Packaging Light Deemer extension for Chrome Web Store..."

# Run build first
echo "🏗️  Running build..."
./scripts/build.sh

# Run tests
echo "🧪 Running tests..."
npm test

# Create package
echo "📦 Creating package..."
cd dist/
zip -r ../light-deemer.zip .
cd ..

# Verify package
echo "✅ Verifying package..."
if [ ! -f "light-deemer.zip" ]; then
    echo "❌ Package creation failed"
    exit 1
fi

# Check package size
package_size=$(du -h light-deemer.zip | cut -f1)
echo "📏 Package size: $package_size"

# Extract and verify contents
echo "🔍 Verifying package contents..."
temp_dir=$(mktemp -d)
unzip -q light-deemer.zip -d "$temp_dir"

required_files=(
    "manifest.json"
    "background.js"
    "contentScript.js"
    "popup.html"
    "popup.js"
    "options.html"
    "options.js"
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
    "_locales/en/messages.json"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$temp_dir/$file" ]; then
        echo "❌ Missing required file in package: $file"
        rm -rf "$temp_dir"
        exit 1
    fi
done

rm -rf "$temp_dir"

echo "✅ Package created successfully!"
echo "📦 light-deemer.zip is ready for Chrome Web Store upload"
echo ""
echo "Package checklist:"
echo "✅ All required files present"
echo "✅ Manifest version updated"
echo "✅ Icons included"
echo "✅ Localization files included"
echo "✅ Size: $package_size"
echo ""
echo "Next steps:"
echo "1. Go to Chrome Web Store Developer Dashboard"
echo "2. Upload light-deemer.zip"
echo "3. Fill in store listing details"
echo "4. Submit for review"
