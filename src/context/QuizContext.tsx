import React, { createContext, useContext, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import questionsData from '../data/questions.json';
import type { Question } from '../types/quiz';
import type { QuestionStat, ExamSession, AppSettings } from '../types/database';
import {
  db,
  DEFAULT_SETTINGS,
  recordQuestionAnswer,
  toggleQuestionBookmark,
  saveQuestionNote,
  setSetting
} from '../db';

export interface SubjectAnalytics {
  id: number;
  name: string;
  total: number;
  seen: number;
  correct: number;
  accuracy: number;
}

interface QuizContextType {
  questions: Question[];
  statsMap: Map<number, QuestionStat>;
  sessions: ExamSession[];
  settings: AppSettings;
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
    // Entra nel quaderno errori se l'ultima risposta è errata o se ha errori e non ha ancora 2 successi consecutivi
    return statsList.filter(s => s.timesWrong > 0 && s.consecutiveCorrect < 2).length;
  }, [statsList]);

  const bookmarksCount = useMemo(() => {
    return statsList.filter(s => s.isBookmarked).length;
  }, [statsList]);

  // Statistiche per materia
  const subjectsAnalytics = useMemo<SubjectAnalytics[]>(() => {
    const subjectMap: Record<number, { name: string; total: number; seen: number; correct: number }> = {};

    for (const q of questions) {
      if (!subjectMap[q.subjectId]) {
        subjectMap[q.subjectId] = { name: q.subjectName, total: 0, seen: 0, correct: 0 };
      }
      subjectMap[q.subjectId].total++;

      const stat = statsMap.get(q.id);
      if (stat && stat.timesSeen > 0) {
        subjectMap[q.subjectId].seen++;
        if (stat.lastResult === 'correct') {
          subjectMap[q.subjectId].correct++;
        }
      }
    }

    return Object.entries(subjectMap).map(([idStr, val]) => {
      const id = Number(idStr);
      const accuracy = val.seen > 0 ? Math.round((val.correct / val.seen) * 100) : 0;
      return {
        id,
        name: val.name,
        total: val.total,
        seen: val.seen,
        correct: val.correct,
        accuracy
      };
    });
  }, [questions, statsMap]);

  // Indice di prontezza all'esame (0 - 100%)
  const readinessScore = useMemo(() => {
    if (questions.length === 0) return 0;

    // Componente 1: Copertura catalogo (peso 35%)
    const coverage = totalSeen / questions.length;

    // Componente 2: Accuratezza generale sulle viste (peso 35%)
    const correctCount = statsList.filter(s => s.lastResult === 'correct').length;
    const accuracy = totalSeen > 0 ? correctCount / totalSeen : 0;

    // Componente 3: Media ultime 3 simulazioni (peso 30%)
    let examScoreFactor = 0;
    if (sessions.length > 0) {
      const recent = sessions.slice(0, 3);
      const passedCount = recent.filter(s => s.isPassed).length;
      examScoreFactor = passedCount / recent.length;
    }

    const calculated = Math.round((coverage * 0.35 + accuracy * 0.35 + examScoreFactor * 0.3) * 100);
    return Math.min(100, Math.max(0, calculated));
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
