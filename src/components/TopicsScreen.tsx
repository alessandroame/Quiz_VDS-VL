import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Pause
} from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { QuestionCard } from './QuestionCard';
import { QuizBottomBar } from './QuizBottomBar';
import { voiceService } from '../services/voiceService';
import { SessionInterruptModal } from './SessionInterruptModal';
import { SessionConflictModal } from './SessionConflictModal';
import { getNextQuestionIndex } from '../utils/quizNavigation';

export interface TopicsScreenProps {
  initialSubjectId?: number | null;
  onClearInitialSubjectId?: () => void;
  onNavigateHome?: () => void;
}

export const TopicsScreen: React.FC<TopicsScreenProps> = ({
  initialSubjectId,
  onClearInitialSubjectId,
  onNavigateHome
}) => {
  const {
    questions,
    filteredQuestions,
    statsMap,
    recordAnswer,
    subjectsAnalytics,
    settings,
    registerAudioSessionContext,
    activeSession,
    persistActiveSession,
    dismissActiveSession
  } = useQuiz();

  const [activeSubjectId, setActiveSubjectId] = useState<number | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, 1 | 2 | 3>>({});
  const [showInterruptModal, setShowInterruptModal] = useState(false);
  const [conflictSub, setConflictSub] = useState<{ id: number; mode: 'all' | 'unseen' | 'wrong' } | null>(null);

  // Stop any voice playback on component unmount
  useEffect(() => {
    return () => {
      voiceService.stop();
    };
  }, []);

  const startTopicSession = (subId: number, mode: 'all' | 'unseen' | 'wrong' = 'all') => {
    setActiveSubjectId(subId);
    setCurrentIndex(0);
    setSessionAnswers({});

    let list = filteredQuestions.filter(q => q.subjectId === subId);

    if (mode === 'unseen') {
      list = list.filter(q => {
        const stat = statsMap.get(q.id);
        return !stat || stat.timesSeen === 0;
      });
    } else if (mode === 'wrong') {
      list = list.filter(q => {
        const stat = statsMap.get(q.id);
        return stat && stat.timesWrong > 0 && stat.consecutiveCorrect < 2;
      });
    }

    // Se il filtro non produce risultati, prendi tutti della disciplina attiva
    if (list.length === 0) {
      list = filteredQuestions.filter(q => q.subjectId === subId);
    }

    setSessionQuestions(list);

    const subMeta = subjectsAnalytics.find(s => s.id === subId);
    persistActiveSession({
      type: 'topic',
      subjectId: subId,
      subjectName: subMeta?.name || `Materia #${subId}`,
      mode,
      questionIds: list.map(q => q.id),
      currentIndex: 0,
      answers: {},
      isPaused: false,
      updatedAt: Date.now()
    });
  };

  const handleRequestStartTopic = (subId: number, mode: 'all' | 'unseen' | 'wrong' = 'all') => {
    if (activeSession && activeSession.questionIds?.length > 0 && (activeSession.type !== 'topic' || activeSession.subjectId !== subId)) {
      setConflictSub({ id: subId, mode });
    } else {
      startTopicSession(subId, mode);
    }
  };

  // Launch initial subject session if triggered from external drilldown (e.g. StatsScreen)
  useEffect(() => {
    if (initialSubjectId !== undefined && initialSubjectId !== null) {
      startTopicSession(initialSubjectId, 'all');
      onClearInitialSubjectId?.();
    }
  }, [initialSubjectId]);

  // Auto-resume topic session from activeSession if available
  React.useEffect(() => {
    if (activeSubjectId === null && activeSession?.type === 'topic' && activeSession.subjectId) {
      const ordered = activeSession.questionIds
        .map(id => questions.find(q => q.id === id))
        .filter((q): q is Question => Boolean(q));

      if (ordered.length > 0) {
        setActiveSubjectId(activeSession.subjectId);
        setSessionQuestions(ordered);
        setCurrentIndex(Math.min(activeSession.currentIndex || 0, ordered.length - 1));
        setSessionAnswers(activeSession.answers || {});
      }
    }
  }, [activeSession, activeSubjectId, questions]);

  const currentQ = sessionQuestions[currentIndex];
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
    if (activeSubjectId !== null) {
      const currentSubjectMeta = subjectsAnalytics.find(s => s.id === activeSubjectId);
      persistActiveSession({
        type: 'topic',
        subjectId: activeSubjectId,
        subjectName: currentSubjectMeta?.name,
        questionIds: sessionQuestions.map(q => q.id),
        currentIndex: newIndex,
        answers: sessionAnswers,
        updatedAt: Date.now()
      });
    }
  };

  const handleAnswer = async (ans: 1 | 2 | 3, qid?: number) => {
    const targetQid = qid ?? currentQ?.id;
    if (!targetQid || sessionAnswers[targetQid]) return;
    const targetQ = sessionQuestions.find(q => q.id === targetQid) || currentQ;
    if (!targetQ) return;

    const updatedAnswers = { ...sessionAnswers, [targetQid]: ans };
    setSessionAnswers(updatedAnswers);
    const isCorrect = ans === targetQ.correctAnswer;
    await recordAnswer(targetQid, isCorrect);

    if (activeSubjectId !== null) {
      const currentSubjectMeta = subjectsAnalytics.find(s => s.id === activeSubjectId);
      persistActiveSession({
        type: 'topic',
        subjectId: activeSubjectId,
        subjectName: currentSubjectMeta?.name,
        questionIds: sessionQuestions.map(q => q.id),
        currentIndex,
        answers: updatedAnswers,
        updatedAt: Date.now()
      });
    }

    // Auto-advance on correct answer if enabled in settings
    if (
      isCorrect &&
      settings.autoAdvanceOnCorrect !== false &&
      targetQid === currentQ?.id
    ) {
      const nextIdx = getNextQuestionIndex(currentIndex, sessionQuestions, updatedAnswers, { fallbackToEndIfComplete: true });
      if (nextIdx !== currentIndex) {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = setTimeout(() => {
          changeIndex(nextIdx);
        }, 900);
      }
    }
  };

  const currentSubjectMeta = subjectsAnalytics.find(s => s.id === activeSubjectId);

  // Registra la sessione audio attiva per lo switch universale
  React.useEffect(() => {
    if (activeSubjectId === null || sessionQuestions.length === 0) {
      registerAudioSessionContext(null);
      return;
    }

    registerAudioSessionContext({
      questions: sessionQuestions,
      currentIndex,
      answers: sessionAnswers,
      flags: {},
      onAnswer: (qid: number, ans: 1 | 2 | 3) => handleAnswer(ans, qid),
      onToggleFlag: () => {},
      onNavigateIndex: (idx: number) => changeIndex(idx),
      isExam: false,
      onAbandonSession: () => {
        voiceService.stop();
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
          autoAdvanceTimerRef.current = null;
        }
        setActiveSubjectId(null);
      },
      title: currentSubjectMeta?.name || 'Materia'
    });

    return () => {
      registerAudioSessionContext(null);
    };
  }, [activeSubjectId, sessionQuestions, currentIndex, sessionAnswers, currentSubjectMeta, registerAudioSessionContext]);

  // --- Vista Sessione Quiz per Materia ---
  if (activeSubjectId !== null && currentQ) {
    const answeredCount = Object.keys(sessionAnswers).length;

    return (
      <div className="max-w-2xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 space-y-2.5 sm:space-y-3 pb-28 sm:pb-32">
        {/* Top bar sessione */}
        <div className="flex items-center justify-between p-2 sm:p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl light:bg-white light:border-slate-300 light:shadow-sm">
          <button
            id="btn-topics-interrupt"
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

          <div className="text-xs font-bold text-zinc-200 light:text-slate-800 truncate max-w-[180px]">
            {currentSubjectMeta?.name}
          </div>

          <div className="text-xs font-mono text-amber-400 light:text-amber-800 font-semibold">
            {currentIndex + 1}/{sessionQuestions.length}
          </div>
        </div>

        {/* Card Domanda con Feedback Immediato */}
        <QuestionCard
          question={currentQ}
          selectedAnswer={sessionAnswers[currentQ.id]}
          onSelectAnswer={handleAnswer}
          showFeedback={settings.immediateFeedbackInTopics}
          indexNumber={currentIndex + 1}
          totalNumber={sessionQuestions.length}
        />

        {/* Barra Navigazione Quiz Ancorata in Basso */}
        <QuizBottomBar
          currentIndex={currentIndex}
          totalCount={sessionQuestions.length}
          onPrevious={() => changeIndex(Math.max(0, currentIndex - 1))}
          onNext={() => changeIndex(getNextQuestionIndex(currentIndex, sessionQuestions, sessionAnswers))}
          isPreviousDisabled={currentIndex === 0}
          previousId="btn-topics-prev-question"
          nextId="btn-topics-next-question"
          centerContent={
            <span className="font-mono text-zinc-400 light:text-slate-500 font-semibold">
              {currentIndex + 1} / {sessionQuestions.length}
            </span>
          }
          primaryAction={
            currentIndex === sessionQuestions.length - 1
              ? {
                  id: 'btn-topics-complete',
                  label: `Concludi (${answeredCount})`,
                  variant: 'emerald',
                  icon: <CheckCircle2 className="w-4 h-4" />,
                  onClick: () => {
                    voiceService.stop();
                    if (autoAdvanceTimerRef.current) {
                      clearTimeout(autoAdvanceTimerRef.current);
                      autoAdvanceTimerRef.current = null;
                    }
                    setActiveSubjectId(null);
                    dismissActiveSession();
                  }
                }
              : undefined
          }
        />

        {/* Modale Interruzione Sessione Materia */}
        <SessionInterruptModal
          isOpen={showInterruptModal}
          onClose={() => {
            setShowInterruptModal(false);
          }}
          onPause={() => {
            voiceService.stop();
            if (activeSubjectId !== null) {
              const currentSubjectMeta = subjectsAnalytics.find(s => s.id === activeSubjectId);
              persistActiveSession({
                type: 'topic',
                subjectId: activeSubjectId,
                subjectName: currentSubjectMeta?.name,
                questionIds: sessionQuestions.map(q => q.id),
                currentIndex,
                answers: sessionAnswers,
                isPaused: true,
                pausedAt: Date.now(),
                updatedAt: Date.now()
              }).catch(console.error);
            }
            setActiveSubjectId(null);
            setShowInterruptModal(false);
            if (onNavigateHome) {
              onNavigateHome();
            }
          }}
          onTerminate={async () => {
            voiceService.stop();
            setActiveSubjectId(null);
            setShowInterruptModal(false);
            await dismissActiveSession();
            if (onNavigateHome) {
              onNavigateHome();
            }
          }}
          sessionTitle={`Studio Materia: ${currentSubjectMeta?.name || 'Materia'}`}
          currentIndex={currentIndex}
          totalQuestions={sessionQuestions.length}
          answeredCount={answeredCount}
        />
      </div>
    );
  }

  // --- Vista Elenco 9 Materie ---
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Materie Ufficiali</h1>
        <p className="text-xs text-zinc-400 light:text-slate-600">
          9 argomenti codificati AeCI VDS-VL
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {subjectsAnalytics.map(sub => {
          const coveragePct = sub.total > 0 ? Math.round((sub.seen / sub.total) * 100) : 0;

          return (
            <div
              key={sub.id}
              className="p-4 rounded-xl border border-zinc-700 bg-zinc-900/90 light:bg-white light:border-slate-300 light:shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono text-amber-400 light:text-amber-800 font-bold">
                    0{sub.id}
                  </div>
                  <h3 className="font-bold text-sm text-zinc-100 light:text-slate-900">
                    {sub.name}
                  </h3>
                  <div className="text-xs text-zinc-400 light:text-slate-600 mt-0.5">
                    {sub.seen} viste su {sub.total} quesiti
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-bold ${
                      sub.accuracy >= 90
                        ? 'text-emerald-400 light:text-emerald-700'
                        : sub.accuracy >= 70
                        ? 'text-amber-400 light:text-amber-800'
                        : 'text-zinc-400'
                    }`}
                  >
                    {sub.seen > 0 ? `${sub.accuracy}%` : '-'}
                  </div>
                  <div className="text-[10px] text-zinc-400 light:text-slate-600 uppercase tracking-wider font-medium">
                    Precisione
                  </div>
                </div>
              </div>

              {/* Progress bar vista */}
              <div className="w-full bg-zinc-950/80 border border-zinc-800 light:bg-slate-200 light:border-slate-300/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${coveragePct}%` }}
                />
              </div>

              {/* Pulsanti Avvio per Filtro */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <button
                  id={`btn-topic-all-${sub.id}`}
                  onClick={() => handleRequestStartTopic(sub.id, 'all')}
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Tutte ({sub.total})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {sub.total - sub.seen > 0 && (
                  <button
                    onClick={() => handleRequestStartTopic(sub.id, 'unseen')}
                    className="py-2 px-3 rounded-lg border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 light:bg-slate-50 light:border-slate-300 light:text-slate-700 text-xs font-medium"
                    title="Solo domande mai viste"
                  >
                    <span>Mai viste ({sub.total - sub.seen})</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modale Conflitto Sessione per Materie */}
      <SessionConflictModal
        isOpen={conflictSub !== null}
        onClose={() => setConflictSub(null)}
        onResumeExisting={() => {
          setConflictSub(null);
          if (activeSession?.subjectId) {
            setActiveSubjectId(activeSession.subjectId);
          }
        }}
        onDiscardAndStartNew={async () => {
          const target = conflictSub;
          setConflictSub(null);
          await dismissActiveSession();
          if (target) {
            startTopicSession(target.id, target.mode);
          }
        }}
        existingTitle={
          activeSession?.subjectName ||
          (activeSession?.type === 'exam'
            ? activeSession.examMode === 'tutor'
              ? 'Tutor'
              : 'Esame Ufficiale'
            : 'Sessione di Studio')
        }
        existingProgress={`Domanda ${(activeSession?.currentIndex || 0) + 1} di ${
          activeSession?.questionIds?.length || 0
        } • ${activeSession?.answers ? Object.keys(activeSession.answers).length : 0} risposte date`}
        newSessionTitle={`Nuovo Studio: ${
          subjectsAnalytics.find(s => s.id === conflictSub?.id)?.name || 'Materia'
        }`}
      />
    </div>
  );
};
