import type { Question } from '../types/quiz';
import type { QuestionStat } from '../types/database';

export const OFFICIAL_EXAM_QUOTAS: Record<number, number> = {
  1: 2, // Normativa (40 quiz tot)
  2: 9, // Aerodinamica (150 quiz tot)
  3: 1, // Pronto Soccorso (20 quiz tot)
  4: 1, // Fisiopatologia (10 quiz tot)
  5: 8, // Meteorologia (120 quiz tot)
  6: 1, // Strumenti (20 quiz tot)
  7: 5, // Tecnica di Pilotaggio (79 quiz tot)
  8: 1, // Materiali (20 quiz tot)
  9: 2, // Sicurezza del Volo (45 quiz tot)
};

export const MARATHON_EXAM_QUOTAS: Record<number, number> = {
  1: 4,
  2: 18,
  3: 2,
  4: 2,
  5: 16,
  6: 2,
  7: 10,
  8: 2,
  9: 4,
};

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Fair Coverage Randomizer:
 * Estrae un set d'esame bilanciato dando priorità alle domande mai viste
 * per garantire di coprire tutti i 504 quiz entro circa 17 simulazioni.
 */
export function generateExamQuestions(
  allQuestions: Question[],
  statsMap: Map<number, QuestionStat>,
  isMarathon = false
): Question[] {
  const quotas = isMarathon ? MARATHON_EXAM_QUOTAS : OFFICIAL_EXAM_QUOTAS;
  const selected: Question[] = [];

  for (let subjectId = 1; subjectId <= 9; subjectId++) {
    const quota = quotas[subjectId] || 1;
    const subjectQuestions = allQuestions.filter(q => q.subjectId === subjectId);

    // Ordina e raggruppa per priorità:
    // 1. Minore numero di volte viste (timesSeen asc)
    // 2. A parità di volte viste, maggiore tasso di errore (timesWrong desc)
    // 3. Randomizzazione interna (per non estrarre sempre in ordine di ID)
    const scored = subjectQuestions.map(q => {
      const stat = statsMap.get(q.id);
      const timesSeen = stat?.timesSeen || 0;
      const timesWrong = stat?.timesWrong || 0;
      const errorRate = timesSeen > 0 ? timesWrong / timesSeen : 0.5;

      return {
        question: q,
        timesSeen,
        errorRate,
        randomJitter: Math.random()
      };
    });

    // Sort: timesSeen asc, poi errorRate desc, poi randomJitter
    scored.sort((a, b) => {
      if (a.timesSeen !== b.timesSeen) {
        return a.timesSeen - b.timesSeen; // Mai viste (0) prima di tutto
      }
      if (Math.abs(a.errorRate - b.errorRate) > 0.2) {
        return b.errorRate - a.errorRate; // Priorità a chi ha più errori
      }
      return a.randomJitter - b.randomJitter;
    });

    const chosenForSubject = scored.slice(0, quota).map(s => s.question);
    selected.push(...chosenForSubject);
  }

  // Mescola l'ordine finale per non avere le domande raggruppate rigidamente per materia
  return shuffleArray(selected);
}
