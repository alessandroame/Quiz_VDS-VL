import type { Question } from '../types/quiz';
import type { QuestionStat, ExamSession } from '../types/database';
import { hasSessionAnswers } from '../services/examEvaluator';

export interface SubjectAnalytics {
  id: number;
  name: string;
  total: number;
  seen: number;
  correct: number;
  accuracy: number;
}

/**
 * Verifica se una domanda deve essere inclusa nel Quaderno Errori:
 * Ha almeno un errore registrato e non ha ancora conseguito 2 risposte corrette consecutive.
 */
export function isMistakeQuestion(stat?: QuestionStat): boolean {
  if (!stat) return false;
  return stat.timesWrong > 0 && stat.consecutiveCorrect < 2;
}

/**
 * Calcola il numero di domande attualmente presenti nel Quaderno Errori.
 */
export function calculateMistakesCount(statsList: QuestionStat[]): number {
  return statsList.filter(isMistakeQuestion).length;
}

/**
 * Calcola le metriche aggregate di studio suddivise per singola materia.
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
      accuracy
    };
  });
}

/**
 * Calcola l'indice di prontezza all'esame (0 - 100%):
 * - Componente 1: Copertura catalogo (peso 35%)
 * - Componente 2: Accuratezza generale sui visti (peso 35%)
 * - Componente 3: Tasso superamento ultime 3 simulazioni (peso 30%)
 */
export function calculateReadinessScore(
  totalCatalogQuestions: number,
  totalSeen: number,
  statsList: QuestionStat[],
  sessions: ExamSession[]
): number {
  if (totalCatalogQuestions === 0) return 0;

  // Componente 1: Copertura catalogo (35%)
  const coverage = totalSeen / totalCatalogQuestions;

  // Componente 2: Accuratezza generale sui visti (35%)
  const correctCount = statsList.filter(s => s.lastResult === 'correct').length;
  const accuracy = totalSeen > 0 ? correctCount / totalSeen : 0;

  // Componente 3: Media ultime 3 simulazioni valide con risposte (30%)
  let examScoreFactor = 0;
  const answeredSessions = sessions.filter(hasSessionAnswers);
  if (answeredSessions.length > 0) {
    const recent = answeredSessions.slice(0, 3);
    const passedCount = recent.filter(s => s.isPassed).length;
    examScoreFactor = passedCount / recent.length;
  }

  const calculated = Math.round((coverage * 0.35 + accuracy * 0.35 + examScoreFactor * 0.3) * 100);
  return Math.min(100, Math.max(0, calculated));
}
