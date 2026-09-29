import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Timer,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  ListFilter,
  Car,
  BookOpen
} from 'lucide-react';
import type { Question } from '../types/quiz';
import type { ExamSession, ExamModeType } from '../types/database';
import { useQuiz } from '../context/QuizContext';
import { generateExamQuestions } from '../utils/fairRandomizer';
import { evaluateExam } from '../services/examEvaluator';
import { formatTime } from '../utils/timer';
import { QuestionCard } from './QuestionCard';
import { voiceService } from '../services/voiceService';
import { QuizBottomBar } from './QuizBottomBar';

export const ExamScreen: React.FC = () => {
  const {
    questions,
    filteredQuestions,
    statsMap,
    saveExam,
    recordAnswer,
    settings,
    setIsExamRunning,
    openDriveMode,
    activeSession,
    persistActiveSession,
    dismissActiveSession
  } = useQuiz();

  // Exam state
  const [examState, setExamState] = useState<'idle' | 'running' | 'review'>('idle');
  const [examMode, setExamMode] = useState<ExamModeType>('tutor');
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 1 | 2 | 3>>({});
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isMarathon, setIsMarathon] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [completedSession, setCompletedSession] = useState<ExamSession | null>(null);

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

  // Gestione tasto Escape per chiudere le modali di conferma esame
  useEffect(() => {
    if (!showAbandonModal && !showSubmitModal) return;
    const handleModalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAbandonModal(false);
        setShowSubmitModal(false);
      }
    };
    window.addEventListener('keydown', handleModalKey);
    return () => window.removeEventListener('keydown', handleModalKey);
  }, [showAbandonModal, showSubmitModal]);

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
        setAnswers(resumedAnswers);
        setFlags(activeSession.flags || {});
        if (mode === 'tutor') {
          setElapsedSeconds(activeSession.secondsRemaining || 0);
        } else {
          setSecondsRemaining(activeSession.secondsRemaining || 45 * 60);
        }
        setStartTime(activeSession.startTime || Date.now());
        setIsMarathon(mode === 'marathon');
        recordedQuestionIds.current = new Set(Object.keys(resumedAnswers).map(Number));
        setExamState('running');
      }
    }
  }, [activeSession, examState, questions]);

  const startExam = (mode: ExamModeType = 'tutor') => {
    isDismissedRef.current = false;
    const marathon = mode === 'marathon';
    setIsMarathon(marathon);
    setExamMode(mode);
    const generated = generateExamQuestions(filteredQuestions, statsMap, marathon);
    setExamQuestions(generated);
    setCurrentIndex(0);
    setAnswers({});
    setFlags({});
    recordedQuestionIds.current.clear();
    const totalMinutes = marathon ? 60 : settings.examTimerMinutes || 45;
    const initialSeconds = totalMinutes * 60;
    setSecondsRemaining(initialSeconds);
    setElapsedSeconds(0);
    const now = Date.now();
    setStartTime(now);
    setCompletedSession(null);
    setExamState('running');

    persistActiveSession({
      type: 'exam',
      examMode: mode,
      questionIds: generated.map(q => q.id),
      currentIndex: 0,
      answers: {},
      flags: {},
      secondsRemaining: mode === 'tutor' ? 0 : initialSeconds,
      startTime: now,
      isMarathon: marathon,
      updatedAt: now
    });
  };

  // Timer interval: count up for tutor mode (no time limit), countdown for official/marathon
  useEffect(() => {
    if (examState !== 'running') return;

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
  }, [examState, examMode]);

  const currentQuestion = examQuestions[currentIndex];
  const totalCount = examQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flags).filter(Boolean).length;

  const changeIndex = (newIndex: number) => {
    setCurrentIndex(newIndex);
    if (examState === 'running') {
      persistActiveSession({
        type: 'exam',
        examMode,
        questionIds: examQuestions.map(q => q.id),
        currentIndex: newIndex,
        answers,
        flags,
        secondsRemaining: examMode === 'tutor' ? elapsedSeconds : secondsRemaining,
        startTime,
        isMarathon,
        updatedAt: Date.now()
      });
    }
  };

  const handleSelectAnswer = async (ans: 1 | 2 | 3, qid?: number) => {
    const targetId = qid ?? currentQuestion?.id;
    if (!targetId) return;

    // In tutor mode, avoid changing an answer that has already been verified
    if (examMode === 'tutor' && answers[targetId] !== undefined) {
      return;
    }

    const updatedAnswers = { ...answers, [targetId]: ans };
    setAnswers(updatedAnswers);

    // In tutor mode, record answer statistics immediately into Dexie
    if (examMode === 'tutor') {
      const targetQ = examQuestions.find(q => q.id === targetId) || currentQuestion;
      if (targetQ) {
        const isCorrect = ans === targetQ.correctAnswer;
        await recordAnswer(targetId, isCorrect);
        recordedQuestionIds.current.add(targetId);
      }
    }

    persistActiveSession({
      type: 'exam',
      examMode,
      questionIds: examQuestions.map(q => q.id),
      currentIndex,
      answers: updatedAnswers,
      flags,
      secondsRemaining: examMode === 'tutor' ? elapsedSeconds : secondsRemaining,
      startTime,
      isMarathon,
      updatedAt: Date.now()
    });
  };

  const handleToggleFlag = (qid?: number) => {
    const targetId = qid ?? currentQuestion?.id;
    if (!targetId) return;
    const updatedFlags = { ...flags, [targetId]: !flags[targetId] };
    setFlags(updatedFlags);

    persistActiveSession({
      type: 'exam',
      examMode,
      questionIds: examQuestions.map(q => q.id),
      currentIndex,
      answers,
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

      if (e.key === '1') handleSelectAnswer(1);
      else if (e.key === '2') handleSelectAnswer(2);
      else if (e.key === '3') handleSelectAnswer(3);
      else if (e.key.toLowerCase() === 'f') handleToggleFlag();
      else if (e.key === 'ArrowLeft' && currentIndex > 0) changeIndex(currentIndex - 1);
      else if (e.key === 'ArrowRight' && currentIndex < totalCount - 1) changeIndex(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [examState, currentIndex, currentQuestion, totalCount, answers, flags]);

  const handleSubmitExam = useCallback(async () => {
    setShowSubmitModal(false);
    const durationSeconds = examMode === 'tutor'
      ? Math.max(1, elapsedSeconds)
      : Math.max(1, Math.round((Date.now() - startTime) / 1000));

    const session = evaluateExam({
      questions: examQuestions,
      answers,
      flags,
      durationSeconds,
      isMarathon,
      examMode
    });

    // Record telemetry in Dexie for answers not yet recorded
    for (const snap of session.snapshots) {
      if (snap.userAnswer !== undefined && !recordedQuestionIds.current.has(snap.questionId)) {
        await recordAnswer(snap.questionId, snap.isCorrect);
      }
    }

    await saveExam(session);
    setCompletedSession(session);
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
  }, [answers, examQuestions, flags, isMarathon, examMode, elapsedSeconds, recordAnswer, saveExam, startTime, dismissActiveSession]);

  const tutorCorrectCount = Object.entries(answers).filter(([qid, ans]) => {
    const q = examQuestions.find(item => item.id === Number(qid));
    return q && q.correctAnswer === ans;
  }).length;
  const tutorWrongCount = Object.entries(answers).filter(([qid, ans]) => {
    const q = examQuestions.find(item => item.id === Number(qid));
    return q && q.correctAnswer !== ans;
  }).length;

  // --- Schermata IDLE: Avvio Esame ---
  if (examState === 'idle') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Selezione Modalità */}
        <div className="space-y-4">
          {/* Opzione 1: Simulazione Didattica (Tutor) - In Evidenza per l'apprendimento */}
          <div className="p-5 bg-zinc-900 border-2 border-amber-500/50 hover:border-amber-500 rounded-2xl transition-all shadow-md light:bg-white light:border-amber-500/60 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  Consigliata per imparare
                </span>
              </div>
              <h3 className="font-bold text-base text-zinc-100 light:text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>Simulazione Didattica (Tutor)</span>
              </h3>
              <p className="text-xs text-zinc-400 light:text-slate-600 leading-relaxed">
                30 quesiti bilanciati AeCI <strong>senza limiti di tempo</strong>. Feedback cromatico immediato ad ogni risposta con spiegazione dettagliata <strong>Regola</strong> e <strong>Tranello</strong>.
              </p>
            </div>
            <button
              id="btn-start-tutor-exam"
              onClick={() => startExam('tutor')}
              className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>Avvia Simulazione Didattica (30 Quiz)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Opzione 2: Esame Ufficiale AeCI - Prova Formale */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition-all light:bg-slate-50 light:border-slate-200 space-y-3">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-zinc-200 light:text-slate-800 flex items-center gap-2">
                <Timer className="w-4 h-4 text-amber-400" />
                <span>Esame Ufficiale AeCI</span>
              </h3>
              <p className="text-xs text-zinc-400 light:text-slate-600 leading-relaxed">
                30 quesiti, timer countdown di 45 minuti e debriefing finale degli errori alla consegna (simulazione prova reale d'esame).
              </p>
            </div>
            <button
              id="btn-start-exam"
              onClick={() => startExam('official')}
              className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 light:bg-slate-200 light:text-slate-800 light:hover:bg-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Avvia Esame Ufficiale (45 min)</span>
            </button>
          </div>

          {/* Opzione 3: Maratona Intensiva */}
          <button
            id="btn-start-marathon"
            onClick={() => startExam('marathon')}
            className="w-full py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 light:border-slate-300 light:text-slate-600 light:hover:text-slate-900 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Maratona Intensiva (60 Quiz - 60 min)</span>
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
            {isTutor ? 'Simulazione Didattica' : completedSession.isMarathon ? 'Maratona Intensiva' : 'Esame Ufficiale'}
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
            {isPassed
              ? 'Complimenti! Hai superato la soglia ufficiale del 90% (max 3 errori).'
              : 'Soglia massima di 3 errori superata. Rivedi subito gli errori qui sotto.'}
          </p>
        </div>

        {/* Dettaglio Materie con Errori */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 light:bg-white light:border-slate-200">
          <h3 className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider mb-3">
            Ripartizione Materie
          </h3>
          <div className="space-y-2 text-xs">
            {Object.entries(completedSession.subjectBreakdown).map(([subIdStr, data]) => {
              const subId = Number(subIdStr);
              const qSample = examQuestions.find(q => q.subjectId === subId);
              const subName = qSample?.subjectName || `Materia ${subId}`;
              const hasErrors = data.wrong > 0;

              return (
                <div key={subId} className="flex items-center justify-between py-1 border-b border-zinc-800/60 light:border-slate-100 last:border-none">
                  <span className="text-zinc-300 light:text-slate-700 font-medium truncate max-w-[200px]">
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
          <button
            id="btn-restart-tutor"
            onClick={() => startExam('tutor')}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Nuova Simulazione Didattica</span>
          </button>
          <button
            id="btn-restart-official"
            onClick={() => startExam('official')}
            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 light:bg-slate-200 light:text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Timer className="w-4 h-4" />
            <span>Esame Ufficiale (45 min)</span>
          </button>
        </div>

        {/* Torna alla schermata principale Esame */}
        <div className="flex justify-center pt-0.5">
          <button
            id="btn-return-home"
            onClick={() => {
              setExamState('idle');
              setCompletedSession(null);
            }}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 light:text-slate-500 light:hover:text-slate-800 flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-zinc-800/40 light:hover:bg-slate-200/60 transition-colors"
          >
            <span>← Torna alla schermata iniziale Esame</span>
          </button>
        </div>

        {/* Revisione Domande Sessione */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold text-zinc-200 light:text-slate-800">
            Revisione Quesiti Sessione
          </h3>
          <div className="space-y-4">
            {examQuestions.map((q, idx) => {
              const snap = completedSession.snapshots[idx];
              return (
                <QuestionCard
                  key={q.id}
                  question={q}
                  selectedAnswer={snap.userAnswer}
                  onSelectAnswer={() => {}}
                  showFeedback={true}
                  indexNumber={idx + 1}
                  totalNumber={totalCount}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- Schermata RUNNING: Esame o Simulazione in Corso ---
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-28 sm:pb-32">
      {/* Top Bar: Timer, Progresso, Consegna */}
      <div className="flex items-center justify-between gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl dark:bg-zinc-900 light:bg-white light:border-slate-200 shadow-sm sticky top-[102px] sm:top-[106px] z-20">
        <div className="flex items-center gap-2">
          {examMode === 'tutor' ? (
            <div className="flex items-center gap-1.5 font-mono font-bold text-sm px-2.5 py-1 rounded-lg bg-zinc-950 text-zinc-100 light:bg-slate-100 light:text-slate-800 border border-emerald-500/30">
              <Timer className="w-4 h-4 text-emerald-400" />
              <span>{formatTime(elapsedSeconds)}</span>
              <span className="text-[10px] text-emerald-400/90 font-sans font-medium hidden sm:inline ml-1">Senza limiti</span>
            </div>
          ) : (
            <div
              className={`flex items-center gap-1.5 font-mono font-bold text-sm px-2.5 py-1 rounded-lg ${
                secondsRemaining < 300
                  ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                  : 'bg-zinc-950 text-zinc-100 light:bg-slate-100 light:text-slate-800'
              }`}
            >
              <Timer className="w-4 h-4 text-amber-400" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>
          )}

          <div className="text-xs text-zinc-400 light:text-slate-600 font-medium flex items-center gap-1.5">
            <span>{answeredCount}/{totalCount}</span>
            {flaggedCount > 0 && (
              <span className="text-amber-400 font-medium">
                ({flaggedCount} ⚑)
              </span>
            )}
          </div>

          {/* In modalità tutor mostra conteggio live corrette/errate */}
          {examMode === 'tutor' && answeredCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-800/80 light:bg-slate-100 light:border-slate-200">
              <span className="text-emerald-400 light:text-emerald-600">{tutorCorrectCount} ✓</span>
              <span className="text-zinc-600 light:text-slate-400">/</span>
              <span className="text-rose-400 light:text-rose-600">{tutorWrongCount} ✗</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-exam-drive-mode"
            onClick={() => {
              openDriveMode({
                questions: examQuestions,
                currentIndex,
                answers,
                flags,
                onAnswer: (qid, ans) => handleSelectAnswer(ans, qid),
                onToggleFlag: (qid) => handleToggleFlag(qid),
                onNavigateIndex: (idx) => setCurrentIndex(idx),
                isExam: true,
                secondsRemaining: examMode === 'tutor' ? elapsedSeconds : secondsRemaining,
                onSubmitExam: handleSubmitExam,
                title: examMode === 'tutor' ? 'Simulazione Didattica' : 'Esame Ufficiale'
              });
            }}
            className="px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-800 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Passa alla Modalità Alla Guida per questa sessione"
          >
            <Car className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Alla Guida</span>
          </button>

          <button
            id="btn-abandon-exam"
            onClick={() => setShowAbandonModal(true)}
            className="px-2.5 py-1.5 rounded-lg border border-rose-500/40 hover:border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 light:border-rose-200 light:bg-rose-50 light:text-rose-700 light:hover:bg-rose-100 text-xs font-semibold transition-colors flex items-center gap-1"
            title="Interrompi la simulazione"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Interrompi</span>
          </button>

          <button
            id="btn-submit-exam-top"
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
          >
            {examMode === 'tutor' ? 'Concludi' : 'Consegna'} ({answeredCount}/{totalCount})
          </button>
        </div>
      </div>

      {/* Griglia Navigatore Domande (30 bolle) */}
      <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl light:bg-white light:border-slate-200">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {examQuestions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isFlagged = flags[q.id] === true;
            const isCurrent = currentIndex === idx;

            let bubbleStyle = 'border-zinc-800 bg-zinc-950 text-zinc-400 light:border-slate-200 light:bg-slate-50 light:text-slate-600';
            if (isAnswered) {
              if (examMode === 'tutor') {
                const isCorrect = answers[q.id] === q.correctAnswer;
                bubbleStyle = isCorrect
                  ? 'border-emerald-500 bg-emerald-500/25 text-emerald-300 font-bold border'
                  : 'border-rose-500 bg-rose-500/25 text-rose-300 font-bold border';
              } else {
                bubbleStyle = 'border-amber-500 bg-amber-500 text-zinc-950 font-bold shadow-sm';
              }
            }
            if (isFlagged) {
              bubbleStyle += ' ring-1 ring-amber-400';
            }
            if (isCurrent) {
              bubbleStyle += ' ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950 light:ring-offset-white';
            }

            return (
              <button
                key={q.id}
                id={`bubble-q-${idx + 1}`}
                onClick={() => changeIndex(idx)}
                className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center transition-all ${bubbleStyle}`}
                title={`Quesito #${q.id}${isAnswered && examMode === 'tutor' ? (answers[q.id] === q.correctAnswer ? ' (Esatta)' : ' (Errata)') : ''}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card Domanda Corrente */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={answers[currentQuestion.id]}
          onSelectAnswer={handleSelectAnswer}
          showFeedback={examMode === 'tutor'}
          isFlagged={flags[currentQuestion.id]}
          onToggleFlag={handleToggleFlag}
          indexNumber={currentIndex + 1}
          totalNumber={totalCount}
        />
      )}

      {/* Link secondario inferiore per interrompere esame */}
      <div className="flex justify-center pt-2">
        <button
          id="btn-bottom-abandon-exam"
          onClick={() => setShowAbandonModal(true)}
          className="text-xs text-zinc-500 hover:text-rose-400 light:text-slate-400 light:hover:text-rose-600 transition-colors flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-zinc-900/60 light:hover:bg-slate-100"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Interrompi simulazione d'esame</span>
        </button>
      </div>

      {/* Barra Navigazione Quiz Ancorata in Basso */}
      <QuizBottomBar
        currentIndex={currentIndex}
        totalCount={totalCount}
        onPrevious={() => changeIndex(Math.max(0, currentIndex - 1))}
        onNext={() => changeIndex(Math.min(totalCount - 1, currentIndex + 1))}
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
          <span className="font-mono text-zinc-400 light:text-slate-500 font-medium">
            {currentIndex + 1} / {totalCount}
          </span>
        }
        primaryAction={
          examMode === 'tutor' && currentQuestion && answers[currentQuestion.id] !== undefined
            ? (currentIndex < totalCount - 1
                ? {
                    id: 'btn-tutor-next-question',
                    label: `Prossima Domanda (${currentIndex + 2}/${totalCount})`,
                    variant: 'amber',
                    icon: <ArrowRight className="w-4 h-4" />,
                    onClick: () => changeIndex(currentIndex + 1)
                  }
                : {
                    id: 'btn-tutor-complete-exam',
                    label: `Completa Simulazione (${answeredCount}/${totalCount})`,
                    variant: 'emerald',
                    icon: <CheckCircle2 className="w-4 h-4" />,
                    onClick: () => setShowSubmitModal(true)
                  })
            : (currentIndex === totalCount - 1
                ? {
                    id: 'btn-submit-exam-bottom',
                    label: `Consegna (${answeredCount}/${totalCount})`,
                    variant: 'emerald',
                    icon: <CheckCircle2 className="w-4 h-4" />,
                    onClick: () => setShowSubmitModal(true)
                  }
                : undefined)
        }
      />

      {/* Modal di Conferma Consegna */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl light:bg-white light:border-slate-200">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-zinc-100 light:text-slate-900">
                {examMode === 'tutor' ? 'Concludi Simulazione Didattica' : 'Consegna Esame'}
              </h3>
            </div>

            <div className="text-xs text-zinc-300 light:text-slate-600 space-y-2">
              <p>
                Hai risposto a <strong>{answeredCount}</strong> su <strong>{totalCount}</strong> quesiti.
              </p>
              {totalCount - answeredCount > 0 && (
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

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 light:border-slate-300 light:text-slate-700 text-xs font-medium"
              >
                Continua
              </button>
              <button
                id="btn-confirm-submit-exam"
                onClick={handleSubmitExam}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
              >
                {examMode === 'tutor' ? 'Mostra Debriefing' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal di Conferma Interruzione Esame */}
      {showAbandonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowAbandonModal(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl dark:bg-zinc-900 dark:border-zinc-800 light:bg-white light:border-slate-200"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="abandon-modal-title"
          >
            <div className="flex items-center gap-2.5 text-rose-400 light:text-rose-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 id="abandon-modal-title" className="font-bold text-base text-zinc-100 dark:text-zinc-100 light:text-slate-900">
                Interrompere la Simulazione?
              </h3>
            </div>

            <div className="text-xs text-zinc-300 dark:text-zinc-300 light:text-slate-600 space-y-2">
              <p>
                Sei sicuro di voler interrompere la prova in corso?
              </p>
              <p className="text-amber-400 dark:text-amber-400 light:text-amber-700 font-medium">
                {examMode === 'tutor'
                  ? 'Le risposte verificate finora rimangono registrate nel tuo studio, ma la sessione d\'esame verrà chiusa.'
                  : answeredCount > 0
                  ? `Le ${answeredCount} risposte fornite finora andranno perse e la scheda non verrà conteggiata.`
                  : 'La simulazione verrà annullata senza registrare alcuna risposta.'}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                id="btn-cancel-abandon"
                onClick={() => setShowAbandonModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                Rimani
              </button>
              <button
                id="btn-confirm-abandon-exam"
                onClick={async () => {
                  isDismissedRef.current = true;
                  voiceService.stop();
                  setShowAbandonModal(false);
                  setIsExamRunning(false);
                  setExamQuestions([]);
                  setAnswers({});
                  setFlags({});
                  setCurrentIndex(0);
                  setExamState('idle');
                  await dismissActiveSession();
                }}
                className="flex-1 py-2.5 rounded-xl border border-rose-500/60 text-rose-400 hover:bg-rose-500/10 light:text-rose-600 light:border-rose-300 text-xs font-medium transition-colors"
              >
                Interrompi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
