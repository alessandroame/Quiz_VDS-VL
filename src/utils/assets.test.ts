import { describe, it, expect } from 'vitest';
import {
  getAssetUrl,
  APP_ICON_URL,
  APP_ICON_LIGHT_URL,
  APP_FAVICON_URL,
  APP_FAVICON_LIGHT_URL,
  getAppIconUrl,
  getAppFaviconUrl
} from './assets';

describe('assets utility', () => {
  it('resolves relative path without leading slash', () => {
    const url = getAssetUrl('icons/icon-192x192.png');
    expect(url).toContain('icons/icon-192x192.png');
    expect(url.startsWith('/')).toBe(true);
  });

  it('resolves path with leading slash without duplicating slash', () => {
    const url = getAssetUrl('/favicon.svg');
    expect(url).toContain('favicon.svg');
    expect(url).not.toContain('//favicon.svg');
  });

  it('provides valid non-empty URLs for dark and light theme assets', () => {
    expect(APP_ICON_URL).toBeTruthy();
    expect(APP_ICON_URL).toContain('icon-192x192.png');
    expect(APP_ICON_LIGHT_URL).toBeTruthy();
    expect(APP_ICON_LIGHT_URL).toContain('icon-light-192x192.png');

    expect(APP_FAVICON_URL).toBeTruthy();
    expect(APP_FAVICON_URL).toContain('favicon.svg');
    expect(APP_FAVICON_LIGHT_URL).toBeTruthy();
    expect(APP_FAVICON_LIGHT_URL).toContain('favicon-light.svg');
  });

  it('returns appropriate icon and favicon URL based on active theme', () => {
    expect(getAppIconUrl('dark')).toBe(APP_ICON_URL);
    expect(getAppIconUrl('light')).toBe(APP_ICON_LIGHT_URL);

    expect(getAppFaviconUrl('dark')).toBe(APP_FAVICON_URL);
    expect(getAppFaviconUrl('light')).toBe(APP_FAVICON_LIGHT_URL);
  });
});
