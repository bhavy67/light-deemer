/**
 * Content script for Light Deemer extension
 */

import {
  LightDeemerSettings,
  DEFAULT_SETTINGS,
  hexToRgba,
  debounce,
  rafThrottle,
  safeQuerySelectorAll,
  getCurrentHostname,
  isRestrictedPage,
  debugLog,
  validateSettings,
  isElementFullscreen,
  getVideoSelectors,
  isVideoElement,
} from './lib/utils';

// Constants
const OVERLAY_ID = 'light-deemer-overlay';
const VIDEO_RAISE_CLASS = 'light-deemer-raise-video';
const OVERLAY_Z_INDEX = '2147483647';
const VIDEO_Z_INDEX = '2147483648';
const DEBOUNCE_DELAY = 150;

// State
let currentSettings: LightDeemerSettings = { ...DEFAULT_SETTINGS };
let overlayElement: HTMLDivElement | null = null;
let mutationObserver: MutationObserver | null = null;
let isFullscreen = false;
let debugMode = false;

/**
 * Initialize content script
 */
function init(): void {
  try {
    console.log('[LightDeemer] Starting initialization...');
    
    if (isRestrictedPage()) {
      console.log('[LightDeemer] Skipping restricted page:', window.location.href);
      return;
    }

    console.log('[LightDeemer] Initializing Light Deemer content script');

    // Load settings and create overlay
    loadSettingsAndApply();

    // Set up event listeners
    setupEventListeners();

    // Set up mutation observer
    setupMutationObserver();

    // Handle iframes
    handleIframes();

    console.log('[LightDeemer] Content script initialized');
  } catch (error) {
    console.error('[LightDeemer] Error initializing content script:', error);
  }
}

/**
 * Load settings from background script
 */
async function loadSettingsAndApply(): Promise<void> {
  try {
    console.log('[LightDeemer] Loading settings from background script...');
    
    const response = await chrome.runtime.sendMessage({
      action: 'getSettings',
    });
    
    console.log('[LightDeemer] Background response:', response);
    
    if (response && response.settings) {
      currentSettings = validateSettings(response.settings);
      debugMode = currentSettings.ld_debug;
      console.log('[LightDeemer] Settings loaded:', currentSettings);
      applyOverlay();
    } else {
      console.warn('[LightDeemer] No settings received, using defaults');
      currentSettings = { ...DEFAULT_SETTINGS };
      debugMode = currentSettings.ld_debug;
      applyOverlay();
    }
  } catch (error) {
    console.error('[LightDeemer] Error loading settings:', error);
    // Use defaults if can't load
    console.log('[LightDeemer] Using default settings due to error');
    currentSettings = { ...DEFAULT_SETTINGS };
    debugMode = currentSettings.ld_debug;
    applyOverlay();
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners(): void {
  // Fullscreen change listeners
  const fullscreenEvents = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'msfullscreenchange',
  ];

  fullscreenEvents.forEach(event => {
    document.addEventListener(event, handleFullscreenChange, { passive: true });
  });

  // Orientation and resize listeners
  window.addEventListener('resize', rafThrottle(handleViewportChange), {
    passive: true,
  });
  window.addEventListener(
    'orientationchange',
    rafThrottle(handleViewportChange),
    { passive: true }
  );

  // History API listeners for SPA navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    handleSpaNavigation();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    handleSpaNavigation();
  };

  window.addEventListener('popstate', handleSpaNavigation, { passive: true });

  // Message listener for background script communication
  chrome.runtime.onMessage.addListener(handleMessage);
}

/**
 * Handle messages from background script
 */
