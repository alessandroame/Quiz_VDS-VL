import { describe, it, expect } from 'vitest';
import {
  formatSubjectCode,
  findQuestionById,
  getArchiveStatusCounts,
  filterArchiveQuestions,
  ARCHIVE_CONCEPT_CHIPS
} from './archiveFilters';
import type { Question } from '../types/quiz';
import type { QuestionStat } from '../types/database';

const mockQuestions: Question[] = [
  {
    id: 1001,
    subjectId: 1,
    subjectName: 'Aerodinamica',
    question: 'Che cosa si intende per stallo?',
    options: ['Distacco dei filetti fluidi', 'Aumento di portanza', 'Aumento di velocità'],
    correctAnswer: 1,
    discipline: 'all',
    explanation: {
      rule: 'Lo stallo si verifica quando si supera l angolo critico.',
      trap: 'Non confondere lo stallo con la picchiata.'
    }
  },
  {
    id: 1002,
    subjectId: 1,
    subjectName: 'Aerodinamica',
    question: 'Come varia l efficienza in volo?',
    options: ['Rapporto tra portanza e resistenza', 'Solo con il peso', 'Costante'],
    correctAnswer: 1,
    discipline: 'paraglider',
    explanation: {
      rule: 'L efficienza massima si ottiene alla migliore velocità.',
      trap: 'Il vento non modifica la polare ma la traiettoria rispetto al suolo.'
    }
  },
  {
    id: 2001,
    subjectId: 2,
    subjectName: 'Meteorologia',
    question: 'Come si forma una nube a sviluppo verticale?',
    options: ['Con moti convettivi e termica', 'Solo di notte', 'Senza umidità'],
    correctAnswer: 1,
    discipline: 'all',
    explanation: {
      rule: 'Le nubi temporalesche nascono dall instabilità e forti correnti ascensionali.',
      trap: 'Attenzione alle raffiche di vento discendenti.'
    }
  },
  {
    id: 3001,
    subjectId: 3,
    subjectName: 'Legislazione',
    question: 'Quali sono le regole di precedenza tra aeromobili?',
    options: ['Ha la precedenza chi converge da destra', 'Chi è più veloce', 'Chi vola più in alto'],
    correctAnswer: 1,
    discipline: 'all',
    explanation: {
      rule: 'Nel volo a vela e VDS chi ha la destra libera prosegue.',
      trap: 'Attenzione alle precedenze in termica sul costone.'
    }
  }
];

