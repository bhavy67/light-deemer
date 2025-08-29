/**
 * Modern Popup script for Light Deemer extension
 */

import {
  LightDeemerSettings,
  DEFAULT_SETTINGS,
  validateSettings,
} from '../../lib/utils';

// DOM Elements
let elements: {
  enabledToggle: HTMLInputElement;
  statusText: HTMLElement;
  statusDescription: HTMLElement;
  controls: HTMLElement;
  intensitySlider: HTMLInputElement;
  intensityValue: HTMLElement;
  colorPicker: HTMLInputElement;
  colorPreview: HTMLElement;
  colorCode: HTMLElement;
  excludeVideos: HTMLInputElement;
  currentSite: HTMLElement;
  openSettings: HTMLButtonElement;
  statusMessage: HTMLElement;
};

let currentSettings: LightDeemerSettings = { ...DEFAULT_SETTINGS };
let currentHostname = '';

/**
 * Initialize popup
 */
async function init(): Promise<void> {
  try {
    // Get DOM elements
    elements = {
      enabledToggle: document.getElementById('enabled-toggle') as HTMLInputElement,
      statusText: document.getElementById('status-text') as HTMLElement,
      statusDescription: document.getElementById('status-description') as HTMLElement,
      controls: document.getElementById('controls') as HTMLElement,
      intensitySlider: document.getElementById('intensity-slider') as HTMLInputElement,
      intensityValue: document.getElementById('intensity-value') as HTMLElement,
      colorPicker: document.getElementById('color-picker') as HTMLInputElement,
      colorPreview: document.getElementById('color-preview') as HTMLElement,
      colorCode: document.getElementById('color-code') as HTMLElement,
      excludeVideos: document.getElementById('exclude-videos') as HTMLInputElement,
      currentSite: document.getElementById('current-site') as HTMLElement,
      openSettings: document.getElementById('open-settings') as HTMLButtonElement,
      statusMessage: document.getElementById('status-message') as HTMLElement,
    };

    // Validate elements
    for (const [key, element] of Object.entries(elements)) {
      if (!element) {
        console.error(`Missing element: ${key}`);
        return;
      }
    }

    // Get current hostname
    await getCurrentHostname();

    // Load settings
    await loadSettings();

    // Set up event listeners
    setupEventListeners();

    // Update UI
    updateUI();

    console.log('[LightDeemer] Popup initialized');
  } catch (error) {
    console.error('[LightDeemer] Error initializing popup:', error);
  }
}

/**
 * Get current hostname from active tab
 */
async function getCurrentHostname(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      currentHostname = url.hostname;
      elements.currentSite.textContent = currentHostname || 'Unknown';
    }
  } catch (error) {
    console.error('[LightDeemer] Error getting hostname:', error);
    currentHostname = '';
    elements.currentSite.textContent = 'Unknown';
  }
}

/**
 * Load settings from background
 */
async function loadSettings(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (response?.settings) {
      currentSettings = validateSettings(response.settings);
    }
  } catch (error) {
    console.error('[LightDeemer] Error loading settings:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings via background script
 */
async function saveSettings(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: currentSettings
    });
  } catch (error) {
    console.error('[LightDeemer] Error saving settings:', error);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners(): void {
  // Master toggle
  elements.enabledToggle.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    currentSettings.ld_enabled = target.checked;
    updateUI();
    saveSettings();
    sendContentScriptMessage();
  });

  // Intensity slider
  elements.intensitySlider.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value) / 100;
    currentSettings.ld_intensity = value;
    updateIntensityDisplay();
    saveSettings();
    sendContentScriptMessage();
  });

  // Color picker
  elements.colorPicker.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    currentSettings.ld_color = target.value;
    updateColorDisplay();
    saveSettings();
    sendContentScriptMessage();
  });

  // Exclude videos toggle
  elements.excludeVideos.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    currentSettings.ld_excludeVideos = target.checked;
    saveSettings();
    sendContentScriptMessage();
  });

  // Open settings button
  elements.openSettings.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
}

/**
 * Update UI to reflect current settings
 */
function updateUI(): void {
  const isEnabled = currentSettings.ld_enabled;
  
  // Update master toggle
  elements.enabledToggle.checked = isEnabled;
  
  // Update status text
  elements.statusText.textContent = isEnabled ? 'Active' : 'Inactive';
  elements.statusDescription.textContent = isEnabled 
    ? 'Protecting your eyes' 
    : 'Click to enable protection';

  // Update controls visibility
  elements.controls.classList.toggle('disabled', !isEnabled);

  // Update intensity
  elements.intensitySlider.value = Math.round(currentSettings.ld_intensity * 100).toString();
  updateIntensityDisplay();

  // Update color
  elements.colorPicker.value = currentSettings.ld_color;
  updateColorDisplay();

  // Update exclude videos
  elements.excludeVideos.checked = currentSettings.ld_excludeVideos;
}

/**
 * Update intensity display
 */
function updateIntensityDisplay(): void {
  const value = Math.round(parseFloat(elements.intensitySlider.value));
  elements.intensityValue.textContent = `${value}%`;
}

/**
 * Update color display
 */
function updateColorDisplay(): void {
  const color = elements.colorPicker.value;
  elements.colorCode.textContent = color;
  elements.colorPreview.style.backgroundColor = color;
}

/**
 * Send message to content script
 */
function sendContentScriptMessage(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'settingsReset',
        settings: currentSettings
      }).catch(() => {
        // Content script might not be loaded, ignore error
      });
    }
  });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
