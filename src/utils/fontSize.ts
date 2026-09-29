import type { FontSizePreference } from '../types/database';

export interface FontSizeOption {
  id: FontSizePreference;
  label: string;
  sizeLabel: string;
  description: string;
}

export const FONT_SIZE_OPTIONS: readonly FontSizeOption[] = [
  {
    id: 'compact',
    label: 'Compatto',
    sizeLabel: '14px',
    description: 'Ideale per smartphone compatti e zero-scroll'
  },
  {
    id: 'normal',
    label: 'Normale',
    sizeLabel: '16px',
    description: 'Dimensione standard bilanciata'
  },
  {
    id: 'large',
    label: 'Grande / Outdoor',
    sizeLabel: '18px',
    description: 'Alta leggibilità da manubrio bici o outdoor'
  }
] as const;

/**
 * Returns a human-friendly label for a given font size preference.
 */
export function getFontSizeLabel(pref: FontSizePreference = 'normal'): string {
  const match = FONT_SIZE_OPTIONS.find(opt => opt.id === pref);
  return match ? match.label : 'Normale';
}

/**
 * Applies the selected font size preference directly to the document root element.
 */
export function applyFontSizePreference(pref: FontSizePreference = 'normal'): void {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-font-size', pref);
  }
}
