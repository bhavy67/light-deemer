/**
 * Background service worker for Light Deemer extension
 */

import {
  LightDeemerSettings,
  DEFAULT_SETTINGS,
  validateSettings,
  getStorageApi,
  debugLog,
} from './lib/utils';

// Message types for communication
export interface Message {
  action: string;
  [key: string]: any;
}

export interface SetEnabledMessage extends Message {
  action: 'setEnabled';
  enabled: boolean;
}

export interface SetIntensityMessage extends Message {
  action: 'setIntensity';
  intensity: number;
}

export interface SetColorMessage extends Message {
  action: 'setColor';
  color: string;
}

export interface SetExcludeVideosMessage extends Message {
  action: 'setExcludeVideos';
  excludeVideos: boolean;
}

export interface SetWhitelistMessage extends Message {
  action: 'setWhitelist';
  whitelist: Record<string, boolean>;
}

export interface GetSettingsMessage extends Message {
  action: 'getSettings';
}

export interface ToggleMessage extends Message {
  action: 'toggle';
}

let currentSettings: LightDeemerSettings = { ...DEFAULT_SETTINGS };
let debugMode = false;

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async (details): Promise<void> => {
  try {
    const storage = await getStorageApi();
    const stored = await storage.get(null);

    if (Object.keys(stored).length === 0) {
      // First install - set defaults
      await storage.set(DEFAULT_SETTINGS);
      currentSettings = { ...DEFAULT_SETTINGS };
      log('Extension installed with default settings');
    } else {
      // Validate and update settings
      currentSettings = validateSettings(stored);
      await storage.set(currentSettings);
      log('Extension updated, settings validated');
    }

    debugMode = currentSettings.ld_debug;

    if (details.reason === 'install') {
      // Open options page on first install
      chrome.tabs.create({
        url: chrome.runtime.getURL('options.html'),
      });
    }
  } catch (error) {
    console.error('[LightDeemer] Error during installation:', error);
  }
});

/**
 * Handle startup
 */
chrome.runtime.onStartup.addListener(async (): Promise<void> => {
  try {
    await loadSettings();
    log('Extension started');
  } catch (error) {
    console.error('[LightDeemer] Error during startup:', error);
  }
});

/**
 * Handle keyboard commands
 */
chrome.commands.onCommand.addListener(
  async (command: string): Promise<void> => {
    if (command === 'toggle-light-deemer') {
      const newEnabled = !currentSettings.ld_enabled;
      await updateSetting('ld_enabled', newEnabled);
      await broadcastToAllTabs({ action: 'setEnabled', enabled: newEnabled });
      log(
        `Light Deemer ${newEnabled ? 'enabled' : 'disabled'} via keyboard shortcut`
      );
    }
  }
);

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean => {
    handleMessage(message, sender, sendResponse);
    return true; // Keep message channel open for async response
  }
);

/**
 * Handle individual messages
 */
async function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): Promise<void> {
  try {
    switch (message.action) {
      case 'getSettings':
        await loadSettings();
        sendResponse({ settings: currentSettings });
        break;

      case 'setEnabled':
        const enabledMsg = message as SetEnabledMessage;
        await updateSetting('ld_enabled', enabledMsg.enabled);
        await broadcastToAllTabs(message);
        sendResponse({ success: true });
        break;

      case 'setIntensity':
        const intensityMsg = message as SetIntensityMessage;
        if (intensityMsg.intensity >= 0 && intensityMsg.intensity <= 1) {
          await updateSetting('ld_intensity', intensityMsg.intensity);
          await broadcastToAllTabs(message);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Invalid intensity value' });
        }
        break;

      case 'setColor':
        const colorMsg = message as SetColorMessage;
        if (/^#[0-9A-Fa-f]{6}$/.test(colorMsg.color)) {
          await updateSetting('ld_color', colorMsg.color);
          await broadcastToAllTabs(message);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Invalid color format' });
        }
        break;

      case 'setExcludeVideos':
        const excludeMsg = message as SetExcludeVideosMessage;
        await updateSetting('ld_excludeVideos', excludeMsg.excludeVideos);
        await broadcastToAllTabs(message);
        sendResponse({ success: true });
        break;

      case 'setWhitelist':
        const whitelistMsg = message as SetWhitelistMessage;
        await updateSetting('ld_whitelist', whitelistMsg.whitelist);
        await broadcastToAllTabs(message);
        sendResponse({ success: true });
        break;

      case 'toggle':
        const newEnabled = !currentSettings.ld_enabled;
        await updateSetting('ld_enabled', newEnabled);
        await broadcastToAllTabs({ action: 'setEnabled', enabled: newEnabled });
        sendResponse({ success: true, enabled: newEnabled });
        break;

      case 'resetDefaults':
        await resetToDefaults();
        await broadcastToAllTabs({
          action: 'settingsReset',
          settings: currentSettings,
        });
        sendResponse({ success: true, settings: currentSettings });
        break;

      case 'setDebug':
        debugMode = message['debug'];
        await updateSetting('ld_debug', debugMode);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('[LightDeemer] Error handling message:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    sendResponse({ success: false, error: errorMessage });
  }
}

/**
 * Load settings from storage
 */
async function loadSettings(): Promise<void> {
  try {
    const storage = await getStorageApi();
    const stored = await storage.get(null);
    currentSettings = validateSettings(stored);
    debugMode = currentSettings.ld_debug;
  } catch (error) {
    console.error('[LightDeemer] Error loading settings:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
}

/**
 * Update a single setting
 */
async function updateSetting(
  key: keyof LightDeemerSettings,
  value: any
): Promise<void> {
  try {
    currentSettings = { ...currentSettings, [key]: value };
    const storage = await getStorageApi();
    await storage.set({ [key]: value });
    log(`Updated setting ${key}:`, value);
  } catch (error) {
    console.error(`[LightDeemer] Error updating setting ${key}:`, error);
    throw error;
  }
}

/**
 * Reset all settings to defaults
 */
async function resetToDefaults(): Promise<void> {
  try {
    const storage = await getStorageApi();
    await storage.clear();
    await storage.set(DEFAULT_SETTINGS);
    currentSettings = { ...DEFAULT_SETTINGS };
    debugMode = DEFAULT_SETTINGS.ld_debug;
    log('Settings reset to defaults');
  } catch (error) {
    console.error('[LightDeemer] Error resetting to defaults:', error);
    throw error;
  }
}

/**
 * Broadcast message to all content scripts
 */
async function broadcastToAllTabs(message: Message): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    const promises = tabs.map(async (tab): Promise<void> => {
      if (tab.id && !isRestrictedUrl(tab.url)) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Ignore errors for tabs without content script
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          log(`Could not send message to tab ${tab.id}:`, errorMessage);
        }
      }
    });
    await Promise.all(promises);
  } catch (error) {
    console.error('[LightDeemer] Error broadcasting to tabs:', error);
  }
}

/**
 * Check if URL is restricted
 */
function isRestrictedUrl(url?: string): boolean {
  if (!url) return true;

  const restrictedSchemes = [
    'chrome:',
    'chrome-extension:',
    'edge:',
    'about:',
    'moz-extension:',
  ];
  return (
    restrictedSchemes.some(scheme => url.startsWith(scheme)) ||
    url.includes('chrome.google.com/webstore')
  );
}

/**
 * Log with debug check
 */
function log(...args: any[]): void {
  if (debugMode) {
    debugLog(...args);
  }
}
