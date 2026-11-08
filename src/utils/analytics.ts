import type { Question } from '../types/quiz';
import type { QuestionStat, ExamSession, ExamOutcome, ExamModeType } from '../types/database';
import { hasSessionAnswers, resolveSessionOutcome } from '../services/examEvaluator';
import {
  OFFICIAL_EXAM_QUOTAS,
  getSubjectPointWeight,
  getQuestionPointWeightById,
} from './aeciRegulation';

export interface SubjectAnalytics {
  id: number;
  name: string;
  total: number;
  seen: number;
  correct: number;
  accuracy: number;
  pointWeight?: number;
  examQuota?: number;
  maxExamPoints?: number;
  examPointsAtRisk?: number;
  activeMistakesCount?: number;
}

export type ReadinessLever = 'coverage' | 'accuracy' | 'exam';

export interface ReadinessBreakdown {
  totalScore: number;
  coverageContribution: number;
  accuracyContribution: number;
  examFactorContribution: number;
  maxCoverageContribution: 35;
  maxAccuracyContribution: 35;
  maxExamFactorContribution: 30;
  coverageRatio: number;
  weightedAccuracyRatio: number;
  examFactorRatio: number;
  validSimulationsCount: number;
  topLever: ReadinessLever;
  potentialGainPoints: number;
  recommendationIt: string;
}

export interface ExamTrendPoint {
  sessionId?: number;
  index: number;
  date: number;
  scoreOn100: number;
  outcome: ExamOutcome;
  examMode: ExamModeType;
  isWeighted: boolean;
  totalQuestions: number;
  wrongAnswers: number;
}

export interface MistakeLeitnerBuckets {
  criticalCount: number;
  recoveringCount: number;
  masteredAfterErrorCount: number;
  activeMistakesTotal: number;
  totalEverWrong: number;
}

/**
 * Checks whether a question belongs to the Mistakes Notebook (Leitner recovery):
 * at least one recorded error and fewer than 2 consecutive correct answers.
 */
export function isMistakeQuestion(stat?: QuestionStat): boolean {
  if (!stat) return false;
  return stat.timesWrong > 0 && stat.consecutiveCorrect < 2;
}

/**
 * Counts how many questions currently reside in the Mistakes Notebook.
 */
export function calculateMistakesCount(statsList: QuestionStat[]): number {
  return statsList.filter(isMistakeQuestion).length;
}

/**
 * Partitions all questions that have ever been answered wrongly into the 3 Leitner recovery stages:
 * - criticalCount (0/2): timesWrong > 0 and consecutiveCorrect === 0
 * - recoveringCount (1/2): timesWrong > 0 and consecutiveCorrect === 1 (1 correct answer away from exit)
 * - masteredAfterErrorCount (2/2): timesWrong > 0 and consecutiveCorrect >= 2 (graduated from Mistakes Notebook)
 */
export function calculateMistakeLeitnerBuckets(statsList: QuestionStat[]): MistakeLeitnerBuckets {
  let criticalCount = 0;
  let recoveringCount = 0;
  let masteredAfterErrorCount = 0;

  for (const stat of statsList) {
    if (stat.timesWrong > 0) {
      if (stat.consecutiveCorrect === 0) {
        criticalCount++;
      } else if (stat.consecutiveCorrect === 1) {
        recoveringCount++;
      } else {
        masteredAfterErrorCount++;
      }
    }
  }

  const activeMistakesTotal = criticalCount + recoveringCount;
  return {
    criticalCount,
    recoveringCount,
    masteredAfterErrorCount,
    activeMistakesTotal,
    totalEverWrong: activeMistakesTotal + masteredAfterErrorCount,
  };
}

/**
 * Computes aggregated study metrics per official subject, enriched with
 * official AeCI exam point weight (2, 3, or 4 pt), 30-quiz exam quota,
 * maximum exam points (out of 100), and estimated exam points at risk.
 */
