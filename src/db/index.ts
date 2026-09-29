import Dexie, { type Table } from 'dexie';
import type {
  QuestionStat,
  ExamSession,
  AppSettings,
  InProgressSession,
  BackupDataPayload
} from '../types/database';
import { smartMergeBackups, type SmartMergeResult } from '../services/smartMerge';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  examTimerMinutes: 45,
  immediateFeedbackInTopics: true,
  soundEnabled: true,
  hapticEnabled: true,
  googleClientId: '',
  autoSyncDrive: false,
  ttsEnabled: true,
  ttsVoice: 'giuseppe',
  ttsAutoExplainOnMistake: true,
  ttsAutoPlayQuestion: false,
  ttsPlaybackRate: 1.0,
  driveModeAutopilot: true,
  driveModeAutoAdvanceSeconds: 5,
  driveModeVoiceCommands: false,
  driveModeIntroPlayed: false,
  audioOfflinePromptDismissed: false,
  driveModeTutor: false,
  disciplinePreference: 'paraglider',
  disciplineOnboardingDone: true,
  audioAutoUpdateOnline: true,
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
  const trimmed = note.trim();
  const valueToSave = trimmed.length > 0 ? trimmed : undefined;

  if (!existing) {
    if (!valueToSave) return;
    await db.stats.put({
      questionId,
      timesSeen: 0,
      timesCorrect: 0,
      timesWrong: 0,
      consecutiveCorrect: 0,
      isBookmarked: false,
      userNote: valueToSave
    });
  } else {
    await db.stats.update(questionId, { userNote: valueToSave });
  }
}

// --- Active In-Progress Study Session Persistence ---

export async function saveActiveSession(session: InProgressSession): Promise<void> {
  try {
    await db.settings.put({ key: 'activeSession', value: session });
  } catch (err) {
    console.error('Error saving activeSession to db:', err);
  }
}

export async function getActiveSession(): Promise<InProgressSession | null> {
  try {
    const entry = await db.settings.get('activeSession');
    return entry ? (entry.value as InProgressSession) : null;
  } catch (err) {
    console.error('Error fetching activeSession from db:', err);
    return null;
  }
}

export async function clearActiveSession(): Promise<void> {
  try {
    await db.settings.delete('activeSession');
  } catch (err) {
    console.error('Error clearing activeSession from db:', err);
  }
}

// --- Export & Import with Smart Merge for Cloud & Local Backups ---

export async function exportDatabaseBackup(): Promise<string> {
  const stats = await db.stats.toArray();
  const sessions = await db.sessions.toArray();
  const settings = await db.settings.toArray();
  const activeSession = await getActiveSession();

  const filteredSettings = settings.filter(s => s.key !== 'activeSession');

  const backupData: BackupDataPayload = {
    version: 2,
    exportedAt: Date.now(),
    stats,
    sessions,
    settings: filteredSettings,
    activeSession: activeSession || null
  };

  return JSON.stringify(backupData, null, 2);
}

export async function importDatabaseBackup(
  jsonString: string
): Promise<{ success: boolean; message: string; mergeResult?: SmartMergeResult }> {
  try {
    const data = JSON.parse(jsonString) as BackupDataPayload;
    if (!data || !Array.isArray(data.stats)) {
      return { success: false, message: 'Formato backup non valido' };
    }

    const localStats = await db.stats.toArray();
    const localSessions = await db.sessions.toArray();
    const localSettings = await db.settings.toArray();
    const localActive = await getActiveSession();

    const localPayload: BackupDataPayload = {
      version: 2,
      exportedAt: Date.now(),
      stats: localStats,
      sessions: localSessions,
      settings: localSettings.filter(s => s.key !== 'activeSession'),
      activeSession: localActive
    };

    const merged = smartMergeBackups(localPayload, data);

    await db.transaction('rw', db.stats, db.sessions, db.settings, async () => {
      await db.stats.clear();
      if (merged.stats.length > 0) {
        await db.stats.bulkPut(merged.stats);
      }

      await db.sessions.clear();
      if (merged.sessions.length > 0) {
        await db.sessions.bulkPut(merged.sessions);
      }

      if (merged.settings.length > 0) {
        await db.settings.bulkPut(merged.settings);
      }

      if (merged.activeSession) {
        await db.settings.put({ key: 'activeSession', value: merged.activeSession });
      } else {
        await db.settings.delete('activeSession');
      }
    });

    return {
      success: true,
      message: `Dati sincronizzati con successo (${merged.summary.mergedStatsCount} quiz, ${merged.summary.totalSessionsCount} sessioni)`,
      mergeResult: merged
    };
  } catch (err: any) {
    return { success: false, message: `Errore ripristino: ${err?.message || err}` };
  }
}
