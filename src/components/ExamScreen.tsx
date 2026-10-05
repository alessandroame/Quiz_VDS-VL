import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Timer,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronRight,
  RotateCcw,
  ListFilter,
  BookOpen,
  Filter,
  Pause,
  Zap,
  Infinity as InfinityIcon,
  Plus
} from 'lucide-react';
import type { Question } from '../types/quiz';
import type { ExamSession, ExamModeType, TutorFormat } from '../types/database';
import { useQuiz } from '../context/QuizContext';
import { generateExamQuestions, generateFlashTutorQuestions } from '../utils/fairRandomizer';
import { evaluateExam } from '../services/examEvaluator';
import { formatTime } from '../utils/timer';
import { QuestionCard } from './QuestionCard';
import { QuestionNavigator } from './QuestionNavigator';
import { voiceService } from '../services/voiceService';
import { soundFX } from '../utils/audio';
import { QuizBottomBar } from './QuizBottomBar';
import { backNavigation } from '../utils/backNavigation';
import { SessionInterruptModal } from './SessionInterruptModal';
import { SessionConflictModal } from './SessionConflictModal';
import { telemetry } from '../services/telemetry';
import { getNextQuestionIndex } from '../utils/quizNavigation';

interface ExamScreenProps {
  initialMode?: ExamModeType;
  onNavigateHome?: () => void;
  onSwitchMode?: (mode: ExamModeType) => void;
}

