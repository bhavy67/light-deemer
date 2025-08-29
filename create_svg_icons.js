#!/usr/bin/env node
/**
 * Create minimalist icons for Light Deemer extension without Python
 * Using SVG to PNG conversion with built-in Node.js capabilities
 */

const fs = require('fs');
const path = require('path');

// Create SVG content for the eye protection icon
const createEyeProtectionSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradient definitions -->
  <defs>
    <radialGradient id="eyeGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
    </radialGradient>
    <radialGradient id="overlayGradient" cx="50%" cy="50%" r="60%">
      <stop offset="0%" style="stop-color:#F59E0B;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#D97706;stop-opacity:0.6" />
    </radialGradient>
    <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:0.7" />
    </linearGradient>
  </defs>
  
  <!-- Background circle for contrast -->
  <circle cx="64" cy="64" r="62" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
  
  <!-- Eye shape -->
  <ellipse cx="64" cy="64" rx="45" ry="25" fill="none" stroke="url(#eyeGradient)" stroke-width="4"/>
  
  <!-- Pupil -->
  <circle cx="64" cy="64" r="12" fill="url(#eyeGradient)"/>
  
  <!-- Eye highlight -->
  <circle cx="68" cy="60" r="4" fill="#FFFFFF" opacity="0.9"/>
  
  <!-- Protective overlay (curved shield over eye) -->
  <path d="M 25 45 Q 64 25 103 45 Q 95 75 64 85 Q 33 75 25 45 Z" 
        fill="url(#overlayGradient)" 
        opacity="0.8"/>
  
  <!-- Subtle shine effect on overlay -->
  <path d="M 35 50 Q 64 35 85 48 Q 80 60 64 65 Q 48 60 35 50 Z" 
        fill="#FFFFFF" 
        opacity="0.2"/>
</svg>
`;

const createMoonEyeSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="moonGradient" cx="30%" cy="30%" r="70%">
      <stop offset="0%" style="stop-color:#FCD34D;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
    </radialGradient>
    <radialGradient id="dimGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#374151;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#1F2937;stop-opacity:0.6" />
    </radialGradient>
  </defs>
  
  <!-- Background -->
  <circle cx="64" cy="64" r="62" fill="#1F2937"/>
  
  <!-- Moon/eye shape -->
  <path d="M 30 64 Q 64 30 98 64 Q 64 85 30 64 Z" 
        fill="url(#moonGradient)"/>
  
  <!-- Dimming overlay -->
  <circle cx="64" cy="64" r="55" fill="url(#dimGradient)"/>
  
  <!-- Crescent highlight -->
  <path d="M 45 50 Q 64 40 75 55 Q 64 70 45 65 Z" 
        fill="#FBBF24" 
        opacity="0.7"/>
  
  <!-- Stars for night theme -->
  <circle cx="25" cy="25" r="2" fill="#FBBF24"/>
  <circle cx="103" cy="30" r="1.5" fill="#FCD34D"/>
  <circle cx="20" cy="100" r="1" fill="#FFFFFF"/>
  <circle cx="105" cy="95" r="1.5" fill="#FBBF24"/>
</svg>
`;

const createSunFilterSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#FEF3C7;stop-opacity:1" />
      <stop offset="70%" style="stop-color:#FCD34D;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
    </radialGradient>
    <radialGradient id="filterGradient" cx="50%" cy="50%" r="60%">
      <stop offset="0%" style="stop-color:#374151;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#1F2937;stop-opacity:0.7" />
    </radialGradient>
  </defs>
  
  <!-- Background -->
  <circle cx="64" cy="64" r="62" fill="#F9FAFB"/>
  
  <!-- Sun rays -->
  <g stroke="url(#sunGradient)" stroke-width="3" stroke-linecap="round">
    <line x1="64" y1="15" x2="64" y2="25"/>
    <line x1="90.5" y1="25.5" x2="86.5" y2="29.5"/>
    <line x1="113" y1="64" x2="103" y2="64"/>
    <line x1="90.5" y1="102.5" x2="86.5" y2="98.5"/>
    <line x1="64" y1="113" x2="64" y2="103"/>
    <line x1="37.5" y1="102.5" x2="41.5" y2="98.5"/>
    <line x1="15" y1="64" x2="25" y2="64"/>
    <line x1="37.5" y1="25.5" x2="41.5" y2="29.5"/>
  </g>
  
  <!-- Sun body -->
  <circle cx="64" cy="64" r="20" fill="url(#sunGradient)"/>
  
  <!-- Dimming filter overlay -->
  <circle cx="64" cy="64" r="35" fill="url(#filterGradient)"/>
  
  <!-- Checkmark or shield symbol -->
  <path d="M 55 64 L 61 70 L 75 56" 
        stroke="#10B981" 
        stroke-width="3" 
        fill="none" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>
</svg>
`;

// Create the icons directory
const iconsDir = path.join(__dirname, 'icons_new');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
const designs = {
  'eye_protection': createEyeProtectionSVG,
  'moon_eye': createMoonEyeSVG,
  'sun_filter': createSunFilterSVG
};

const sizes = [16, 48, 128];

console.log('🎨 Creating minimalist Light Deemer icons...\n');

Object.entries(designs).forEach(([name, svgFunction]) => {
  console.log(`Creating ${name} icons:`);
  
  sizes.forEach(size => {
    const svgContent = svgFunction(size);
    const filename = `${name}_icon${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filepath, svgContent);
    console.log(`  ✓ Created ${filename}`);
  });
  
  console.log();
});

console.log('📝 SVG icons created successfully!');
console.log('\n🔄 To convert to PNG, you can:');
console.log('1. Use an online SVG to PNG converter');
console.log('2. Use a design tool like Figma or Adobe Illustrator');
console.log('3. Use a command-line tool like ImageMagick or Inkscape');
console.log('\nExample with ImageMagick:');
console.log('  convert eye_protection_icon128.svg eye_protection_icon128.png');

// Create a simple HTML preview file
const previewHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Light Deemer Icons Preview</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 2rem;
            background: #f9fafb;
        }
        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        .icon-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            text-align: center;
        }
        .icon-sizes {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            margin: 1rem 0;
        }
        .icon-container {
            padding: 0.5rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: white;
        }
        h1 { color: #1f2937; }
        h3 { color: #374151; margin-bottom: 1rem; }
        .size-label { font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem; }
    </style>
</head>
<body>
    <h1>🌙 Light Deemer - Icon Designs</h1>
    <p>Choose your favorite design for the Chrome extension:</p>
    
    <div class="icon-grid">
        ${Object.keys(designs).map(name => `
            <div class="icon-card">
                <h3>${name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                <div class="icon-sizes">
                    ${sizes.map(size => `
                        <div class="icon-container">
                            <img src="${name}_icon${size}.svg" width="${Math.min(size, 48)}" height="${Math.min(size, 48)}" alt="${name} ${size}px">
                            <div class="size-label">${size}px</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    </div>
    
    <div style="margin-top: 3rem; padding: 1.5rem; background: #eff6ff; border-radius: 8px;">
        <h4>💡 Design Concepts:</h4>
        <ul style="margin: 0;">
            <li><strong>Eye Protection:</strong> Classic eye with warm protective overlay</li>
            <li><strong>Moon Eye:</strong> Night mode theme with crescent moon shape</li>
            <li><strong>Sun Filter:</strong> Bright sun with dimming filter and check mark</li>
        </ul>
    </div>
</body>
</html>
`;

fs.writeFileSync(path.join(iconsDir, 'preview.html'), previewHTML);
console.log('\n📱 Created preview.html - Open in browser to see all designs!');
