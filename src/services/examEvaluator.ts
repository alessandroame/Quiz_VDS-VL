import type { Question } from '../types/quiz';
import type {
  ExamSession,
  ExamQuestionSnapshot,
  ExamModeType,
  TutorFormat,
  ExamOutcome,
  SubjectBreakdownEntry,
} from '../types/database';
import {
  MAX_EXAM_POINTS,
  MARATHON_RAW_MAX_POINTS,
  PASSING_SCORE_POINTS,
  ORAL_CHECK_MIN_POINTS,
  getSubjectPointWeight,
} from '../utils/aeciRegulation';

export { MAX_EXAM_POINTS, PASSING_SCORE_POINTS, ORAL_CHECK_MIN_POINTS };

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
 * Classifies a normalized 0..100 AeCI Volo Libero exam score into the 3 official tiers:
 * - 86..100 points: 'passed' (direct pass)
 * - 80..85.9 points: 'oral_check' (admitted with integrative oral check on wrong questions)
 * - < 80 points: 'failed'
 */
export function evaluateWeightedOutcome(scorePoints: number): ExamOutcome {
  if (scorePoints >= PASSING_SCORE_POINTS) {
    return 'passed';
  }
  if (scorePoints >= ORAL_CHECK_MIN_POINTS) {
    return 'oral_check';
  }
  return 'failed';
}

/**
 * Resolves the 3-tier outcome of any current or historical ExamSession,
 * preserving full backward compatibility with legacy sessions lacking examOutcome.
 */
export function resolveSessionOutcome(
  session: Pick<ExamSession, 'examOutcome' | 'isPassed' | 'scorePoints'>
): ExamOutcome {
  if (session.examOutcome) {
    return session.examOutcome;
  }
  if (typeof session.scorePoints === 'number') {
    return evaluateWeightedOutcome(session.scorePoints);
  }
  return session.isPassed ? 'passed' : 'failed';
}

/**
 * Legacy unweighted pass check (90% threshold) retained for Flash (10-quiz),
 * Endless Tutor, and non-quota synthetic question slices.
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
 * Deterministically evaluates an exam or tutor session.
 * - Balanced 30-question (100 pt) and 60-question Marathon (200 raw pt -> /100) AeCI sheets
 *   in Official, Tutor Standard, and Marathon modes are evaluated with the official weighted
 *   4/3/2 point engine and 3-tier outcome ('passed' 86..100, 'oral_check' 80..85, 'failed' < 80).
 * - Unanswered or skipped questions count as errors except in Endless Tutor stream mode.
 */
export function evaluateExam({
  questions,
  answers,
  flags = {},
  durationSeconds,
  isMarathon = false,
  examMode = isMarathon ? 'marathon' : 'official',
  tutorFormat,
}: EvaluateExamParams): ExamSession {
  const evaluatedQuestions =
    tutorFormat === 'endless'
      ? questions.filter(q => answers[q.id] !== undefined)
      : questions;

  let correctCount = 0;
  let wrongCount = 0;
  let rawPoints = 0;
  let rawMaxPoints = 0;
  const subjectMap: Record<number, SubjectBreakdownEntry> = {};
  const snapshots: ExamQuestionSnapshot[] = [];

  for (const q of evaluatedQuestions) {
    const userAns = answers[q.id];
    const isCorrect = userAns !== undefined && userAns === q.correctAnswer;
    const weight = getSubjectPointWeight(q.subjectId);

    rawMaxPoints += weight;
    if (isCorrect) {
      correctCount++;
      rawPoints += weight;
    } else {
      wrongCount++;
    }

    if (!subjectMap[q.subjectId]) {
      subjectMap[q.subjectId] = {
        total: 0,
        correct: 0,
        wrong: 0,
        pointWeight: weight,
        pointsEarned: 0,
        maxPoints: 0,
        pointsLost: 0,
      };
    }

    const subEntry = subjectMap[q.subjectId];
    subEntry.total++;
    subEntry.maxPoints = (subEntry.maxPoints || 0) + weight;
    if (isCorrect) {
      subEntry.correct++;
      subEntry.pointsEarned = (subEntry.pointsEarned || 0) + weight;
    } else {
      subEntry.wrong++;
      subEntry.pointsLost = (subEntry.pointsLost || 0) + weight;
    }

    snapshots.push({
      questionId: q.id,
      userAnswer: userAns,
      correctAnswer: q.correctAnswer,
      isCorrect,
      wasFlagged: !!flags[q.id],
    });
  }

  const totalQuestions = evaluatedQuestions.length;
  const isWeightedMode =
    examMode === 'official' ||
    examMode === 'marathon' ||
    (examMode === 'tutor' && tutorFormat !== 'flash' && tutorFormat !== 'endless');

  const isBalancedWeightedSheet =
    isWeightedMode &&
    ((totalQuestions === 30 && rawMaxPoints === MAX_EXAM_POINTS) ||
      (totalQuestions === 60 && rawMaxPoints === MARATHON_RAW_MAX_POINTS));

  if (isBalancedWeightedSheet) {
    const scorePoints =
      rawMaxPoints === MAX_EXAM_POINTS
        ? rawPoints
        : Math.round((rawPoints / rawMaxPoints) * 1000) / 10;
    const examOutcome = evaluateWeightedOutcome(scorePoints);
    const isPassed = examOutcome === 'passed';

    return {
      date: Date.now(),
      durationSeconds,
      totalQuestions,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      isPassed,
      examOutcome,
      scorePoints,
      maxPoints: MAX_EXAM_POINTS,
      rawPoints,
      rawMaxPoints,
      isMarathon,
      examMode,
      tutorFormat,
      subjectBreakdown: subjectMap,
      snapshots,
    };
  }

  const isPassed = totalQuestions === 0 ? true : isPassingScore(wrongCount, isMarathon, totalQuestions);
  const examOutcome: ExamOutcome = isPassed ? 'passed' : 'failed';

  return {
    date: Date.now(),
    durationSeconds,
    totalQuestions,
    correctAnswers: correctCount,
    wrongAnswers: wrongCount,
    isPassed,
    examOutcome,
    isMarathon,
    examMode,
    tutorFormat,
    subjectBreakdown: subjectMap,
    snapshots,
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
