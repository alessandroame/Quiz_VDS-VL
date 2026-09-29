import { describe, it, expect } from 'vitest';
import questionsData from '../data/questions.json';
import type { Question } from '../types/quiz';
import {
  filterQuestionsByDiscipline,
  getDisciplineBadge,
  DISCIPLINE_OPTIONS
} from './discipline';
import { OFFICIAL_EXAM_QUOTAS, MARATHON_EXAM_QUOTAS } from './fairRandomizer';

describe('Suite 16: Discipline Filtering & Tagging Logic', () => {
  const allQuestions = questionsData as Question[];

  it('DISC-01: DISCIPLINE_OPTIONS contiene opzioni valide con totali coerenti', () => {
    expect(DISCIPLINE_OPTIONS.length).toBe(3);
    const allOpt = DISCIPLINE_OPTIONS.find(o => o.id === 'all');
    const pgOpt = DISCIPLINE_OPTIONS.find(o => o.id === 'paraglider');
    const hgOpt = DISCIPLINE_OPTIONS.find(o => o.id === 'hang_glider');

    expect(allOpt?.totalCount).toBe(504);
    expect(pgOpt?.totalCount).toBe(474);
    expect(hgOpt?.totalCount).toBe(458);
  });

  it('DISC-02: filtro "all" restituisce tutti i 504 quiz senza alterazioni', () => {
    const filtered = filterQuestionsByDiscipline(allQuestions, 'all');
    expect(filtered.length).toBe(504);
  });

  it('DISC-03: filtro "paraglider" restituisce 474 quiz escludendo tassativamente tutti i 30 quiz hang_glider', () => {
    const filtered = filterQuestionsByDiscipline(allQuestions, 'paraglider');
    expect(filtered.length).toBe(474);

    const hasHG = filtered.some(q => q.discipline === 'hang_glider');
    expect(hasHG).toBe(false);

    // Deve includere tutte le 428 all + 46 paraglider
    const allCount = filtered.filter(q => q.discipline === 'all').length;
    const pgCount = filtered.filter(q => q.discipline === 'paraglider').length;
    expect(allCount).toBe(428);
    expect(pgCount).toBe(46);
  });

  it('DISC-04: filtro "hang_glider" restituisce 458 quiz escludendo tassativamente tutti i 46 quiz paraglider', () => {
    const filtered = filterQuestionsByDiscipline(allQuestions, 'hang_glider');
    expect(filtered.length).toBe(458);

    const hasPG = filtered.some(q => q.discipline === 'paraglider');
    expect(hasPG).toBe(false);

    // Deve includere tutte le 428 all + 30 hang_glider
    const allCount = filtered.filter(q => q.discipline === 'all').length;
    const hgCount = filtered.filter(q => q.discipline === 'hang_glider').length;
    expect(allCount).toBe(428);
    expect(hgCount).toBe(30);
  });

  it('DISC-05: il pool filtrato di ciascuna disciplina soddisfa le quote per tutte le 9 materie', () => {
    const disciplines: ('all' | 'paraglider' | 'hang_glider')[] = ['all', 'paraglider', 'hang_glider'];

    for (const d of disciplines) {
      const filtered = filterQuestionsByDiscipline(allQuestions, d);
      const countsBySubject: Record<number, number> = {};

      for (const q of filtered) {
        countsBySubject[q.subjectId] = (countsBySubject[q.subjectId] || 0) + 1;
      }

      for (let sId = 1; sId <= 9; sId++) {
        const available = countsBySubject[sId] || 0;
        const standardReq = OFFICIAL_EXAM_QUOTAS[sId];
        const marathonReq = MARATHON_EXAM_QUOTAS[sId];

        expect(available).toBeGreaterThanOrEqual(standardReq);
        expect(available).toBeGreaterThanOrEqual(marathonReq);
      }
    }
  });

  it('DISC-06: getDisciplineBadge restituisce badge solo per discipline specifiche e null per "all"', () => {
    expect(getDisciplineBadge('all')).toBeNull();

    const hgBadge = getDisciplineBadge('hang_glider');
    expect(hgBadge).not.toBeNull();
    expect(hgBadge?.label).toBe('Deltaplano');

    const pgBadge = getDisciplineBadge('paraglider');
    expect(pgBadge).not.toBeNull();
    expect(pgBadge?.label).toBe('Parapendio');
  });

  it('DISC-07: filterQuestionsByDiscipline defaults to paraglider (474 questions) when parameter is omitted', () => {
    const defaultFiltered = filterQuestionsByDiscipline(allQuestions);
    expect(defaultFiltered.length).toBe(474);
    expect(defaultFiltered.some(q => q.discipline === 'hang_glider')).toBe(false);
  });

  it('DISC-08: stable paraglider pool has exactly 474 questions with zero hang_glider questions and meets all 9 subject quotas', () => {
    const paragliderPool = allQuestions.filter(q => q.discipline !== 'hang_glider');
    expect(paragliderPool.length).toBe(474);
    expect(paragliderPool.every(q => q.discipline !== 'hang_glider')).toBe(true);

    const counts: Record<number, number> = {};
    for (const q of paragliderPool) {
      counts[q.subjectId] = (counts[q.subjectId] || 0) + 1;
    }

    for (let sId = 1; sId <= 9; sId++) {
      expect(counts[sId]).toBeGreaterThanOrEqual(OFFICIAL_EXAM_QUOTAS[sId]);
      expect(counts[sId]).toBeGreaterThanOrEqual(MARATHON_EXAM_QUOTAS[sId]);
    }
  });
});
