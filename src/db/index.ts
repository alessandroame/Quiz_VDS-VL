import Dexie, { type Table } from 'dexie';
import type { QuestionStat, ExamSession, AppSettings } from '../types/database';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  examTimerMinutes: 45,
  immediateFeedbackInTopics: true,
  soundEnabled: true,
  hapticEnabled: true,
  googleClientId: '',
  autoSyncDrive: false,
};

export class VdsQuizDatabase extends Dexie {
  stats!: Table<QuestionStat, number>;
  sessions!: Table<ExamSession, number>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('VdsQuizMasterDB');
    this.version(1).stores({
      stats: 'questionId, timesSeen, timesWrong, lastAnsweredAt, isBookmarked, consecutiveCorrect',
      sessions: '++id, date, isPassed, isMarathon',
      settings: 'key'
    });
  }
}

export const db = new VdsQuizDatabase();

// --- Helper Functions per Impostazioni Persistite ---

export async function getSetting<T>(key: keyof AppSettings, defaultValue: T): Promise<T> {
  try {
    const entry = await db.settings.get(key);
    return entry !== undefined ? (entry.value as T) : defaultValue;
  } catch (err) {
    console.error(`Errore caricamento impostazione ${key}:`, err);
    return defaultValue;
  }
}

export async function setSetting<T>(key: keyof AppSettings, value: T): Promise<void> {
  try {
    await db.settings.put({ key, value });
  } catch (err) {
    console.error(`Errore salvataggio impostazione ${key}:`, err);
  }
}

export async function getAllSettings(): Promise<AppSettings> {
  try {
    const records = await db.settings.toArray();
    const map = records.reduce((acc, curr) => {
      acc[curr.key as keyof AppSettings] = curr.value;
      return acc;
    }, {} as Partial<AppSettings>);

    return { ...DEFAULT_SETTINGS, ...map };
  } catch (err) {
    console.error('Errore caricamento tutte le impostazioni:', err);
    return DEFAULT_SETTINGS;
  }
}

// --- Helper Telemetria Domande ---

export async function recordQuestionAnswer(questionId: number, isCorrect: boolean): Promise<void> {
  const existing = await db.stats.get(questionId);
  const now = Date.now();

  if (!existing) {
    await db.stats.put({
      questionId,
      timesSeen: 1,
      timesCorrect: isCorrect ? 1 : 0,
      timesWrong: isCorrect ? 0 : 1,
      lastAnsweredAt: now,
      lastResult: isCorrect ? 'correct' : 'wrong',
      consecutiveCorrect: isCorrect ? 1 : 0,
      isBookmarked: false,
    });
  } else {
    await db.stats.update(questionId, {
      timesSeen: existing.timesSeen + 1,
      timesCorrect: isCorrect ? existing.timesCorrect + 1 : existing.timesCorrect,
      timesWrong: isCorrect ? existing.timesWrong : existing.timesWrong + 1,
      lastAnsweredAt: now,
      lastResult: isCorrect ? 'correct' : 'wrong',
      consecutiveCorrect: isCorrect ? existing.consecutiveCorrect + 1 : 0,
    });
  }
}

export async function toggleQuestionBookmark(questionId: number): Promise<boolean> {
  const existing = await db.stats.get(questionId);
  if (!existing) {
    await db.stats.put({
      questionId,
      timesSeen: 0,
      timesCorrect: 0,
      timesWrong: 0,
      consecutiveCorrect: 0,
      isBookmarked: true,
    });
    return true;
  } else {
    const newState = !existing.isBookmarked;
    await db.stats.update(questionId, { isBookmarked: newState });
    return newState;
  }
}

export async function saveQuestionNote(questionId: number, note: string): Promise<void> {
  const existing = await db.stats.get(questionId);
  if (!existing) {
    await db.stats.put({
      questionId,
      timesSeen: 0,
      timesCorrect: 0,
      timesWrong: 0,
      consecutiveCorrect: 0,
      isBookmarked: false,
      userNote: note
    });
  } else {
    await db.stats.update(questionId, { userNote: note });
  }
}

// --- Export & Import Completo per Google Drive ---

export async function exportDatabaseBackup(): Promise<string> {
  const stats = await db.stats.toArray();
  const sessions = await db.sessions.toArray();
  const settings = await db.settings.toArray();

  const backupData = {
    version: 1,
    exportedAt: Date.now(),
    stats,
    sessions,
    settings
  };

  return JSON.stringify(backupData, null, 2);
}

export async function importDatabaseBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.stats)) {
      return { success: false, message: 'Formato backup non valido' };
    }

    await db.transaction('rw', db.stats, db.sessions, db.settings, async () => {
      if (data.stats && data.stats.length > 0) {
        await db.stats.bulkPut(data.stats);
      }
      if (data.sessions && data.sessions.length > 0) {
        await db.sessions.bulkPut(data.sessions);
      }
      if (data.settings && data.settings.length > 0) {
        await db.settings.bulkPut(data.settings);
      }
    });

    return { success: true, message: 'Dati ripristinati con successo' };
  } catch (err) {
    return { success: false, message: `Errore ripristino: ${err}` };
  }
}
