/**
 * E2E test setup for Light Deemer extension
 */

import puppeteer from 'puppeteer';
import path from 'path';

declare global {
  var browser: import('puppeteer').Browser;
  var context: import('puppeteer').BrowserContext;
  var extensionId: string;
}

beforeAll(async () => {
  // Launch browser with extension loaded
  const extensionPath = path.resolve(__dirname, '../../dist');

  global.browser = await puppeteer.launch({
    headless: false, // Need to see the extension UI for some tests
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
  const targets = await global.browser.targets();
  const extensionTarget = targets.find(
    target =>
      target.type() === 'service_worker' &&
      target.url().includes('chrome-extension://')
  );

  if (extensionTarget) {
    const extensionUrl = extensionTarget.url();
    const urlParts = extensionUrl.split('chrome-extension://')[1]?.split('/');
    if (urlParts && urlParts[0]) {
      global.extensionId = urlParts[0];
      console.log(`Extension loaded with ID: ${global.extensionId}`);
    } else {
      throw new Error('Could not parse extension ID from URL');
    }
  } else {
    throw new Error('Extension service worker not found');
  }
});

afterAll(async () => {
  if (global.browser) {
    await global.browser.close();
  }
});

beforeEach(async () => {
  // Create new context for each test to ensure clean state
  global.context = await global.browser.createBrowserContext();
});

afterEach(async () => {
  if (global.context) {
    await global.context.close();
  }
});