function handleMessage(message: any): void {
  try {
    switch (message.action) {
      case 'setEnabled':
        currentSettings.ld_enabled = message.enabled;
        applyOverlay();
        break;

      case 'setIntensity':
        currentSettings.ld_intensity = message.intensity;
        applyOverlay();
        break;

      case 'setColor':
        currentSettings.ld_color = message.color;
        applyOverlay();
        break;

      case 'setExcludeVideos':
        currentSettings.ld_excludeVideos = message.excludeVideos;
        applyOverlay();
        break;

      case 'setWhitelist':
        currentSettings.ld_whitelist = message.whitelist;
        applyOverlay();
        break;

      case 'settingsReset':
        currentSettings = validateSettings(message.settings);
        debugMode = currentSettings.ld_debug;
        applyOverlay();
        break;
    }
  } catch (error) {
    console.error('[LightDeemer] Error handling message:', error);
  }
}

/**
 * Apply or remove overlay based on current settings
 */
function applyOverlay(): void {
  try {
    const hostname = getCurrentHostname();
    const isWhitelisted = currentSettings.ld_whitelist[hostname] === true;
    const shouldShow =
      currentSettings.ld_enabled &&
      !isWhitelisted &&
      !isFullscreen &&
      currentSettings.ld_intensity > 0;

    console.log('[LightDeemer] Apply overlay check:', {
      hostname,
      enabled: currentSettings.ld_enabled,
      isWhitelisted,
      isFullscreen,
      intensity: currentSettings.ld_intensity,
      shouldShow
    });

    if (shouldShow) {
      console.log('[LightDeemer] Creating overlay...');
      createOrUpdateOverlay();
      if (currentSettings.ld_excludeVideos) {
        raiseVideoElements();
      } else {
        clearVideoRaising();
      }
    } else {
      console.log('[LightDeemer] Removing overlay...');
      removeOverlay();
      clearVideoRaising();
    }
  } catch (error) {
    console.error('[LightDeemer] Error applying overlay:', error);
  }
}

/**
 * Create or update the overlay element
 */
function createOrUpdateOverlay(): void {
  try {
    console.log('[LightDeemer] Creating/updating overlay element...');
    
    if (!overlayElement) {
      overlayElement = document.createElement('div');
      overlayElement.id = OVERLAY_ID;
      overlayElement.setAttribute('aria-hidden', 'true');

      // Append to document element for maximum coverage
      const targetElement = document.documentElement || document.body;
      if (targetElement) {
        targetElement.appendChild(overlayElement);
        console.log('[LightDeemer] Overlay element created and appended');
      } else {
        console.error('[LightDeemer] Could not find target element for overlay');
        return;
      }
    }

    // Update overlay styles
    updateOverlayStyles();
    console.log('[LightDeemer] Overlay styles updated');
  } catch (error) {
    console.error('[LightDeemer] Error creating/updating overlay:', error);
  }
}

/**
 * Update overlay styles based on current settings
 */
function updateOverlayStyles(): void {
  if (!overlayElement) return;

  try {
    const backgroundColor = hexToRgba(
      currentSettings.ld_color,
      currentSettings.ld_intensity
    );

    const styles: Record<string, string> = {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: backgroundColor,
      mixBlendMode:
        currentSettings.ld_mode === 'overlay' ? 'multiply' : 'normal',
      pointerEvents: 'none',
      zIndex: OVERLAY_Z_INDEX,
      willChange: 'opacity, background-color',
      transition: 'opacity 0.2s ease-in-out',
    };

    // Apply filter mode if selected
    if (currentSettings.ld_mode === 'filter') {
      const brightness = 1 - currentSettings.ld_intensity * 0.5;
      styles['filter'] = `brightness(${brightness})`;
    }

    // Apply styles
    Object.assign(overlayElement.style, styles);
  } catch (error) {
    console.error('[LightDeemer] Error updating overlay styles:', error);
  }
}

/**
 * Remove the overlay element
 */
function removeOverlay(): void {
  try {
    if (overlayElement && overlayElement.parentNode) {
      overlayElement.parentNode.removeChild(overlayElement);
      overlayElement = null;
    }
  } catch (error) {
    console.error('[LightDeemer] Error removing overlay:', error);
  }
}

