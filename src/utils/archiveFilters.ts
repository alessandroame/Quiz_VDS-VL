import type { Question } from '../types/quiz';
import type { QuestionStat } from '../types/database';

export type ArchiveStatusFilter = 'all' | 'unseen' | 'incorrect' | 'correct' | 'bookmarked' | 'with_notes';

export interface ConceptChipDefinition {
  id: string;
  label: string;
  keywords: string[];
}

export const ARCHIVE_CONCEPT_CHIPS: readonly ConceptChipDefinition[] = [
  { id: 'vento', label: 'Vento', keywords: ['vento', 'venti'] },
  { id: 'stallo', label: 'Stallo', keywords: ['stallo', 'stalli'] },
  { id: 'efficienza', label: 'Efficienza', keywords: ['efficienza', 'efficienze'] },
  { id: 'precedenze', label: 'Precedenze', keywords: ['precedenz'] },
  { id: 'spazio_aereo', label: 'Spazio Aereo', keywords: ['spazio aereo', 'spazi aerei', 'ctr', 'atz'] },
  { id: 'termica', label: 'Termica', keywords: ['termica', 'termiche', 'termico'] },
  { id: 'nubi', label: 'Nubi', keywords: ['nub', 'nuvol'] }
] as const;

export interface ArchiveFilterOptions {
  searchQuery?: string;
  subjectId?: number | 'all';
  statusFilter?: ArchiveStatusFilter;
  conceptChipId?: string | null;
}

export interface ArchiveStatusCounts {
  all: number;
  unseen: number;
  incorrect: number;
  correct: number;
  bookmarked: number;
  with_notes: number;
}

/**
 * Formats a numeric subject identifier into a two-digit display string (e.g. 1 -> "01").
 */
export function formatSubjectCode(id: number): string {
  return id < 10 ? `0${id}` : `${id}`;
}

/**
 * Searches for a question by its exact identifier.
 */
export function findQuestionById(questions: Question[], id: number): Question | undefined {
  return questions.find(q => q.id === id);
}

/**
 * Calculates item counts for each status filter category, optionally scoped to a selected subject.
 */
export function getArchiveStatusCounts(
  questions: Question[],
  statsMap: Map<number, QuestionStat>,
  subjectId: number | 'all' = 'all'
): ArchiveStatusCounts {
  const scopedQuestions =
    subjectId === 'all' ? questions : questions.filter(q => q.subjectId === subjectId);

  let unseen = 0;
  let incorrect = 0;
  let correct = 0;
  let bookmarked = 0;
  let withNotes = 0;

  for (const q of scopedQuestions) {
    const stat = statsMap.get(q.id);
    if (!stat || stat.timesSeen === 0) {
      unseen++;
    }
    if (stat && (stat.timesWrong > 0 || stat.lastResult === 'wrong')) {
      incorrect++;
    }
    if (stat && stat.timesSeen > 0 && stat.lastResult === 'correct') {
      correct++;
    }
    if (stat?.isBookmarked) {
      bookmarked++;
    }
    if (stat?.userNote && stat.userNote.trim().length > 0) {
      withNotes++;
    }
  }

  return {
    all: scopedQuestions.length,
    unseen,
    incorrect,
    correct,
    bookmarked,
    with_notes: withNotes
  };
}

/**
 * Filters the list of archive questions based on subject, status, concept chips, and text search.
 */
export function filterArchiveQuestions(
  questions: Question[],
  statsMap: Map<number, QuestionStat>,
  options: ArchiveFilterOptions
): Question[] {
  const {
    searchQuery = '',
    subjectId = 'all',
    statusFilter = 'all',
    conceptChipId = null
  } = options;

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isIdSearch = /^#?\d+$/.test(trimmedQuery);
  const cleanIdQuery = isIdSearch ? trimmedQuery.replace(/^#/, '') : '';

  const activeChipDef = conceptChipId
    ? ARCHIVE_CONCEPT_CHIPS.find(c => c.id === conceptChipId)
    : null;

  return questions.filter(q => {
    // 1. Subject filter
    if (subjectId !== 'all' && q.subjectId !== subjectId) {
      return false;
    }

    const stat = statsMap.get(q.id);

    // 2. Status filter
    if (statusFilter === 'unseen') {
      if (stat && stat.timesSeen > 0) return false;
    } else if (statusFilter === 'incorrect') {
      if (!stat || (stat.timesWrong === 0 && stat.lastResult !== 'wrong')) return false;
    } else if (statusFilter === 'correct') {
      if (!stat || stat.timesSeen === 0 || stat.lastResult !== 'correct') return false;
    } else if (statusFilter === 'bookmarked') {
      if (!stat?.isBookmarked) return false;
    } else if (statusFilter === 'with_notes') {
      if (!stat?.userNote || stat.userNote.trim().length === 0) return false;
    }

    // 3. Thematic concept chip filter
    if (activeChipDef) {
      const fullText = (
        q.question +
        ' ' +
        q.options.join(' ') +
        ' ' +
        q.explanation.rule +
        ' ' +
        q.explanation.trap
      ).toLowerCase();

      const matchesConcept = activeChipDef.keywords.some(kw => fullText.includes(kw));
      if (!matchesConcept) return false;
    }

    // 4. Free-form text or #ID search
    if (trimmedQuery) {
      if (isIdSearch) {
        if (!q.id.toString().includes(cleanIdQuery)) {
          return false;
        }
      } else {
        const fullText = (
          q.question +
          ' ' +
          q.options.join(' ') +
          ' ' +
          q.explanation.rule +
          ' ' +
          q.explanation.trap +
          (stat?.userNote ? ' ' + stat.userNote : '')
        ).toLowerCase();

        if (!fullText.includes(trimmedQuery)) {
          return false;
        }
      }
    }

    return true;
  });
}
