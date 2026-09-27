import { describe, it, expect } from 'vitest';
import questionsData from '../data/questions.json';
import type { Question } from '../types/quiz';
import {
  evaluateExam,
  isPassingScore,
  MAX_ALLOWED_ERRORS_STANDARD,
  MAX_ALLOWED_ERRORS_MARATHON
} from './examEvaluator';

describe('Suite 3: Motore di Valutazione Esame AeCI (src/services/examEvaluator.ts)', () => {
  const allQuestions = questionsData as Question[];
  const sample30 = allQuestions.slice(0, 30);
  const sample60 = allQuestions.slice(0, 60);

  it('EVAL-01: BVA - esame perfetto (30/30 corrette, 0 errate) risulta Idoneo', () => {
    // Arrange
    const answers: Record<number, 1 | 2 | 3> = {};
    for (const q of sample30) {
      answers[q.id] = q.correctAnswer;
    }

    // Act
    const session = evaluateExam({
      questions: sample30,
      answers,
      durationSeconds: 1200,
      isMarathon: false
    });

    // Assert
    expect(session.isPassed).toBe(true);
    expect(session.correctAnswers).toBe(30);
    expect(session.wrongAnswers).toBe(0);
    expect(session.totalQuestions).toBe(30);
    expect(session.isMarathon).toBe(false);
  });

  it('EVAL-02: BVA - soglia limite massimo Idoneo standard: 27 corrette e 3 errate (Idoneo)', () => {
    // Arrange: 3 errori su 30
    const answers: Record<number, 1 | 2 | 3> = {};
    sample30.forEach((q, idx) => {
      if (idx < 3) {
        // Risposta errata
        const wrongAns = (q.correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3;
        answers[q.id] = wrongAns;
      } else {
        answers[q.id] = q.correctAnswer;
      }
    });

    // Act
    const session = evaluateExam({
      questions: sample30,
      answers,
      durationSeconds: 1500,
      isMarathon: false
    });

    // Assert
    expect(session.isPassed).toBe(true);
    expect(session.wrongAnswers).toBe(3);
    expect(session.correctAnswers).toBe(27);
  });

  it('EVAL-03: BVA - soglia minima Respinto standard: 26 corrette e 4 errate (Non Idoneo)', () => {
    // Arrange: 4 errori su 30
    const answers: Record<number, 1 | 2 | 3> = {};
    sample30.forEach((q, idx) => {
      if (idx < 4) {
        answers[q.id] = (q.correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3;
      } else {
        answers[q.id] = q.correctAnswer;
      }
    });

    // Act
    const session = evaluateExam({
      questions: sample30,
      answers,
      durationSeconds: 1800,
      isMarathon: false
    });

    // Assert
    expect(session.isPassed).toBe(false);
    expect(session.wrongAnswers).toBe(4);
    expect(session.correctAnswers).toBe(26);
  });

  it('EVAL-04: BVA - esame completamente fallito (0 corrette, 30 errate) risulta Non Idoneo', () => {
    // Arrange
    const answers: Record<number, 1 | 2 | 3> = {};
    for (const q of sample30) {
      answers[q.id] = (q.correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3;
    }

    // Act
    const session = evaluateExam({
      questions: sample30,
      answers,
      durationSeconds: 900
    });

    // Assert
    expect(session.isPassed).toBe(false);
    expect(session.correctAnswers).toBe(0);
    expect(session.wrongAnswers).toBe(30);
  });

  it('EVAL-05: BVA Maratona - 54 corrette e 6 errate su 60 risulta Idoneo', () => {
    // Arrange: 6 errori su 60
    const answers: Record<number, 1 | 2 | 3> = {};
    sample60.forEach((q, idx) => {
      if (idx < 6) {
        answers[q.id] = (q.correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3;
      } else {
        answers[q.id] = q.correctAnswer;
      }
    });

    // Act
    const session = evaluateExam({
      questions: sample60,
      answers,
      durationSeconds: 3000,
      isMarathon: true
    });

    // Assert
    expect(session.isPassed).toBe(true);
    expect(session.wrongAnswers).toBe(6);
    expect(session.correctAnswers).toBe(54);
    expect(session.isMarathon).toBe(true);
  });

  it('EVAL-06: BVA Maratona - 53 corrette e 7 errate su 60 risulta Non Idoneo', () => {
    // Arrange: 7 errori su 60
    const answers: Record<number, 1 | 2 | 3> = {};
    sample60.forEach((q, idx) => {
      if (idx < 7) {
        answers[q.id] = (q.correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3;
      } else {
        answers[q.id] = q.correctAnswer;
      }
    });

    // Act
    const session = evaluateExam({
      questions: sample60,
      answers,
      durationSeconds: 3200,
      isMarathon: true
    });

    // Assert
    expect(session.isPassed).toBe(false);
    expect(session.wrongAnswers).toBe(7);
    expect(session.correctAnswers).toBe(53);
  });

  it('EVAL-07: domande non risposte o saltate vengono rigorosamente conteggiate come errate', () => {
    // Arrange: utente risponde solo a 20 domande (tutte corrette), le restanti 10 rimangono senza risposta
    const answers: Record<number, 1 | 2 | 3> = {};
    sample30.slice(0, 20).forEach(q => {
      answers[q.id] = q.correctAnswer;
    });

    // Act
    const session = evaluateExam({
      questions: sample30,
      answers,
      durationSeconds: 2700,
      isMarathon: false
    });

    // Assert: 20 corrette, 10 non risposte = 10 errori -> Non Idoneo
    expect(session.correctAnswers).toBe(20);
    expect(session.wrongAnswers).toBe(10);
    expect(session.isPassed).toBe(false);

    // Verifica negli snapshot che userAnswer sia undefined
    const unansweredSnapshots = session.snapshots.filter(s => s.userAnswer === undefined);
    expect(unansweredSnapshots.length).toBe(10);
    unansweredSnapshots.forEach(s => {
      expect(s.isCorrect).toBe(false);
    });
  });

  it('EVAL-08: calcola accuratamente il breakdown statistico per singola materia', () => {
    // Arrange
    const answers: Record<number, 1 | 2 | 3> = {};
    sample30.forEach((q, idx) => {
      // Sbaglia solo gli indici pari
      if (idx % 2 === 0) {
        answers[q.id] = (q.correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3;
      } else {
        answers[q.id] = q.correctAnswer;
      }
    });

    // Act
    const session = evaluateExam({
      questions: sample30,
      answers,
      durationSeconds: 1500
    });

    // Assert
    const breakdown = session.subjectBreakdown;
    expect(Object.keys(breakdown).length).toBeGreaterThan(0);

    let sumTotal = 0;
    let sumCorrect = 0;
    let sumWrong = 0;

    for (const subStat of Object.values(breakdown)) {
      expect(subStat.total).toBe(subStat.correct + subStat.wrong);
      sumTotal += subStat.total;
      sumCorrect += subStat.correct;
      sumWrong += subStat.wrong;
    }

    expect(sumTotal).toBe(30);
    expect(sumCorrect).toBe(session.correctAnswers);
    expect(sumWrong).toBe(session.wrongAnswers);
  });

  it('EVAL-09: snapshots memorizzano fedelmente risposte, chiavi esatte e flag di revisione', () => {
    // Arrange
    const flags: Record<number, boolean> = {
      [sample30[0].id]: true,
      [sample30[5].id]: true
    };
    const answers: Record<number, 1 | 2 | 3> = {
      [sample30[0].id]: sample30[0].correctAnswer
    };

    // Act
    const session = evaluateExam({
      questions: sample30,
      answers,
      flags,
      durationSeconds: 1000
    });

    // Assert
    expect(session.snapshots.length).toBe(30);

    const snap0 = session.snapshots.find(s => s.questionId === sample30[0].id);
    expect(snap0).toBeDefined();
    expect(snap0!.wasFlagged).toBe(true);
    expect(snap0!.isCorrect).toBe(true);
    expect(snap0!.userAnswer).toBe(sample30[0].correctAnswer);

    const snap5 = session.snapshots.find(s => s.questionId === sample30[5].id);
    expect(snap5).toBeDefined();
    expect(snap5!.wasFlagged).toBe(true);
    expect(snap5!.isCorrect).toBe(false);
    expect(snap5!.userAnswer).toBeUndefined();
  });

  it('isPassingScore: rispetta le costanti ufficiali per esame standard e maratona', () => {
    expect(MAX_ALLOWED_ERRORS_STANDARD).toBe(3);
    expect(MAX_ALLOWED_ERRORS_MARATHON).toBe(6);

    expect(isPassingScore(3, false)).toBe(true);
    expect(isPassingScore(4, false)).toBe(false);

    expect(isPassingScore(6, true)).toBe(true);
    expect(isPassingScore(7, true)).toBe(false);
  });
});
