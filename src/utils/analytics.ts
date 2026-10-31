import type { Question } from '../types/quiz';
import type { QuestionStat, ExamSession } from '../types/database';
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
 * Computes aggregated study metrics per official subject, enriched with
 * official AeCI exam point weight (2, 3, or 4 pt) and 30-quiz exam quota.
 */
export function calculateSubjectAnalytics(
  questions: Question[],
  statsMap: Map<number, QuestionStat>
): SubjectAnalytics[] {
  const subjectMap: Record<number, { name: string; total: number; seen: number; correct: number }> = {};

  for (const q of questions) {
    if (!subjectMap[q.subjectId]) {
      subjectMap[q.subjectId] = { name: q.subjectName, total: 0, seen: 0, correct: 0 };
    }
    subjectMap[q.subjectId].total++;

    const stat = statsMap.get(q.id);
    if (stat && stat.timesSeen > 0) {
      subjectMap[q.subjectId].seen++;
      if (stat.lastResult === 'correct') {
        subjectMap[q.subjectId].correct++;
      }
    }
  }

  return Object.entries(subjectMap).map(([idStr, val]) => {
    const id = Number(idStr);
    const accuracy = val.seen > 0 ? Math.round((val.correct / val.seen) * 100) : 0;
    return {
      id,
      name: val.name,
      total: val.total,
      seen: val.seen,
      correct: val.correct,
      accuracy,
      pointWeight: getSubjectPointWeight(id),
      examQuota: OFFICIAL_EXAM_QUOTAS[id] ?? 1,
    };
  });
}

/**
 * Computes the Exam Readiness Index (0 - 100%):
 * - Component 1 (35%): Unweighted catalog coverage (totalSeen / totalCatalogQuestions).
 * - Component 2 (35%): Point-weighted accuracy on seen questions (4 / 3 / 2 pt by subject,
 *   falling back to weight 1 for synthetic IDs < 1000).
 * - Component 3 (30%): Average outcome over the last 3 valid simulations
 *   ('passed' = 1.0, 'oral_check' = 0.5, 'failed' = 0.0).
 */
export function calculateReadinessScore(
  totalCatalogQuestions: number,
  totalSeen: number,
  statsList: QuestionStat[],
  sessions: ExamSession[]
): number {
  if (totalCatalogQuestions === 0) return 0;

  // Component 1: Catalog coverage (35%)
  const coverage = totalSeen / totalCatalogQuestions;

  // Component 2: Weighted accuracy on seen questions (35%)
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
  const accuracy =
    weightedSeen > 0
      ? weightedCorrect / weightedSeen
      : totalSeen > 0
      ? statsList.filter(s => s.lastResult === 'correct').length / totalSeen
      : 0;

  // Component 3: Average outcome of last 3 answered simulations (30%)
  let examScoreFactor = 0;
  const answeredSessions = sessions.filter(hasSessionAnswers);
  if (answeredSessions.length > 0) {
    const recent = answeredSessions.slice(0, 3);
    const weightedOutcomes = recent.reduce((acc, s) => {
      const outcome = resolveSessionOutcome(s);
      if (outcome === 'passed') return acc + 1;
      if (outcome === 'oral_check') return acc + 0.5;
      return acc;
    }, 0);
    examScoreFactor = weightedOutcomes / recent.length;
  }

  const calculated = Math.round((coverage * 0.35 + accuracy * 0.35 + examScoreFactor * 0.3) * 100);
  return Math.min(100, Math.max(0, calculated));
}
