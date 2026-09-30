/**
 * Asset URL helper to ensure assets resolve properly across all deployment environments,
 * including root domains and subdirectory bases like GitHub Pages (/Quiz_VDS-VL/).
 */
export function getAssetUrl(path: string): string {
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return base ? `${base}/${cleanPath}` : `/${cleanPath}`;
}

export const APP_ICON_URL = getAssetUrl('icons/icon-192x192.png');
export const APP_ICON_LIGHT_URL = getAssetUrl('icons/icon-light-192x192.png');
export const APP_FAVICON_URL = getAssetUrl('favicon.svg');
export const APP_FAVICON_LIGHT_URL = getAssetUrl('favicon-light.svg');

/**
 * Returns the appropriate app icon URL matching the current active theme.
 */
export function getAppIconUrl(theme: 'dark' | 'light'): string {
  return theme === 'light' ? APP_ICON_LIGHT_URL : APP_ICON_URL;
}

/**
 * Returns the appropriate favicon URL matching the current active theme.
 */
export function getAppFaviconUrl(theme: 'dark' | 'light'): string {
  return theme === 'light' ? APP_FAVICON_LIGHT_URL : APP_FAVICON_URL;
}
