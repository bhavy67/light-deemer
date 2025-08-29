/**
 * E2E tests for Light Deemer extension
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';

describe('Light Deemer Extension E2E Tests', () => {
  let browser: Browser;
  let page: Page;
  let extensionId: string;

  beforeAll(async () => {
    const extensionPath = path.resolve(__dirname, '../../dist');

    browser = await puppeteer.launch({
      headless: true, // Changed from 'new' to boolean
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
      ],
    });

    // Get extension ID
    const targets = await browser.targets();
    const extensionTarget = targets.find(
      (target: any) =>
        target.type() === 'service_worker' &&
        target.url().includes('chrome-extension://')
    );

    if (extensionTarget) {
      const extensionUrl = extensionTarget.url();
      extensionId = extensionUrl
        .split('chrome-extension://')[1]!
        .split('/')[0]!;
      console.log(`Extension loaded with ID: ${extensionId}`);
    } else {
      throw new Error('Extension service worker not found');
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('should load extension and create overlay on page', async () => {
    // Navigate to a test page
    await page.goto(
      'data:text/html,<html><body style="background:white;height:100vh;"><h1>Test Page</h1></body></html>'
    );

    // Wait for content script to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if overlay element exists
    const overlay = await page.$('#light-deemer-overlay');
    expect(overlay).toBeTruthy();

    // Check if overlay has correct styles
    const overlayStyles = await page.evaluate(() => {
      const overlay = document.getElementById('light-deemer-overlay');
      if (!overlay) return null;

      const computedStyle = window.getComputedStyle(overlay);
      return {
        position: computedStyle.position,
        zIndex: computedStyle.zIndex,
        pointerEvents: computedStyle.pointerEvents,
        mixBlendMode: computedStyle.mixBlendMode,
      };
    });

    expect(overlayStyles).toEqual({
      position: 'fixed',
      zIndex: '2147483647',
      pointerEvents: 'none',
      mixBlendMode: 'multiply',
    });
  });

  test('should raise video elements when excludeVideos is enabled', async () => {
    // Create a page with video element
    await page.goto(
      'data:text/html,<html><body><video width="320" height="240" controls><source src="movie.mp4" type="video/mp4"></video></body></html>'
    );

    // Wait for content script to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if video has raised class
    const hasRaisedClass = await page.evaluate(() => {
      const video = document.querySelector('video');
      return video?.classList.contains('light-deemer-raise-video');
    });

    expect(hasRaisedClass).toBe(true);

    // Check if video has higher z-index
    const videoZIndex = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLElement;
      return video?.style.zIndex;
    });

    expect(videoZIndex).toBe('2147483648');
  });

  test('should hide overlay in fullscreen mode', async () => {
    await page.goto(
      'data:text/html,<html><body style="background:white;height:100vh;"><button id="fullscreen-btn">Fullscreen</button></body></html>'
    );

    // Wait for content script
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify overlay is visible initially
    let overlayDisplay = await page.evaluate(() => {
      const overlay = document.getElementById('light-deemer-overlay');
      return overlay ? window.getComputedStyle(overlay).display : null;
    });

    expect(overlayDisplay).not.toBe('none');

    // Simulate fullscreen (in real browser this would require user interaction)
    await page.evaluate(() => {
      const fullscreenChange = new Event('fullscreenchange');
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.body,
        configurable: true,
      });
      document.dispatchEvent(fullscreenChange);
    });

    // Wait for fullscreen handling
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if overlay is hidden
    const overlayAfterFullscreen = await page.$('#light-deemer-overlay');
    expect(overlayAfterFullscreen).toBeNull();
  });

  test('should respect whitelist settings', async () => {
    // Set up whitelist for test domain
    await page.evaluateOnNewDocument(() => {
      // Mock chrome.storage for testing
      (window as any).chrome = {
        runtime: {
          sendMessage: () =>
            Promise.resolve({
              settings: {
                ld_enabled: true,
                ld_intensity: 0.25,
                ld_color: '#000000',
                ld_excludeVideos: true,
                ld_whitelist: { 'example.com': true },
                ld_perDomain: {},
                ld_mode: 'overlay',
                ld_debug: false,
              },
            }),
        },
      };
    });

    // Navigate to whitelisted domain simulation
    await page.goto(
      'data:text/html,<html><body style="background:white;height:100vh;"><h1>Whitelisted Page</h1></body></html>'
    );

    // Override hostname for test
    await page.evaluate(() => {
      Object.defineProperty(window.location, 'hostname', {
        value: 'example.com',
        configurable: true,
      });
    });

    // Wait for content script
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if overlay is NOT created due to whitelist
    const overlay = await page.$('#light-deemer-overlay');
    expect(overlay).toBeNull();
  });

  test('should open popup and modify settings', async () => {
    // Open extension popup
    const popupPage = await browser.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

    // Wait for popup to load
    await popupPage.waitForSelector('#enabled-toggle');

    // Check if toggle exists and is checked
    const isToggleChecked = await popupPage.evaluate(() => {
      const toggle = document.getElementById(
        'enabled-toggle'
      ) as HTMLInputElement;
      return toggle?.checked;
    });

    expect(typeof isToggleChecked).toBe('boolean');

    // Check if intensity slider exists
    const intensitySlider = await popupPage.$('#intensity-slider');
    expect(intensitySlider).toBeTruthy();

    // Check if color picker exists
    const colorPicker = await popupPage.$('#color-picker');
    expect(colorPicker).toBeTruthy();

    // Test changing intensity
    await popupPage.evaluate(() => {
      const slider = document.getElementById(
        'intensity-slider'
      ) as HTMLInputElement;
      if (slider) {
        slider.value = '50';
        slider.dispatchEvent(new Event('input'));
        slider.dispatchEvent(new Event('change'));
      }
    });

    // Verify intensity value updated
    const intensityValue = await popupPage.evaluate(() => {
      const valueEl = document.getElementById('intensity-value');
      return valueEl?.textContent;
    });

    expect(intensityValue).toBe('50%');

    await popupPage.close();
  });

  test('should open options page and manage whitelist', async () => {
    // Open options page
    const optionsPage = await browser.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Wait for options page to load
    await optionsPage.waitForSelector('#new-site-input');

    // Test adding site to whitelist
    await optionsPage.type('#new-site-input', 'test.com');
    await optionsPage.click('#add-site-btn');

    // Wait for UI update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if site was added to whitelist UI
    const whitelistItem = await optionsPage.$(
      '.whitelist-item .whitelist-domain'
    );
    const whitelistText = await optionsPage.evaluate(
      el => el?.textContent,
      whitelistItem
    );

    expect(whitelistText).toBe('test.com');

    // Test removing site from whitelist
    const removeBtn = await optionsPage.$('.whitelist-item .remove-btn');
    if (removeBtn) {
      await removeBtn.click();
    }

    // Wait for UI update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if whitelist is empty again
    const emptyState = await optionsPage.$('#whitelist-empty');
    const isVisible = await optionsPage.evaluate(el => {
      return el ? window.getComputedStyle(el).display !== 'none' : false;
    }, emptyState);

    expect(isVisible).toBe(true);

    await optionsPage.close();
  });
});
