/**
 * Application build and version information helper.
 * Provides runtime access to build metadata injected by Vite at compile time.
 */

/**
 * Official application display and brand name.
 */
export const APP_NAME = 'Quiz VDS-VL' as const;

/**
 * Compact application name used for mobile home screens and narrow viewports.
 */
export const APP_SHORT_NAME = 'VDS Quiz' as const;

export interface BuildInfo {
  appName: string;
  version: string;
  buildNumber: string;
  commitHash: string;
  buildTime: string;
  buildId: string;
}

/**
 * Returns the current application build metadata.
 */
export function getBuildInfo(): BuildInfo {
  return {
    appName: APP_NAME,
    version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1.0',
    buildNumber: typeof __APP_BUILD_NUMBER__ !== 'undefined' ? __APP_BUILD_NUMBER__ : '0',
    commitHash: typeof __APP_COMMIT_HASH__ !== 'undefined' ? __APP_COMMIT_HASH__ : 'dev',
    buildTime: typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : new Date().toISOString(),
    buildId: typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev',
  };
}

/**
 * Formats a localized readable timestamp from an ISO string.
 */
export function formatBuildDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

/**
 * Forces a reload and updates the PWA cache.
 * Cleans non-audio cache stores to guarantee the latest app shell is loaded.
 */
export async function forceReloadPWA(): Promise<void> {
  const globalObj = typeof window !== 'undefined' ? window : (globalThis as any);
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : globalObj?.navigator;
    if (nav && 'serviceWorker' in nav) {
      const registrations = await nav.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.update();
      }
    }

    const cacheStorage = typeof caches !== 'undefined'
      ? caches
      : (globalObj && globalObj.caches ? globalObj.caches : undefined);

    if (cacheStorage) {
      const cacheNames = await cacheStorage.keys();
      for (const name of cacheNames) {
        // Keep heavy audio files intact, invalidate app shell and data caches
        if (!name.startsWith('vds-audio-')) {
          await cacheStorage.delete(name);
        }
      }
    }
  } catch (err) {
    console.error('[BuildInfo] Error invalidating caches for PWA refresh:', err);
  } finally {
    if (globalObj && globalObj.location && typeof globalObj.location.reload === 'function') {
      globalObj.location.reload();
    }
  }
}
