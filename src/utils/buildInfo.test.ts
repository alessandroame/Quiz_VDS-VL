import { describe, it, expect, vi } from 'vitest';
import { getBuildInfo, formatBuildDate, forceReloadPWA } from './buildInfo';

describe('buildInfo utility', () => {
  it('returns valid default build info structure', () => {
    const info = getBuildInfo();
    expect(info).toBeDefined();
    expect(info.appName).toBe('Quiz VDS-VL');
    expect(typeof info.version).toBe('string');
    expect(typeof info.buildNumber).toBe('string');
    expect(typeof info.commitHash).toBe('string');
    expect(typeof info.buildTime).toBe('string');
    expect(typeof info.buildId).toBe('string');
  });

  it('formats ISO build timestamp to Italian locale format', () => {
    const iso = '2026-09-30T08:15:00.000Z';
    const formatted = formatBuildDate(iso);
    expect(formatted).toMatch(/30\/09\/2026/);
  });

  it('handles invalid timestamp gracefully', () => {
    const invalid = 'not-a-date';
    expect(formatBuildDate(invalid)).toBe(invalid);
  });

  it('invokes cache clearing and reload on forceReloadPWA', async () => {
    const originalNav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const originalLoc = Object.getOwnPropertyDescriptor(globalThis, 'location');
    const originalCaches = Object.getOwnPropertyDescriptor(globalThis, 'caches');

    const reloadMock = vi.fn();
    const updateMock = vi.fn().mockResolvedValue(undefined);
    const deleteMock = vi.fn().mockResolvedValue(true);

    const mockCaches = {
      keys: vi.fn().mockResolvedValue(['workbox-precache-v2', 'vds-audio-giuseppe', 'vds-data-cache']),
      delete: deleteMock,
    };

    Object.defineProperty(globalThis, 'location', {
      value: { reload: reloadMock },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, 'caches', {
      value: mockCaches,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        serviceWorker: {
          getRegistrations: vi.fn().mockResolvedValue([{ update: updateMock }]),
        },
      },
      configurable: true,
      writable: true,
    });

    await forceReloadPWA();

    expect(updateMock).toHaveBeenCalled();
    // Audio cache must not be deleted
    expect(deleteMock).toHaveBeenCalledWith('workbox-precache-v2');
    expect(deleteMock).toHaveBeenCalledWith('vds-data-cache');
    expect(deleteMock).not.toHaveBeenCalledWith('vds-audio-giuseppe');
    expect(reloadMock).toHaveBeenCalled();

    if (originalNav) Object.defineProperty(globalThis, 'navigator', originalNav);
    else delete (globalThis as any).navigator;

    if (originalLoc) Object.defineProperty(globalThis, 'location', originalLoc);
    else delete (globalThis as any).location;

    if (originalCaches) Object.defineProperty(globalThis, 'caches', originalCaches);
    else delete (globalThis as any).caches;
  });
});
