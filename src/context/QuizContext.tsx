import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import questionsData from '../data/questions.json';
import type { Question } from '../types/quiz';
import type { QuestionStat, ExamSession, AppSettings } from '../types/database';
import { voiceService } from '../services/voiceService';
import {
  db,
  DEFAULT_SETTINGS,
  recordQuestionAnswer,
  toggleQuestionBookmark,
  saveQuestionNote,
  setSetting
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
  };

  const recordAnswer = async (questionId: number, isCorrect: boolean) => {
    await recordQuestionAnswer(questionId, isCorrect);
  };

  const toggleBookmark = async (questionId: number) => {
    return await toggleQuestionBookmark(questionId);
  };

  const saveNote = async (questionId: number, note: string) => {
    await saveQuestionNote(questionId, note);
  };

  const saveExam = async (session: ExamSession): Promise<number> => {
    return await db.sessions.add(session);
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
        subjectsAnalytics
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
