import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Flame,
  FileText,
  ChevronRight,
  Pause
} from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { QuestionCard } from './QuestionCard';
import { QuizBottomBar } from './QuizBottomBar';
import { voiceService } from '../services/voiceService';
import { QuestionDetailModal } from './QuestionDetailModal';
import { SessionInterruptModal } from './SessionInterruptModal';
import { SessionConflictModal } from './SessionConflictModal';

export interface MistakesScreenProps {
  onNavigateHome?: () => void;
}

export const MistakesScreen: React.FC<MistakesScreenProps> = ({ onNavigateHome }) => {
  const {
    questions,
    statsMap,
    recordAnswer,
    mistakesCount,
    settings,
    registerAudioSessionContext,
    activeSession,
    persistActiveSession,
    dismissActiveSession
  } = useQuiz();

  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewAnswers, setReviewAnswers] = useState<Record<number, 1 | 2 | 3>>({});
  const [showInterruptModal, setShowInterruptModal] = useState(false);
  const [conflictPendingPool, setConflictPendingPool] = useState<Question[] | null>(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedQuestionForModal, setSelectedQuestionForModal] = useState<Question | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Stop any voice playback on component unmount
  useEffect(() => {
    return () => {
      voiceService.stop();
    };
  }, []);

  // Lista domande attualmente nel quaderno errori
  const mistakeQuestions = useMemo(() => {
    return questions.filter(q => {
      const s = statsMap.get(q.id);
      return s && s.timesWrong > 0 && s.consecutiveCorrect < 2;
    });
  }, [questions, statsMap]);

  // Materie presenti negli errori
  const subjectsWithErrors = useMemo(() => {
    const map = new Map<number, { id: number; name: string; count: number }>();
    for (const q of mistakeQuestions) {
      const entry = map.get(q.subjectId);
      if (entry) {
        entry.count++;
      } else {
        map.set(q.subjectId, { id: q.subjectId, name: q.subjectName, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.id - b.id);
  }, [mistakeQuestions]);

  // Resetta il filtro se la materia non ha più errori
  useEffect(() => {
    if (selectedSubjectId !== null) {
      const hasQuestions = mistakeQuestions.some(q => q.subjectId === selectedSubjectId);
      if (!hasQuestions) {
        setSelectedSubjectId(null);
      }
    }
  }, [mistakeQuestions, selectedSubjectId]);

  // Domande mostrate in base al filtro materia
  const displayedMistakeQuestions = useMemo(() => {
    if (selectedSubjectId === null) return mistakeQuestions;
    return mistakeQuestions.filter(q => q.subjectId === selectedSubjectId);
  }, [mistakeQuestions, selectedSubjectId]);

  // Auto-resume mistakes review session if present
  useEffect(() => {
    if (!isReviewing && activeSession?.type === 'mistakes' && activeSession.questionIds?.length > 0) {
      const ordered = activeSession.questionIds
        .map(id => questions.find(q => q.id === id))
        .filter((q): q is Question => Boolean(q));

      if (ordered.length > 0) {
        setReviewQuestions(ordered);
        setCurrentIndex(Math.min(activeSession.currentIndex || 0, ordered.length - 1));
        setReviewAnswers(activeSession.answers || {});
        setIsReviewing(true);
      }
    }
  }, [activeSession, isReviewing, questions]);

  const startReviewSession = (poolToUse?: Question[]) => {
    const targetPool = poolToUse ?? displayedMistakeQuestions;
    if (targetPool.length === 0) return;
    setReviewQuestions(targetPool);
    setCurrentIndex(0);
    setReviewAnswers({});
    setIsReviewing(true);

    const activeSubjectName = selectedSubjectId
      ? subjectsWithErrors.find(s => s.id === selectedSubjectId)?.name || 'Quaderno Errori'
      : 'Quaderno Errori';

    persistActiveSession({
      type: 'mistakes',
      subjectName: activeSubjectName,
      questionIds: targetPool.map(q => q.id),
      currentIndex: 0,
      answers: {},
      isPaused: false,
      updatedAt: Date.now()
    });
  };

  const handleRequestStartReview = (poolToUse?: Question[]) => {
    const targetPool = poolToUse ?? displayedMistakeQuestions;
    if (activeSession && activeSession.questionIds?.length > 0 && activeSession.type !== 'mistakes') {
      setConflictPendingPool(targetPool);
    } else {
      startReviewSession(targetPool);
    }
  };

  const currentQ = reviewQuestions[currentIndex];
  const autoAdvanceTimerRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [currentIndex]);

  const changeIndex = (newIndex: number) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setCurrentIndex(newIndex);
    persistActiveSession({
      type: 'mistakes',
      subjectName: 'Quaderno Errori',
      questionIds: reviewQuestions.map(q => q.id),
      currentIndex: newIndex,
      answers: reviewAnswers,
      updatedAt: Date.now()
    });
  };

  const handleAnswer = async (ans: 1 | 2 | 3, qid?: number) => {
    const targetQid = qid ?? currentQ?.id;
    if (!targetQid || reviewAnswers[targetQid]) return;
    const targetQ = reviewQuestions.find(q => q.id === targetQid) || currentQ;
    if (!targetQ) return;

    const updatedAnswers = { ...reviewAnswers, [targetQid]: ans };
    setReviewAnswers(updatedAnswers);
    const isCorrect = ans === targetQ.correctAnswer;
    await recordAnswer(targetQid, isCorrect);

    persistActiveSession({
      type: 'mistakes',
      subjectName: 'Quaderno Errori',
      questionIds: reviewQuestions.map(q => q.id),
      currentIndex,
      answers: updatedAnswers,
      updatedAt: Date.now()
    });

    // Auto-advance on correct answer if enabled in settings
    if (
      isCorrect &&
      settings.autoAdvanceOnCorrect !== false &&
      currentIndex < reviewQuestions.length - 1 &&
      targetQid === currentQ?.id
    ) {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = setTimeout(() => {
        changeIndex(currentIndex + 1);
      }, 900);
    }
  };

  // Registra la sessione audio attiva per lo switch universale
  React.useEffect(() => {
    if (!isReviewing || reviewQuestions.length === 0) {
      registerAudioSessionContext(null);
      return;
    }

    registerAudioSessionContext({
      questions: reviewQuestions,
      currentIndex,
      answers: reviewAnswers,
      flags: {},
      onAnswer: (qid, ans) => handleAnswer(ans, qid),
      onToggleFlag: () => {},
      onNavigateIndex: (idx) => changeIndex(idx),
      isExam: false,
      onAbandonSession: () => {
        voiceService.stop();
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
          autoAdvanceTimerRef.current = null;
        }
        setIsReviewing(false);
      },
      title: 'Ripasso Errori'
    });

    return () => {
      registerAudioSessionContext(null);
    };
  }, [isReviewing, reviewQuestions, currentIndex, reviewAnswers, registerAudioSessionContext]);

  // --- Modalità Ripasso in Corso ---
  if (isReviewing && currentQ) {
    const stat = statsMap.get(currentQ.id);
    const consecutive = stat?.consecutiveCorrect || 0;

    return (
      <div className="max-w-2xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 space-y-2.5 sm:space-y-3 pb-28 sm:pb-32">
        {/* Top bar ripasso */}
        <div className="flex items-center justify-between p-2 sm:p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl light:bg-white light:border-slate-300 light:shadow-sm">
          <button
            id="btn-mistakes-interrupt"
            onClick={() => {
              voiceService.stop();
              if (autoAdvanceTimerRef.current) {
                clearTimeout(autoAdvanceTimerRef.current);
                autoAdvanceTimerRef.current = null;
              }
              setShowInterruptModal(true);
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200 light:text-slate-600 flex items-center gap-1 font-medium"
          >
            <Pause className="w-4 h-4" />
            <span>Pausa</span>
          </button>

          <div className="text-xs font-bold text-rose-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            <span>Ripasso Errori</span>
          </div>

          <div className="text-xs font-mono text-amber-400 light:text-amber-600 font-semibold">
            {currentIndex + 1}/{reviewQuestions.length}
          </div>
        </div>

        {/* Badge Obiettivo 2 risposte corrette */}
        <div className="px-3 py-1.5 bg-zinc-900/80 border border-zinc-700 rounded-lg text-xs text-zinc-300 light:bg-slate-100 light:border-slate-300 light:text-slate-700 flex items-center justify-between font-medium">
          <span>Obiettivo: 2 risposte esatte di fila per toglierla</span>
          <span className="font-semibold text-zinc-200 light:text-slate-700">
            {consecutive}/2 completate
          </span>
        </div>

        {/* Card Domanda con Feedback Immediato */}
        <QuestionCard
          question={currentQ}
          selectedAnswer={reviewAnswers[currentQ.id]}
          onSelectAnswer={handleAnswer}
          showFeedback={settings.immediateFeedbackInTopics}
          indexNumber={currentIndex + 1}
          totalNumber={reviewQuestions.length}
        />

        {/* Barra Navigazione Quiz Ancorata in Basso */}
        <QuizBottomBar
          currentIndex={currentIndex}
          totalCount={reviewQuestions.length}
          onPrevious={() => changeIndex(Math.max(0, currentIndex - 1))}
          onNext={() => changeIndex(currentIndex + 1)}
          isPreviousDisabled={currentIndex === 0}
          previousId="btn-mistakes-prev-question"
          nextId="btn-mistakes-next-question"
          centerContent={
            <span className="font-mono text-zinc-400 light:text-slate-500 font-semibold">
              {currentIndex + 1} / {reviewQuestions.length}
            </span>
          }
          primaryAction={
            currentIndex === reviewQuestions.length - 1
              ? {
                  id: 'btn-mistakes-complete',
                  label: 'Concludi Ripasso',
                  variant: 'emerald',
                  icon: <CheckCircle2 className="w-4 h-4" />,
                  onClick: () => {
                    voiceService.stop();
                    if (autoAdvanceTimerRef.current) {
                      clearTimeout(autoAdvanceTimerRef.current);
                      autoAdvanceTimerRef.current = null;
                    }
                    setIsReviewing(false);
                    dismissActiveSession();
                  }
                }
              : undefined
          }
        />

        {/* Modale Interruzione Ripasso Errori */}
        <SessionInterruptModal
          isOpen={showInterruptModal}
          onClose={() => {
            setShowInterruptModal(false);
          }}
          onPause={() => {
            voiceService.stop();
            persistActiveSession({
              type: 'mistakes',
              subjectName: 'Quaderno Errori',
              questionIds: reviewQuestions.map(q => q.id),
              currentIndex,
              answers: reviewAnswers,
              isPaused: true,
              pausedAt: Date.now(),
              updatedAt: Date.now()
            }).catch(console.error);
            setIsReviewing(false);
            setShowInterruptModal(false);
            if (onNavigateHome) {
              onNavigateHome();
            }
          }}
          onTerminate={async () => {
            voiceService.stop();
            setIsReviewing(false);
            setShowInterruptModal(false);
            await dismissActiveSession();
            if (onNavigateHome) {
              onNavigateHome();
            }
          }}
          sessionTitle="Ripasso Quaderno Errori"
          currentIndex={currentIndex}
          totalQuestions={reviewQuestions.length}
          answeredCount={Object.keys(reviewAnswers).length}
        />
      </div>
    );
  }

  // --- Vista Principale Quaderno Errori ---
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quaderno Errori</h1>
          <p className="text-xs text-zinc-400 light:text-slate-600">
            Rispondi esattamente per 2 volte di fila per togliere una domanda dagli errori
          </p>
        </div>

        <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 font-bold text-xs">
          {mistakesCount} da ripassare
        </div>
      </div>

      {mistakesCount === 0 ? (
        <div className="p-8 rounded-2xl border border-zinc-700 bg-zinc-900/80 light:bg-white light:border-slate-300 light:shadow-sm text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-200 light:text-slate-800">
            Nessun errore da ripassare
          </h3>
          <p className="text-xs text-zinc-400 light:text-slate-600 max-w-sm mx-auto">
            Hai risposto correttamente a tutte le domande affrontate per almeno 2 volte consecutive. Inizia una simulazione d'esame per verificare la preparazione.
          </p>
        </div>
      ) : (
        <>
          {/* Filtro Materie con Errori */}
          {subjectsWithErrors.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                id="btn-mistakes-filter-all"
                onClick={() => setSelectedSubjectId(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                  selectedSubjectId === null
                    ? 'bg-zinc-800 text-zinc-100 border-zinc-600 light:bg-slate-200 light:text-slate-900 light:border-slate-400'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 light:bg-white light:text-slate-600 light:border-slate-200'
                }`}
              >
                Tutte ({mistakeQuestions.length})
              </button>
              {subjectsWithErrors.map(sub => (
                <button
                  key={sub.id}
                  id={`btn-mistakes-filter-${sub.id}`}
                  onClick={() => setSelectedSubjectId(selectedSubjectId === sub.id ? null : sub.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                    selectedSubjectId === sub.id
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 light:bg-rose-50 light:text-rose-700 light:border-rose-300'
                      : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 light:bg-white light:text-slate-600 light:border-slate-200'
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className="font-mono text-[10px] opacity-90">({sub.count})</span>
                </button>
              ))}
            </div>
          )}

          <button
            id="btn-start-mistakes-review"
            onClick={() => handleRequestStartReview(displayedMistakeQuestions)}
            className="w-full py-3.5 sm:py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>
              {selectedSubjectId !== null
                ? `Ripassa i ${displayedMistakeQuestions.length} Errori (${subjectsWithErrors.find(s => s.id === selectedSubjectId)?.name})`
                : `Ripassa le ${mistakeQuestions.length} Domande Sbagliate`}
            </span>
          </button>

          {/* Elenco dettagliato errori */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-300 light:text-slate-700 uppercase tracking-wider">
                Domande da Ripassare ({displayedMistakeQuestions.length})
              </h3>
              <span className="text-[11px] text-zinc-500 light:text-slate-400">
                Tocca per aprire scheda e spiegazione
              </span>
            </div>

            <div className="space-y-2">
              {displayedMistakeQuestions.map(q => {
                const s = statsMap.get(q.id);
                return (
                  <div
                    key={q.id}
                    id={`mistake-card-${q.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedQuestionForModal(q);
                      setIsDetailModalOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedQuestionForModal(q);
                        setIsDetailModalOpen(true);
                      }
                    }}
                    className="p-3.5 rounded-xl border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800/80 hover:border-zinc-600 light:bg-white light:border-slate-300 light:hover:border-slate-400 light:shadow-sm flex items-start justify-between gap-3 text-xs cursor-pointer transition-all active:scale-[0.99] group focus:outline-none focus:ring-1 focus:ring-amber-500/60"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">#{q.id}</span>
                        <span className="text-zinc-400 light:text-slate-600 truncate">{q.subjectName}</span>
                      </div>
                      <p className="text-zinc-200 light:text-slate-800 line-clamp-2 group-hover:text-zinc-100 transition-colors">
                        {q.question}
                      </p>
                      {s?.userNote && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-400 light:text-amber-700 bg-amber-950/40 light:bg-amber-50 px-2 py-0.5 rounded border border-amber-800/40 light:border-amber-200 w-fit max-w-full">
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate italic">Nota: "{s.userNote}"</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex flex-col items-end space-y-1">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                          {s?.timesWrong} err
                        </span>
                        <span className="text-[10px] text-zinc-400 light:text-slate-500 font-mono">
                          {s?.consecutiveCorrect || 0}/2 ok
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 light:text-slate-400 light:group-hover:text-slate-600 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Modal Dettaglio Domanda */}
      <QuestionDetailModal
        question={selectedQuestionForModal}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedQuestionForModal(null);
        }}
      />

      {/* Modale Conflitto Sessione in Sospeso per Ripasso Errori */}
      <SessionConflictModal
        isOpen={conflictPendingPool !== null}
        onClose={() => setConflictPendingPool(null)}
        onResumeExisting={() => {
          setConflictPendingPool(null);
        }}
        onDiscardAndStartNew={async () => {
          const pool = conflictPendingPool || displayedMistakeQuestions;
          setConflictPendingPool(null);
          await dismissActiveSession();
          startReviewSession(pool);
        }}
        existingTitle={
          activeSession?.subjectName ||
          (activeSession?.type === 'exam'
            ? activeSession.examMode === 'tutor'
              ? 'Simulazione Didattica (Tutor)'
              : 'Esame Ufficiale'
            : 'Sessione di Studio')
        }
        existingProgress={`Domanda ${(activeSession?.currentIndex || 0) + 1} di ${
          activeSession?.questionIds?.length || 0
        } • ${activeSession?.answers ? Object.keys(activeSession.answers).length : 0} risposte date`}
        newSessionTitle="Nuovo Ripasso Quaderno Errori"
      />
    </div>
  );
};
