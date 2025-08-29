/**
 * Utility functions for Light Deemer extension
 */

export interface LightDeemerSettings {
  ld_enabled: boolean;
  ld_intensity: number;
  ld_color: string;
  ld_excludeVideos: boolean;
  ld_whitelist: Record<string, boolean>;
  ld_perDomain: Record<
    string,
    { intensity?: number; color?: string; enabled?: boolean }
  >;
  ld_mode: 'overlay' | 'filter';
  ld_debug: boolean;
}

export const DEFAULT_SETTINGS: LightDeemerSettings = {
  ld_enabled: true,
  ld_intensity: 0.25,
  ld_color: '#000000',
  ld_excludeVideos: true,
  ld_whitelist: {},
  ld_perDomain: {},
  ld_mode: 'overlay',
  ld_debug: false,
};

/**
 * Convert hex color to rgba with alpha
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Debounce function to limit rapid function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function using requestAnimationFrame
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  return (...args: Parameters<T>): void => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

/**
 * Safe DOM access wrapper
 */
export function safeQuerySelector(
  selector: string,
  root: Document | Element = document
): Element | null {
  try {
    return root.querySelector(selector);
  } catch (error) {
    debugLog(`Error selecting ${selector}:`, error);
    return null;
  }
}

/**
 * Safe DOM access for multiple elements
 */
export function safeQuerySelectorAll(
  selector: string,
  root: Document | Element = document
): NodeListOf<Element> | [] {
  try {
    return root.querySelectorAll(selector);
  } catch (error) {
    debugLog(`Error selecting all ${selector}:`, error);
    return [] as any; // Return empty array-like object
  }
}

/**
 * Get current hostname
 */
export function getCurrentHostname(): string {
  try {
    return window.location.hostname;
  } catch (error) {
    debugLog('Error getting hostname:', error);
    return '';
  }
}

/**
 * Check if current page is a restricted page
 */
export function isRestrictedPage(): boolean {
  const restrictedSchemes = [
    'chrome:',
    'chrome-extension:',
    'edge:',
    'about:',
    'moz-extension:',
  ];
  const currentUrl = window.location.href;

  return (
    restrictedSchemes.some(scheme => currentUrl.startsWith(scheme)) ||
    currentUrl.includes('chrome.google.com/webstore')
  );
}

/**
 * Debug logging with prefix
 */
export function debugLog(...args: any[]): void {
  // Only log if debug is enabled - check will be done by caller
  console.debug('[LightDeemer]', ...args);
}

/**
 * Validate settings object structure
 */
export function validateSettings(settings: any): LightDeemerSettings {
  const validated: LightDeemerSettings = { ...DEFAULT_SETTINGS };

  if (typeof settings === 'object' && settings !== null) {
    if (typeof settings.ld_enabled === 'boolean') {
      validated.ld_enabled = settings.ld_enabled;
    }
    if (
      typeof settings.ld_intensity === 'number' &&
      settings.ld_intensity >= 0 &&
      settings.ld_intensity <= 1
    ) {
      validated.ld_intensity = settings.ld_intensity;
    }
    if (
      typeof settings.ld_color === 'string' &&
      /^#[0-9A-Fa-f]{6}$/.test(settings.ld_color)
    ) {
      validated.ld_color = settings.ld_color;
    }
    if (typeof settings.ld_excludeVideos === 'boolean') {
      validated.ld_excludeVideos = settings.ld_excludeVideos;
    }
    if (
      typeof settings.ld_whitelist === 'object' &&
      settings.ld_whitelist !== null
    ) {
      validated.ld_whitelist = settings.ld_whitelist;
    }
    if (
      typeof settings.ld_perDomain === 'object' &&
      settings.ld_perDomain !== null
    ) {
      validated.ld_perDomain = settings.ld_perDomain;
    }
    if (settings.ld_mode === 'overlay' || settings.ld_mode === 'filter') {
      validated.ld_mode = settings.ld_mode;
    }
    if (typeof settings.ld_debug === 'boolean') {
      validated.ld_debug = settings.ld_debug;
    }
  }

  return validated;
}

/**
 * Check if storage quota is approaching limit
 */
export async function checkStorageQuota(): Promise<{
  needsMigration: boolean;
  bytesInUse: number;
}> {
  try {
    if (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.sync
    ) {
      const bytesInUse = await chrome.storage.sync.getBytesInUse();
      const quota = chrome.storage.sync.QUOTA_BYTES;
      const needsMigration = bytesInUse > quota * 0.8; // Migrate at 80% capacity

      return { needsMigration, bytesInUse };
    }
    return { needsMigration: false, bytesInUse: 0 };
  } catch (error) {
    debugLog('Error checking storage quota:', error);
    return { needsMigration: false, bytesInUse: 0 };
  }
}

/**
 * Migrate settings from sync to local storage
 */
export async function migrateToLocalStorage(
  settings: LightDeemerSettings
): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ ...settings, ld_using_local: true });
      await chrome.storage.sync.clear();
      debugLog('Migrated settings to local storage');
    }
  } catch (error) {
    debugLog('Error migrating to local storage:', error);
    throw error;
  }
}

/**
 * Get appropriate storage API based on current usage
 */
export async function getStorageApi(): Promise<any> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const localData = await chrome.storage.local.get('ld_using_local');
      return localData['ld_using_local']
        ? chrome.storage.local
        : chrome.storage.sync;
    }
    // Fallback for testing environment
    return {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
      clear: () => Promise.resolve(),
      getBytesInUse: () => Promise.resolve(0),
      QUOTA_BYTES: 102400,
    };
  } catch (error) {
    debugLog('Error determining storage API:', error);
    // Return sync storage as fallback
    return (
      chrome?.storage?.sync || {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
        clear: () => Promise.resolve(),
        getBytesInUse: () => Promise.resolve(0),
        QUOTA_BYTES: 102400,
      }
    );
  }
}

/**
 * Check if element is in fullscreen
 */
export function isElementFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

/**
 * Get video and canvas selectors for raising z-index
 */
export function getVideoSelectors(): string[] {
  return [
    'video',
    'canvas[data-video]',
    '.html5-video-player',
    '.ytp-chrome-top',
    '.video-player',
    '.player-container',
    '[data-player]',
    '.vjs-tech', // Video.js
    '.jwplayer', // JW Player
    '.flowplayer', // Flowplayer
  ];
}

/**
 * Check if element is likely a video container
 */
export function isVideoElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'video') return true;

  if (tagName === 'canvas') {
    // Check if canvas has video-related attributes or classes
    return !!(
      element.getAttribute('data-video') ||
      element.className.includes('video') ||
      element.className.includes('player')
    );
  }

  // Check for known video player containers
  const videoClasses = [
    'html5-video-player',
    'ytp-chrome-top',
    'video-player',
    'player-container',
    'vjs-tech',
    'jwplayer',
    'flowplayer',
  ];

  return videoClasses.some(className => element.classList.contains(className));
}