/**
 * Raise video elements above overlay
 */
function raiseVideoElements(): void {
  try {
    const videoSelectors = getVideoSelectors();

    videoSelectors.forEach(selector => {
      const elements = safeQuerySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            raiseVideoElement(element);
          }
        });
      }
    });

    // Also handle dynamically created video elements
    const videos = safeQuerySelectorAll('video');
    videos.forEach(video => {
      if (video instanceof HTMLElement) {
        raiseVideoElement(video);
      }
    });

    const canvases = safeQuerySelectorAll('canvas');
    canvases.forEach(canvas => {
      if (canvas instanceof HTMLElement && isVideoElement(canvas)) {
        raiseVideoElement(canvas);
      }
    });
  } catch (error) {
    console.error('[LightDeemer] Error raising video elements:', error);
  }
}

/**
 * Raise individual video element
 */
function raiseVideoElement(element: HTMLElement): void {
  try {
    if (!element.classList.contains(VIDEO_RAISE_CLASS)) {
      element.classList.add(VIDEO_RAISE_CLASS);

      // Store original position and z-index
      const originalPosition = element.style.position;
      const originalZIndex = element.style.zIndex;

      element.setAttribute('data-ld-original-position', originalPosition || '');
      element.setAttribute('data-ld-original-z-index', originalZIndex || '');

      // Apply raised styles
      if (!originalPosition || originalPosition === 'static') {
        element.style.position = 'relative';
      }
      element.style.zIndex = VIDEO_Z_INDEX;
    }
  } catch (error) {
    console.error('[LightDeemer] Error raising video element:', error);
  }
}

/**
 * Clear video raising styles
 */
function clearVideoRaising(): void {
  try {
    const raisedElements = safeQuerySelectorAll(`.${VIDEO_RAISE_CLASS}`);
    raisedElements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.classList.remove(VIDEO_RAISE_CLASS);

        // Restore original styles
        const originalPosition = element.getAttribute(
          'data-ld-original-position'
        );
        const originalZIndex = element.getAttribute('data-ld-original-z-index');

        if (originalPosition !== null) {
          if (originalPosition === '') {
            element.style.removeProperty('position');
          } else {
            element.style.position = originalPosition;
          }
          element.removeAttribute('data-ld-original-position');
        }

        if (originalZIndex !== null) {
          if (originalZIndex === '') {
            element.style.removeProperty('z-index');
          } else {
            element.style.zIndex = originalZIndex;
          }
          element.removeAttribute('data-ld-original-z-index');
        }
      }
    });
  } catch (error) {
    console.error('[LightDeemer] Error clearing video raising:', error);
  }
}

/**
 * Handle fullscreen changes
 */
function handleFullscreenChange(): void {
  try {
    const wasFullscreen = isFullscreen;
    isFullscreen = isElementFullscreen();

    if (wasFullscreen !== isFullscreen) {
      log(`Fullscreen changed: ${isFullscreen}`);
      applyOverlay();
    }
  } catch (error) {
    console.error('[LightDeemer] Error handling fullscreen change:', error);
  }
}

/**
 * Handle viewport changes
 */
function handleViewportChange(): void {
  try {
    if (overlayElement) {
      // Ensure overlay covers new viewport
      updateOverlayStyles();
    }
  } catch (error) {
    console.error('[LightDeemer] Error handling viewport change:', error);
  }
}

/**
 * Handle SPA navigation
 */
const handleSpaNavigation = debounce((): void => {
  try {
    log('SPA navigation detected');
    applyOverlay();
  } catch (error) {
    console.error('[LightDeemer] Error handling SPA navigation:', error);
  }
}, DEBOUNCE_DELAY);

/**
 * Set up mutation observer
 */
