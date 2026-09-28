import type {
  QuestionStat,
  ExamSession,
  InProgressSession,
  BackupDataPayload
} from '../types/database';

export interface SmartMergeResult {
  stats: QuestionStat[];
  sessions: ExamSession[];
  settings: Array<{ key: string; value: any }>;
  activeSession: InProgressSession | null;
  summary: {
    mergedStatsCount: number;
    addedSessionsCount: number;
    totalSessionsCount: number;
    hasActiveSession: boolean;
  };
}

const DEFAULT_MAX_ACTIVE_SESSION_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Merges two sets of question statistics deterministically.
 * Resolves conflicts by timestamp (lastAnsweredAt) for learning state (consecutive streaks, last result),
 * and takes monotonic maximums for cumulative counters to prevent regression.
 */
export function mergeQuestionStats(
  localStats: QuestionStat[],
  incomingStats: QuestionStat[]
): QuestionStat[] {
  const mergedMap = new Map<number, QuestionStat>();

  for (const stat of localStats) {
    mergedMap.set(stat.questionId, { ...stat });
  }

  for (const incoming of incomingStats) {
    const local = mergedMap.get(incoming.questionId);

    if (!local) {
      mergedMap.set(incoming.questionId, { ...incoming });
      continue;
    }

    const localLast = local.lastAnsweredAt || 0;
    const incomingLast = incoming.lastAnsweredAt || 0;

    const timesCorrect = Math.max(local.timesCorrect || 0, incoming.timesCorrect || 0);
    const timesWrong = Math.max(local.timesWrong || 0, incoming.timesWrong || 0);
    const timesSeen = Math.max(local.timesSeen || 0, incoming.timesSeen || 0, timesCorrect + timesWrong);

    let lastResult = local.lastResult;
    let consecutiveCorrect = local.consecutiveCorrect || 0;
    let lastAnsweredAt = local.lastAnsweredAt;
    let isBookmarked = local.isBookmarked;

    if (incomingLast > localLast) {
      lastResult = incoming.lastResult ?? local.lastResult;
      consecutiveCorrect = incoming.consecutiveCorrect ?? local.consecutiveCorrect;
      lastAnsweredAt = incoming.lastAnsweredAt;
      isBookmarked = incoming.isBookmarked;
    } else if (incomingLast === localLast) {
      lastResult = local.lastResult || incoming.lastResult;
      consecutiveCorrect = Math.max(local.consecutiveCorrect || 0, incoming.consecutiveCorrect || 0);
      lastAnsweredAt = local.lastAnsweredAt || incoming.lastAnsweredAt;
      isBookmarked = Boolean(local.isBookmarked || incoming.isBookmarked);
    }

    // Resolve notes: prioritize non-empty note, or newer note if both present
    let userNote: string | undefined = undefined;
    const localNote = local.userNote?.trim();
    const incomingNote = incoming.userNote?.trim();

    if (localNote && incomingNote) {
      userNote = incomingLast > localLast ? incomingNote : localNote;
    } else if (localNote) {
      userNote = localNote;
    } else if (incomingNote) {
      userNote = incomingNote;
    }

    mergedMap.set(incoming.questionId, {
      questionId: incoming.questionId,
      timesSeen,
      timesCorrect,
      timesWrong,
      lastAnsweredAt: lastAnsweredAt ? lastAnsweredAt : undefined,
      lastResult,
      consecutiveCorrect,
      isBookmarked,
      userNote: userNote || undefined
    });
  }

  return Array.from(mergedMap.values()).sort((a, b) => a.questionId - b.questionId);
}

/**
 * Merges exam sessions from two sources without data loss.
 * Deduplicates sessions by business key: timestamp + duration + question counts.
 */
