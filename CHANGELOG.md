# Changelog

All notable changes to the Light Deemer extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-08-28

### Added
- Initial release of Light Deemer extension
- Smart overlay dimming using CSS `mix-blend-mode: multiply`
- Adjustable dimming intensity (0-100%)
- Customizable overlay colors with color picker
- Video exclusion feature to keep video elements bright
- Per-site whitelist to disable extension on specific domains
- Per-domain custom settings (intensity, color, enabled state)
- Fullscreen detection - automatically hide overlay when content is fullscreen
- Single Page Application (SPA) support with navigation detection
- Same-origin iframe support with overlay injection
- Cross-origin iframe documentation and user guidance
- Keyboard navigation support for all UI elements
- ARIA labels and accessibility features
- Debug mode with detailed console logging
- Storage quota monitoring with automatic migration to local storage
- Internationalization support (English)
- Comprehensive error handling and recovery
- Performance optimizations with debounced DOM updates
- Manifest V3 compliance
- TypeScript implementation with strict type checking
- Comprehensive test suite (unit and E2E)
- CI/CD pipeline with automated testing
- Chrome Web Store packaging scripts

### Features
- **Popup Interface**: Quick access to enable/disable, intensity, color, and whitelist controls
- **Options Page**: Advanced settings, whitelist management, per-domain configuration
- **Background Service Worker**: Settings synchronization and message handling
- **Content Script**: Overlay management, video detection, fullscreen handling
- **Two Dimming Modes**: Overlay (multiply blend) and Filter (brightness reduction)
- **Storage Management**: Automatic migration between sync and local storage
- **Video Detection**: Supports HTML5 video, canvas elements, and popular video players
- **Mutation Observation**: Handles dynamically added content
- **History API Hooks**: Detects SPA navigation without page reload
- **Privacy Focused**: No data collection, no remote connections

### Technical Details
- Chrome Manifest V3
- TypeScript with strict typing
- Webpack build system
- Jest testing framework
- Puppeteer E2E testing
- ESLint + Prettier code formatting
- GitHub Actions CI/CD
- Semantic versioning

### Browser Support
- Chrome 88+
- Chromium-based Edge
- Chromium-based Opera

## [Unreleased]

### Planned Features
- Firefox support (Manifest V2 compatibility)
- Safari extension support
- Additional video player detection
- Advanced color schemes and themes
- Scheduled dimming based on time of day
- Blue light filter options
- Custom CSS injection capabilities
- Export/import settings functionality
