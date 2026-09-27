import { describe, it, expect } from 'vitest';
import questionsData from './questions.json';
import type { Question } from '../types/quiz';
import { OFFICIAL_EXAM_QUOTAS, MARATHON_EXAM_QUOTAS } from '../utils/fairRandomizer';

describe('Suite 1: Integrità Dataset 504 Quiz AeCI (questions.json)', () => {
  const questions = questionsData as Question[];

  it('DATA-01: contiene esattamente 504 record', () => {
    expect(questions).toBeInstanceOf(Array);
    expect(questions.length).toBe(504);
  });

  it('DATA-02: tutti gli ID sono univoci e numeri positivi', () => {
    const idSet = new Set<number>();
    for (const q of questions) {
      expect(typeof q.id).toBe('number');
      expect(q.id).toBeGreaterThan(0);
      expect(idSet.has(q.id)).toBe(false);
      idSet.add(q.id);
    }
    expect(idSet.size).toBe(504);
  });

  it('DATA-03: le materie appartengono esattamente all\'intervallo [1..9] con nomi ufficiali', () => {
    const expectedSubjects: Record<number, string> = {
      1: 'Normativa e Legislazione',
      2: 'Aerodinamica',
      3: 'Pronto Soccorso',
      4: 'Fisiopatologia del Volo',
      5: 'Meteorologia e Aerologia',
      6: 'Strumenti',
      7: 'Tecnica di Pilotaggio',
      8: 'Materiali',
      9: 'Sicurezza del Volo'
    };

    for (const q of questions) {
      expect(q.subjectId).toBeGreaterThanOrEqual(1);
      expect(q.subjectId).toBeLessThanOrEqual(9);
      expect(q.subjectName).toBe(expectedSubjects[q.subjectId]);
    }
  });

  it('DATA-04: ogni quiz ha esattamente 3 opzioni non vuote e testo domanda valido', () => {
    for (const q of questions) {
      expect(typeof q.question).toBe('string');
      expect(q.question.trim().length).toBeGreaterThan(5);

      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBe(3);
      for (const opt of q.options) {
        expect(typeof opt).toBe('string');
        expect(opt.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('DATA-05: correctAnswer è un indice valido tra 1, 2 o 3', () => {
    for (const q of questions) {
      expect([1, 2, 3]).toContain(q.correctAnswer);
    }
  });

  it('DATA-06: ogni domanda contiene explanation.rule ed explanation.trap esplicative', () => {
    for (const q of questions) {
      expect(q.explanation).toBeDefined();
      expect(typeof q.explanation.rule).toBe('string');
      expect(q.explanation.rule.trim().length).toBeGreaterThan(10);

      expect(typeof q.explanation.trap).toBe('string');
      expect(q.explanation.trap.trim().length).toBeGreaterThan(10);
    }
  });

  it('DATA-07: il catalogo dispone di quiz sufficienti a soddisfare quote standard e maratona per tutte le 9 materie', () => {
    const countsBySubject: Record<number, number> = {};
    for (const q of questions) {
      countsBySubject[q.subjectId] = (countsBySubject[q.subjectId] || 0) + 1;
    }

    for (let sId = 1; sId <= 9; sId++) {
      const available = countsBySubject[sId] || 0;
      const standardReq = OFFICIAL_EXAM_QUOTAS[sId];
      const marathonReq = MARATHON_EXAM_QUOTAS[sId];

      expect(available).toBeGreaterThanOrEqual(standardReq);
      expect(available).toBeGreaterThanOrEqual(marathonReq);
    }
  });
});