export function mergeExamSessions(
  localSessions: ExamSession[],
  incomingSessions: ExamSession[]
): { sessions: ExamSession[]; addedCount: number } {
  const getSessionKey = (s: ExamSession): string =>
    `${s.date}_${s.durationSeconds}_${s.totalQuestions}_${s.correctAnswers}_${s.wrongAnswers}`;

  const sessionMap = new Map<string, ExamSession>();
  let addedCount = 0;

  for (const session of localSessions) {
    sessionMap.set(getSessionKey(session), session);
  }

  for (const incoming of incomingSessions) {
    const key = getSessionKey(incoming);
    if (!sessionMap.has(key)) {
      // New session from another device: remove existing local auto-increment id
      const { id, ...sessionWithoutId } = incoming;
      sessionMap.set(key, sessionWithoutId as ExamSession);
      addedCount++;
    }
  }

  const merged = Array.from(sessionMap.values()).sort((a, b) => a.date - b.date);
  return { sessions: merged, addedCount };
}

/**
 * Merges settings entries, keeping the most relevant configuration.
 */
export function mergeSettings(
  localSettings: Array<{ key: string; value: any }>,
  incomingSettings: Array<{ key: string; value: any }>
): Array<{ key: string; value: any }> {
  const settingsMap = new Map<string, any>();

  for (const item of localSettings) {
    settingsMap.set(item.key, item.value);
  }

  for (const item of incomingSettings) {
    if (!settingsMap.has(item.key)) {
      settingsMap.set(item.key, item.value);
    } else {
      // For timestamps, take latest
      if (item.key === 'lastDriveSyncAt') {
        const localVal = Number(settingsMap.get(item.key)) || 0;
        const incomingVal = Number(item.value) || 0;
        settingsMap.set(item.key, Math.max(localVal, incomingVal));
      } else {
        // By default, incoming settings override if present
        settingsMap.set(item.key, item.value);
      }
    }
  }

  return Array.from(settingsMap.entries()).map(([key, value]) => ({ key, value }));
}

/**
 * Merges active in-progress sessions.
 * Prefers the most recent session, provided it has not expired.
 */
export function mergeActiveSession(
  localSession: InProgressSession | null | undefined,
  incomingSession: InProgressSession | null | undefined,
  maxAgeMs = DEFAULT_MAX_ACTIVE_SESSION_AGE_MS,
  now = Date.now()
): InProgressSession | null {
  const isFresh = (s?: InProgressSession | null): s is InProgressSession =>
    Boolean(s && s.updatedAt && now - s.updatedAt <= maxAgeMs);

  const localValid = isFresh(localSession);
  const incomingValid = isFresh(incomingSession);

  if (localValid && incomingValid) {
    return incomingSession.updatedAt >= localSession.updatedAt
      ? incomingSession
      : localSession;
  }

  if (incomingValid) return incomingSession;
  if (localValid) return localSession;

  return null;
}

/**
 * Main coordinator for smart merging an incoming backup payload with local database data.
 */
export function smartMergeBackups(
  local: BackupDataPayload,
  incoming: BackupDataPayload,
  maxActiveSessionAgeMs = DEFAULT_MAX_ACTIVE_SESSION_AGE_MS
): SmartMergeResult {
  if (!incoming || !Array.isArray(incoming.stats)) {
    throw new Error('Invalid incoming backup data: stats array is required');
  }

  const mergedStats = mergeQuestionStats(local.stats || [], incoming.stats || []);
  const { sessions: mergedSessions, addedCount: addedSessionsCount } = mergeExamSessions(
    local.sessions || [],
    incoming.sessions || []
  );
  const mergedSettings = mergeSettings(local.settings || [], incoming.settings || []);
  const mergedActiveSession = mergeActiveSession(
    local.activeSession,
    incoming.activeSession,
    maxActiveSessionAgeMs
  );

  return {
    stats: mergedStats,
    sessions: mergedSessions,
    settings: mergedSettings,
    activeSession: mergedActiveSession,
    summary: {
      mergedStatsCount: mergedStats.length,
      addedSessionsCount,
      totalSessionsCount: mergedSessions.length,
      hasActiveSession: mergedActiveSession !== null
    }
  };
}
