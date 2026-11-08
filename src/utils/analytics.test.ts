import { describe, it, expect } from 'vitest';
import questionsData from '../data/questions.json';
import type { Question } from '../types/quiz';
import type { QuestionStat, ExamSession } from '../types/database';
import {
  isMistakeQuestion,
  calculateMistakesCount,
  calculateMistakeLeitnerBuckets,
  calculateSubjectAnalytics,
  calculateReadinessScore,
  calculateReadinessBreakdown,
  calculateExamTrend
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

    it('STAT-06: ignores sessions with zero answers when calculating exam score component', () => {
      const totalCatalog = 474;
      const totalSeen = 100;
      const statsList: QuestionStat[] = [];
      for (let i = 0; i < totalSeen; i++) {
        statsList.push({
          questionId: i + 1,
          timesSeen: 1,
          timesCorrect: 1,
          timesWrong: 0,
          consecutiveCorrect: 1,
          lastResult: 'correct',
          isBookmarked: false
        });
      }

      // Valid passed session with answers
      const validSession: ExamSession = {
        date: 100,
        durationSeconds: 1200,
        totalQuestions: 30,
        correctAnswers: 28,
        wrongAnswers: 2,
        isPassed: true,
        isMarathon: false,
        subjectBreakdown: {},
        snapshots: [{ questionId: 1, userAnswer: 1, correctAnswer: 1, isCorrect: true, wasFlagged: false }]
      };

      // Empty session (0 answers, 30 wrong due to unanswered penalty, isPassed: false)
      const emptySession: ExamSession = {
        date: 200,
        durationSeconds: 10,
        totalQuestions: 30,
        correctAnswers: 0,
        wrongAnswers: 30,
        isPassed: false,
        isMarathon: false,
        subjectBreakdown: {},
        snapshots: Array.from({ length: 30 }, (_, idx) => ({
          questionId: idx + 1,
          userAnswer: undefined,
          correctAnswer: 1,
          isCorrect: false,
          wasFlagged: false
        }))
      };

      const scoreWithoutEmpty = calculateReadinessScore(totalCatalog, totalSeen, statsList, [validSession]);
      const scoreWithEmpty = calculateReadinessScore(totalCatalog, totalSeen, statsList, [emptySession, validSession]);

      // Both should yield identical readiness score because the empty session is ignored
      expect(scoreWithEmpty).toBe(scoreWithoutEmpty);
    });

    it('STAT-07: weights seen-question accuracy by official AeCI subject points (4 / 3 / 2 pt) on real catalog IDs', () => {
      const statsHighCorrect: QuestionStat[] = [
        { questionId: 5001, timesSeen: 1, timesCorrect: 1, timesWrong: 0, consecutiveCorrect: 1, lastResult: 'correct', isBookmarked: false },
        { questionId: 3001, timesSeen: 1, timesCorrect: 0, timesWrong: 1, consecutiveCorrect: 0, lastResult: 'wrong', isBookmarked: false },
      ];
      const statsLowCorrect: QuestionStat[] = [
        { questionId: 5001, timesSeen: 1, timesCorrect: 0, timesWrong: 1, consecutiveCorrect: 0, lastResult: 'wrong', isBookmarked: false },
        { questionId: 3001, timesSeen: 1, timesCorrect: 1, timesWrong: 0, consecutiveCorrect: 1, lastResult: 'correct', isBookmarked: false },
      ];

      expect(calculateReadinessScore(100, 2, statsHighCorrect, [])).toBe(24);
      expect(calculateReadinessScore(100, 2, statsLowCorrect, [])).toBe(12);
    });

    it('STAT-08: scores oral_check (80-85 pt) simulations at 0.5 weight in the 30% simulation component', () => {
      const stats: QuestionStat[] = [
        { questionId: 5001, timesSeen: 1, timesCorrect: 1, timesWrong: 0, consecutiveCorrect: 1, lastResult: 'correct', isBookmarked: false },
      ];
      const oralSession: ExamSession = {
        date: 100,
        durationSeconds: 1200,
        totalQuestions: 30,
        correctAnswers: 26,
        wrongAnswers: 4,
        isPassed: false,
        examOutcome: 'oral_check',
        scorePoints: 84,
        maxPoints: 100,
        isMarathon: false,
        subjectBreakdown: {},
        snapshots: [{ questionId: 5001, userAnswer: 1, correctAnswer: 1, isCorrect: true, wasFlagged: false }],
      };

      expect(calculateReadinessScore(1, 1, stats, [oralSession])).toBe(85);
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
      expect(unseensub!.examPointsAtRisk).toBe(0);

      // Materia 1 (Normativa: 4 quiz x 3 pt = 12 pt max, 30% errori -> 3.6 pt a rischio)
      expect(sub1Stat!.maxExamPoints).toBe(12);
      expect(sub1Stat!.examPointsAtRisk).toBe(3.6);
      expect(sub1Stat!.activeMistakesCount).toBe(3);
    });

    it('STAT-09: computes ReadinessBreakdown 35/35/30 contributions and selects deterministic priority lever', () => {
      const zeroBreakdown = calculateReadinessBreakdown(504, 0, [], []);
      expect(zeroBreakdown.totalScore).toBe(0);
      expect(zeroBreakdown.topLever).toBe('coverage');
      expect(zeroBreakdown.potentialGainPoints).toBe(35);

      const seenAccurateNoExams: QuestionStat[] = [
        { questionId: 5001, timesSeen: 1, timesCorrect: 1, timesWrong: 0, consecutiveCorrect: 1, lastResult: 'correct', isBookmarked: false }
      ];
      const examGapBreakdown = calculateReadinessBreakdown(1, 1, seenAccurateNoExams, []);
      expect(examGapBreakdown.coverageContribution).toBe(35);
      expect(examGapBreakdown.accuracyContribution).toBe(35);
      expect(examGapBreakdown.examFactorContribution).toBe(0);
      expect(examGapBreakdown.topLever).toBe('exam');
      expect(examGapBreakdown.potentialGainPoints).toBe(30);
    });

    it('STAT-10: computes MistakeLeitnerBuckets across 0/2 critical, 1/2 recovering, and >=2 mastered stages', () => {
      const stats: QuestionStat[] = [
        { questionId: 1, timesSeen: 1, timesCorrect: 0, timesWrong: 1, consecutiveCorrect: 0, isBookmarked: false },
        { questionId: 2, timesSeen: 2, timesCorrect: 1, timesWrong: 1, consecutiveCorrect: 1, isBookmarked: false },
        { questionId: 3, timesSeen: 3, timesCorrect: 2, timesWrong: 1, consecutiveCorrect: 2, isBookmarked: false },
        { questionId: 4, timesSeen: 4, timesCorrect: 3, timesWrong: 1, consecutiveCorrect: 3, isBookmarked: false },
        { questionId: 5, timesSeen: 2, timesCorrect: 2, timesWrong: 0, consecutiveCorrect: 2, isBookmarked: false }
      ];
      const buckets = calculateMistakeLeitnerBuckets(stats);
      expect(buckets.criticalCount).toBe(1);
      expect(buckets.recoveringCount).toBe(1);
      expect(buckets.masteredAfterErrorCount).toBe(2);
      expect(buckets.activeMistakesTotal).toBe(2);
      expect(buckets.totalEverWrong).toBe(4);
    });

    it('STAT-11: normalizes ExamTrendPoint series in chronological order onto /100 pt scale with AeCI outcomes', () => {
      const sessions: ExamSession[] = [
        // Newest first (as returned by DB)
        {
          id: 3,
          date: 3000,
          durationSeconds: 900,
          totalQuestions: 60,
          correctAnswers: 52,
          wrongAnswers: 8,
          isPassed: true,
          examOutcome: 'passed',
          scorePoints: 86,
          maxPoints: 100,
          rawPoints: 172,
          rawMaxPoints: 200,
          isMarathon: true,
          examMode: 'marathon',
          subjectBreakdown: {},
          snapshots: [{ questionId: 1001, userAnswer: 1, correctAnswer: 1, isCorrect: true, wasFlagged: false }]
        },
        {
          id: 2,
          date: 2000,
          durationSeconds: 900,
          totalQuestions: 30,
          correctAnswers: 25,
          wrongAnswers: 5,
          isPassed: false,
          examOutcome: 'oral_check',
          scorePoints: 82,
          maxPoints: 100,
          isMarathon: false,
          examMode: 'official',
          subjectBreakdown: {},
          snapshots: [{ questionId: 1001, userAnswer: 1, correctAnswer: 1, isCorrect: true, wasFlagged: false }]
        },
        // Empty ghost session (must be excluded)
        {
          id: 99,
          date: 1500,
          durationSeconds: 5,
          totalQuestions: 30,
          correctAnswers: 0,
          wrongAnswers: 30,
          isPassed: false,
          isMarathon: false,
          subjectBreakdown: {},
          snapshots: [{ questionId: 1001, userAnswer: undefined, correctAnswer: 1, isCorrect: false, wasFlagged: false }]
        }
      ];

      const trend = calculateExamTrend(sessions, 10);
      expect(trend).toHaveLength(2);
      // Oldest first (#1 = id 2, #2 = id 3)
      expect(trend[0].sessionId).toBe(2);
      expect(trend[0].scoreOn100).toBe(82);
      expect(trend[0].outcome).toBe('oral_check');
      expect(trend[1].sessionId).toBe(3);
      expect(trend[1].scoreOn100).toBe(86);
      expect(trend[1].outcome).toBe('passed');
    });
  });
});
