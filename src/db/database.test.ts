import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  DEFAULT_SETTINGS,
  recordQuestionAnswer,
  toggleQuestionBookmark,
  saveQuestionNote,
  getSetting,
  setSetting,
  getAllSettings,
  exportDatabaseBackup,
  importDatabaseBackup
} from './index';

describe('Suite 4: Persistenza Dexie IndexedDB (src/db/index.ts)', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('DB-01: registra la prima risposta corretta inizializzando la telemetria', async () => {
    // Act
    await recordQuestionAnswer(1001, true);

    // Assert
    const stat = await db.stats.get(1001);
    expect(stat).toBeDefined();
    expect(stat!.questionId).toBe(1001);
    expect(stat!.timesSeen).toBe(1);
    expect(stat!.timesCorrect).toBe(1);
    expect(stat!.timesWrong).toBe(0);
    expect(stat!.consecutiveCorrect).toBe(1);
    expect(stat!.lastResult).toBe('correct');
    expect(stat!.isBookmarked).toBe(false);
    expect(typeof stat!.lastAnsweredAt).toBe('number');
  });

  it('DB-02: registra la prima risposta errata con consecutiveCorrect pari a 0', async () => {
    // Act
    await recordQuestionAnswer(1002, false);

    // Assert
    const stat = await db.stats.get(1002);
    expect(stat).toBeDefined();
    expect(stat!.timesSeen).toBe(1);
    expect(stat!.timesCorrect).toBe(0);
    expect(stat!.timesWrong).toBe(1);
    expect(stat!.consecutiveCorrect).toBe(0);
    expect(stat!.lastResult).toBe('wrong');
  });

  it('DB-03: risposte corrette consecutive incrementano consecutiveCorrect', async () => {
    // Act
    await recordQuestionAnswer(1003, true);
    await recordQuestionAnswer(1003, true);
    await recordQuestionAnswer(1003, true);

    // Assert
    const stat = await db.stats.get(1003);
    expect(stat!.timesSeen).toBe(3);
    expect(stat!.timesCorrect).toBe(3);
    expect(stat!.timesWrong).toBe(0);
    expect(stat!.consecutiveCorrect).toBe(3);
    expect(stat!.lastResult).toBe('correct');
  });

  it('DB-04: un errore dopo successi consecutivi resetta consecutiveCorrect a 0', async () => {
    // Arrange: 2 successi
    await recordQuestionAnswer(1004, true);
    await recordQuestionAnswer(1004, true);
    let stat = await db.stats.get(1004);
    expect(stat!.consecutiveCorrect).toBe(2);

    // Act: commette un errore
    await recordQuestionAnswer(1004, false);

    // Assert
    stat = await db.stats.get(1004);
    expect(stat!.timesSeen).toBe(3);
    expect(stat!.timesCorrect).toBe(2);
    expect(stat!.timesWrong).toBe(1);
    expect(stat!.consecutiveCorrect).toBe(0);
    expect(stat!.lastResult).toBe('wrong');
  });

  it('DB-05: toggle bookmark gestisce sia record inesistenti che già presenti in modo idempotente', async () => {
    // Act 1: primo toggle su quiz non ancora presente in stats
    const state1 = await toggleQuestionBookmark(2001);
    expect(state1).toBe(true);
    let stat = await db.stats.get(2001);
    expect(stat!.isBookmarked).toBe(true);

    // Act 2: secondo toggle
    const state2 = await toggleQuestionBookmark(2001);
    expect(state2).toBe(false);
    stat = await db.stats.get(2001);
    expect(stat!.isBookmarked).toBe(false);
  });

  it('DB-06: salvataggio e aggiornamento note personali sul quiz', async () => {
    // Act 1: salvataggio su quiz nuovo
    await saveQuestionNote(2002, 'Ricordarsi la regola della precedenza a destra');
    let stat = await db.stats.get(2002);
    expect(stat!.userNote).toBe('Ricordarsi la regola della precedenza a destra');

    // Act 2: aggiornamento nota
    await saveQuestionNote(2002, 'Aggiornamento: vale anche in termica');
    stat = await db.stats.get(2002);
    expect(stat!.userNote).toBe('Aggiornamento: vale anche in termica');
  });

  it('DB-07: gestione impostazioni e fallback trasparente ai default', async () => {
    // Fallback con DB vuoto
    const defaultTimer = await getSetting('examTimerMinutes', 45);
    expect(defaultTimer).toBe(45);

    // Scrittura
    await setSetting('examTimerMinutes', 30);
    const updatedTimer = await getSetting('examTimerMinutes', 45);
    expect(updatedTimer).toBe(30);

    // getAllSettings
    const all = await getAllSettings();
    expect(all.examTimerMinutes).toBe(30);
    expect(all.theme).toBe(DEFAULT_SETTINGS.theme);
  });

  it('DB-08: esportazione backup database in formato JSON serializzato', async () => {
    // Arrange: popoliamo qualche dato
    await recordQuestionAnswer(1001, true);
    await setSetting('soundEnabled', false);
    await db.sessions.add({
      date: 123456789,
      durationSeconds: 1500,
      totalQuestions: 30,
      correctAnswers: 28,
      wrongAnswers: 2,
      isPassed: true,
      isMarathon: false,
      subjectBreakdown: {},
      snapshots: []
    });

    // Act
    const backupJson = await exportDatabaseBackup();

    // Assert
    expect(typeof backupJson).toBe('string');
    const parsed = JSON.parse(backupJson);
    expect(parsed.version).toBe(1);
    expect(typeof parsed.exportedAt).toBe('number');
    expect(Array.isArray(parsed.stats)).toBe(true);
    expect(parsed.stats.length).toBe(1);
    expect(parsed.sessions.length).toBe(1);
    expect(parsed.settings.length).toBe(1);
  });

  it('DB-09: ripristino atomico del backup transazionale', async () => {
    // Arrange
    const backupPayload = JSON.stringify({
      version: 1,
      exportedAt: Date.now(),
      stats: [
        { questionId: 3001, timesSeen: 2, timesCorrect: 2, timesWrong: 0, consecutiveCorrect: 2, isBookmarked: true }
      ],
      sessions: [
        { id: 1, date: 99999, durationSeconds: 1200, totalQuestions: 30, correctAnswers: 30, wrongAnswers: 0, isPassed: true, isMarathon: false, subjectBreakdown: {}, snapshots: [] }
      ],
      settings: [
        { key: 'theme', value: 'dark' }
      ]
    });

    // Act
    const result = await importDatabaseBackup(backupPayload);

    // Assert
    expect(result.success).toBe(true);
    const stat = await db.stats.get(3001);
    expect(stat).toBeDefined();
    expect(stat!.isBookmarked).toBe(true);

    const sessions = await db.sessions.toArray();
    expect(sessions.length).toBe(1);
    expect(sessions[0].isPassed).toBe(true);

    const theme = await getSetting('theme', 'system');
    expect(theme).toBe('dark');
  });

  it('DB-10: gestione sicura di backup corrotti o non validi', async () => {
    // Act 1: stringa non JSON
    const res1 = await importDatabaseBackup('INVALID_JSON{{{');
    expect(res1.success).toBe(false);

    // Act 2: JSON privo del campo stats obbligatorio
    const res2 = await importDatabaseBackup(JSON.stringify({ somethingElse: true }));
    expect(res2.success).toBe(false);
    expect(res2.message).toContain('non valido');
  });
});