export const ExamScreen: React.FC<ExamScreenProps> = ({
  initialMode = 'tutor',
  onNavigateHome,
  onSwitchMode
}) => {
  const {
    questions,
    filteredQuestions,
    statsMap,
    saveExam,
    recordAnswer,
    settings,
    setIsExamRunning,
    registerAudioSessionContext,
    activeSession,
    persistActiveSession,
    dismissActiveSession,
    readinessScore
  } = useQuiz();

  // Exam state
  const [examState, setExamState] = useState<'idle' | 'running' | 'review'>('idle');
  const [examMode, setExamMode] = useState<ExamModeType>(initialMode);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 1 | 2 | 3>>({});
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const flagsRef = useRef(flags);
  useEffect(() => {
    flagsRef.current = flags;
  }, [flags]);
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isMarathon, setIsMarathon] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showInterruptModal, setShowInterruptModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [conflictPendingMode, setConflictPendingMode] = useState<ExamModeType | null>(null);
  const [conflictPendingFormat, setConflictPendingFormat] = useState<TutorFormat | undefined>(undefined);
  const [tutorFormat, setTutorFormat] = useState<TutorFormat>(() => {
    try {
      const saved = localStorage.getItem('vds_last_tutor_format');
      if (saved === 'flash' || saved === 'standard' || saved === 'endless') {
        return saved;
      }
    } catch {
      // Storage unavailable, fallback to flash
    }
    return 'flash';
  });
  const [completedSession, setCompletedSession] = useState<ExamSession | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'flagged' | 'correct'>('all');

  // Stop any voice playback on component unmount
  useEffect(() => {
    return () => {
      voiceService.stop();
    };
  }, []);

  // Stop any voice playback when entering review/debriefing state
  useEffect(() => {
    if (examState === 'review') {
      voiceService.stop();
    }
  }, [examState]);

  // Sync examMode with initialMode prop when in idle state
  useEffect(() => {
    if (examState === 'idle') {
      setExamMode(initialMode);
    }
  }, [initialMode, examState]);

  // Track question IDs whose answers have already been recorded to prevent duplicate writes
  const recordedQuestionIds = useRef<Set<number>>(new Set());
  // Prevent auto-resume cycle after user explicitly abandons the session
  const isDismissedRef = useRef(false);

  // Sincronizza lo stato globale dell'esame attivo (per bloccare navigazione accidentale)
  useEffect(() => {
    setIsExamRunning(examState === 'running');
  }, [examState, setIsExamRunning]);

  // Cleanup all'unmount
  useEffect(() => {
    return () => {
      setIsExamRunning(false);
    };
  }, [setIsExamRunning]);

  // Gestione tasto Escape per chiudere la modale di consegna esame
  useEffect(() => {
    if (!showSubmitModal) return;
    const handleModalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSubmitModal(false);
      }
    };
    window.addEventListener('keydown', handleModalKey);
    return () => window.removeEventListener('keydown', handleModalKey);
  }, [showSubmitModal]);

  // Registra la modale di consegna con il coordinatore back navigation
  useEffect(() => {
    if (!showSubmitModal) return;
    const unregister = backNavigation.registerSubModal('exam-submit-modal', () => {
      setShowSubmitModal(false);
    });
    return () => unregister();
  }, [showSubmitModal]);

  // Auto-resume active exam if present
  useEffect(() => {
    if (isDismissedRef.current) return;
    if (examState === 'idle' && activeSession?.type === 'exam' && activeSession.questionIds?.length > 0) {
      const ordered = activeSession.questionIds
        .map(id => questions.find(q => q.id === id))
        .filter((q): q is Question => Boolean(q));

      if (ordered.length > 0) {
        const mode: ExamModeType = activeSession.examMode || (activeSession.isMarathon ? 'marathon' : 'official');
        setExamQuestions(ordered);
        setExamMode(mode);
        setCurrentIndex(Math.min(activeSession.currentIndex || 0, ordered.length - 1));
        const resumedAnswers = activeSession.answers || {};
        const resumedFlags = activeSession.flags || {};
        setAnswers(resumedAnswers);
        answersRef.current = resumedAnswers;
        setFlags(resumedFlags);
        flagsRef.current = resumedFlags;
        if (mode === 'tutor') {
          if (activeSession.tutorFormat) {
            setTutorFormat(activeSession.tutorFormat);
          }
          setElapsedSeconds(activeSession.elapsedSeconds || activeSession.secondsRemaining || 0);
        } else {
          setSecondsRemaining(activeSession.secondsRemaining || 45 * 60);
        }
        setStartTime(activeSession.startTime || Date.now());
        setIsMarathon(mode === 'marathon');
        setIsPaused(false);
        recordedQuestionIds.current = new Set(Object.keys(resumedAnswers).map(Number));
        setExamState('running');
      }
    }
  }, [activeSession, examState, questions]);

  const startExam = (mode: ExamModeType = 'tutor', format: TutorFormat = tutorFormat) => {
    isDismissedRef.current = false;
    const marathon = mode === 'marathon';
    setIsMarathon(marathon);
    setExamMode(mode);
    setTutorFormat(format);
    try {
      if (mode === 'tutor') {
        localStorage.setItem('vds_last_tutor_format', format);
      }
    } catch {
      // Storage error ignored
    }

    let generated: Question[];
    if (mode === 'tutor') {
      if (format === 'flash') {
        generated = generateFlashTutorQuestions(filteredQuestions, statsMap, 10);
      } else if (format === 'endless') {
        generated = generateFlashTutorQuestions(filteredQuestions, statsMap, filteredQuestions.length);
      } else {
        generated = generateExamQuestions(filteredQuestions, statsMap, false);
      }
    } else {
      generated = generateExamQuestions(filteredQuestions, statsMap, marathon);
    }

    setExamQuestions(generated);
    setCurrentIndex(0);
    setAnswers({});
    answersRef.current = {};
    setFlags({});
    flagsRef.current = {};
    recordedQuestionIds.current.clear();
    const totalMinutes = marathon ? 60 : settings.examTimerMinutes || 45;
    const initialSeconds = totalMinutes * 60;
    setSecondsRemaining(initialSeconds);
    setElapsedSeconds(0);
    const now = Date.now();
    setStartTime(now);
    setCompletedSession(null);
    setIsPaused(false);
    setExamState('running');

    persistActiveSession({
      type: 'exam',
      examMode: mode,
      tutorFormat: mode === 'tutor' ? format : undefined,
      questionIds: generated.map(q => q.id),
      currentIndex: 0,
      answers: {},
      flags: {},
      secondsRemaining: mode === 'tutor' ? 0 : initialSeconds,
      elapsedSeconds: 0,
      startTime: now,
      isMarathon: marathon,
      isPaused: false,
      updatedAt: now
    });

    telemetry.trackExamStarted({
      mode,
      is_marathon: marathon,
      total_questions: generated.length,
      readiness_score: readinessScore,
    });
  };

  const handleRequestStartExam = (mode: ExamModeType = 'tutor', format?: TutorFormat) => {
    const targetFormat = format || tutorFormat;
    if (activeSession && activeSession.questionIds?.length > 0 && !isDismissedRef.current) {
      setConflictPendingMode(mode);
      setConflictPendingFormat(targetFormat);
    } else {
      startExam(mode, targetFormat);
    }
  };

  const handleExtendFlashSession = () => {
    voiceService.stop();
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    const existingIds = new Set(examQuestions.map(q => q.id));
    const additionalQuestions = generateFlashTutorQuestions(filteredQuestions, statsMap, 10, existingIds);
    if (additionalQuestions.length === 0) return;

    const updatedQuestions = [...examQuestions, ...additionalQuestions];
    const nextIndex = examQuestions.length;
    setExamQuestions(updatedQuestions);
    setCurrentIndex(nextIndex);

    persistActiveSession({
      type: 'exam',
      examMode: 'tutor',
      tutorFormat: 'flash',
      questionIds: updatedQuestions.map(q => q.id),
      currentIndex: nextIndex,
      answers: answersRef.current,
      flags: flagsRef.current,
      secondsRemaining: 0,
      elapsedSeconds,
      startTime,
      isMarathon: false,
      updatedAt: Date.now()
    });
  };

  // Timer interval: count up for tutor mode (no time limit), countdown for official/marathon
  useEffect(() => {
    if (examState !== 'running' || isPaused) return;

    if (examMode === 'tutor') {
      const interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      const interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [examState, examMode, isPaused]);

  const currentQuestion = examQuestions[currentIndex];
  const totalCount = examQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flags).filter(Boolean).length;

  // Auto-advance timer ref for smooth transition on correct answers in tutor mode
  const autoAdvanceTimerRef = useRef<any>(null);

  // Clear auto-advance timer on question change or unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [currentIndex]);

  const changeIndex = (newIndex: number) => {
    voiceService.stop();
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setCurrentIndex(newIndex);
    if (examState === 'running') {
      persistActiveSession({
        type: 'exam',
        examMode,
        tutorFormat: examMode === 'tutor' ? tutorFormat : undefined,
        questionIds: examQuestions.map(q => q.id),
        currentIndex: newIndex,
        answers: answersRef.current,
        flags: flagsRef.current,
        secondsRemaining: examMode === 'tutor' ? elapsedSeconds : secondsRemaining,
        startTime,
        isMarathon,
        updatedAt: Date.now()
      });
    }
  };

  const handlePauseExamSession = () => {
    setShowInterruptModal(false);
    setShowSubmitModal(false);
    voiceService.stop();
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setIsExamRunning(false);
    persistActiveSession({
      type: 'exam',
      examMode,
      tutorFormat: examMode === 'tutor' ? tutorFormat : undefined,
      questionIds: examQuestions.map(q => q.id),
      currentIndex,
      answers: answersRef.current,
      flags: flagsRef.current,
      secondsRemaining: examMode === 'tutor' ? 0 : secondsRemaining,
      elapsedSeconds: examMode === 'tutor' ? elapsedSeconds : 0,
      startTime,
      isMarathon,
      isPaused: true,
      pausedAt: Date.now(),
      updatedAt: Date.now()
    }).catch(console.error);
    if (onNavigateHome) {
      onNavigateHome();
    }
  };

  const handleSelectAnswer = async (ans: 1 | 2 | 3, qid?: number, fromKeyboard = false) => {
    voiceService.stop();
    const targetId = qid ?? currentQuestion?.id;
    if (!targetId) return;

    // Avoid changing an answer that has already been verified
    if (answersRef.current[targetId] !== undefined) {
      return;
    }

    const updatedAnswers = { ...answersRef.current, [targetId]: ans };
    answersRef.current = updatedAnswers;
    setAnswers(updatedAnswers);

    // Record answer statistics immediately into Dexie
    const targetQ = examQuestions.find(q => q.id === targetId) || currentQuestion;
    if (targetQ) {
      const isCorrect = ans === targetQ.correctAnswer;
      try {
        await recordAnswer(targetId, isCorrect);
      } catch (err) {
        console.error(err);
      }
      recordedQuestionIds.current.add(targetId);

      // Play audio feedback for keyboard answering
      if (fromKeyboard && settings.soundEnabled) {
        if (isCorrect) soundFX.playCorrect();
        else if (examMode === 'tutor') soundFX.playWrong();
        else soundFX.playClick();
      }

      // Auto-advance on correct answer if enabled in settings
      if (
        isCorrect &&
        settings.autoAdvanceOnCorrect !== false &&
        targetId === currentQuestion?.id
      ) {
        const nextIdx = getNextQuestionIndex(currentIndex, examQuestions, updatedAnswers, { fallbackToEndIfComplete: true });
        if (nextIdx !== currentIndex) {
          if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
          autoAdvanceTimerRef.current = setTimeout(() => {
            changeIndex(nextIdx);
          }, 900);
        }
      }
    }

    persistActiveSession({
      type: 'exam',
      examMode,
      tutorFormat: examMode === 'tutor' ? tutorFormat : undefined,
      questionIds: examQuestions.map(q => q.id),
      currentIndex,
      answers: updatedAnswers,
      flags: flagsRef.current,
      secondsRemaining: examMode === 'tutor' ? elapsedSeconds : secondsRemaining,
      startTime,
      isMarathon,
      updatedAt: Date.now()
    });
  };

  const handleToggleFlag = (qid?: number) => {
    const targetId = qid ?? currentQuestion?.id;
    if (!targetId) return;
    const updatedFlags = { ...flagsRef.current, [targetId]: !flagsRef.current[targetId] };
    flagsRef.current = updatedFlags;
    setFlags(updatedFlags);

    persistActiveSession({
      type: 'exam',
      examMode,
      tutorFormat: examMode === 'tutor' ? tutorFormat : undefined,
      questionIds: examQuestions.map(q => q.id),
      currentIndex,
      answers: answersRef.current,
      flags: updatedFlags,
      secondsRemaining: examMode === 'tutor' ? elapsedSeconds : secondsRemaining,
      startTime,
      isMarathon,
      updatedAt: Date.now()
    });
  };

  // Keyboard navigation
  useEffect(() => {
    if (examState !== 'running' || !currentQuestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '1') handleSelectAnswer(1, undefined, true);
      else if (e.key === '2') handleSelectAnswer(2, undefined, true);
      else if (e.key === '3') handleSelectAnswer(3, undefined, true);
      else if (e.key.toLowerCase() === 'f') handleToggleFlag();
      else if (e.key === 'ArrowLeft' && currentIndex > 0) changeIndex(currentIndex - 1);
      else if (e.key === 'ArrowRight' && currentIndex < totalCount - 1) {
        const nextIdx = getNextQuestionIndex(currentIndex, examQuestions, answers);
        changeIndex(nextIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [examState, currentIndex, currentQuestion, totalCount, answers, flags]);

  const handleSubmitExam = useCallback(async (
    overrideAnswers?: Record<number, 1 | 2 | 3> | any,
    overrideDuration?: number
  ) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    voiceService.stop();
    setShowSubmitModal(false);
    setIsExamRunning(false);

    // Sanitize overrideAnswers in case a React SyntheticEvent or click event was passed
    const hasValidOverrideAnswers =
      overrideAnswers &&
      typeof overrideAnswers === 'object' &&
      !('nativeEvent' in overrideAnswers) &&
      !('preventDefault' in overrideAnswers) &&
      !('target' in overrideAnswers);

    const safeOverrideAnswers = hasValidOverrideAnswers
      ? (overrideAnswers as Record<number, 1 | 2 | 3>)
      : undefined;

    const safeOverrideDuration = typeof overrideDuration === 'number'
      ? overrideDuration
      : undefined;

    // Resolve answers: explicitly passed > answersRef.current > answers state
    const effectiveAnswers = safeOverrideAnswers ?? (
      Object.keys(answersRef.current).length > 0 ? answersRef.current : answers
    );
    const effectiveFlags = flagsRef.current && Object.keys(flagsRef.current).length > 0
      ? flagsRef.current
      : flags;

    const realDurationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const durationSeconds = safeOverrideDuration !== undefined
      ? Math.max(1, safeOverrideDuration)
      : (examMode === 'tutor'
          ? Math.max(elapsedSeconds, realDurationSeconds)
          : realDurationSeconds);

    const session = evaluateExam({
      questions: examQuestions,
      answers: effectiveAnswers,
      flags: effectiveFlags,
      durationSeconds,
      isMarathon,
      examMode,
      tutorFormat: examMode === 'tutor' ? tutorFormat : undefined
    });

    // Record telemetry in Dexie for answers not yet recorded
    for (const snap of session.snapshots) {
      if (snap.userAnswer !== undefined && !recordedQuestionIds.current.has(snap.questionId)) {
        await recordAnswer(snap.questionId, snap.isCorrect);
      }
    }

    await saveExam(session);
    setCompletedSession(session);
    setReviewFilter(session.wrongAnswers > 0 ? 'wrong' : 'all');
    setExamState('review');
    await dismissActiveSession();

    if (session.isPassed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignore
      }
    }
  }, [answers, examQuestions, flags, isMarathon, examMode, tutorFormat, elapsedSeconds, recordAnswer, saveExam, startTime, dismissActiveSession, setIsExamRunning]);

  const handleReviewMistakesNow = () => {
    if (!completedSession) return;
    voiceService.stop();
    const wrongQuestions = examQuestions.filter((_, idx) => {
      const snap = completedSession.snapshots[idx];
      return snap && !snap.isCorrect;
    });
    if (wrongQuestions.length === 0) return;

    setExamQuestions(wrongQuestions);
    setCurrentIndex(0);
    setAnswers({});
    answersRef.current = {};
    setFlags({});
    flagsRef.current = {};
    recordedQuestionIds.current.clear();
    setExamMode('tutor');
    setElapsedSeconds(0);
    setSecondsRemaining(0);
    setIsMarathon(false);
    setCompletedSession(null);
    setExamState('running');

    persistActiveSession({
      type: 'exam',
      examMode: 'tutor',
      questionIds: wrongQuestions.map(q => q.id),
      currentIndex: 0,
      answers: {},
      flags: {},
      secondsRemaining: 0,
      startTime: Date.now(),
      isMarathon: false,
      updatedAt: Date.now()
    });
  };

  // Registra la sessione audio attiva per consentire lo switch universale (Navbar o shortcut) senza perdere lo stato
  useEffect(() => {
    if (examState !== 'running' || examQuestions.length === 0) {
      registerAudioSessionContext(null);
      return;
    }

    registerAudioSessionContext({
      questions: examQuestions,
      currentIndex,
      answers: answersRef.current,
      flags: flagsRef.current,
      onAnswer: (qid, ans) => handleSelectAnswer(ans, qid),
      onToggleFlag: (qid) => handleToggleFlag(qid),
      onNavigateIndex: (idx) => setCurrentIndex(idx),
      isExam: true,
      isTutor: examMode === 'tutor',
      secondsRemaining: examMode === 'tutor' ? elapsedSeconds : secondsRemaining,
      onSubmitExam: (overrideAnswers, overrideDuration) => handleSubmitExam(overrideAnswers, overrideDuration),
      onAbandonSession: () => {
        voiceService.stop();
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
          autoAdvanceTimerRef.current = null;
        }
        isDismissedRef.current = true;
        setIsExamRunning(false);
        setExamState('idle');
        setExamQuestions([]);
        setAnswers({});
        setFlags({});
        setCurrentIndex(0);
      },
      title: examMode === 'tutor'
        ? (tutorFormat === 'flash'
            ? 'Tutor Flash'
            : tutorFormat === 'endless'
            ? 'Tutor Continuo'
            : 'Tutor Standard')
        : 'Esame Ufficiale'
    });

    return () => {
      registerAudioSessionContext(null);
    };
  }, [
    examState,
    examQuestions,
    currentIndex,
    answers,
    flags,
    examMode,
    tutorFormat,
    handleSubmitExam,
    registerAudioSessionContext
  ]);

  const tutorCorrectCount = Object.entries(answers).filter(([qid, ans]) => {
    const q = examQuestions.find(item => item.id === Number(qid));
    return q && q.correctAnswer === ans;
  }).length;
  const tutorWrongCount = Object.entries(answers).filter(([qid, ans]) => {
    const q = examQuestions.find(item => item.id === Number(qid));
    return q && q.correctAnswer !== ans;
  }).length;

  // --- Schermata IDLE: Avvio Esame / Tutor Dedicato ---
  if (examState === 'idle') {
    if (examMode === 'tutor') {
      return (
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3.5 animate-in fade-in">
          {/* Header didattico */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-800 text-[10px] font-bold uppercase tracking-wider font-mono border border-emerald-500/30">
                Studio Guidato
              </span>
              <span className="text-[11px] font-mono text-zinc-400 light:text-slate-500">
                Feedback immediato • Regola & Tranello
              </span>
            </div>
            <h2 className="font-bold text-lg sm:text-xl text-zinc-100 light:text-slate-900 flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              <span>Modalità Tutor</span>
            </h2>
            <p className="text-xs text-zinc-400 light:text-slate-600">
              Scegli il formato più adatto al tuo tempo a disposizione:
            </p>
          </div>

          {/* Formato 1: Flash 10 Quiz (Consigliato per buchi di tempo) */}
          <button
            type="button"
            id="btn-start-tutor-flash"
            onClick={() => handleRequestStartExam('tutor', 'flash')}
            className="w-full text-left p-4 sm:p-5 bg-zinc-900 border-2 border-emerald-500/60 hover:border-emerald-500 hover:bg-zinc-800/80 active:scale-[0.99] rounded-2xl transition-all shadow-md light:bg-white light:border-emerald-500/70 light:hover:bg-emerald-50/40 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 flex items-center justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base text-zinc-100 light:text-slate-900 group-hover:text-emerald-400 light:group-hover:text-emerald-700 transition-colors">
                    Flash (10 Quiz)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 light:bg-amber-100 light:text-amber-800 text-[10px] font-bold uppercase font-mono">
                    Buchi di tempo (3-5 min)
                  </span>
                </div>
                <p className="text-xs text-zinc-400 light:text-slate-600 leading-relaxed">
                  10 quesiti prioritari (non visti ed errori aperti). Al termine puoi estendere con altri 10 quiz o concludere.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 light:text-slate-400 light:group-hover:text-emerald-600 transition-all flex-shrink-0" />
          </button>

          {/* Formato 2: Standard 30 Quiz AeCI */}
          <button
            type="button"
            id="btn-start-tutor-exam"
            data-testid="btn-start-tutor-standard"
            onClick={() => handleRequestStartExam('tutor', 'standard')}
            className="w-full text-left p-4 sm:p-5 bg-zinc-900 border border-zinc-700 hover:border-emerald-500/70 hover:bg-zinc-800/80 active:scale-[0.99] rounded-2xl transition-all shadow-sm light:bg-white light:border-slate-300 light:hover:border-emerald-500/70 light:hover:bg-slate-50 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 flex items-center justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base text-zinc-100 light:text-slate-900 group-hover:text-emerald-400 light:group-hover:text-emerald-700 transition-colors">
                    Standard (30 Quiz AeCI)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 light:bg-slate-200 light:text-slate-700 text-[10px] font-bold uppercase font-mono">
                    Quote Esame (15-20 min)
                  </span>
                </div>
                <p className="text-xs text-zinc-400 light:text-slate-600 leading-relaxed">
                  30 quesiti distribuiti per materia secondo le quote ufficiali d'esame (9 aerodinamica, 8 meteo, ecc.).
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 light:text-slate-400 light:group-hover:text-emerald-600 transition-all flex-shrink-0" />
          </button>

          {/* Formato 3: Continuo Senza Limiti */}
          <button
            type="button"
            id="btn-start-tutor-endless"
            onClick={() => handleRequestStartExam('tutor', 'endless')}
            className="w-full text-left p-4 sm:p-5 bg-zinc-900 border border-zinc-700 hover:border-sky-500/70 hover:bg-zinc-800/80 active:scale-[0.99] rounded-2xl transition-all shadow-sm light:bg-white light:border-slate-300 light:hover:border-sky-500/70 light:hover:bg-slate-50 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/40 flex items-center justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/20 text-sky-400 light:bg-sky-100 light:text-sky-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <InfinityIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base text-zinc-100 light:text-slate-900 group-hover:text-sky-400 light:group-hover:text-sky-700 transition-colors">
                    Continuo (Senza Limiti)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 light:bg-sky-100 light:text-sky-800 text-[10px] font-bold uppercase font-mono">
                    Flusso Libero
                  </span>
                </div>
                <p className="text-xs text-zinc-400 light:text-slate-600 leading-relaxed">
                  Flusso progressivo ininterrotto. Rispondi finché hai tempo ed esci liberamente quando vuoi.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-sky-400 group-hover:translate-x-0.5 light:text-slate-400 light:group-hover:text-sky-600 transition-all flex-shrink-0" />
          </button>

          {/* Switch rapido a Esame Ufficiale */}
          <div className="text-center pt-1">
            <button
              id="btn-switch-to-official"
              onClick={() => {
                if (onSwitchMode) onSwitchMode('official');
                else setExamMode('official');
              }}
              className="text-xs text-zinc-400 hover:text-sky-400 light:text-slate-500 light:hover:text-sky-600 transition-colors inline-flex items-center gap-1.5"
            >
              <Timer className="w-3.5 h-3.5 text-sky-400" />
              <span>Vuoi metterti alla prova col timer? Passa a <strong>Esame Ufficiale (45 min)</strong></span>
            </button>
          </div>
        </div>
      );
    }

    // Default per 'official' ed eventuale 'marathon'
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Card Principale Esame Ufficiale AeCI */}
        <div className="p-5 sm:p-6 bg-zinc-900 border-2 border-sky-500/50 hover:border-sky-500 rounded-2xl transition-all shadow-md light:bg-white light:border-sky-500/60 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 light:bg-sky-100 light:text-sky-800 text-[10px] font-bold uppercase tracking-wider font-mono">
                Quota AeCI Certificata • D.P.R. 133/2010
              </span>
              <span className="text-[11px] font-mono text-zinc-400 light:text-slate-500">
                30 Quiz • 45 Minuti
              </span>
            </div>
            <h2 className="font-bold text-lg sm:text-xl text-zinc-100 light:text-slate-900 flex items-center gap-2.5">
              <Timer className="w-6 h-6 text-sky-400" />
              <span>Esame Ufficiale AeCI</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 light:text-slate-600 leading-relaxed">
              Simulazione formale fedele alla prova d'esame per l'attestato VDS/VL. 30 quesiti a risposta multipla con countdown reale di 45 minuti e debriefing finale alla consegna.
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950/70 light:bg-slate-50 border border-zinc-700/70 light:border-slate-300 rounded-xl space-y-2 text-xs text-zinc-300 light:text-slate-700">
            <div className="font-semibold text-zinc-200 light:text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span>Regolamento della sessione:</span>
            </div>
            <ul className="space-y-1.5 pl-6 list-disc text-zinc-400 light:text-slate-600">
              <li><strong>30 quesiti ufficiali</strong> ripartiti esattamente secondo le 9 materie d'esame.</li>
              <li><strong>Countdown di 45 minuti</strong> con avviso visivo negli ultimi minuti.</li>
              <li><strong>Idoneità conseguita</strong> con un massimo di <strong>3 errori</strong> (minimo 27 risposte esatte).</li>
              <li><strong>Nessun feedback durante la prova</strong>: correzione e spiegazioni complete nel debriefing alla consegna.</li>
            </ul>
          </div>

          <button
            id="btn-start-exam"
            onClick={() => handleRequestStartExam('official')}
            className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.99] light:bg-sky-600 light:hover:bg-sky-700"
          >
            <Timer className="w-4 h-4" />
            <span>Inizia Esame Ufficiale (45 min)</span>
          </button>
        </div>

        {/* Opzione Maratona Intensiva (Secondaria) */}
        <div className="p-4 bg-zinc-900/80 border border-zinc-700 hover:border-zinc-600 rounded-2xl transition-all light:bg-white light:border-slate-300 light:shadow-sm flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-zinc-200 light:text-slate-800 flex items-center gap-1.5">
              <ListFilter className="w-4 h-4 text-amber-400" />
              <span>Maratona Intensiva (60 Quiz)</span>
            </div>
            <p className="text-[11px] text-zinc-400 light:text-slate-600">
              Sessione estesa da 60 minuti con doppia quota quiz per testare resistenza e memoria.
            </p>
          </div>
          <button
            id="btn-start-marathon"
            onClick={() => handleRequestStartExam('marathon')}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 light:bg-slate-200 light:text-slate-800 light:hover:bg-slate-300 font-semibold text-xs whitespace-nowrap transition-colors flex-shrink-0"
          >
            Inizia Maratona
          </button>
        </div>

        {/* Switch rapido a Tutor Didattico */}
        <div className="text-center pt-1">
          <button
            id="btn-switch-to-tutor"
            onClick={() => {
              if (onSwitchMode) onSwitchMode('tutor');
              else setExamMode('tutor');
            }}
            className="text-xs text-zinc-400 hover:text-emerald-400 light:text-slate-500 light:hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vuoi prima esercitarti senza limiti di tempo? Passa a <strong>Tutor</strong></span>
          </button>
        </div>
      </div>
    );
  }

  // --- Schermata REVIEW / DEBRIEFING ESITO ---
  if (examState === 'review' && completedSession) {
    const isPassed = completedSession.isPassed;
    const errors = completedSession.wrongAnswers;
    const correct = completedSession.correctAnswers;
    const total = completedSession.totalQuestions;
    const isTutor = completedSession.examMode === 'tutor';

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Banner Esito */}
        <div
          className={`p-6 rounded-2xl border text-center space-y-2 ${
            isPassed
              ? 'bg-emerald-950/30 border-emerald-500/60 light:bg-emerald-50 light:border-emerald-300'
              : 'bg-rose-950/30 border-rose-500/60 light:bg-rose-50 light:border-rose-300'
          }`}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-1">
            {isPassed ? (
              <CheckCircle2 className="w-14 h-14 text-emerald-400 light:text-emerald-600" />
            ) : (
              <XCircle className="w-14 h-14 text-rose-400 light:text-rose-600" />
            )}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 light:text-slate-500">
            {isTutor
              ? (completedSession.tutorFormat === 'flash'
                  ? 'Tutor Flash (10 Quiz)'
                  : completedSession.tutorFormat === 'endless'
                  ? 'Tutor Continuo'
                  : 'Tutor Standard (30 Quiz)')
              : completedSession.isMarathon
              ? 'Maratona Intensiva'
              : 'Esame Ufficiale'}
          </div>
          <h2
            className={`text-2xl font-black tracking-tight ${
              isPassed ? 'text-emerald-300 light:text-emerald-800' : 'text-rose-300 light:text-rose-800'
            }`}
          >
            {isPassed ? 'IDONEO' : 'NON IDONEO'}
          </h2>
          <div className="text-sm font-semibold text-zinc-300 light:text-slate-700">
            {correct}/{total} esatte ({errors} {errors === 1 ? 'errore' : 'errori'}) • Tempo: {formatTime(completedSession.durationSeconds)}
          </div>
          <p className="text-xs text-zinc-400 light:text-slate-600">
            {isTutor
              ? (completedSession.tutorFormat === 'flash'
                  ? (isPassed ? 'Complimenti! Hai superato la prova rapida da 10 quiz.' : 'Esercitazione completata. Rivedi subito gli errori qui sotto.')
                  : completedSession.tutorFormat === 'endless'
                  ? 'Flusso continuo completato! Ottimo allenamento.'
                  : (isPassed ? 'Complimenti! Hai superato la soglia ufficiale del 90% (max 3 errori).' : 'Soglia massima di 3 errori superata. Rivedi subito gli errori qui sotto.'))
              : (isPassed
                  ? 'Complimenti! Hai superato la soglia ufficiale del 90% (max 3 errori).'
                  : 'Soglia massima di 3 errori superata. Rivedi subito gli errori qui sotto.')}
          </p>
        </div>

        {/* Dettaglio Materie con Errori */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 light:bg-white light:border-slate-300 light:shadow-sm">
          <h3 className="text-xs font-bold text-zinc-300 light:text-slate-700 uppercase tracking-wider mb-3">
            Ripartizione Materie
          </h3>
          <div className="space-y-2 text-xs">
            {Object.entries(completedSession.subjectBreakdown).map(([subIdStr, data]) => {
              const subId = Number(subIdStr);
              const qSample = examQuestions.find(q => q.subjectId === subId);
              const subName = qSample?.subjectName || `Materia ${subId}`;
              const hasErrors = data.wrong > 0;

              return (
                <div key={subId} className="flex items-center justify-between py-1 border-b border-zinc-700/60 light:border-slate-200 last:border-none">
                  <span className="text-zinc-200 light:text-slate-800 font-medium truncate max-w-[200px]">
                    {subName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">
                      {data.correct}/{data.total}
                    </span>
                    {hasErrors ? (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                        -{data.wrong} err
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        100%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pulsanti Azione */}
        <div className="flex flex-col sm:flex-row gap-3">
          {completedSession.tutorFormat === 'flash' ? (
            <button
              id="btn-restart-tutor"
              onClick={() => startExam('tutor', 'flash')}
              className="flex-1 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Nuovo Flash (10 Quiz)</span>
            </button>
          ) : (
            <button
              id="btn-restart-tutor"
              onClick={() => startExam('tutor', completedSession.tutorFormat || 'standard')}
              className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Nuova Sessione Tutor</span>
            </button>
          )}
          <button
            id="btn-restart-official"
            onClick={() => startExam('official')}
            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 light:bg-slate-200 light:text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Timer className="w-4 h-4" />
            <span>Esame Ufficiale (45 min)</span>
          </button>
        </div>

        {/* Torna alla schermata principale Esame o Home */}
        <div className="flex justify-center pt-0.5">
          <button
            id="btn-return-home"
            onClick={() => {
              voiceService.stop();
              setIsExamRunning(false);
              if (onNavigateHome) {
                onNavigateHome();
              } else {
                setExamState('idle');
                setCompletedSession(null);
              }
            }}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 light:text-slate-500 light:hover:text-slate-800 flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-zinc-800/40 light:hover:bg-slate-200/60 transition-colors"
          >
            <span>← Torna alla Home</span>
          </button>
        </div>

        {/* Revisione Domande Sessione */}
        {(() => {
          const flaggedCountInReview = completedSession.snapshots.filter(s => s.wasFlagged).length;
          const filteredReviewItems = examQuestions
            .map((q, idx) => ({ q, idx, snap: completedSession.snapshots[idx] }))
            .filter(({ snap }) => {
              if (!snap) return true;
              if (reviewFilter === 'wrong') return !snap.isCorrect;
              if (reviewFilter === 'correct') return snap.isCorrect;
              if (reviewFilter === 'flagged') return Boolean(snap.wasFlagged);
              return true;
            });

          return (
            <div className="space-y-4 pt-4 border-t border-zinc-800 light:border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <h3 className="text-sm font-bold text-zinc-200 light:text-slate-800 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-zinc-400" />
                  <span>Revisione Quesiti ({filteredReviewItems.length}/{totalCount})</span>
                </h3>

                {/* Filtri Revisione */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    id="btn-filter-review-all"
                    onClick={() => setReviewFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                      reviewFilter === 'all'
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600 light:bg-slate-200 light:text-slate-900 light:border-slate-400'
                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 light:bg-white light:text-slate-600 light:border-slate-200'
                    }`}
                  >
                    Tutti ({total})
                  </button>

                  <button
                    id="btn-filter-review-wrong"
                    onClick={() => setReviewFilter('wrong')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1 ${
                      reviewFilter === 'wrong'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 light:bg-rose-50 light:text-rose-700 light:border-rose-300'
                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 light:bg-white light:text-slate-600 light:border-slate-200'
                    }`}
                  >
                    <span>Solo Errori</span>
                    <span className="font-mono text-[10px] opacity-90">({errors})</span>
                  </button>

                  {flaggedCountInReview > 0 && (
                    <button
                      id="btn-filter-review-flagged"
                      onClick={() => setReviewFilter('flagged')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1 ${
                        reviewFilter === 'flagged'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 light:bg-amber-50 light:text-amber-700 light:border-amber-300'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 light:bg-white light:text-slate-600 light:border-slate-200'
                      }`}
                    >
                      <span>⚑ Rivedi</span>
                      <span className="font-mono text-[10px] opacity-90">({flaggedCountInReview})</span>
                    </button>
                  )}

                  <button
                    id="btn-filter-review-correct"
                    onClick={() => setReviewFilter('correct')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1 ${
                      reviewFilter === 'correct'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 light:bg-emerald-50 light:text-emerald-700 light:border-emerald-300'
                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 light:bg-white light:text-slate-600 light:border-slate-200'
                    }`}
                  >
                    <span>Corretti</span>
                    <span className="font-mono text-[10px] opacity-90">({correct})</span>
                  </button>
                </div>
              </div>

              {/* Banner Azione Rapida: Ripassa Subito Errori */}
              {reviewFilter === 'wrong' && errors > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 light:bg-amber-50 light:border-amber-200 light:text-amber-900">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-xs font-semibold">Vuoi riprovare subito i quesiti sbagliati con il feedback immediato?</span>
                  </div>
                  <button
                    id="btn-retry-mistakes-now"
                    onClick={handleReviewMistakesNow}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap self-end sm:self-auto cursor-pointer"
                  >
                    <span>Ripassa Ora in Tutor ({errors})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Lista Quesiti Filtrati */}
              {filteredReviewItems.length === 0 ? (
                <div className="p-8 rounded-xl border border-zinc-700 bg-zinc-900/60 light:bg-white light:border-slate-300 text-center space-y-2 text-xs text-zinc-400 light:text-slate-600">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                  <p className="font-semibold text-zinc-200 light:text-slate-800">
                    {reviewFilter === 'wrong'
                      ? 'Nessun errore! Tutti i quesiti di questa sessione sono stati risposti correttamente.'
                      : reviewFilter === 'flagged'
                      ? 'Nessun quesito contrassegnato con la bandierina in questa sessione.'
                      : 'Nessun quesito da mostrare per questo filtro.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviewItems.map(item => (
                    <QuestionCard
                      key={item.q.id}
                      question={item.q}
                      selectedAnswer={item.snap?.userAnswer}
                      onSelectAnswer={() => {}}
                      showFeedback={true}
                      isReviewMode={true}
                      disableAutoPlay={true}
                      indexNumber={item.idx + 1}
                      totalNumber={totalCount}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  }

  // --- Schermata RUNNING: Esame o Simulazione in Corso ---
  return (
    <div className="max-w-2xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 space-y-2.5 sm:space-y-3 pb-20 sm:pb-24">
      {/* Top Bar: Timer, Progresso, Consegna */}
      <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl dark:bg-zinc-900 light:bg-white light:border-slate-300 shadow-sm sticky top-[48px] sm:top-[50px] z-20">
        <div className="flex items-center gap-2">
          {examMode === 'tutor' ? (
            <div className="flex items-center gap-1.5 font-mono font-bold text-sm px-2.5 py-1 rounded-lg bg-zinc-950 text-zinc-100 light:bg-slate-100 light:text-slate-800 border border-emerald-500/30">
              <Timer className="w-4 h-4 text-emerald-400" />
              <span>{formatTime(elapsedSeconds)}</span>
              <span className="text-[10px] text-emerald-400/90 font-sans font-medium hidden sm:inline ml-1">
                {tutorFormat === 'flash' ? 'Flash (10)' : tutorFormat === 'endless' ? 'Continuo' : 'Senza limiti'}
              </span>
            </div>
          ) : (
            <div
              className={`flex items-center gap-1.5 font-mono font-bold text-sm px-2.5 py-1 rounded-lg ${
                secondsRemaining < 300
                  ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                  : 'bg-zinc-950 text-zinc-100 light:bg-slate-100 light:text-slate-800 border border-zinc-700/80 light:border-slate-300'
              }`}
            >
              <Timer className="w-4 h-4 text-amber-400" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>
          )}

          <div className="text-xs text-zinc-300 light:text-slate-700 font-medium flex items-center gap-1.5">
            <span>{tutorFormat === 'endless' ? `${answeredCount} risposte` : `${answeredCount}/${totalCount}`}</span>
            {flaggedCount > 0 && (
              <span className="text-amber-400 font-medium">
                ({flaggedCount} ⚑)
              </span>
            )}
          </div>

          {/* In modalità tutor mostra conteggio live corrette/errate */}
          {examMode === 'tutor' && answeredCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-700 light:bg-slate-100 light:border-slate-300">
              <span className="text-emerald-400 light:text-emerald-600">{tutorCorrectCount} ✓</span>
              <span className="text-zinc-500 light:text-slate-400">/</span>
              <span className="text-rose-400 light:text-rose-600">{tutorWrongCount} ✗</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="btn-abandon-exam"
            onClick={() => {
              voiceService.stop();
              setIsPaused(true);
              setShowInterruptModal(true);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-amber-500/40 hover:border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 light:border-amber-300 light:bg-amber-50 light:text-amber-800 light:hover:bg-amber-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Pausa o Interrompi la sessione"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pausa</span>
          </button>

          <button
            id="btn-submit-exam-top"
            onClick={() => {
              voiceService.stop();
              setShowSubmitModal(true);
            }}
            className="px-2.5 py-1.5 sm:px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all"
          >
            {examMode === 'tutor' ? 'Concludi' : 'Consegna'}
            {tutorFormat !== 'endless' && (
              <span className="hidden sm:inline"> ({answeredCount}/{totalCount})</span>
            )}
          </button>
        </div>
      </div>

      {/* Navigatore Domande (comprimibile a riga singola o espanso a 3 righe) */}
      <QuestionNavigator
        questions={examQuestions}
        currentIndex={currentIndex}
        answers={answers}
        flags={flags}
        examMode={examMode}
        tutorFormat={examMode === 'tutor' ? tutorFormat : undefined}
        onSelectIndex={changeIndex}
      />

      {/* Card Domanda Corrente */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={answers[currentQuestion.id]}
          onSelectAnswer={handleSelectAnswer}
          showFeedback={true}
          isFlagged={flags[currentQuestion.id]}
          onToggleFlag={handleToggleFlag}
          indexNumber={currentIndex + 1}
          totalNumber={totalCount}
        />
      )}

      {/* Barra Navigazione Quiz Ancorata in Basso */}
      <QuizBottomBar
        currentIndex={currentIndex}
        totalCount={totalCount}
        onPrevious={() => changeIndex(Math.max(0, currentIndex - 1))}
        onNext={() => changeIndex(getNextQuestionIndex(currentIndex, examQuestions, answers))}
        isPreviousDisabled={currentIndex === 0}
        isNextDisabled={currentIndex === totalCount - 1}
        previousId="btn-prev-question"
        nextId="btn-next-question"
        flagAction={currentQuestion ? {
          isFlagged: flags[currentQuestion.id] === true,
          onToggle: () => handleToggleFlag(currentQuestion.id),
          id: 'btn-flag-question-bottom'
        } : undefined}
        centerContent={
          examMode === 'tutor' && tutorFormat === 'endless' ? (
            <span className="font-mono text-zinc-400 light:text-slate-500 font-medium">
              Quiz #{currentIndex + 1}
            </span>
          ) : (
            <span className="font-mono text-zinc-400 light:text-slate-500 font-medium">
              {currentIndex + 1} / {totalCount}
            </span>
          )
        }
        primaryAction={
          currentQuestion && answers[currentQuestion.id] !== undefined
            ? (currentIndex < totalCount - 1
                ? {
                    id: 'btn-tutor-next-question',
                    label: 'Successiva',
                    variant: 'amber',
                    icon: <ArrowRight className="w-4 h-4" />,
                    onClick: () => changeIndex(getNextQuestionIndex(currentIndex, examQuestions, answers, { fallbackToEndIfComplete: true }))
                  }
                : {
                    id: 'btn-tutor-complete-exam',
                    label: examMode === 'tutor' ? 'Completa' : 'Consegna',
                    variant: 'emerald',
                    icon: <CheckCircle2 className="w-4 h-4" />,
                    onClick: () => {
                      voiceService.stop();
                      setShowSubmitModal(true);
                    }
                  })
            : (currentIndex === totalCount - 1
                ? {
                    id: 'btn-submit-exam-bottom',
                    label: 'Consegna',
                    variant: 'emerald',
                    icon: <CheckCircle2 className="w-4 h-4" />,
                    onClick: () => {
                      voiceService.stop();
                      setShowSubmitModal(true);
                    }
                  }
                : undefined)
        }
      />

      {/* Modal di Conferma Consegna */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl light:bg-white light:border-slate-300">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-zinc-100 light:text-slate-900">
                {examMode === 'tutor'
                  ? tutorFormat === 'flash'
                    ? 'Concludi Flash (10 Quiz)'
                    : tutorFormat === 'endless'
                    ? 'Concludi Flusso Continuo'
                    : 'Concludi Tutor'
                  : 'Consegna Esame'}
              </h3>
            </div>

            <div className="text-xs text-zinc-300 light:text-slate-600 space-y-2">
              <p>
                Hai risposto a <strong>{answeredCount}</strong> {tutorFormat === 'endless' ? 'quesiti.' : <>su <strong>{totalCount}</strong> quesiti.</>}
              </p>
              {examMode === 'tutor' && tutorFormat === 'endless' && (
                <p className="text-zinc-400 light:text-slate-500">
                  Nel flusso continuo puoi terminare in qualsiasi momento senza alcuna penalità sui quiz non visualizzati.
                </p>
              )}
              {tutorFormat !== 'endless' && totalCount - answeredCount > 0 && (
                <p className="text-rose-400 font-medium">
                  Attenzione: {totalCount - answeredCount} domande non risposte verranno considerate errate.
                </p>
              )}
              {flaggedCount > 0 && (
                <p className="text-amber-400">
                  Hai ancora {flaggedCount} domande contrassegnate da rivedere.
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {/* Opzione Continua (+10 Quiz) per Flash Tutor */}
              {examMode === 'tutor' && tutorFormat === 'flash' && (
                <button
                  id="btn-extend-flash-modal"
                  onClick={() => {
                    setShowSubmitModal(false);
                    handleExtendFlashSession();
                  }}
                  className="w-full py-2.5 rounded-xl border border-amber-500/50 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 light:bg-amber-100 light:border-amber-400 light:text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Continua (+10 Quiz)</span>
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white light:border-slate-300 light:text-slate-700 text-xs font-medium"
                >
                  Continua
                </button>
                <button
                  id="btn-confirm-submit-exam"
                  onClick={handleSubmitExam}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md"
                >
                  {examMode === 'tutor' ? 'Mostra Debriefing' : 'Conferma'}
                </button>
              </div>

              {/* Tasto Metti in Pausa esplicito nel dialog di conclusione */}
              <button
                id="btn-submit-modal-pause"
                onClick={handlePauseExamSession}
                className="w-full py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 light:bg-amber-50 light:border-amber-300 light:text-amber-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Metti in Pausa (Riprendi più tardi)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Unificata Interruzione Sessione (Pausa o Termina) */}
      <SessionInterruptModal
        isOpen={showInterruptModal}
        onClose={() => {
          setIsPaused(false);
          setShowInterruptModal(false);
        }}
        onPause={handlePauseExamSession}
        onTerminate={async () => {
          voiceService.stop();
          if (autoAdvanceTimerRef.current) {
            clearTimeout(autoAdvanceTimerRef.current);
            autoAdvanceTimerRef.current = null;
          }
          isDismissedRef.current = true;
          setShowInterruptModal(false);
          setIsExamRunning(false);
          setExamState('idle');
          setExamQuestions([]);
          setAnswers({});
          setFlags({});
          setCurrentIndex(0);
          await dismissActiveSession();
          if (onNavigateHome) {
            onNavigateHome();
          }
        }}
        sessionTitle={
          examMode === 'tutor'
            ? tutorFormat === 'flash'
              ? 'Tutor Flash (10 Quiz)'
              : tutorFormat === 'endless'
              ? 'Tutor Flusso Continuo'
              : 'Tutor Standard'
            : isMarathon
            ? 'Maratona 60 Quiz'
            : 'Simulazione Esame Ufficiale'
        }
        currentIndex={currentIndex}
        totalQuestions={totalCount}
        answeredCount={answeredCount}
        timeDisplay={
          examMode === 'tutor'
            ? `${formatTime(elapsedSeconds)} trascorsi`
            : `${formatTime(secondsRemaining)} rimanenti`
        }
      />

      {/* Modale Conflitto Sessione in Sospeso per Avvio Nuova Prova */}
      <SessionConflictModal
        isOpen={conflictPendingMode !== null}
        onClose={() => {
          setConflictPendingMode(null);
          setConflictPendingFormat(undefined);
        }}
        onResumeExisting={() => {
          setConflictPendingMode(null);
          setConflictPendingFormat(undefined);
          if (activeSession) {
            isDismissedRef.current = false;
            const ordered = activeSession.questionIds
              .map(id => questions.find(q => q.id === id))
              .filter((q): q is Question => Boolean(q));
            if (ordered.length > 0) {
              const resMode = activeSession.examMode || (activeSession.isMarathon ? 'marathon' : 'official');
              setExamQuestions(ordered);
              setExamMode(resMode);
              if (activeSession.tutorFormat) {
                setTutorFormat(activeSession.tutorFormat);
              }
              setCurrentIndex(Math.min(activeSession.currentIndex || 0, ordered.length - 1));
              const resAnswers = activeSession.answers || {};
              const resFlags = activeSession.flags || {};
              setAnswers(resAnswers);
              answersRef.current = resAnswers;
              setFlags(resFlags);
              flagsRef.current = resFlags;
              if (resMode === 'tutor') {
                setElapsedSeconds(activeSession.elapsedSeconds || activeSession.secondsRemaining || 0);
              } else {
                setSecondsRemaining(activeSession.secondsRemaining || 45 * 60);
              }
              setStartTime(activeSession.startTime || Date.now());
              setIsMarathon(resMode === 'marathon');
              setIsPaused(false);
              setExamState('running');
            }
          }
        }}
        onDiscardAndStartNew={async () => {
          const mode = conflictPendingMode || 'tutor';
          const format = conflictPendingFormat;
          setConflictPendingMode(null);
          setConflictPendingFormat(undefined);
          await dismissActiveSession();
          startExam(mode, format);
        }}
        existingTitle={
          activeSession?.subjectName ||
          (activeSession?.type === 'exam'
            ? activeSession.examMode === 'tutor'
              ? activeSession.tutorFormat === 'flash'
                ? 'Tutor Flash (10 Quiz)'
                : activeSession.tutorFormat === 'endless'
                ? 'Tutor Continuo'
                : 'Tutor Standard (30 Quiz)'
              : activeSession.isMarathon
              ? 'Maratona 60 Quiz'
              : 'Esame Ufficiale'
            : 'Sessione di Studio')
        }
        existingProgress={`Domanda ${(activeSession?.currentIndex || 0) + 1} di ${
          activeSession?.questionIds?.length || 0
        } • ${activeSession?.answers ? Object.keys(activeSession.answers).length : 0} risposte date`}
        newSessionTitle={
          conflictPendingMode === 'tutor'
            ? conflictPendingFormat === 'flash'
              ? 'Nuova Sessione Tutor Flash (10 Quiz)'
              : conflictPendingFormat === 'endless'
              ? 'Nuovo Flusso Continuo Tutor'
              : 'Nuova Sessione Tutor (30 Quiz)'
            : conflictPendingMode === 'marathon'
            ? 'Nuova Maratona 60 Quiz'
            : 'Nuova Simulazione Esame Ufficiale'
        }
      />
    </div>
  );
};
