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

  it('DATA-08: ogni domanda ha una disciplina valida con ripartizione certificata (428 all, 30 hang_glider, 46 paraglider)', () => {
    let allCount = 0;
    let hgCount = 0;
    let pgCount = 0;

    for (const q of questions) {
      expect(['all', 'hang_glider', 'paraglider']).toContain(q.discipline);
      if (q.discipline === 'all') allCount++;
      if (q.discipline === 'hang_glider') hgCount++;
      if (q.discipline === 'paraglider') pgCount++;
    }

    expect(allCount).toBe(428);
    expect(hgCount).toBe(30);
    expect(pgCount).toBe(46);
    expect(allCount + hgCount + pgCount).toBe(504);
  });

  it('DATA-09: le spiegazioni di tutte le 9 materie (504 quiz) sono specifiche, uniche al 100% e conformi', () => {
    // Subject 1: Normativa e Legislazione (40 quiz)
    const normQuestions = questions.filter(q => q.subjectId === 1);
    expect(normQuestions.length).toBe(40);
    expect(new Set(normQuestions.map(q => q.explanation.rule)).size).toBe(40);
    expect(new Set(normQuestions.map(q => q.explanation.trap)).size).toBe(40);

    // Subject 2: Aerodinamica (150 quiz)
    const aeroQuestions = questions.filter(q => q.subjectId === 2);
    expect(aeroQuestions.length).toBe(150);
    expect(new Set(aeroQuestions.map(q => q.explanation.rule)).size).toBe(150);
    expect(new Set(aeroQuestions.map(q => q.explanation.trap)).size).toBe(150);

    // Subject 3: Pronto Soccorso (20 quiz)
    const soccorsoQuestions = questions.filter(q => q.subjectId === 3);
    expect(soccorsoQuestions.length).toBe(20);
    expect(new Set(soccorsoQuestions.map(q => q.explanation.rule)).size).toBe(20);
    expect(new Set(soccorsoQuestions.map(q => q.explanation.trap)).size).toBe(20);

    // Subject 4: Fisiopatologia (10 quiz)
    const fisioQuestions = questions.filter(q => q.subjectId === 4);
    expect(fisioQuestions.length).toBe(10);
    expect(new Set(fisioQuestions.map(q => q.explanation.rule)).size).toBe(10);
    expect(new Set(fisioQuestions.map(q => q.explanation.trap)).size).toBe(10);

    // Subject 5: Meteorologia e Aerologia (120 quiz)
    const meteoQuestions = questions.filter(q => q.subjectId === 5);
    expect(meteoQuestions.length).toBe(120);
    expect(new Set(meteoQuestions.map(q => q.explanation.rule)).size).toBe(120);
    expect(new Set(meteoQuestions.map(q => q.explanation.trap)).size).toBe(120);

    // Subject 6: Strumenti (20 quiz)
    const strumentiQuestions = questions.filter(q => q.subjectId === 6);
    expect(strumentiQuestions.length).toBe(20);
    expect(new Set(strumentiQuestions.map(q => q.explanation.rule)).size).toBe(20);
    expect(new Set(strumentiQuestions.map(q => q.explanation.trap)).size).toBe(20);

    // Subject 7: Tecnica di Pilotaggio (79 quiz)
    const pilotQuestions = questions.filter(q => q.subjectId === 7);
    expect(pilotQuestions.length).toBe(79);
    expect(new Set(pilotQuestions.map(q => q.explanation.rule)).size).toBe(79);
    expect(new Set(pilotQuestions.map(q => q.explanation.trap)).size).toBe(79);

    // Subject 8: Materiali (20 quiz)
    const matQuestions = questions.filter(q => q.subjectId === 8);
    expect(matQuestions.length).toBe(20);
    expect(new Set(matQuestions.map(q => q.explanation.rule)).size).toBe(20);
    expect(new Set(matQuestions.map(q => q.explanation.trap)).size).toBe(20);

    // Subject 9: Sicurezza del Volo (45 quiz)
    const sicQuestions = questions.filter(q => q.subjectId === 9);
    expect(sicQuestions.length).toBe(45);
    expect(new Set(sicQuestions.map(q => q.explanation.rule)).size).toBe(45);
    expect(new Set(sicQuestions.map(q => q.explanation.trap)).size).toBe(45);

    // Controllo globale: 504 spiegazioni uniche e distinte su tutto il catalogo
    expect(new Set(questions.map(q => q.explanation.rule)).size).toBe(504);
    expect(new Set(questions.map(q => q.explanation.trap)).size).toBe(504);

    // Domanda chiave #8003 verificata
    const q8003 = questions.find(q => q.id === 8003);
    expect(q8003).toBeDefined();
    expect(q8003?.explanation.rule).toContain('centro di pressione');
    expect(q8003?.explanation.rule).toContain('60-70%');
    expect(q8003?.explanation.trap).toContain('distribuzione uniforme');
  });
});
