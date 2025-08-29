/**
 * Unit tests for utility functions
 */

import {
  hexToRgba,
  debounce,
  validateSettings,
  DEFAULT_SETTINGS,
  LightDeemerSettings,
  getCurrentHostname,
  isVideoElement,
} from '../../src/lib/utils';

describe('Utils', () => {
  describe('hexToRgba', () => {
    test('should convert hex color to rgba with alpha', () => {
      expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
      expect(hexToRgba('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
      expect(hexToRgba('#ff0000', 0.25)).toBe('rgba(255, 0, 0, 0.25)');
      expect(hexToRgba('#00ff00', 0)).toBe('rgba(0, 255, 0, 0)');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call multiple times quickly
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      // Should not be called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Fast forward time
      jest.advanceTimersByTime(100);

      // Should be called once with last arguments
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    test('should reset timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      jest.advanceTimersByTime(50);

      debouncedFn('arg2');
      jest.advanceTimersByTime(50);

      // Should not be called yet
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);

      // Should be called with last arguments
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg2');
    });
  });

  describe('validateSettings', () => {
    test('should return default settings for invalid input', () => {
      expect(validateSettings(null)).toEqual(DEFAULT_SETTINGS);
      expect(validateSettings(undefined)).toEqual(DEFAULT_SETTINGS);
      expect(validateSettings('invalid')).toEqual(DEFAULT_SETTINGS);
      expect(validateSettings(123)).toEqual(DEFAULT_SETTINGS);
    });

    test('should validate and correct settings', () => {
      const invalidSettings = {
        ld_enabled: 'true', // wrong type
        ld_intensity: 2, // out of range
        ld_color: 'invalid', // invalid format
        ld_excludeVideos: 1, // wrong type
        ld_mode: 'invalid', // invalid value
      };

      const result = validateSettings(invalidSettings);

      expect(result.ld_enabled).toBe(DEFAULT_SETTINGS.ld_enabled);
      expect(result.ld_intensity).toBe(DEFAULT_SETTINGS.ld_intensity);
      expect(result.ld_color).toBe(DEFAULT_SETTINGS.ld_color);
      expect(result.ld_excludeVideos).toBe(DEFAULT_SETTINGS.ld_excludeVideos);
      expect(result.ld_mode).toBe(DEFAULT_SETTINGS.ld_mode);
    });

    test('should preserve valid settings', () => {
      const validSettings: Partial<LightDeemerSettings> = {
        ld_enabled: false,
        ld_intensity: 0.8,
        ld_color: '#ff0000',
        ld_excludeVideos: false,
        ld_mode: 'filter',
        ld_debug: true,
      };

      const result = validateSettings(validSettings);

      expect(result.ld_enabled).toBe(false);
      expect(result.ld_intensity).toBe(0.8);
      expect(result.ld_color).toBe('#ff0000');
      expect(result.ld_excludeVideos).toBe(false);
      expect(result.ld_mode).toBe('filter');
      expect(result.ld_debug).toBe(true);
    });
  });

  describe('getCurrentHostname', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      // Mock window.location
      delete (window as any).location;
      (window as any).location = {
        ...originalLocation,
        hostname: 'example.com',
      } as Location;
    });

    afterEach(() => {
      (window as any).location = originalLocation;
    });

    test('should return current hostname', () => {
      expect(getCurrentHostname()).toBe('example.com');
    });
  });

  describe('isVideoElement', () => {
    test('should identify video elements', () => {
      const video = document.createElement('video');
      expect(isVideoElement(video)).toBe(true);
    });

    test('should identify canvas with video attributes', () => {
      const canvas = document.createElement('canvas');
      canvas.setAttribute('data-video', 'true');
      expect(isVideoElement(canvas)).toBe(true);
    });

    test('should identify elements with video classes', () => {
      const div = document.createElement('div');
      div.className = 'html5-video-player';
      expect(isVideoElement(div)).toBe(true);
    });

    test('should not identify regular elements', () => {
      const div = document.createElement('div');
      expect(isVideoElement(div)).toBe(false);
    });
  });
});
