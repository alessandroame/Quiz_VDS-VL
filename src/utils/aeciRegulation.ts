/**
 * Official Aero Club d'Italia (AeCI) VDS/VL (Volo Libero) exam regulation constants
 * and point weight helpers (Regolamento Tecnico-Operativo-Didattico Volo Libero).
 *
 * Official 30-question exam distribution (total = 30 questions, 100 points):
 *  - Subject 1 (Normativa e Legislazione): 4 questions x 3 pt = 12 pt
 *  - Subject 2 (Aerodinamica):             8 questions x 3 pt = 24 pt
 *  - Subject 3 (Pronto Soccorso):          1 question  x 2 pt =  2 pt
 *  - Subject 4 (Fisiopatologia del Volo):  1 question  x 2 pt =  2 pt
 *  - Subject 5 (Meteorologia e Aerologia): 6 questions x 4 pt = 24 pt
 *  - Subject 6 (Strumenti):                1 question  x 2 pt =  2 pt
 *  - Subject 7 (Tecnica di Pilotaggio):    5 questions x 4 pt = 20 pt
 *  - Subject 8 (Materiali):                1 question  x 2 pt =  2 pt
 *  - Subject 9 (Sicurezza del Volo):       3 questions x 4 pt = 12 pt
 */

export const SUBJECT_POINT_WEIGHTS: Record<number, 2 | 3 | 4> = {
  1: 3,
  2: 3,
  3: 2,
  4: 2,
  5: 4,
  6: 2,
  7: 4,
  8: 2,
  9: 4,
};

export const OFFICIAL_EXAM_QUOTAS: Record<number, number> = {
  1: 4,
  2: 8,
  3: 1,
  4: 1,
  5: 6,
  6: 1,
  7: 5,
  8: 1,
  9: 3,
};

export const MARATHON_EXAM_QUOTAS: Record<number, number> = {
  1: 8,
  2: 16,
  3: 2,
  4: 2,
  5: 12,
  6: 2,
  7: 10,
  8: 2,
  9: 6,
};

export const MAX_EXAM_POINTS = 100;
export const MARATHON_RAW_MAX_POINTS = 200;
export const PASSING_SCORE_POINTS = 86;
export const ORAL_CHECK_MIN_POINTS = 80;

export const OFFICIAL_WRITTEN_TIMER_MINUTES = 30;
export const EXTENDED_EXAM_TIMER_MINUTES = 45;
export const HANDS_FREE_AUDIO_TIMER_MINUTES = 45;
export const MARATHON_TIMER_MINUTES = 60;

/**
 * Returns the official point weight (2, 3, or 4) for a given subject ID (1..9).
 * Falls back to 1 for synthetic or unknown subject IDs.
 */
export function getSubjectPointWeight(subjectId: number): number {
  return SUBJECT_POINT_WEIGHTS[subjectId] ?? 1;
}

/**
 * Derives the official point weight (2, 3, or 4) directly from a catalog question ID
 * (e.g. 1001..9045 -> subjectId 1..9). Falls back to 1 for synthetic test IDs (< 1000).
 */
export function getQuestionPointWeightById(questionId: number): number {
  const derivedSubjectId = Math.floor(questionId / 1000);
  if (derivedSubjectId >= 1 && derivedSubjectId <= 9) {
    return SUBJECT_POINT_WEIGHTS[derivedSubjectId];
  }
  return 1;
}
