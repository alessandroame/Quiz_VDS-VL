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
import { telemetry } from '../services/telemetry';
import type { StudyModeType } from '../types/telemetry';

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
  toggleDriveMode: (context?: DriveModeSessionContext) => void;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  recordAnswer: (
    questionId: number,
    isCorrect: boolean,
    selectedOption?: 1 | 2 | 3,
    mode?: StudyModeType
  ) => Promise<void>;
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

  // Monitora e traccia l'evoluzione della prontezza all'esame
  const prevReadinessRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevReadinessRef.current === null) {
      prevReadinessRef.current = readinessScore;
      return;
    }

    if (prevReadinessRef.current !== readinessScore) {
      const prev = prevReadinessRef.current;
      const delta = readinessScore - prev;
      prevReadinessRef.current = readinessScore;

      const activeStats = statsList.filter(s => filteredQuestionIdSet.has(s.questionId));
      const correctCount = activeStats.filter(s => s.lastResult === 'correct').length;
      const accuracyPct = totalSeen > 0 ? Math.round((correctCount / totalSeen) * 100) : 0;
      const coveragePct = filteredQuestions.length > 0 ? Math.round((totalSeen / filteredQuestions.length) * 100) : 0;
      const recent = sessions.slice(0, 3);
      const passRatePct = recent.length > 0 ? Math.round((recent.filter(s => s.isPassed).length / recent.length) * 100) : 0;

      telemetry.trackReadinessScoreUpdated({
        readiness_score: readinessScore,
        previous_readiness_score: prev,
        delta,
        coverage_pct: coveragePct,
        accuracy_pct: accuracyPct,
        exam_pass_rate_pct: passRatePct,
        total_seen: totalSeen,
        total_catalog: filteredQuestions.length,
        total_mistakes: mistakesCount,
        trigger: isExamRunning ? 'exam_completed' : 'question_answered',
      });
    }
  }, [readinessScore, totalSeen, filteredQuestions.length, mistakesCount, sessions, statsList, filteredQuestionIdSet, isExamRunning]);

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    await setSetting(key, value);
    if (key === 'autoSyncDrive') {
      syncEngine.setAutoSyncEnabled(Boolean(value));
    } else {
      syncEngine.schedulePush();
    }
  };

  const recordAnswer = async (
    questionId: number,
    isCorrect: boolean,
    selectedOption?: 1 | 2 | 3,
    mode?: StudyModeType
  ) => {
    await recordQuestionAnswer(questionId, isCorrect);
    syncEngine.schedulePush();

    const q = questions.find(item => item.id === questionId);
    if (q) {
      telemetry.trackQuestionAnswered({
        question_id: questionId,
        subject_id: q.subjectId,
        subject_name: q.subjectName,
        is_correct: isCorrect,
        selected_option: selectedOption || (isCorrect ? q.correctAnswer : (((q.correctAnswer % 3) + 1) as 1 | 2 | 3)),
        correct_option: q.correctAnswer,
        mode: mode || 'topics'
      });
    }
  };

  const openDriveMode = useCallback((context?: DriveModeSessionContext) => {
    let targetContext = context ?? activeAudioSessionContextRef.current;
    if (!targetContext && filteredQuestions.length > 0) {
      targetContext = {
        questions: filteredQuestions,
        currentIndex: 0,
        answers: {},
        flags: {},
        onAnswer: (qid, ans) => {
          const q = filteredQuestions.find(item => item.id === qid);
          if (q) recordAnswer(qid, q.correctAnswer === ans, ans, 'topics');
        },
        onToggleFlag: () => {},
        onNavigateIndex: () => {},
        title: 'Radio Quiz'
      };
    }
    setDriveSessionContext(targetContext || null);
    setIsDriveModeOpen(true);
    telemetry.trackStudyModeEntered({ mode: 'audio_mode' });

    // Directly start speech within the user click gesture to satisfy browser autoplay policies
    if (targetContext && targetContext.questions && targetContext.questions.length > 0) {
      const q = targetContext.questions[targetContext.currentIndex || 0];
      if (q) {
        voiceService.playFullSequence(q.id);
      }
    }
  }, [filteredQuestions, recordAnswer]);

  const closeDriveMode = useCallback(() => {
    voiceService.stop();
    setIsDriveModeOpen(false);
    setDriveSessionContext(null);
  }, []);

  const toggleDriveMode = useCallback((context?: DriveModeSessionContext) => {
    if (isDriveModeOpen) {
      voiceService.stop();
      setIsDriveModeOpen(false);
      setDriveSessionContext(null);
    } else {
      let targetContext = context ?? activeAudioSessionContextRef.current;
      if (!targetContext && filteredQuestions.length > 0) {
        targetContext = {
          questions: filteredQuestions,
          currentIndex: 0,
          answers: {},
          flags: {},
          onAnswer: (qid, ans) => {
            const q = filteredQuestions.find(item => item.id === qid);
            if (q) recordAnswer(qid, q.correctAnswer === ans, ans, 'topics');
          },
          onToggleFlag: () => {},
          onNavigateIndex: () => {},
          title: 'Radio Quiz'
        };
      }
      setDriveSessionContext(targetContext || null);
      setIsDriveModeOpen(true);
      telemetry.trackStudyModeEntered({ mode: 'audio_mode' });

      // Directly start speech within the user click gesture to satisfy browser autoplay policies
      if (targetContext && targetContext.questions && targetContext.questions.length > 0) {
        const q = targetContext.questions[targetContext.currentIndex || 0];
        if (q) {
          voiceService.playFullSequence(q.id);
        }
      }
    }
  }, [isDriveModeOpen, filteredQuestions, recordAnswer]);

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

    // Telemetry: macro exam outcome
    let worstSubjectId: number | undefined;
    let worstSubjectName: string | undefined;
    let worstAccuracy = 1.0;
    if (session.subjectBreakdown) {
      for (const [subjIdStr, data] of Object.entries(session.subjectBreakdown)) {
        if (data.total > 0) {
          const acc = data.correct / data.total;
          if (acc < worstAccuracy) {
            worstAccuracy = acc;
            worstSubjectId = Number(subjIdStr);
          }
        }
      }
    }
    if (worstSubjectId) {
      const q = questions.find(item => item.subjectId === worstSubjectId);
      worstSubjectName = q?.subjectName;
    }

    telemetry.trackExamCompleted({
      mode: session.examMode || (session.isMarathon ? 'marathon' : 'official'),
      is_passed: session.isPassed,
      score: session.correctAnswers,
      errors_count: session.wrongAnswers,
      duration_seconds: session.durationSeconds,
      worst_subject_id: worstSubjectId,
      worst_subject_name: worstSubjectName,
      is_marathon: session.isMarathon,
      readiness_score: readinessScore,
    });

    // Telemetry: individual question answers for exam mode
    for (const snap of session.snapshots) {
      if (snap.userAnswer !== undefined) {
        const q = questions.find(item => item.id === snap.questionId);
        if (q) {
          telemetry.trackQuestionAnswered({
            question_id: snap.questionId,
            subject_id: q.subjectId,
            subject_name: q.subjectName,
            is_correct: snap.isCorrect,
            selected_option: snap.userAnswer,
            correct_option: snap.correctAnswer,
            mode: session.examMode === 'tutor' ? 'tutor_exam' : 'official_exam'
          });
        }
      }
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
        toggleDriveMode,
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