export function calculateSubjectAnalytics(
  questions: Question[],
  statsMap: Map<number, QuestionStat>
): SubjectAnalytics[] {
  const subjectMap: Record<
    number,
    { name: string; total: number; seen: number; correct: number; activeMistakes: number }
  > = {};

  for (const q of questions) {
    if (!subjectMap[q.subjectId]) {
      subjectMap[q.subjectId] = {
        name: q.subjectName,
        total: 0,
        seen: 0,
        correct: 0,
        activeMistakes: 0,
      };
    }
    subjectMap[q.subjectId].total++;

    const stat = statsMap.get(q.id);
    if (stat && stat.timesSeen > 0) {
      subjectMap[q.subjectId].seen++;
      if (stat.lastResult === 'correct') {
        subjectMap[q.subjectId].correct++;
      }
      if (isMistakeQuestion(stat)) {
        subjectMap[q.subjectId].activeMistakes++;
      }
    }
  }

  return Object.entries(subjectMap).map(([idStr, val]) => {
    const id = Number(idStr);
    const accuracy = val.seen > 0 ? Math.round((val.correct / val.seen) * 100) : 0;
    const pointWeight = getSubjectPointWeight(id);
    const examQuota = OFFICIAL_EXAM_QUOTAS[id] ?? 1;
    const maxExamPoints = examQuota * pointWeight;
    const errorRate = val.seen > 0 ? Math.max(0, 1 - val.correct / val.seen) : 0;
    const examPointsAtRisk =
      val.seen > 0 ? Math.round(maxExamPoints * errorRate * 10) / 10 : 0;

    return {
      id,
      name: val.name,
      total: val.total,
      seen: val.seen,
      correct: val.correct,
      accuracy,
      pointWeight,
      examQuota,
      maxExamPoints,
      examPointsAtRisk,
      activeMistakesCount: val.activeMistakes,
    };
  });
}

/**
 * Decomposes the Exam Readiness Index (0 - 100%) into its 3 explicit pillars:
 * - Component 1 (max 35%): Unweighted catalog coverage (totalSeen / totalCatalogQuestions).
 * - Component 2 (max 35%): Point-weighted accuracy on seen questions (4 / 3 / 2 pt by subject).
 * - Component 3 (max 30%): Average outcome over the last 3 valid simulations ('passed'=1.0, 'oral_check'=0.5).
 */
export function calculateReadinessBreakdown(
  totalCatalogQuestions: number,
  totalSeen: number,
  statsList: QuestionStat[],
  sessions: ExamSession[]
): ReadinessBreakdown {
  if (totalCatalogQuestions <= 0) {
    return {
      totalScore: 0,
      coverageContribution: 0,
      accuracyContribution: 0,
      examFactorContribution: 0,
      maxCoverageContribution: 35,
      maxAccuracyContribution: 35,
      maxExamFactorContribution: 30,
      coverageRatio: 0,
      weightedAccuracyRatio: 0,
      examFactorRatio: 0,
      validSimulationsCount: 0,
      topLever: 'coverage',
      potentialGainPoints: 35,
      recommendationIt: 'Inizia dai quiz mai visti (+35% max)',
    };
  }

  const coverageRatio = Math.min(1, Math.max(0, totalSeen / totalCatalogQuestions));

  let weightedCorrect = 0;
  let weightedSeen = 0;
  for (const stat of statsList) {
    if (stat.timesSeen > 0) {
      const weight = getQuestionPointWeightById(stat.questionId);
      weightedSeen += weight;
      if (stat.lastResult === 'correct') {
        weightedCorrect += weight;
      }
    }
  }
  const weightedAccuracyRatio =
    weightedSeen > 0
      ? Math.min(1, Math.max(0, weightedCorrect / weightedSeen))
      : totalSeen > 0
      ? Math.min(1, Math.max(0, statsList.filter(s => s.lastResult === 'correct').length / totalSeen))
      : 0;

  let examFactorRatio = 0;
  const answeredSessions = sessions.filter(hasSessionAnswers);
  const recentSimulations = answeredSessions.slice(0, 3);
  if (recentSimulations.length > 0) {
    const weightedOutcomes = recentSimulations.reduce((acc, s) => {
      const outcome = resolveSessionOutcome(s);
      if (outcome === 'passed') return acc + 1;
      if (outcome === 'oral_check') return acc + 0.5;
      return acc;
    }, 0);
    examFactorRatio = Math.min(1, Math.max(0, weightedOutcomes / recentSimulations.length));
  }

  const coverageContribution = Math.round(coverageRatio * 350) / 10;
  const accuracyContribution = Math.round(weightedAccuracyRatio * 350) / 10;
  const examFactorContribution = Math.round(examFactorRatio * 300) / 10;

  const calculated = Math.round(
    (coverageRatio * 0.35 + weightedAccuracyRatio * 0.35 + examFactorRatio * 0.3) * 100
  );
  const totalScore = Math.min(100, Math.max(0, calculated));

  const gapCoverage = Math.max(0, Math.round((35 - coverageContribution) * 10) / 10);
  const gapAccuracy = Math.max(0, Math.round((35 - accuracyContribution) * 10) / 10);
  const gapExam = Math.max(0, Math.round((30 - examFactorContribution) * 10) / 10);

  let topLever: ReadinessLever = 'coverage';
  let potentialGainPoints = gapCoverage;
  let recommendationIt = `Esplora nuovi quiz (+${Math.round(gapCoverage)}% max)`;

  if (totalSeen === 0) {
    topLever = 'coverage';
    potentialGainPoints = 35;
    recommendationIt = 'Inizia dai quiz mai visti (+35% max)';
  } else if (gapExam >= gapAccuracy && gapExam >= gapCoverage && gapExam > 0) {
    topLever = 'exam';
    potentialGainPoints = gapExam;
    recommendationIt =
      recentSimulations.length === 0
        ? 'Completa una simulazione esame (+30% max)'
        : `Supera nuove simulazioni (+${Math.round(gapExam)}% max)`;
  } else if (gapAccuracy >= gapCoverage && gapAccuracy > 0) {
    topLever = 'accuracy';
    potentialGainPoints = gapAccuracy;
    recommendationIt = `Ripassa il Quaderno Errori (+${Math.round(gapAccuracy)}% max)`;
  } else if (gapCoverage === 0 && gapAccuracy === 0 && gapExam === 0) {
    topLever = 'exam';
    potentialGainPoints = 0;
    recommendationIt = 'Prontezza al 100%: mantieni l’allenamento';
  }

  return {
    totalScore,
    coverageContribution,
    accuracyContribution,
    examFactorContribution,
    maxCoverageContribution: 35,
    maxAccuracyContribution: 35,
    maxExamFactorContribution: 30,
    coverageRatio,
    weightedAccuracyRatio,
    examFactorRatio,
    validSimulationsCount: recentSimulations.length,
    topLever,
    potentialGainPoints,
    recommendationIt,
  };
}

