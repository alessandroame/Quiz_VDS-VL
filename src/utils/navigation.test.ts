import { describe, it, expect } from 'vitest';
import {
  SCENARIO_DEFINITIONS,
  getScenarioByShortcut,
  getHeaderTitle,
  getTabLabel
} from './navigation';

describe('Suite 17: Cockpit V2 Navigation & Home Hub Logic', () => {
  it('NAV-01: SCENARIO_DEFINITIONS definisce esattamente i 6 scenari d\'uso puri del cruscotto', () => {
    expect(SCENARIO_DEFINITIONS.length).toBe(6);
    const ids = SCENARIO_DEFINITIONS.map(s => s.id);
    expect(ids).toEqual(['tutor', 'topics', 'exam', 'mistakes', 'archive', 'stats']);
  });

  it('NAV-02: le scorciatoie da tastiera 1..6 sono univoche e sequenziali', () => {
    const shortcuts = SCENARIO_DEFINITIONS.map(s => s.shortcut);
    expect(shortcuts).toEqual(['1', '2', '3', '4', '5', '6']);
    const uniqueShortcuts = new Set(shortcuts);
    expect(uniqueShortcuts.size).toBe(6);
  });

  it('NAV-03: getScenarioByShortcut mappa correttamente i tasti numerici 1..6 e restituisce undefined per tasti non validi', () => {
    expect(getScenarioByShortcut('1')?.id).toBe('tutor');
    expect(getScenarioByShortcut('2')?.id).toBe('topics');
    expect(getScenarioByShortcut('3')?.id).toBe('exam');
    expect(getScenarioByShortcut('4')?.id).toBe('mistakes');
    expect(getScenarioByShortcut('5')?.id).toBe('archive');
    expect(getScenarioByShortcut('6')?.id).toBe('stats');

    expect(getScenarioByShortcut('0')).toBeUndefined();
    expect(getScenarioByShortcut('7')).toBeUndefined();
    expect(getScenarioByShortcut('a')).toBeUndefined();
  });

  it('NAV-04: getHeaderTitle restituisce titoli essenziali per il mini-header e Home per la radice', () => {
    expect(getHeaderTitle('home')).toBe('Home');
    expect(getHeaderTitle('tutor')).toBe('Tutor Didattico');
    expect(getHeaderTitle('exam')).toBe('Simulazione Esame');
    expect(getHeaderTitle('topics')).toBe('Studio Materie');
    expect(getHeaderTitle('mistakes')).toBe('Quaderno Errori');
    expect(getHeaderTitle('archive')).toBe('Archivio Quiz');
    expect(getHeaderTitle('stats')).toBe('Statistiche');
  });

  it('NAV-05: getTabLabel restituisce etichette leggibili per l\'abbandono e gestisce valori null o home', () => {
    expect(getTabLabel(null)).toBe('Home');
    expect(getTabLabel('home')).toBe('Home');
    expect(getTabLabel('tutor')).toBe('Tutor Didattico');
    expect(getTabLabel('exam')).toBe('Esame Ufficiale');
    expect(getTabLabel('topics')).toBe('Materie');
    expect(getTabLabel('mistakes')).toBe('Errori');
    expect(getTabLabel('archive')).toBe('Archivio');
    expect(getTabLabel('stats')).toBe('Stats');
  });
});
