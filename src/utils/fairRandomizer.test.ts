import { describe, it, expect } from 'vitest';
import questionsData from '../data/questions.json';
import type { Question } from '../types/quiz';
import type { QuestionStat } from '../types/database';
import {
  generateExamQuestions,
  generateFlashTutorQuestions,
  OFFICIAL_EXAM_QUOTAS,
  MARATHON_EXAM_QUOTAS
} from './fairRandomizer';

describe('Suite 2: Fair Coverage Randomizer (src/utils/fairRandomizer.ts)', () => {
  const allQuestions = questionsData as Question[];

  it('RAND-01: rispetta rigorosamente le quote per materia dell\'esame standard (30 quesiti)', () => {
    // Arrange
    const statsMap = new Map<number, QuestionStat>();

    // Act
    const exam = generateExamQuestions(allQuestions, statsMap, false);

    // Assert
    expect(exam.length).toBe(30);

    const counts: Record<number, number> = {};
    for (const q of exam) {
      counts[q.subjectId] = (counts[q.subjectId] || 0) + 1;
    }

    for (let sId = 1; sId <= 9; sId++) {
      expect(counts[sId]).toBe(OFFICIAL_EXAM_QUOTAS[sId]);
    }
  });

  it('RAND-02: rispetta le quote raddoppiate per l\'esame maratona (60 quesiti)', () => {
    // Arrange
    const statsMap = new Map<number, QuestionStat>();

    // Act
    const exam = generateExamQuestions(allQuestions, statsMap, true);

    // Assert
    expect(exam.length).toBe(60);

    const counts: Record<number, number> = {};
    for (const q of exam) {
      counts[q.subjectId] = (counts[q.subjectId] || 0) + 1;
    }

    for (let sId = 1; sId <= 9; sId++) {
      expect(counts[sId]).toBe(MARATHON_EXAM_QUOTAS[sId]);
    }
  });

  it('RAND-03: non genera MAI domande duplicate all\'interno della stessa sessione', () => {
    // Arrange
    const statsMap = new Map<number, QuestionStat>();

    // Act
    const standardExam = generateExamQuestions(allQuestions, statsMap, false);
    const marathonExam = generateExamQuestions(allQuestions, statsMap, true);

    // Assert
    const standardIds = standardExam.map(q => q.id);
    const marathonIds = marathonExam.map(q => q.id);

    expect(new Set(standardIds).size).toBe(30);
    expect(new Set(marathonIds).size).toBe(60);
  });

  it('RAND-04: prioritarizza sistematicamente le domande mai viste (timesSeen = 0)', () => {
    // Arrange
    const statsMap = new Map<number, QuestionStat>();
    // Segnamo tutte le domande tranne 2 di Normativa (Subject 1) come già viste 5 volte
    const subject1Questions = allQuestions.filter(q => q.subjectId === 1);
    const unseen1 = subject1Questions[0];
    const unseen2 = subject1Questions[1];

    for (const q of subject1Questions) {
      if (q.id !== unseen1.id && q.id !== unseen2.id) {
        statsMap.set(q.id, {
          questionId: q.id,
          timesSeen: 5,
          timesCorrect: 5,
          timesWrong: 0,
          consecutiveCorrect: 5,
          isBookmarked: false
        });
      }
    }

    // Act: la quota di Normativa è 2
    const exam = generateExamQuestions(allQuestions, statsMap, false);
    const selectedSub1Ids = exam.filter(q => q.subjectId === 1).map(q => q.id);

    // Assert: devono essere state scelte esattamente le due mai viste
    expect(selectedSub1Ids).toContain(unseen1.id);
    expect(selectedSub1Ids).toContain(unseen2.id);
  });

  it('RAND-05: a parità di visualizzazioni, dà priorità ai quesiti con tasso di errore più alto', () => {
    // Arrange
    const statsMap = new Map<number, QuestionStat>();
    const subject3Questions = allQuestions.filter(q => q.subjectId === 3); // Pronto Soccorso (quota 1)

    // Impostiamo per tutte timesSeen = 2, ma una sola con 2 errori (tasso 100%)
    const highErrorQ = subject3Questions[0];
    statsMap.set(highErrorQ.id, {
      questionId: highErrorQ.id,
      timesSeen: 2,
      timesCorrect: 0,
      timesWrong: 2,
      consecutiveCorrect: 0,
      isBookmarked: false
    });

    for (let i = 1; i < subject3Questions.length; i++) {
      const q = subject3Questions[i];
      statsMap.set(q.id, {
        questionId: q.id,
        timesSeen: 2,
        timesCorrect: 2,
        timesWrong: 0,
        consecutiveCorrect: 2,
        isBookmarked: false
      });
    }

    // Act
    const exam = generateExamQuestions(allQuestions, statsMap, false);
    const selectedSub3 = exam.filter(q => q.subjectId === 3);

    // Assert: la domanda con tasso di errore 100% deve essere estratta per la quota 1
    expect(selectedSub3.length).toBe(1);
    expect(selectedSub3[0].id).toBe(highErrorQ.id);
  });

  it('RAND-06: simulazione Monte Carlo - copertura catalogo progressiva e totale al 100% entro 23 simulazioni', () => {
    // Arrange
    const statsMap = new Map<number, QuestionStat>();

    // Act: eseguiamo 23 simulazioni consecutive aggiornando timesSeen ad ogni estrazione
    for (let run = 1; run <= 23; run++) {
      const exam = generateExamQuestions(allQuestions, statsMap, false);
      for (const q of exam) {
        const prev = statsMap.get(q.id);
        const seen = (prev?.timesSeen || 0) + 1;
        statsMap.set(q.id, {
          questionId: q.id,
          timesSeen: seen,
          timesCorrect: seen,
          timesWrong: 0,
          consecutiveCorrect: seen,
          isBookmarked: false
        });
      }

      if (run === 20) {
        // Alla 20esima simulazione, almeno 499 quiz su 504 (99%+) sono stati visti
        const seenAt20 = Array.from(statsMap.values()).filter(s => s.timesSeen >= 1).length;
        expect(seenAt20).toBeGreaterThanOrEqual(499);
      }
    }

    // Assert: alla 23esima simulazione il 100% dei 504 quiz è stato visto almeno una volta
    const totalSeenAt23 = Array.from(statsMap.values()).filter(s => s.timesSeen >= 1).length;
    expect(totalSeenAt23).toBe(504);

    for (const q of allQuestions) {
      const stat = statsMap.get(q.id);
      expect(stat).toBeDefined();
      expect(stat!.timesSeen).toBeGreaterThanOrEqual(1);
    }
  });

  it('RAND-07: generateFlashTutorQuestions extracts exactly requested count (default 10) without duplicates', () => {
    // Arrange
    const statsMap = new Map<number, QuestionStat>();

    // Act
    const flashQuestions = generateFlashTutorQuestions(allQuestions, statsMap, 10);

    // Assert
    expect(flashQuestions.length).toBe(10);
    const uniqueIds = new Set(flashQuestions.map(q => q.id));
    expect(uniqueIds.size).toBe(10);
  });

  it('RAND-08: generateFlashTutorQuestions prioritizes unseen questions (timesSeen=0) and active mistakes', () => {
    // Arrange: mark 500 questions as seen and mastered
    const statsMap = new Map<number, QuestionStat>();
    for (let i = 0; i < 500; i++) {
      const q = allQuestions[i];
      statsMap.set(q.id, {
        questionId: q.id,
        timesSeen: 4,
        timesCorrect: 4,
        timesWrong: 0,
        consecutiveCorrect: 4,
        isBookmarked: false
      });
    }

    // Leave exactly 4 questions unseen (timesSeen=0)
    const unseenQuestions = allQuestions.slice(500, 504);

    // Pick 2 questions from the mastered group and make them active mistakes
    const activeMistake1 = allQuestions[10];
    const activeMistake2 = allQuestions[20];
    statsMap.set(activeMistake1.id, {
      questionId: activeMistake1.id,
      timesSeen: 3,
      timesCorrect: 1,
      timesWrong: 2,
      consecutiveCorrect: 0,
      isBookmarked: false
    });
    statsMap.set(activeMistake2.id, {
      questionId: activeMistake2.id,
      timesSeen: 4,
      timesCorrect: 2,
      timesWrong: 2,
      consecutiveCorrect: 0,
      isBookmarked: false
    });

    // Act
    const batch = generateFlashTutorQuestions(allQuestions, statsMap, 10);
    const batchIds = new Set(batch.map(q => q.id));

    // Assert: all 4 unseen questions and both active mistakes MUST be included in the top 10 batch
    for (const unseen of unseenQuestions) {
      expect(batchIds.has(unseen.id)).toBe(true);
    }
    expect(batchIds.has(activeMistake1.id)).toBe(true);
    expect(batchIds.has(activeMistake2.id)).toBe(true);
  });

  it('RAND-09: generateFlashTutorQuestions respects excludeIds when extending session (+10 questions)', () => {
    // Arrange
    const statsMap = new Map<number, QuestionStat>();
    const firstBatch = generateFlashTutorQuestions(allQuestions, statsMap, 10);
    const firstBatchIds = new Set(firstBatch.map(q => q.id));

    // Act: request 10 more questions excluding the first batch
    const secondBatch = generateFlashTutorQuestions(allQuestions, statsMap, 10, firstBatchIds);

    // Assert
    expect(secondBatch.length).toBe(10);
    for (const q of secondBatch) {
      expect(firstBatchIds.has(q.id)).toBe(false);
    }
  });
});

