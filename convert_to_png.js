#!/usr/bin/env node
/**
 * Convert SVG icons to PNG using Canvas (requires canvas package)
 * Alternative approach without external dependencies
 */

const fs = require('fs');
const path = require('path');

// Simple function to create PNG data URLs from SVG (for manual conversion)
const createConversionInstructions = () => {
  const iconsDir = path.join(__dirname, 'icons_new');
  const svgFiles = fs.readdirSync(iconsDir).filter(file => file.endsWith('.svg') && file !== 'preview.html');
  
  console.log('🔄 SVG to PNG Conversion Instructions:\n');
  
  console.log('Method 1: Online Converter (Recommended)');
  console.log('1. Visit: https://svgtopng.com/ or https://convertio.co/svg-png/');
  console.log('2. Upload these SVG files:');
  svgFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
  console.log('3. Download the PNG versions');
  console.log('4. Replace the old icons in the icons/ folder\n');
  
  console.log('Method 2: Manual Browser Conversion');
  console.log('1. Open the preview.html file in your browser');
  console.log('2. Right-click each icon and "Save image as..." PNG');
  console.log('3. Use browser dev tools to screenshot at exact sizes\n');
  
  console.log('Method 3: Quick Replace Current Icons');
  console.log('Choose your favorite design and run one of these commands:');
  console.log('\n# For eye_protection design:');
  console.log('cp icons_new/eye_protection_icon16.svg icons/icon16.svg');
  console.log('cp icons_new/eye_protection_icon48.svg icons/icon48.svg'); 
  console.log('cp icons_new/eye_protection_icon128.svg icons/icon128.svg');
  
  console.log('\n# For moon_eye design:');
  console.log('cp icons_new/moon_eye_icon16.svg icons/icon16.svg');
  console.log('cp icons_new/moon_eye_icon48.svg icons/icon48.svg');
  console.log('cp icons_new/moon_eye_icon128.svg icons/icon128.svg');
  
  console.log('\n# For sun_filter design:');
  console.log('cp icons_new/sun_filter_icon16.svg icons/icon16.svg');
  console.log('cp icons_new/sun_filter_icon48.svg icons/icon48.svg');
  console.log('cp icons_new/sun_filter_icon128.svg icons/icon128.svg');
  
  console.log('\n💡 Note: Chrome extensions support SVG icons in Manifest V3!');
  console.log('You can use SVG directly by updating manifest.json');
};

// Generate a simple HTML converter page
const createConverterPage = () => {
  const iconsDir = path.join(__dirname, 'icons_new');
  const svgFiles = fs.readdirSync(iconsDir).filter(file => file.endsWith('.svg') && file !== 'preview.html');
  
  const converterHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>SVG to PNG Converter</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; }
        .converter { margin: 2rem 0; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; }
        canvas { border: 1px solid #ccc; margin: 1rem; }
        button { background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; }
        button:hover { background: #2563eb; }
    </style>
</head>
<body>
    <h1>SVG to PNG Converter</h1>
    <p>This page can help convert your SVG icons to PNG format.</p>
    
    ${svgFiles.map(file => {
      const svgContent = fs.readFileSync(path.join(iconsDir, file), 'utf8');
      const size = file.includes('16') ? 16 : file.includes('48') ? 48 : 128;
      
      return `
        <div class="converter">
            <h3>${file}</h3>
            <div>
                ${svgContent}
            </div>
            <canvas id="canvas_${file.replace(/[^a-zA-Z0-9]/g, '_')}" width="${size}" height="${size}"></canvas>
            <button onclick="convertToPNG('${file}', ${size})">Convert to PNG</button>
            <a id="download_${file.replace(/[^a-zA-Z0-9]/g, '_')}" style="display:none;">Download PNG</a>
        </div>
      `;
    }).join('')}
    
    <script>
        function convertToPNG(filename, size) {
            const svg = document.querySelector(\`div:has(h3:contains('\${filename}')) svg\`);
            const canvas = document.getElementById('canvas_' + filename.replace(/[^a-zA-Z0-9]/g, '_'));
            const ctx = canvas.getContext('2d');
            const data = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            img.onload = function() {
                ctx.drawImage(img, 0, 0, size, size);
                canvas.toBlob(function(blob) {
                    const pngUrl = URL.createObjectURL(blob);
                    const download = document.getElementById('download_' + filename.replace(/[^a-zA-Z0-9]/g, '_'));
                    download.href = pngUrl;
                    download.download = filename.replace('.svg', '.png');
                    download.style.display = 'inline';
                    download.textContent = 'Download ' + filename.replace('.svg', '.png');
                    URL.revokeObjectURL(url);
                });
            };
            img.src = url;
        }
    </script>
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(iconsDir, 'converter.html'), converterHTML);
  console.log('\n🔧 Created converter.html - Open in browser to convert SVG to PNG!');
};

createConversionInstructions();
createConverterPage();
