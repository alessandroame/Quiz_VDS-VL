import React, { createContext, useContext, useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import questionsData from '../data/questions.json';
import type { Question, Discipline } from '../types/quiz';
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
  activeAudioSessionContext: DriveModeSessionContext | null;
  registerAudioSessionContext: (context: DriveModeSessionContext | null) => void;
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
  syncNow: (interactive?: boolean) => Promise<{ success: boolean; message: string }>;
  disciplineFilter: Discipline;
  setDisciplineFilter: (discipline: Discipline) => Promise<void>;
  filteredQuestions: Question[];
  isSettingsLoaded: boolean;
}

const QuizContext = createContext<QuizContextType | null>(null);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Fixed stable pool: 474 paraglider questions (428 common + 46 paraglider, pruning 30 exclusive hang-glider questions)
  const questions: Question[] = useMemo(() => {
    return (questionsData as Question[]).filter(q => q.discipline !== 'hang_glider');
  }, []);
  const [isExamRunning, setIsExamRunning] = useState<boolean>(false);
  const [isDriveModeOpen, setIsDriveModeOpen] = useState<boolean>(false);
  const [driveSessionContext, setDriveSessionContext] = useState<DriveModeSessionContext | null>(null);
  const activeAudioSessionContextRef = useRef<DriveModeSessionContext | null>(null);

  const registerAudioSessionContext = useCallback((context: DriveModeSessionContext | null) => {
    activeAudioSessionContextRef.current = context;
  }, []);

  const openDriveMode = useCallback((context?: DriveModeSessionContext) => {
    const targetContext = context ?? activeAudioSessionContextRef.current;
    setDriveSessionContext(targetContext || null);
    setIsDriveModeOpen(true);
  }, []);

  const closeDriveMode = useCallback(() => {
    voiceService.stop();
    setIsDriveModeOpen(false);
    setDriveSessionContext(null);
  }, []);

  // Reattività istantanea con Dexie live queries
  const statsList = useLiveQuery(() => db.stats.toArray(), []) || [];
  const sessions = useLiveQuery(() => db.sessions.orderBy('date').reverse().toArray(), []) || [];
  const rawSettings = useLiveQuery(() => db.settings.toArray(), []);
  const settingsList = rawSettings || [];
  const isSettingsLoaded = rawSettings !== undefined;
  const activeSessionEntry = useLiveQuery(() => db.settings.get('activeSession'), []);
  const [isLocallyDismissed, setIsLocallyDismissed] = useState(false);

  useEffect(() => {
    if (!activeSessionEntry?.value) {
      setIsLocallyDismissed(false);
    }
  }, [activeSessionEntry]);

  const activeSession = useMemo<InProgressSession | null>(() => {
    if (isLocallyDismissed) return null;
    return (activeSessionEntry?.value as InProgressSession) || null;
  }, [activeSessionEntry, isLocallyDismissed]);

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

  // Backward-compatible discipline filter, permanently fixed to paraglider (474 questions)
  const disciplineFilter: Discipline = 'paraglider';

  const setDisciplineFilter = async (discipline: Discipline) => {
    await updateSetting('disciplinePreference', discipline);
  };

  const filteredQuestions = questions;

  const filteredQuestionIdSet = useMemo(() => {
    return new Set(filteredQuestions.map(q => q.id));
  }, [filteredQuestions]);

  // Metriche aggregate (calcolate sui quiz della disciplina attiva)
  const totalSeen = useMemo(() => {
    return statsList.filter(s => filteredQuestionIdSet.has(s.questionId) && s.timesSeen > 0).length;
  }, [statsList, filteredQuestionIdSet]);

  const mistakesCount = useMemo(() => {
    const filteredStats = statsList.filter(s => filteredQuestionIdSet.has(s.questionId));
    return calculateMistakesCount(filteredStats);
  }, [statsList, filteredQuestionIdSet]);

  const bookmarksCount = useMemo(() => {
    return statsList.filter(s => filteredQuestionIdSet.has(s.questionId) && s.isBookmarked).length;
  }, [statsList, filteredQuestionIdSet]);

  // Statistiche per materia
  const subjectsAnalytics = useMemo<SubjectAnalytics[]>(() => {
    return calculateSubjectAnalytics(filteredQuestions, statsMap);
  }, [filteredQuestions, statsMap]);

  // Indice di prontezza all'esame (0 - 100%)
  const readinessScore = useMemo(() => {
    const activeStats = statsList.filter(s => filteredQuestionIdSet.has(s.questionId));
    return calculateReadinessScore(filteredQuestions.length, totalSeen, activeStats, sessions);
  }, [filteredQuestions.length, totalSeen, statsList, filteredQuestionIdSet, sessions]);

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
    setIsLocallyDismissed(false);
    await saveActiveSession(session);
    syncEngine.schedulePush();
  };

  const dismissActiveSession = async () => {
    voiceService.stop();
    setIsLocallyDismissed(true);
    await clearActiveSession();
    syncEngine.schedulePush();
  };

  const syncNow = async (interactive = true) => {
    return await syncEngine.fullSync(interactive);
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
        activeAudioSessionContext: activeAudioSessionContextRef.current,
        registerAudioSessionContext,
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
        syncNow,
        disciplineFilter,
        setDisciplineFilter,
        filteredQuestions,
        isSettingsLoaded
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
