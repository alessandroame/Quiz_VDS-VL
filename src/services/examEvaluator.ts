import type { Question } from '../types/quiz';
import type { ExamSession, ExamQuestionSnapshot, ExamModeType } from '../types/database';

export const MAX_ALLOWED_ERRORS_STANDARD = 3;
export const MAX_ALLOWED_ERRORS_MARATHON = 6;

export interface EvaluateExamParams {
  questions: Question[];
  answers: Record<number, 1 | 2 | 3>;
  flags?: Record<number, boolean>;
  durationSeconds: number;
  isMarathon?: boolean;
  examMode?: ExamModeType;
}

/**
 * Verifica se l'esame è superato (Idoneo) secondo i criteri ufficiali AeCI:
 * - Esame Standard (30 domande): max 3 errori (>= 27 risposte esatte)
 * - Esame Maratona (60 domande): max 6 errori (>= 54 risposte esatte)
 */
export function isPassingScore(wrongCount: number, isMarathon = false): boolean {
  const maxErrors = isMarathon ? MAX_ALLOWED_ERRORS_MARATHON : MAX_ALLOWED_ERRORS_STANDARD;
  return wrongCount <= maxErrors;
}

/**
 * Valuta deterministicamente una sessione d'esame.
 * Le domande non risposte o saltate vengono conteggiate come errate.
 */
export function evaluateExam({
  questions,
  answers,
  flags = {},
  durationSeconds,
  isMarathon = false,
  examMode = isMarathon ? 'marathon' : 'official'
}: EvaluateExamParams): ExamSession {
  let correctCount = 0;
  let wrongCount = 0;
  const subjectMap: Record<number, { total: number; correct: number; wrong: number }> = {};
  const snapshots: ExamQuestionSnapshot[] = [];

  for (const q of questions) {
    const userAns = answers[q.id];
    const isCorrect = userAns !== undefined && userAns === q.correctAnswer;

    if (isCorrect) {
      correctCount++;
    } else {
      wrongCount++;
    }

    if (!subjectMap[q.subjectId]) {
      subjectMap[q.subjectId] = { total: 0, correct: 0, wrong: 0 };
    }
    subjectMap[q.subjectId].total++;
    if (isCorrect) {
      subjectMap[q.subjectId].correct++;
    } else {
      subjectMap[q.subjectId].wrong++;
    }

    snapshots.push({
      questionId: q.id,
      userAnswer: userAns,
      correctAnswer: q.correctAnswer,
      isCorrect,
      wasFlagged: !!flags[q.id]
    });
  }

  const isPassed = isPassingScore(wrongCount, isMarathon);

  return {
    date: Date.now(),
    durationSeconds,
    totalQuestions: questions.length,
    correctAnswers: correctCount,
    wrongAnswers: wrongCount,
    isPassed,
    isMarathon,
    examMode,
    subjectBreakdown: subjectMap,
    snapshots
  };
}
