import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Timer,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Zap,
  ListFilter,
  LogOut,
  Car
} from 'lucide-react';
import type { Question } from '../types/quiz';
import type { ExamSession } from '../types/database';
import { useQuiz } from '../context/QuizContext';
import { generateExamQuestions } from '../utils/fairRandomizer';
import { evaluateExam } from '../services/examEvaluator';
import { formatTime } from '../utils/timer';
import { QuestionCard } from './QuestionCard';

export const ExamScreen: React.FC = () => {
  const {
    questions,
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

  // Stato esame
  const [examState, setExamState] = useState<'idle' | 'running' | 'review'>('idle');
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 1 | 2 | 3>>({});
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60);
  const [startTime, setStartTime] = useState(0);
  const [isMarathon, setIsMarathon] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [completedSession, setCompletedSession] = useState<ExamSession | null>(null);

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

  // Auto-resume active exam if present
  useEffect(() => {
    if (examState === 'idle' && activeSession?.type === 'exam' && activeSession.questionIds?.length > 0) {
      const ordered = activeSession.questionIds
        .map(id => questions.find(q => q.id === id))
        .filter((q): q is Question => Boolean(q));

      if (ordered.length > 0) {
        setExamQuestions(ordered);
        setCurrentIndex(Math.min(activeSession.currentIndex || 0, ordered.length - 1));
        setAnswers(activeSession.answers || {});
        setFlags(activeSession.flags || {});
        setSecondsRemaining(activeSession.secondsRemaining || 45 * 60);
        setStartTime(activeSession.startTime || Date.now());
        setIsMarathon(Boolean(activeSession.isMarathon));
        setExamState('running');
      }
    }
  }, [activeSession, examState, questions]);

  const startExam = (marathon = false) => {
    setIsMarathon(marathon);
    const generated = generateExamQuestions(questions, statsMap, marathon);
    setExamQuestions(generated);
    setCurrentIndex(0);
    setAnswers({});
    setFlags({});
    const totalMinutes = marathon ? 60 : settings.examTimerMinutes || 45;
    const initialSeconds = totalMinutes * 60;
    setSecondsRemaining(initialSeconds);
    const now = Date.now();
    setStartTime(now);
    setCompletedSession(null);
    setExamState('running');

    persistActiveSession({
      type: 'exam',
      questionIds: generated.map(q => q.id),
      currentIndex: 0,
      answers: {},
      flags: {},
      secondsRemaining: initialSeconds,
      startTime: now,
      isMarathon: marathon,
      updatedAt: now
    });
  };

  // Timer countdown
  useEffect(() => {
    if (examState !== 'running') return;

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
  }, [examState]);

  const currentQuestion = examQuestions[currentIndex];
  const totalCount = examQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flags).filter(Boolean).length;

  const changeIndex = (newIndex: number) => {
    setCurrentIndex(newIndex);
    if (examState === 'running') {
      persistActiveSession({
        type: 'exam',
        questionIds: examQuestions.map(q => q.id),
        currentIndex: newIndex,
        answers,
        flags,
        secondsRemaining,
        startTime,
        isMarathon,
        updatedAt: Date.now()
      });
    }
  };

  const handleSelectAnswer = (ans: 1 | 2 | 3, qid?: number) => {
    const targetId = qid ?? currentQuestion?.id;
    if (!targetId) return;
    const updatedAnswers = { ...answers, [targetId]: ans };
    setAnswers(updatedAnswers);

    persistActiveSession({
      type: 'exam',
      questionIds: examQuestions.map(q => q.id),
      currentIndex,
      answers: updatedAnswers,
      flags,
      secondsRemaining,
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
      questionIds: examQuestions.map(q => q.id),
      currentIndex,
      answers,
      flags: updatedFlags,
      secondsRemaining,
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
  }, [examState, currentIndex, currentQuestion, totalCount]);

  const handleSubmitExam = useCallback(async () => {
    setShowSubmitModal(false);
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    const session = evaluateExam({
      questions: examQuestions,
      answers,
      flags,
      durationSeconds,
      isMarathon
    });

    // Registra telemetria permanente su Dexie per i quiz risposti
    for (const snap of session.snapshots) {
      if (snap.userAnswer !== undefined) {
        await recordAnswer(snap.questionId, snap.isCorrect);
      }
    }

    await saveExam(session);
    setCompletedSession(session);
    setExamState('review');

    if (session.isPassed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignora
      }
    }
  }, [answers, examQuestions, flags, isMarathon, recordAnswer, saveExam, startTime]);

  // --- Schermata IDLE: Avvio Esame ---
  if (examState === 'idle') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 mb-2">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Simulazione Esame</h1>
          <p className="text-xs text-zinc-400 light:text-slate-600 max-w-sm mx-auto">
            Regolamento Ufficiale AeCI (D.P.R. 133/2010): 30 quesiti proporzionali, max 3 errori, 45 minuti.
          </p>
        </div>

        {/* Card Regole Ufficiali */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 light:bg-white light:border-slate-200 shadow-sm space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-zinc-950/60 light:bg-slate-50 rounded-lg border border-zinc-800/80 light:border-slate-200">
              <div className="text-2xl font-black text-amber-400 light:text-amber-600">30</div>
              <div className="text-[11px] text-zinc-400 light:text-slate-500 font-medium">Quesiti</div>
            </div>
            <div className="p-3 bg-zinc-950/60 light:bg-slate-50 rounded-lg border border-zinc-800/80 light:border-slate-200">
              <div className="text-2xl font-black text-emerald-400 light:text-emerald-600">max 3</div>
              <div className="text-[11px] text-zinc-400 light:text-slate-500 font-medium">Errori Ammessi</div>
            </div>
            <div className="p-3 bg-zinc-950/60 light:bg-slate-50 rounded-lg border border-zinc-800/80 light:border-slate-200">
              <div className="text-2xl font-black text-amber-400 light:text-amber-600">45'</div>
              <div className="text-[11px] text-zinc-400 light:text-slate-500 font-medium">Tempo Limite</div>
            </div>
          </div>

          <div className="text-xs text-zinc-400 light:text-slate-500 pt-2 flex items-center justify-between border-t border-zinc-800 light:border-slate-100">
            <span>Selezione domande:</span>
            <span className="text-amber-400 light:text-amber-600 font-medium">Priorità a quelle non ancora viste</span>
          </div>
        </div>

        {/* Pulsanti Avvio */}
        <div className="space-y-3 pt-2">
          <button
            id="btn-start-exam"
            onClick={() => startExam(false)}
            className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-base shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span>Avvia Esame Ufficiale (30 Quiz)</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            id="btn-start-marathon"
            onClick={() => startExam(true)}
            className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 light:bg-slate-100 light:text-slate-700 light:border-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <ListFilter className="w-4 h-4" />
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
          <h2
            className={`text-2xl font-black tracking-tight ${
              isPassed ? 'text-emerald-300 light:text-emerald-800' : 'text-rose-300 light:text-rose-800'
            }`}
          >
            {isPassed ? 'IDONEO' : 'NON IDONEO'}
          </h2>
          <div className="text-sm font-semibold text-slate-300 light:text-slate-700">
            {correct}/{total} esatte ({errors} {errors === 1 ? 'errore' : 'errori'})
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600">
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
        <div className="flex gap-3">
          <button
            onClick={() => startExam(false)}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Nuovo Esame</span>
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

  // --- Schermata RUNNING: Esame in Corso ---
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Top Bar: Timer, Progresso, Consegna */}
      <div className="flex items-center justify-between gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl dark:bg-zinc-900 light:bg-white light:border-slate-200 shadow-sm sticky top-14 z-30">
        <div className="flex items-center gap-2">
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

          <div className="text-xs text-zinc-400 light:text-slate-600 font-medium">
            <span>{answeredCount}</span>/{totalCount}
            {flaggedCount > 0 && (
              <span className="ml-1 text-amber-400 font-medium">
                ({flaggedCount} ⚑)
              </span>
            )}
          </div>
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
                secondsRemaining,
                onSubmitExam: handleSubmitExam,
                title: 'Esame Ufficiale'
              });
            }}
            className="px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-800 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Passa alla Modalità Alla Guida per questo esame"
          >
            <Car className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Alla Guida</span>
          </button>

          <button
            id="btn-abandon-exam"
            onClick={() => setShowAbandonModal(true)}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-700/80 hover:border-rose-500/80 text-zinc-400 hover:text-rose-400 light:border-slate-300 light:text-slate-600 light:hover:text-rose-600 text-xs font-medium transition-colors flex items-center gap-1"
            title="Abbandona la sessione di esame"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Abbandona</span>
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
          >
            Consegna ({answeredCount}/{totalCount})
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
              bubbleStyle = 'border-amber-500 bg-amber-500 text-zinc-950 font-bold shadow-sm';
            }
            if (isFlagged) {
              bubbleStyle = 'border-amber-400 bg-amber-400/20 text-amber-300 font-bold ring-1 ring-amber-400';
            }
            if (isCurrent) {
              bubbleStyle += ' ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950 light:ring-offset-white';
            }

            return (
              <button
                key={q.id}
                onClick={() => changeIndex(idx)}
                className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center transition-all ${bubbleStyle}`}
                title={`Quesito #${q.id}`}
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
          showFeedback={false}
          isFlagged={flags[currentQuestion.id]}
          onToggleFlag={handleToggleFlag}
          indexNumber={currentIndex + 1}
          totalNumber={totalCount}
        />
      )}

      {/* Controlli Precedente / Successiva */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => changeIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 light:bg-white light:border-slate-200 light:text-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Precedente</span>
        </button>

        <button
          onClick={() => changeIndex(Math.min(totalCount - 1, currentIndex + 1))}
          disabled={currentIndex === totalCount - 1}
          className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 light:bg-white light:border-slate-200 light:text-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30"
        >
          <span>Successiva</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modal di Conferma Consegna */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl light:bg-white light:border-slate-200">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-zinc-100 light:text-slate-900">
                Consegna Esame
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
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal di Conferma Abbandono Esame */}
      {showAbandonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl light:bg-white light:border-slate-200">
            <div className="flex items-center gap-2 text-rose-400 light:text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-zinc-100 light:text-slate-900">
                Abbandonare l'Esame?
              </h3>
            </div>

            <div className="text-xs text-zinc-300 light:text-slate-600 space-y-2">
              <p>
                Sei sicuro di voler interrompere la simulazione in corso?
              </p>
              <p className="text-amber-400 light:text-amber-700 font-medium">
                Tutte le {answeredCount} risposte fornite finora andranno perse e la scheda non verrà conteggiata.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAbandonModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md"
              >
                Continua Esame
              </button>
              <button
                onClick={() => {
                  setShowAbandonModal(false);
                  setExamState('idle');
                  setIsExamRunning(false);
                  dismissActiveSession();
                }}
                className="flex-1 py-2.5 rounded-xl border border-rose-500/60 text-rose-400 hover:bg-rose-500/10 light:text-rose-600 light:border-rose-300 text-xs font-medium"
              >
                Abbandona
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
