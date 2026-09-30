import { describe, it, expect } from 'vitest';
import { getAssetUrl, APP_ICON_URL, APP_FAVICON_URL } from './assets';

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

  it('provides valid non-empty URLs for APP_ICON_URL and APP_FAVICON_URL', () => {
    expect(APP_ICON_URL).toBeTruthy();
    expect(APP_FAVICON_URL).toBeTruthy();
    expect(APP_ICON_URL).toContain('icon-192x192.png');
    expect(APP_FAVICON_URL).toContain('favicon.svg');
  });
});
