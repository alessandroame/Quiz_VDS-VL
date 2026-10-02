import { describe, it, expect } from 'vitest';
import { APP_NAME, APP_SHORT_NAME, getBuildInfo } from './buildInfo';
import indexContent from '../../index.html?raw';

describe('Microcopy and Brand Tone Verification', () => {
  const BANNED_PATTERNS = [
    { word: 'quiz master', regex: /quiz master/i },
    { word: 'master', regex: /\bmaster\b/i },
    { word: 'sfida', regex: /\bsfida\b/i },
    { word: 'campione', regex: /\bcampione\b/i },
    { word: 'scalata', regex: /\bscalata\b/i },
    { word: 'punteggio record', regex: /punteggio record/i },
    { word: 'cruscotto', regex: /\bcruscotto\b/i },
    { word: 'cockpit', regex: /\bcockpit\b/i },
  ];

  it('BRAND-01: adheres to sober, essential application name and short name', () => {
    expect(APP_NAME).toBe('Quiz VDS-VL');
    expect(APP_SHORT_NAME).toBe('VDS Quiz');

    const buildInfo = getBuildInfo();
    expect(buildInfo.appName).toBe('Quiz VDS-VL');
  });

  it('BRAND-02: official application name contains zero banned gamification or cosplay terms', () => {
    for (const item of BANNED_PATTERNS) {
      expect(item.regex.test(APP_NAME)).toBe(false);
      expect(item.regex.test(APP_SHORT_NAME)).toBe(false);
    }
  });

  it('BRAND-03: index.html title and splash screen contain zero banned patterns', () => {
    expect(indexContent).toContain('<title>Quiz VDS-VL</title>');

    // Check for banned brand / gamification words
    for (const item of BANNED_PATTERNS) {
      if (item.word === 'cockpit' || item.word === 'cruscotto') {
        // Cockpit may only exist in historical HTML comment if any, but let's check title & visible markup
        const titleMatch = /<title>(.*?)<\/title>/i.exec(indexContent);
        if (titleMatch) {
          expect(item.regex.test(titleMatch[1])).toBe(false);
        }
      } else {
        expect(item.regex.test(indexContent)).toBe(false);
      }
    }
  });
});