/**
 * Computes the Exam Readiness Index (0 - 100%).
 */
export function calculateReadinessScore(
  totalCatalogQuestions: number,
  totalSeen: number,
  statsList: QuestionStat[],
  sessions: ExamSession[]
): number {
  return calculateReadinessBreakdown(totalCatalogQuestions, totalSeen, statsList, sessions).totalScore;
}

/**
 * Normalizes the most recent valid simulations onto a /100 pt scale in chronological order
 * (oldest to newest) for SVG trend chart rendering against the 86 pt and 80 pt AeCI thresholds.
 */
export function calculateExamTrend(sessions: ExamSession[], limit = 10): ExamTrendPoint[] {
  const validRecent = sessions.filter(hasSessionAnswers).slice(0, Math.max(1, limit)).reverse();

  return validRecent.map((s, idx) => {
    let scoreOn100 = 0;
    let isWeighted = false;

    if (typeof s.scorePoints === 'number') {
      const maxPts = typeof s.maxPoints === 'number' && s.maxPoints > 0 ? s.maxPoints : 100;
      scoreOn100 = Math.round((s.scorePoints / maxPts) * 1000) / 10;
      isWeighted = true;
    } else if (
      typeof s.rawPoints === 'number' &&
      typeof s.rawMaxPoints === 'number' &&
      s.rawMaxPoints > 0
    ) {
      scoreOn100 = Math.round((s.rawPoints / s.rawMaxPoints) * 1000) / 10;
      isWeighted = true;
    } else if (s.totalQuestions > 0) {
      scoreOn100 = Math.round((s.correctAnswers / s.totalQuestions) * 1000) / 10;
    }

    scoreOn100 = Math.min(100, Math.max(0, scoreOn100));

    return {
      sessionId: s.id,
      index: idx + 1,
      date: s.date,
      scoreOn100,
      outcome: resolveSessionOutcome(s),
      examMode: s.examMode ?? (s.isMarathon ? 'marathon' : 'official'),
      isWeighted,
      totalQuestions: s.totalQuestions,
      wrongAnswers: s.wrongAnswers,
    };
  });
}
