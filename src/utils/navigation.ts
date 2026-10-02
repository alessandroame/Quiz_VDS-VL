export type NavTab = 'home' | 'tutor' | 'exam' | 'topics' | 'mistakes' | 'archive' | 'stats';

export interface ScenarioDefinition {
  id: NavTab;
  shortcut: string;
  label: string;
  headerTitle: string;
  description: string;
}

export const SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  {
    id: 'tutor',
    shortcut: '1',
    label: 'Tutor',
    headerTitle: 'Tutor',
    description: '30 quiz AeCI senza limiti di tempo con feedback immediato e spiegazione Regola e Tranello.'
  },
  {
    id: 'topics',
    shortcut: '2',
    label: 'Materie',
    headerTitle: 'Studio Materie',
    description: 'Esercitati sulle 9 materie canoniche per singolo argomento.'
  },
  {
    id: 'exam',
    shortcut: '3',
    label: 'Esame Ufficiale',
    headerTitle: 'Simulazione Esame',
    description: 'Simulazione conforme AeCI con timer 45 minuti e max 3 errori.'
  },
  {
    id: 'mistakes',
    shortcut: '4',
    label: 'Errori',
    headerTitle: 'Quaderno Errori',
    description: 'Ripetizione spaziata Leitner per consolidare i quiz sbagliati.'
  },
  {
    id: 'archive',
    shortcut: '5',
    label: 'Archivio',
    headerTitle: 'Archivio Quiz',
    description: 'Catalogo completo 474 quiz con ricerca full-text, note e preferiti.'
  },
  {
    id: 'stats',
    shortcut: '6',
    label: 'Stats',
    headerTitle: 'Statistiche',
    description: 'Radar di rendimento per materia e indice di prontezza.'
  }
];

export function getScenarioByShortcut(key: string): ScenarioDefinition | undefined {
  return SCENARIO_DEFINITIONS.find(s => s.shortcut === key);
}

export function getHeaderTitle(tab: NavTab): string {
  if (tab === 'home') return 'Home';
  return SCENARIO_DEFINITIONS.find(s => s.id === tab)?.headerTitle || '';
}

export function getTabLabel(tab: NavTab | null): string {
  if (!tab || tab === 'home') return 'Home';
  return SCENARIO_DEFINITIONS.find(s => s.id === tab)?.label || '';
}
