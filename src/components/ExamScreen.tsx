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
  BookOpen
} from 'lucide-react';
import type { Question } from '../types/quiz';
import type { ExamSession, ExamModeType } from '../types/database';
import { useQuiz } from '../context/QuizContext';
import { generateExamQuestions } from '../utils/fairRandomizer';
import { evaluateExam } from '../services/examEvaluator';
import { formatTime } from '../utils/timer';
import { QuestionCard } from './QuestionCard';
import { QuestionNavigator } from './QuestionNavigator';
import { voiceService } from '../services/voiceService';
import { QuizBottomBar } from './QuizBottomBar';
import { backNavigation } from '../utils/backNavigation';

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
    dismissActiveSession
  } = useQuiz();

  // Exam state
  const [examState, setExamState] = useState<'idle' | 'running' | 'review'>('idle');
  const [examMode, setExamMode] = useState<ExamModeType>(initialMode);
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

  // Registra le modali di conferma con il coordinatore back navigation
  useEffect(() => {
    if (!showSubmitModal) return;
    const unregister = backNavigation.registerSubModal('exam-submit-modal', () => {
      setShowSubmitModal(false);
    });
    return () => unregister();
  }, [showSubmitModal]);

  useEffect(() => {
    if (!showAbandonModal) return;
    const unregister = backNavigation.registerSubModal('exam-abandon-modal', () => {
      setShowAbandonModal(false);
    });
    return () => unregister();
  }, [showAbandonModal]);

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
    setIsExamRunning(false);
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
  }, [answers, examQuestions, flags, isMarathon, examMode, elapsedSeconds, recordAnswer, saveExam, startTime, dismissActiveSession, setIsExamRunning]);

  // Registra la sessione audio attiva per consentire lo switch universale (Navbar o shortcut) senza perdere lo stato
  useEffect(() => {
    if (examState !== 'running' || examQuestions.length === 0) {
      registerAudioSessionContext(null);
      return;
    }

    registerAudioSessionContext({
      questions: examQuestions,
      currentIndex,
      answers,
      flags,
      onAnswer: (qid, ans) => handleSelectAnswer(ans, qid),
      onToggleFlag: (qid) => handleToggleFlag(qid),
      onNavigateIndex: (idx) => setCurrentIndex(idx),
      isExam: true,
      isTutor: examMode === 'tutor',
      secondsRemaining: examMode === 'tutor' ? elapsedSeconds : secondsRemaining,
      onSubmitExam: handleSubmitExam,
      title: examMode === 'tutor' ? 'Simulazione Didattica' : 'Esame Ufficiale'
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
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Card Principale: Simulazione Didattica (Tutor) */}
          <div className="p-5 sm:p-6 bg-zinc-900 border-2 border-emerald-500/50 hover:border-emerald-500 rounded-2xl transition-all shadow-md light:bg-white light:border-emerald-500/60 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-800 text-[10px] font-bold uppercase tracking-wider font-mono">
                  Consigliata per imparare
                </span>
                <span className="text-[11px] font-mono text-zinc-400 light:text-slate-500">
                  30 Quiz • Senza limiti di tempo
                </span>
              </div>
              <h2 className="font-bold text-lg sm:text-xl text-zinc-100 light:text-slate-900 flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-emerald-400" />
                <span>Simulazione Didattica (Tutor)</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 light:text-slate-600 leading-relaxed">
                Esercitazione guidata sui 30 quesiti ufficiali AeCI ripartiti per materia. Correzione cromatico-didattica istantanea ad ogni risposta con spiegazione dettagliata <strong>Regola</strong> e <strong>Tranello</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-zinc-950/60 light:bg-slate-50 border border-zinc-800 light:border-slate-200 rounded-xl space-y-2 text-xs text-zinc-300 light:text-slate-700">
              <div className="font-semibold text-zinc-200 light:text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Cosa prevede questa modalità:</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-zinc-400 light:text-slate-600">
                <li><strong>30 quiz bilanciati</strong> estratti con algoritmo Fair Coverage AeCI.</li>
                <li><strong>Nessun timer</strong>: rifletti con calma su ogni concetto teorico.</li>
                <li><strong>Feedback immediato</strong> con la spiegazione normativa e i tranelli tipici.</li>
                <li>Gli errori confluiscono automaticamente nel tuo <strong>Quaderno Errori</strong>.</li>
              </ul>
            </div>

            <button
              id="btn-start-tutor-exam"
              onClick={() => startExam('tutor')}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>Avvia Simulazione Didattica (30 Quiz)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

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

          <div className="p-3.5 bg-zinc-950/60 light:bg-slate-50 border border-zinc-800 light:border-slate-200 rounded-xl space-y-2 text-xs text-zinc-300 light:text-slate-700">
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
            onClick={() => startExam('official')}
            className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.99] light:bg-sky-600 light:hover:bg-sky-700"
          >
            <Timer className="w-4 h-4" />
            <span>Avvia Esame Ufficiale (45 min)</span>
          </button>
        </div>

        {/* Opzione Maratona Intensiva (Secondaria) */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition-all light:bg-slate-50 light:border-slate-200 flex items-center justify-between gap-3">
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
            onClick={() => startExam('marathon')}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 light:bg-slate-200 light:text-slate-800 light:hover:bg-slate-300 font-semibold text-xs whitespace-nowrap transition-colors flex-shrink-0"
          >
            Avvia Maratona
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
            <span>Vuoi prima esercitarti senza limiti di tempo? Passa a <strong>Tutor Didattico</strong></span>
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

        {/* Torna alla schermata principale Esame o Home */}
        <div className="flex justify-center pt-0.5">
          <button
            id="btn-return-home"
            onClick={() => {
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
            <span>← Torna al Cruscotto Home</span>
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
    <div className="max-w-2xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 space-y-2.5 sm:space-y-3 pb-20 sm:pb-24">
      {/* Top Bar: Timer, Progresso, Consegna */}
      <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl dark:bg-zinc-900 light:bg-white light:border-slate-200 shadow-sm sticky top-[48px] sm:top-[50px] z-20">
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

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="btn-abandon-exam"
            onClick={() => setShowAbandonModal(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-rose-500/40 hover:border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 light:border-rose-200 light:bg-rose-50 light:text-rose-700 light:hover:bg-rose-100 text-xs font-semibold transition-colors flex items-center gap-1"
            title="Interrompi la simulazione"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Interrompi</span>
          </button>

          <button
            id="btn-submit-exam-top"
            onClick={() => setShowSubmitModal(true)}
            className="px-2.5 py-1.5 sm:px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
          >
            {examMode === 'tutor' ? 'Concludi' : 'Consegna'}
            <span className="hidden sm:inline"> ({answeredCount}/{totalCount})</span>
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
        onSelectIndex={changeIndex}
      />

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