function setupMutationObserver(): void {
  try {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }

    const debouncedHandler = debounce(handleDomMutation, DEBOUNCE_DELAY);

    mutationObserver = new MutationObserver(debouncedHandler);
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  } catch (error) {
    console.error('[LightDeemer] Error setting up mutation observer:', error);
  }
}

/**
 * Handle DOM mutations
 */
function handleDomMutation(mutations: MutationRecord[]): void {
  try {
    let shouldReapply = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Check if any added nodes are video elements or containers
        const addedNodes = Array.from(mutation.addedNodes);
        for (const node of addedNodes) {
          if (node instanceof Element) {
            if (isVideoElement(node) || node.querySelector('video, canvas')) {
              shouldReapply = true;
              break;
            }
          }
        }

        if (shouldReapply) break;
      }
    }

    if (shouldReapply) {
      log('DOM mutation detected, reapplying overlay');
      rafThrottle(() => applyOverlay())();
    }
  } catch (error) {
    console.error('[LightDeemer] Error handling DOM mutation:', error);
  }
}

/**
 * Handle iframes
 */
function handleIframes(): void {
  try {
    const iframes = safeQuerySelectorAll('iframe');
    iframes.forEach(iframe => {
      if (iframe instanceof HTMLIFrameElement) {
        handleSingleIframe(iframe);
      }
    });
  } catch (error) {
    console.error('[LightDeemer] Error handling iframes:', error);
  }
}

/**
 * Handle single iframe
 */
function handleSingleIframe(iframe: HTMLIFrameElement): void {
  try {
    // Try to access same-origin iframe
    try {
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc) {
        // Inject overlay into same-origin iframe
        injectOverlayIntoIframe(iframeDoc);
        log('Injected overlay into same-origin iframe');
      }
    } catch (crossOriginError) {
      // Cross-origin iframe - cannot access
      log('Cross-origin iframe detected, cannot inject overlay');
    }
  } catch (error) {
    console.error('[LightDeemer] Error handling single iframe:', error);
  }
}

/**
 * Inject overlay into iframe document
 */
function injectOverlayIntoIframe(iframeDoc: Document): void {
  try {
    const existingOverlay = iframeDoc.getElementById(OVERLAY_ID);
    if (existingOverlay) return;

    const hostname = getCurrentHostname();
    const isWhitelisted = currentSettings.ld_whitelist[hostname] === true;
    const shouldShow =
      currentSettings.ld_enabled &&
      !isWhitelisted &&
      !isFullscreen &&
      currentSettings.ld_intensity > 0;

    if (!shouldShow) return;

    const iframeOverlay = iframeDoc.createElement('div');
    iframeOverlay.id = OVERLAY_ID;
    iframeOverlay.setAttribute('aria-hidden', 'true');

    const backgroundColor = hexToRgba(
      currentSettings.ld_color,
      currentSettings.ld_intensity
    );

    const styles = {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      width: '100%',
      height: '100%',
      backgroundColor: backgroundColor,
      mixBlendMode: 'multiply',
      pointerEvents: 'none',
      zIndex: OVERLAY_Z_INDEX,
    };

    Object.assign(iframeOverlay.style, styles);

    const targetElement = iframeDoc.documentElement || iframeDoc.body;
    if (targetElement) {
      targetElement.appendChild(iframeOverlay);
    }
  } catch (error) {
    console.error('[LightDeemer] Error injecting overlay into iframe:', error);
  }
}

/**
 * Clean up on unload
 */
function cleanup(): void {
  try {
    removeOverlay();
    clearVideoRaising();

    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }

    log('Content script cleaned up');
  } catch (error) {
    console.error('[LightDeemer] Error during cleanup:', error);
  }
}

/**
 * Debug logging
 */
function log(...args: any[]): void {
  if (debugMode) {
    debugLog(...args);
  }
}

// Event listeners
window.addEventListener('beforeunload', cleanup, { passive: true });

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  // DOM is already ready
  init();
}
