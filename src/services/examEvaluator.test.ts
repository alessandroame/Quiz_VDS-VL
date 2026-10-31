import { describe, it, expect } from 'vitest';
import questionsData from '../data/questions.json';
import { generateExamQuestions } from '../utils/fairRandomizer';
import type { Question } from '../types/quiz';
import {
  evaluateExam,
  evaluateWeightedOutcome,
  resolveSessionOutcome,
  isPassingScore,
  countSessionAnsweredQuestions,
  hasSessionAnswers,
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

  it('EVAL-11: should correctly propagate examMode for tutor, official and marathon sessions', () => {
    const tutorSession = evaluateExam({
      questions: sample30,
      answers: {},
      durationSeconds: 500,
      examMode: 'tutor'
    });
    expect(tutorSession.examMode).toBe('tutor');

    const officialSession = evaluateExam({
      questions: sample30,
      answers: {},
      durationSeconds: 500,
      examMode: 'official'
    });
    expect(officialSession.examMode).toBe('official');

    const defaultSession = evaluateExam({
      questions: sample30,
      answers: {},
      durationSeconds: 500
    });
    expect(defaultSession.examMode).toBe('official');

    const marathonSession = evaluateExam({
      questions: sample60,
      answers: {},
      durationSeconds: 500,
      isMarathon: true
    });
    expect(marathonSession.examMode).toBe('marathon');
  });

  it('EVAL-12: should evaluate 10-question flash tutor sessions with 90% threshold (max 1 error) and propagate tutorFormat', () => {
    const sample10 = allQuestions.slice(0, 10);
    const answers1Error: Record<number, 1 | 2 | 3> = {};
    sample10.forEach((q, idx) => {
      answers1Error[q.id] = idx === 0 ? ((q.correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3) : q.correctAnswer;
    });

    const passedFlash = evaluateExam({
      questions: sample10,
      answers: answers1Error,
      durationSeconds: 180,
      examMode: 'tutor',
      tutorFormat: 'flash'
    });
    expect(passedFlash.isPassed).toBe(true);
    expect(passedFlash.wrongAnswers).toBe(1);
    expect(passedFlash.correctAnswers).toBe(9);
    expect(passedFlash.tutorFormat).toBe('flash');

    const answers2Errors: Record<number, 1 | 2 | 3> = { ...answers1Error };
    answers2Errors[sample10[1].id] = (sample10[1].correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3;

    const failedFlash = evaluateExam({
      questions: sample10,
      answers: answers2Errors,
      durationSeconds: 200,
      examMode: 'tutor',
      tutorFormat: 'flash'
    });
    expect(failedFlash.isPassed).toBe(false);
    expect(failedFlash.wrongAnswers).toBe(2);
    expect(failedFlash.tutorFormat).toBe('flash');
  });

  it('EVAL-13: should evaluate endless tutor sessions based only on answered questions without penalty for unvisited questions', () => {
    // 50 questions in pool, user answers only 12 questions (11 correct, 1 wrong)
    const pool = allQuestions.slice(0, 50);
    const answers: Record<number, 1 | 2 | 3> = {};
    for (let i = 0; i < 12; i++) {
      const q = pool[i];
      answers[q.id] = i === 0 ? ((q.correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3) : q.correctAnswer;
    }

    const session = evaluateExam({
      questions: pool,
      answers,
      durationSeconds: 300,
      examMode: 'tutor',
      tutorFormat: 'endless'
    });

    expect(session.totalQuestions).toBe(12);
    expect(session.correctAnswers).toBe(11);
    expect(session.wrongAnswers).toBe(1);
    expect(session.snapshots.length).toBe(12);
    expect(session.isPassed).toBe(true);
    expect(session.tutorFormat).toBe('endless');
  });

  it('EVAL-14: should detect zero-answer sessions where all questions were skipped/unanswered', () => {
    // 30 questions evaluated, but user gave no answers
    const emptySession = evaluateExam({
      questions: sample30,
      answers: {},
      durationSeconds: 60,
      isMarathon: false
    });

    expect(emptySession.totalQuestions).toBe(30);
    expect(emptySession.correctAnswers).toBe(0);
    expect(emptySession.wrongAnswers).toBe(30);
    expect(countSessionAnsweredQuestions(emptySession)).toBe(0);
    expect(hasSessionAnswers(emptySession)).toBe(false);
  });

  it('EVAL-15: should detect answered sessions even if all answered questions were incorrect', () => {
    // User answered 2 questions, both wrong, skipped 28
    const answers: Record<number, 1 | 2 | 3> = {
      [sample30[0].id]: ((sample30[0].correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3),
      [sample30[1].id]: ((sample30[1].correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3)
    };

    const sessionWithErrorsOnly = evaluateExam({
      questions: sample30,
      answers,
      durationSeconds: 120,
      isMarathon: false
    });

    expect(sessionWithErrorsOnly.correctAnswers).toBe(0);
    expect(sessionWithErrorsOnly.wrongAnswers).toBe(30);
    expect(countSessionAnsweredQuestions(sessionWithErrorsOnly)).toBe(2);
    expect(hasSessionAnswers(sessionWithErrorsOnly)).toBe(true);
  });

  it('EVAL-16: should handle endless tutor with 0 questions as zero-answer session', () => {
    const emptyEndless = evaluateExam({
      questions: allQuestions,
      answers: {},
      durationSeconds: 15,
      examMode: 'tutor',
      tutorFormat: 'endless'
    });

    expect(emptyEndless.totalQuestions).toBe(0);
    expect(emptyEndless.snapshots.length).toBe(0);
    expect(countSessionAnsweredQuestions(emptyEndless)).toBe(0);
    expect(hasSessionAnswers(emptyEndless)).toBe(false);
  });

  it('EVAL-17: weighted 100-point AeCI 30-question sheet awards 100/100 and passed outcome on perfect answers', () => {
    const balanced30 = generateExamQuestions(allQuestions, new Map(), false);
    const answers: Record<number, 1 | 2 | 3> = {};
    for (const q of balanced30) {
      answers[q.id] = q.correctAnswer;
    }

    const session = evaluateExam({
      questions: balanced30,
      answers,
      durationSeconds: 1200,
      examMode: 'official',
    });

    expect(session.scorePoints).toBe(100);
    expect(session.maxPoints).toBe(100);
    expect(session.examOutcome).toBe('passed');
    expect(session.isPassed).toBe(true);
  });

  it('EVAL-18: BVA weighted thresholds - 86 pt is passed, 85 pt and 80 pt are oral_check, 79 pt is failed', () => {
    expect(evaluateWeightedOutcome(100)).toBe('passed');
    expect(evaluateWeightedOutcome(86)).toBe('passed');
    expect(evaluateWeightedOutcome(85.5)).toBe('oral_check');
    expect(evaluateWeightedOutcome(85)).toBe('oral_check');
    expect(evaluateWeightedOutcome(80)).toBe('oral_check');
    expect(evaluateWeightedOutcome(79.5)).toBe('failed');
    expect(evaluateWeightedOutcome(79)).toBe('failed');

    const balanced30 = generateExamQuestions(allQuestions, new Map(), false);
    const wrongAnsFor = (q: Question): 1 | 2 | 3 => ((q.correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3);

    const bySubject = (sId: number) => balanced30.filter(q => q.subjectId === sId);
    const fourPtQs = [...bySubject(5), ...bySubject(7), ...bySubject(9)];
    const threePtQs = [...bySubject(1), ...bySubject(2)];
    const twoPtQs = [...bySubject(3), ...bySubject(4), ...bySubject(6), ...bySubject(8)];

    const buildAnswersWithErrors = (wrongIds: Set<number>) => {
      const map: Record<number, 1 | 2 | 3> = {};
      for (const q of balanced30) {
        map[q.id] = wrongIds.has(q.id) ? wrongAnsFor(q) : q.correctAnswer;
      }
      return map;
    };

    // Case 86 pt (5 errors: two 4-pt [-8] + three 2-pt [-6] = -14 -> 86/100 -> passed)
    const wrong86 = new Set([fourPtQs[0].id, fourPtQs[1].id, twoPtQs[0].id, twoPtQs[1].id, twoPtQs[2].id]);
    const session86 = evaluateExam({
      questions: balanced30,
      answers: buildAnswersWithErrors(wrong86),
      durationSeconds: 1100,
      examMode: 'official',
    });
    expect(session86.wrongAnswers).toBe(5);
    expect(session86.scorePoints).toBe(86);
    expect(session86.examOutcome).toBe('passed');
    expect(session86.isPassed).toBe(true);

    // Case 85 pt (4 errors: three 4-pt [-12] + one 3-pt [-3] = -15 -> 85/100 -> oral_check)
    const wrong85 = new Set([fourPtQs[0].id, fourPtQs[1].id, fourPtQs[2].id, threePtQs[0].id]);
    const session85 = evaluateExam({
      questions: balanced30,
      answers: buildAnswersWithErrors(wrong85),
      durationSeconds: 1100,
      examMode: 'official',
    });
    expect(session85.wrongAnswers).toBe(4);
    expect(session85.scorePoints).toBe(85);
    expect(session85.examOutcome).toBe('oral_check');
    expect(session85.isPassed).toBe(false);

    // Case 80 pt (5 errors: five 4-pt [-20] -> 80/100 -> oral_check)
    const wrong80 = new Set(fourPtQs.slice(0, 5).map(q => q.id));
    const session80 = evaluateExam({
      questions: balanced30,
      answers: buildAnswersWithErrors(wrong80),
      durationSeconds: 1100,
      examMode: 'official',
    });
    expect(session80.scorePoints).toBe(80);
    expect(session80.examOutcome).toBe('oral_check');
    expect(session80.isPassed).toBe(false);

    // Case 79 pt (6 errors: four 4-pt [-16] + one 3-pt [-3] + one 2-pt [-2] = -21 -> 79/100 -> failed)
    const wrong79 = new Set([
      fourPtQs[0].id,
      fourPtQs[1].id,
      fourPtQs[2].id,
      fourPtQs[3].id,
      threePtQs[0].id,
      twoPtQs[0].id,
    ]);
    const session79 = evaluateExam({
      questions: balanced30,
      answers: buildAnswersWithErrors(wrong79),
      durationSeconds: 1100,
      examMode: 'official',
    });
    expect(session79.scorePoints).toBe(79);
    expect(session79.examOutcome).toBe('failed');
    expect(session79.isPassed).toBe(false);
  });

  it('EVAL-19: normalizes 60-question Marathon (200 raw points) onto the 100-point AeCI scale', () => {
    const marathon60 = generateExamQuestions(allQuestions, new Map(), true);
    const wrongAnsFor = (q: Question): 1 | 2 | 3 => ((q.correctAnswer === 1 ? 2 : 1) as 1 | 2 | 3);
    const fourPtQs = marathon60.filter(q => q.subjectId === 5 || q.subjectId === 7 || q.subjectId === 9);
    const threePtQs = marathon60.filter(q => q.subjectId === 1);

    const wrong172 = new Set(fourPtQs.slice(0, 7).map(q => q.id));
    const answers172: Record<number, 1 | 2 | 3> = {};
    for (const q of marathon60) {
      answers172[q.id] = wrong172.has(q.id) ? wrongAnsFor(q) : q.correctAnswer;
    }
    const passedMarathon = evaluateExam({
      questions: marathon60,
      answers: answers172,
      durationSeconds: 2400,
      isMarathon: true,
      examMode: 'marathon',
    });
    expect(passedMarathon.rawPoints).toBe(172);
    expect(passedMarathon.rawMaxPoints).toBe(200);
    expect(passedMarathon.scorePoints).toBe(86);
    expect(passedMarathon.examOutcome).toBe('passed');

    const wrong170 = new Set([...fourPtQs.slice(0, 6).map(q => q.id), threePtQs[0].id, threePtQs[1].id]);
    const answers170: Record<number, 1 | 2 | 3> = {};
    for (const q of marathon60) {
      answers170[q.id] = wrong170.has(q.id) ? wrongAnsFor(q) : q.correctAnswer;
    }
    const oralMarathon = evaluateExam({
      questions: marathon60,
      answers: answers170,
      durationSeconds: 2400,
      isMarathon: true,
      examMode: 'marathon',
    });
    expect(oralMarathon.scorePoints).toBe(85);
    expect(oralMarathon.examOutcome).toBe('oral_check');
  });

  it('EVAL-20: Tutor Standard (30 quiz) uses weighted /100 scoring while Flash (10) stays unweighted and resolveSessionOutcome handles legacy records', () => {
    const balanced30 = generateExamQuestions(allQuestions, new Map(), false);
    const answers30: Record<number, 1 | 2 | 3> = {};
    for (const q of balanced30) answers30[q.id] = q.correctAnswer;

    const tutorStandard = evaluateExam({
      questions: balanced30,
      answers: answers30,
      durationSeconds: 600,
      examMode: 'tutor',
      tutorFormat: 'standard',
    });
    expect(tutorStandard.scorePoints).toBe(100);
    expect(tutorStandard.examOutcome).toBe('passed');

    const sample10 = balanced30.slice(0, 10);
    const answers10: Record<number, 1 | 2 | 3> = {};
    for (const q of sample10) answers10[q.id] = q.correctAnswer;
    const tutorFlash = evaluateExam({
      questions: sample10,
      answers: answers10,
      durationSeconds: 180,
      examMode: 'tutor',
      tutorFormat: 'flash',
    });
    expect(tutorFlash.scorePoints).toBeUndefined();

    expect(resolveSessionOutcome({ isPassed: true })).toBe('passed');
    expect(resolveSessionOutcome({ isPassed: false })).toBe('failed');
    expect(resolveSessionOutcome({ isPassed: false, scorePoints: 83 })).toBe('oral_check');
  });
});
