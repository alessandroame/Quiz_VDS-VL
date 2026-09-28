import { describe, it, expect } from 'vitest';
import questionsData from '../data/questions.json';
import type { Question } from '../types/quiz';
import type { QuestionStat, ExamSession } from '../types/database';
import {
  isMistakeQuestion,
  calculateMistakesCount,
  calculateSubjectAnalytics,
  calculateReadinessScore
} from './analytics';

describe('Suite 6: Calcolo Metriche & Quaderno Errori (src/utils/analytics.ts)', () => {
  const allQuestions = questionsData as Question[];

  describe('Quaderno Errori (isMistakeQuestion & calculateMistakesCount)', () => {
    it('STAT-01: gestisce correttamente le condizioni di ingresso, permanenza e uscita dal Quaderno Errori', () => {
      // Caso 1: stat undefined o mai vista
      expect(isMistakeQuestion(undefined)).toBe(false);

      // Caso 2: vista 5 volte, 0 errori -> NON deve entrare nel quaderno
      const zeroErrors: QuestionStat = {
        questionId: 1,
        timesSeen: 5,
        timesCorrect: 5,
        timesWrong: 0,
        consecutiveCorrect: 5,
        isBookmarked: false
      };
      expect(isMistakeQuestion(zeroErrors)).toBe(false);

      // Caso 3: 1 errore recente (consecutiveCorrect: 0) -> ENTRA nel quaderno
      const oneError: QuestionStat = {
        questionId: 2,
        timesSeen: 1,
        timesCorrect: 0,
        timesWrong: 1,
        consecutiveCorrect: 0,
        isBookmarked: false
      };
      expect(isMistakeQuestion(oneError)).toBe(true);

      // Caso 4: 1 risposta corretta successiva all'errore (consecutiveCorrect: 1) -> RIMANE nel quaderno
      const oneRecovery: QuestionStat = {
        questionId: 3,
        timesSeen: 2,
        timesCorrect: 1,
        timesWrong: 1,
        consecutiveCorrect: 1,
        isBookmarked: false
      };
      expect(isMistakeQuestion(oneRecovery)).toBe(true);

      // Caso 5: 2 risposte corrette consecutive (consecutiveCorrect: 2) -> ESCE (promossa) dal quaderno
      const twoRecoveries: QuestionStat = {
        questionId: 4,
        timesSeen: 3,
        timesCorrect: 2,
        timesWrong: 1,
        consecutiveCorrect: 2,
        isBookmarked: false
      };
      expect(isMistakeQuestion(twoRecoveries)).toBe(false);

      // Test aggregato su lista
      const list: QuestionStat[] = [zeroErrors, oneError, oneRecovery, twoRecoveries];
      expect(calculateMistakesCount(list)).toBe(2);
    });
  });

  describe('Indice di Preparazione Esame (calculateReadinessScore)', () => {
    it('STAT-02: restituisce 0 con catalogo vuoto o 0 domande viste', () => {
      expect(calculateReadinessScore(0, 0, [], [])).toBe(0);
      expect(calculateReadinessScore(504, 0, [], [])).toBe(0);
    });

    it('STAT-03: calcola esattamente il punteggio ponderato (35% copertura, 35% accuratezza, 30% esami)', () => {
      // Scenario A: 50% catalogo visto (50% * 35% = 17.5%)
      // 80% accuratezza sulle viste (80% * 35% = 28%)
      // 3 su 3 esami superati (100% * 30% = 30%)
      // Totale atteso = round(17.5 + 28 + 30) = round(75.5) = 76%

      const totalCatalog = 504;
      const totalSeen = 252; // 50%
      const statsList: QuestionStat[] = [];
      const correctCount = Math.round(252 * 0.8); // 80%

      for (let i = 0; i < totalSeen; i++) {
        statsList.push({
          questionId: i + 1,
          timesSeen: 1,
          timesCorrect: i < correctCount ? 1 : 0,
          timesWrong: i < correctCount ? 0 : 1,
          consecutiveCorrect: i < correctCount ? 1 : 0,
          lastResult: i < correctCount ? 'correct' : 'wrong',
          isBookmarked: false
        });
      }

      const sessions: ExamSession[] = [
        { date: 1, durationSeconds: 1000, totalQuestions: 30, correctAnswers: 28, wrongAnswers: 2, isPassed: true, isMarathon: false, subjectBreakdown: {}, snapshots: [] },
        { date: 2, durationSeconds: 1000, totalQuestions: 30, correctAnswers: 29, wrongAnswers: 1, isPassed: true, isMarathon: false, subjectBreakdown: {}, snapshots: [] },
        { date: 3, durationSeconds: 1000, totalQuestions: 30, correctAnswers: 30, wrongAnswers: 0, isPassed: true, isMarathon: false, subjectBreakdown: {}, snapshots: [] }
      ];

      const score = calculateReadinessScore(totalCatalog, totalSeen, statsList, sessions);
      expect(score).toBe(76);
    });

    it('STAT-04: BVA - valore massimo 100% e valore minimo 0%', () => {
      // 100% perfetto
      const statsListAllCorrect: QuestionStat[] = [];
      for (let i = 0; i < 504; i++) {
        statsListAllCorrect.push({
          questionId: i + 1,
          timesSeen: 2,
          timesCorrect: 2,
          timesWrong: 0,
          consecutiveCorrect: 2,
          lastResult: 'correct',
          isBookmarked: false
        });
      }

      const allPassedSessions: ExamSession[] = [
        { date: 1, durationSeconds: 1000, totalQuestions: 30, correctAnswers: 30, wrongAnswers: 0, isPassed: true, isMarathon: false, subjectBreakdown: {}, snapshots: [] }
      ];

      const maxScore = calculateReadinessScore(504, 504, statsListAllCorrect, allPassedSessions);
      expect(maxScore).toBe(100);
    });
  });

  describe('Statistiche per Materia (calculateSubjectAnalytics)', () => {
    it('STAT-05: aggrega correttamente totali, visti, corretti e percentuale di accuratezza per materia', () => {
      const statsMap = new Map<number, QuestionStat>();
      // Materia 1 ha 40 domande nel dataset
      const sub1Questions = allQuestions.filter(q => q.subjectId === 1);
      expect(sub1Questions.length).toBe(40);

      // Ne segnamo 10 viste, di cui 7 con lastResult 'correct' e 3 'wrong'
      for (let i = 0; i < 10; i++) {
        const q = sub1Questions[i];
        const isCorr = i < 7;
        statsMap.set(q.id, {
          questionId: q.id,
          timesSeen: 1,
          timesCorrect: isCorr ? 1 : 0,
          timesWrong: isCorr ? 0 : 1,
          consecutiveCorrect: isCorr ? 1 : 0,
          lastResult: isCorr ? 'correct' : 'wrong',
          isBookmarked: false
        });
      }

      const analytics = calculateSubjectAnalytics(allQuestions, statsMap);
      const sub1Stat = analytics.find(s => s.id === 1);

      expect(sub1Stat).toBeDefined();
      expect(sub1Stat!.total).toBe(40);
      expect(sub1Stat!.seen).toBe(10);
      expect(sub1Stat!.correct).toBe(7);
      expect(sub1Stat!.accuracy).toBe(70); // 7/10 = 70%

      // Materia non ancora vista ha accuracy 0%
      const unseensub = analytics.find(s => s.id === 2);
      expect(unseensub).toBeDefined();
      expect(unseensub!.seen).toBe(0);
      expect(unseensub!.accuracy).toBe(0);
    });
  });
});
