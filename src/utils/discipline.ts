import type { Discipline, Question } from '../types/quiz';

export type { Discipline };

export interface DisciplineOption {
  id: Discipline;
  label: string;
  shortLabel: string;
  description: string;
  totalCount: number;
}

export const DISCIPLINE_OPTIONS: DisciplineOption[] = [
  {
    id: 'all',
    label: 'Tutti i Quiz',
    shortLabel: 'Tutti',
    description: 'Catalogo unificato 504 quiz AeCI (Volo Libero unificato)',
    totalCount: 504
  },
  {
    id: 'paraglider',
    label: 'Parapendio',
    shortLabel: 'Parapendio',
    description: 'Solo Parapendio e quiz comuni (474 quiz, esclude i 30 specifici del deltaplano)',
    totalCount: 474
  },
  {
    id: 'hang_glider',
    label: 'Deltaplano',
    shortLabel: 'Deltaplano',
    description: 'Solo Deltaplano e quiz comuni (458 quiz, esclude i 46 specifici del parapendio)',
    totalCount: 458
  }
];

/**
 * Filtra le domande in base alla disciplina selezionata.
 * Le domande con discipline === 'all' (teoria generale condivisa) sono sempre incluse.
 */
export function filterQuestionsByDiscipline(questions: Question[], discipline: Discipline = 'paraglider'): Question[] {
  if (discipline === 'all') {
    return questions;
  }
  return questions.filter(q => q.discipline === 'all' || q.discipline === discipline);
}

/**
 * Restituisce i metadati del badge grafico per le domande a disciplina esclusiva.
 */
export function getDisciplineBadge(discipline: Discipline): { label: string; className: string } | null {
  if (discipline === 'hang_glider') {
    return {
      label: 'Deltaplano',
      className: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
    };
  }
  if (discipline === 'paraglider') {
    return {
      label: 'Parapendio',
      className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
    };
  }
  return null;
}
