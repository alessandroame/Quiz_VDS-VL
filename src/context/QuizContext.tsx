import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import questionsData from '../data/questions.json';
import type { Question } from '../types/quiz';
import type { QuestionStat, ExamSession, AppSettings, InProgressSession } from '../types/database';
import { voiceService } from '../services/voiceService';
import { syncEngine, type SyncEngineState } from '../services/syncEngine';
import {
  db,
  DEFAULT_SETTINGS,
  recordQuestionAnswer,
  toggleQuestionBookmark,
  saveQuestionNote,
  setSetting,
  saveActiveSession,
  clearActiveSession
} from '../db';
import type { DriveModeSessionContext } from '../components/DriveModeScreen';
import {
  type SubjectAnalytics,
  calculateMistakesCount,
  calculateSubjectAnalytics,
  calculateReadinessScore
} from '../utils/analytics';

export type { SubjectAnalytics };

interface QuizContextType {
  questions: Question[];
  statsMap: Map<number, QuestionStat>;
  sessions: ExamSession[];
  settings: AppSettings;
  isExamRunning: boolean;
  setIsExamRunning: (running: boolean) => void;
  isDriveModeOpen: boolean;
  driveSessionContext: DriveModeSessionContext | null;
  openDriveMode: (context?: DriveModeSessionContext) => void;
  closeDriveMode: () => void;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  recordAnswer: (questionId: number, isCorrect: boolean) => Promise<void>;
  toggleBookmark: (questionId: number) => Promise<boolean>;
  saveNote: (questionId: number, note: string) => Promise<void>;
  saveExam: (session: ExamSession) => Promise<number>;
  totalSeen: number;
  readinessScore: number;
  mistakesCount: number;
  bookmarksCount: number;
  subjectsAnalytics: SubjectAnalytics[];
  activeSession: InProgressSession | null;
  persistActiveSession: (session: InProgressSession) => Promise<void>;
  dismissActiveSession: () => Promise<void>;
  syncState: SyncEngineState;
  syncNow: () => Promise<{ success: boolean; message: string }>;
}

const QuizContext = createContext<QuizContextType | null>(null);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const questions: Question[] = questionsData as Question[];
  const [isExamRunning, setIsExamRunning] = useState<boolean>(false);
  const [isDriveModeOpen, setIsDriveModeOpen] = useState<boolean>(false);
  const [driveSessionContext, setDriveSessionContext] = useState<DriveModeSessionContext | null>(null);

  const openDriveMode = (context?: DriveModeSessionContext) => {
    setDriveSessionContext(context || null);
    setIsDriveModeOpen(true);
  };

  const closeDriveMode = () => {
    setIsDriveModeOpen(false);
    setDriveSessionContext(null);
  };

  // Reattività istantanea con Dexie live queries
  const statsList = useLiveQuery(() => db.stats.toArray(), []) || [];
  const sessions = useLiveQuery(() => db.sessions.orderBy('date').reverse().toArray(), []) || [];
  const settingsList = useLiveQuery(() => db.settings.toArray(), []) || [];
  const activeSessionEntry = useLiveQuery(() => db.settings.get('activeSession'), []);

  const activeSession = useMemo<InProgressSession | null>(() => {
    return (activeSessionEntry?.value as InProgressSession) || null;
  }, [activeSessionEntry]);

  const [syncState, setSyncState] = useState<SyncEngineState>(syncEngine.getState());

  useEffect(() => {
    const unsub = syncEngine.subscribe(setSyncState);
    syncEngine.init();
    return unsub;
  }, []);

  const settings = useMemo(() => {
    const map = settingsList.reduce((acc, curr) => {
      acc[curr.key as keyof AppSettings] = curr.value;
      return acc;
    }, {} as Partial<AppSettings>);
    return { ...DEFAULT_SETTINGS, ...map };
  }, [settingsList]);

  useEffect(() => {
    voiceService.setPlaybackRate(settings.ttsPlaybackRate || 1.0);
    voiceService.setVoice(settings.ttsVoice || 'giuseppe');
  }, [settings.ttsPlaybackRate, settings.ttsVoice]);

  const statsMap = useMemo(() => {
    const map = new Map<number, QuestionStat>();
    for (const s of statsList) {
      map.set(s.questionId, s);
    }
    return map;
  }, [statsList]);

  // Metriche aggregate
  const totalSeen = useMemo(() => {
    return statsList.filter(s => s.timesSeen > 0).length;
  }, [statsList]);

  const mistakesCount = useMemo(() => {
    return calculateMistakesCount(statsList);
  }, [statsList]);

  const bookmarksCount = useMemo(() => {
    return statsList.filter(s => s.isBookmarked).length;
  }, [statsList]);

  // Statistiche per materia
  const subjectsAnalytics = useMemo<SubjectAnalytics[]>(() => {
    return calculateSubjectAnalytics(questions, statsMap);
  }, [questions, statsMap]);

  // Indice di prontezza all'esame (0 - 100%)
  const readinessScore = useMemo(() => {
    return calculateReadinessScore(questions.length, totalSeen, statsList, sessions);
  }, [questions.length, totalSeen, statsList, sessions]);

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    await setSetting(key, value);
    if (key === 'autoSyncDrive') {
      syncEngine.setAutoSyncEnabled(Boolean(value));
    } else {
      syncEngine.schedulePush();
    }
  };

  const recordAnswer = async (questionId: number, isCorrect: boolean) => {
    await recordQuestionAnswer(questionId, isCorrect);
    syncEngine.schedulePush();
  };

  const toggleBookmark = async (questionId: number) => {
    const res = await toggleQuestionBookmark(questionId);
    syncEngine.schedulePush();
    return res;
  };

  const saveNote = async (questionId: number, note: string) => {
    await saveQuestionNote(questionId, note);
    syncEngine.schedulePush();
  };

  const saveExam = async (session: ExamSession): Promise<number> => {
    const id = await db.sessions.add(session);
    await clearActiveSession();
    if (syncEngine.getState().isAutoSyncEnabled) {
      syncEngine.pushNow().catch(() => {});
    }
    return id;
  };

  const persistActiveSession = async (session: InProgressSession) => {
    await saveActiveSession(session);
    syncEngine.schedulePush();
  };

  const dismissActiveSession = async () => {
    await clearActiveSession();
    syncEngine.schedulePush();
  };

  const syncNow = async () => {
    return await syncEngine.fullSync();
  };

  return (
    <QuizContext.Provider
      value={{
        questions,
        statsMap,
        sessions,
        settings,
        isExamRunning,
        setIsExamRunning,
        isDriveModeOpen,
        driveSessionContext,
        openDriveMode,
        closeDriveMode,
        updateSetting,
        recordAnswer,
        toggleBookmark,
        saveNote,
        saveExam,
        totalSeen,
        readinessScore,
        mistakesCount,
        bookmarksCount,
        subjectsAnalytics,
        activeSession,
        persistActiveSession,
        dismissActiveSession,
        syncState,
        syncNow
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz deve essere usato all\'interno di QuizProvider');
  }
  return context;
};