describe('Archive Filters Utility', () => {
  it('formats subject identifiers with leading zeros', () => {
    expect(formatSubjectCode(1)).toBe('01');
    expect(formatSubjectCode(9)).toBe('09');
    expect(formatSubjectCode(10)).toBe('10');
  });

  it('finds question by exact id', () => {
    expect(findQuestionById(mockQuestions, 1001)?.id).toBe(1001);
    expect(findQuestionById(mockQuestions, 9999)).toBeUndefined();
  });

  describe('getArchiveStatusCounts', () => {
    it('calculates counts accurately across categories', () => {
      const statsMap = new Map<number, QuestionStat>([
        [
          1001,
          {
            questionId: 1001,
            timesSeen: 2,
            timesCorrect: 1,
            timesWrong: 1,
            lastResult: 'wrong',
            consecutiveCorrect: 0,
            isBookmarked: true,
            userNote: 'Ripassare angolo critico'
          }
        ],
        [
          1002,
          {
            questionId: 1002,
            timesSeen: 1,
            timesCorrect: 1,
            timesWrong: 0,
            lastResult: 'correct',
            consecutiveCorrect: 1,
            isBookmarked: false
          }
        ]
        // 2001 & 3001 unseen
      ]);

      const counts = getArchiveStatusCounts(mockQuestions, statsMap, 'all');
      expect(counts.all).toBe(4);
      expect(counts.unseen).toBe(2);
      expect(counts.incorrect).toBe(1);
      expect(counts.bookmarked).toBe(1);
      expect(counts.with_notes).toBe(1);

      // Scoped to subject 1
      const sub1Counts = getArchiveStatusCounts(mockQuestions, statsMap, 1);
      expect(sub1Counts.all).toBe(2);
      expect(sub1Counts.unseen).toBe(0);
      expect(sub1Counts.incorrect).toBe(1);
      expect(sub1Counts.bookmarked).toBe(1);
      expect(sub1Counts.with_notes).toBe(1);
    });
  });

  describe('filterArchiveQuestions', () => {
    const statsMap = new Map<number, QuestionStat>([
      [
        1001,
        {
          questionId: 1001,
          timesSeen: 3,
          timesCorrect: 1,
          timesWrong: 2,
          lastResult: 'wrong',
          consecutiveCorrect: 0,
          isBookmarked: true,
          userNote: 'Da rivedere prima dell esame'
        }
      ],
      [
        1002,
        {
          questionId: 1002,
          timesSeen: 1,
          timesCorrect: 1,
          timesWrong: 0,
          lastResult: 'correct',
          consecutiveCorrect: 1,
          isBookmarked: true
        }
      ]
    ]);

    it('returns all questions when no filters are set', () => {
      const results = filterArchiveQuestions(mockQuestions, statsMap, {});
      expect(results.length).toBe(4);
    });

    it('filters strictly by subjectId', () => {
      const results = filterArchiveQuestions(mockQuestions, statsMap, { subjectId: 1 });
      expect(results.length).toBe(2);
      expect(results.every(q => q.subjectId === 1)).toBe(true);
    });

    it('filters by status: unseen, incorrect, bookmarked, with_notes', () => {
      const unseen = filterArchiveQuestions(mockQuestions, statsMap, { statusFilter: 'unseen' });
      expect(unseen.map(q => q.id)).toEqual([2001, 3001]);

      const incorrect = filterArchiveQuestions(mockQuestions, statsMap, {
        statusFilter: 'incorrect'
      });
      expect(incorrect.map(q => q.id)).toEqual([1001]);

      const bookmarked = filterArchiveQuestions(mockQuestions, statsMap, {
        statusFilter: 'bookmarked'
      });
      expect(bookmarked.map(q => q.id)).toEqual([1001, 1002]);

      const withNotes = filterArchiveQuestions(mockQuestions, statsMap, {
        statusFilter: 'with_notes'
      });
      expect(withNotes.map(q => q.id)).toEqual([1001]);
    });

    it('filters by thematic concept chip', () => {
      const stallo = filterArchiveQuestions(mockQuestions, statsMap, { conceptChipId: 'stallo' });
      expect(stallo.map(q => q.id)).toEqual([1001]);

      const efficienza = filterArchiveQuestions(mockQuestions, statsMap, {
        conceptChipId: 'efficienza'
      });
      expect(efficienza.map(q => q.id)).toEqual([1002]);

      const nubi = filterArchiveQuestions(mockQuestions, statsMap, { conceptChipId: 'nubi' });
      expect(nubi.map(q => q.id)).toEqual([2001]);

      const vento = filterArchiveQuestions(mockQuestions, statsMap, { conceptChipId: 'vento' });
      // 1002 mentions vento in explanation trap, 2001 mentions vento in explanation trap
      expect(vento.map(q => q.id)).toEqual([1002, 2001]);
    });

    it('supports #ID search directly with or without hash prefix', () => {
      const withHash = filterArchiveQuestions(mockQuestions, statsMap, { searchQuery: '#1002' });
      expect(withHash.map(q => q.id)).toEqual([1002]);

      const numericOnly = filterArchiveQuestions(mockQuestions, statsMap, {
        searchQuery: '2001'
      });
      expect(numericOnly.map(q => q.id)).toEqual([2001]);
    });

    it('supports text search in question and explanations and notes', () => {
      const searchRule = filterArchiveQuestions(mockQuestions, statsMap, {
        searchQuery: 'angolo critico'
      });
      expect(searchRule.map(q => q.id)).toEqual([1001]);

      const searchNote = filterArchiveQuestions(mockQuestions, statsMap, {
        searchQuery: 'prima dell esame'
      });
      expect(searchNote.map(q => q.id)).toEqual([1001]);
    });

    it('combines multiple criteria seamlessly', () => {
      const results = filterArchiveQuestions(mockQuestions, statsMap, {
        subjectId: 1,
        statusFilter: 'bookmarked',
        conceptChipId: 'efficienza'
      });
      expect(results.map(q => q.id)).toEqual([1002]);
    });
  });

  it('exposes the standard 7 thematic concept chips defined in specifications', () => {
    expect(ARCHIVE_CONCEPT_CHIPS.map(c => c.id)).toEqual([
      'vento',
      'stallo',
      'efficienza',
      'precedenze',
      'spazio_aereo',
      'termica',
      'nubi'
    ]);
  });
});
