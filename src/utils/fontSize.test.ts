import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FONT_SIZE_OPTIONS,
  getFontSizeLabel,
  applyFontSizePreference
} from './fontSize';

describe('Font Size Utility', () => {
  const originalDocument = (globalThis as any).document;
  let mockElement: {
    attributes: Map<string, string>;
    setAttribute: (key: string, val: string) => void;
    getAttribute: (key: string) => string | null;
    removeAttribute: (key: string) => void;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockElement = {
      attributes: new Map<string, string>(),
      setAttribute(key: string, val: string) {
        this.attributes.set(key, val);
      },
      getAttribute(key: string) {
        return this.attributes.get(key) || null;
      },
      removeAttribute(key: string) {
        this.attributes.delete(key);
      }
    };

    Object.defineProperty(globalThis, 'document', {
      value: { documentElement: mockElement },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'document', {
      value: originalDocument,
      writable: true,
      configurable: true
    });
  });

  it('exposes exactly three font scaling options with required metadata', () => {
    expect(FONT_SIZE_OPTIONS.length).toBe(3);
    expect(FONT_SIZE_OPTIONS.map(o => o.id)).toEqual(['compact', 'normal', 'large']);
    expect(FONT_SIZE_OPTIONS.every(o => o.label && o.sizeLabel && o.description)).toBe(true);
  });

  describe('getFontSizeLabel', () => {
    it('returns correct label for valid preferences', () => {
      expect(getFontSizeLabel('compact')).toBe('Compatto');
      expect(getFontSizeLabel('normal')).toBe('Normale');
      expect(getFontSizeLabel('large')).toBe('Grande / Outdoor');
    });

    it('falls back to Normale for undefined or unknown input', () => {
      expect(getFontSizeLabel(undefined as any)).toBe('Normale');
      expect(getFontSizeLabel('unknown' as any)).toBe('Normale');
    });
  });

  describe('applyFontSizePreference', () => {
    it('sets the data-font-size attribute on document.documentElement', () => {
      applyFontSizePreference('compact');
      expect(mockElement.getAttribute('data-font-size')).toBe('compact');

      applyFontSizePreference('large');
      expect(mockElement.getAttribute('data-font-size')).toBe('large');

      applyFontSizePreference('normal');
      expect(mockElement.getAttribute('data-font-size')).toBe('normal');
    });

    it('defaults to normal if called without argument', () => {
      applyFontSizePreference();
      expect(mockElement.getAttribute('data-font-size')).toBe('normal');
    });

    it('gracefully handles environment without document', () => {
      Object.defineProperty(globalThis, 'document', {
        value: undefined,
        writable: true,
        configurable: true
      });

      expect(() => applyFontSizePreference('compact')).not.toThrow();
    });
  });
});
