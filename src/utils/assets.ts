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
export const APP_FAVICON_URL = getAssetUrl('favicon.svg');
