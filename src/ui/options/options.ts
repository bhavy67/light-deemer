/**
 * Modern Options page script for Light Deemer extension
 */

import {
  LightDeemerSettings,
  DEFAULT_SETTINGS,
  validateSettings,
  getStorageApi,
} from '../../lib/utils';

// DOM Elements
let elements: {
  defaultIntensity: HTMLInputElement;
  intensityDisplay: HTMLElement;
  defaultColor: HTMLInputElement;
  colorCode: HTMLElement;
  colorPreview: HTMLElement;
  overlayModeBtn: HTMLButtonElement;
  filterModeBtn: HTMLButtonElement;
  excludeVideos: HTMLInputElement;
  resetBtn: HTMLButtonElement;
  statusMessage: HTMLElement;
};

let currentSettings: LightDeemerSettings = { ...DEFAULT_SETTINGS };

/**
 * Initialize options page
 */
async function init(): Promise<void> {
  try {
    // Get DOM elements
    elements = {
      defaultIntensity: document.getElementById('default-intensity') as HTMLInputElement,
      intensityDisplay: document.getElementById('intensity-display') as HTMLElement,
      defaultColor: document.getElementById('default-color') as HTMLInputElement,
      colorCode: document.getElementById('color-code') as HTMLElement,
      colorPreview: document.getElementById('color-preview') as HTMLElement,
      overlayModeBtn: document.querySelector('[data-mode="overlay"]') as HTMLButtonElement,
      filterModeBtn: document.querySelector('[data-mode="filter"]') as HTMLButtonElement,
      excludeVideos: document.getElementById('exclude-videos') as HTMLInputElement,
      resetBtn: document.getElementById('reset-settings') as HTMLButtonElement,
      statusMessage: document.getElementById('status-message') as HTMLElement,
    };

    // Validate elements
    for (const [key, element] of Object.entries(elements)) {
      if (!element) {
        console.error(`Missing element: ${key}`);
        return;
      }
    }

    // Load settings
    await loadSettings();

    // Set up event listeners
    setupEventListeners();

    // Update UI
    updateUI();

    console.log('[LightDeemer] Options page initialized');
  } catch (error) {
    console.error('[LightDeemer] Error initializing options page:', error);
  }
}

/**
 * Load settings from storage
 */
async function loadSettings(): Promise<void> {
  try {
    const storage = await getStorageApi();
    const data = await storage.get(Object.keys(DEFAULT_SETTINGS));
    currentSettings = validateSettings(data);
  } catch (error) {
    console.error('[LightDeemer] Error loading settings:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings to storage
 */
async function saveSettings(): Promise<void> {
  try {
    const storage = await getStorageApi();
    await storage.set(currentSettings);
    
    // Notify background script
    chrome.runtime.sendMessage({
      action: 'settingsChanged',
      settings: currentSettings
    });

    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('[LightDeemer] Error saving settings:', error);
    showStatus('Failed to save settings', 'error');
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners(): void {
  // Intensity slider
  elements.defaultIntensity.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value) / 100;
    currentSettings.ld_intensity = value;
    updateIntensityDisplay();
    saveSettings();
  });

  // Color picker
  elements.defaultColor.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    currentSettings.ld_color = target.value;
    updateColorDisplay();
    saveSettings();
  });

  // Mode buttons
  elements.overlayModeBtn.addEventListener('click', () => {
    setMode('overlay');
  });

  elements.filterModeBtn.addEventListener('click', () => {
    setMode('filter');
  });

  // Exclude videos toggle
  elements.excludeVideos.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    currentSettings.ld_excludeVideos = target.checked;
    saveSettings();
  });

  // Reset button
  elements.resetBtn.addEventListener('click', () => {
    resetToDefaults();
  });
}

/**
 * Update UI to reflect current settings
 */
function updateUI(): void {
  // Update intensity
  elements.defaultIntensity.value = Math.round(currentSettings.ld_intensity * 100).toString();
  updateIntensityDisplay();

  // Update color
  elements.defaultColor.value = currentSettings.ld_color;
  updateColorDisplay();

  // Update mode buttons
  updateModeButtons();

  // Update exclude videos
  elements.excludeVideos.checked = currentSettings.ld_excludeVideos;
}

/**
 * Update intensity display
 */
function updateIntensityDisplay(): void {
  const value = Math.round(parseFloat(elements.defaultIntensity.value));
  elements.intensityDisplay.textContent = `${value}%`;
}

/**
 * Update color display
 */
function updateColorDisplay(): void {
  const color = elements.defaultColor.value;
  elements.colorCode.textContent = color;
  elements.colorPreview.style.backgroundColor = color;
}

/**
 * Set dimming mode
 */
function setMode(mode: 'overlay' | 'filter'): void {
  currentSettings.ld_mode = mode;
  updateModeButtons();
  saveSettings();
}

/**
 * Update mode button styles
 */
function updateModeButtons(): void {
  elements.overlayModeBtn.classList.toggle('active', currentSettings.ld_mode === 'overlay');
  elements.filterModeBtn.classList.toggle('active', currentSettings.ld_mode === 'filter');
}

/**
 * Reset to default settings
 */
async function resetToDefaults(): Promise<void> {
  try {
    currentSettings = { ...DEFAULT_SETTINGS };
    updateUI();
    await saveSettings();
    showStatus('Settings reset to defaults', 'success');
  } catch (error) {
    console.error('[LightDeemer] Error resetting settings:', error);
    showStatus('Failed to reset settings', 'error');
  }
}

/**
 * Show status message
 */
function showStatus(message: string, type: 'success' | 'error'): void {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `toast ${type} show`;
  
  setTimeout(() => {
    elements.statusMessage.classList.remove('show');
  }, 3000);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
