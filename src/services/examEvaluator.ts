import type { Question } from '../types/quiz';
import type { ExamSession, ExamQuestionSnapshot, ExamModeType, TutorFormat } from '../types/database';

export const MAX_ALLOWED_ERRORS_STANDARD = 3;
export const MAX_ALLOWED_ERRORS_MARATHON = 6;

export interface EvaluateExamParams {
  questions: Question[];
  answers: Record<number, 1 | 2 | 3>;
  flags?: Record<number, boolean>;
  durationSeconds: number;
  isMarathon?: boolean;
  examMode?: ExamModeType;
  tutorFormat?: TutorFormat;
}

/**
 * Verifica se l'esame è superato (Idoneo) secondo i criteri ufficiali AeCI:
 * - Esame Flash (10 domande): max 1 errore (>= 90% idoneità)
 * - Esame Standard (30 domande): max 3 errori (>= 27 risposte esatte)
 * - Esame Maratona (60 domande): max 6 errori (>= 54 risposte esatte)
 */
export function isPassingScore(wrongCount: number, isMarathon = false, totalQuestions = 30): boolean {
  if (totalQuestions <= 0) return true;
  if (totalQuestions <= 10) {
    return totalQuestions >= 10 ? wrongCount <= 1 : wrongCount === 0;
  }
  const maxErrors = isMarathon ? MAX_ALLOWED_ERRORS_MARATHON : Math.max(1, Math.floor(totalQuestions * 0.1));
  return wrongCount <= maxErrors;
}

/**
 * Valuta deterministicamente una sessione d'esame.
 * Le domande non risposte o saltate vengono conteggiate come errate, tranne nel flusso continuo tutor.
 */
export function evaluateExam({
  questions,
  answers,
  flags = {},
  durationSeconds,
  isMarathon = false,
  examMode = isMarathon ? 'marathon' : 'official',
  tutorFormat
}: EvaluateExamParams): ExamSession {
  const evaluatedQuestions =
    tutorFormat === 'endless'
      ? questions.filter(q => answers[q.id] !== undefined)
      : questions;

  let correctCount = 0;
  let wrongCount = 0;
  const subjectMap: Record<number, { total: number; correct: number; wrong: number }> = {};
  const snapshots: ExamQuestionSnapshot[] = [];

  for (const q of evaluatedQuestions) {
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

  const totalQuestions = evaluatedQuestions.length;
  const isPassed = totalQuestions === 0 ? true : isPassingScore(wrongCount, isMarathon, totalQuestions);

  return {
    date: Date.now(),
    durationSeconds,
    totalQuestions,
    correctAnswers: correctCount,
    wrongAnswers: wrongCount,
    isPassed,
    isMarathon,
    examMode,
    tutorFormat,
    subjectBreakdown: subjectMap,
    snapshots
  };
}

/**
 * Counts how many questions the user actually answered in the session.
 */
export function countSessionAnsweredQuestions(session: ExamSession): number {
  if (session.snapshots && session.snapshots.length > 0) {
    return session.snapshots.filter(s => s.userAnswer !== undefined).length;
  }
  return session.correctAnswers;
}

/**
 * Checks whether an exam session contains at least one answered question.
 * Sessions where the user did not give any answer (e.g. submitted immediately or expired with 0 answers)
 * are excluded from history and analytics.
 */
export function hasSessionAnswers(session: ExamSession): boolean {
  return countSessionAnsweredQuestions(session) > 0;
}
