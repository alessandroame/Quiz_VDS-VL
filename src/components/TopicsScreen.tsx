import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Headphones
} from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { QuestionCard } from './QuestionCard';
import { QuizBottomBar } from './QuizBottomBar';

export const TopicsScreen: React.FC = () => {
  const {
    questions,
    filteredQuestions,
    statsMap,
    recordAnswer,
    subjectsAnalytics,
    settings,
    openDriveMode,
    registerAudioSessionContext,
    activeSession,
    persistActiveSession,
    dismissActiveSession
  } = useQuiz();

  const [activeSubjectId, setActiveSubjectId] = useState<number | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, 1 | 2 | 3>>({});

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
      updatedAt: Date.now()
    });
  };

  const currentQ = sessionQuestions[currentIndex];

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
  };

  const changeIndex = (newIndex: number) => {
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
      <div className="max-w-2xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 space-y-2.5 sm:space-y-3 pb-20 sm:pb-24">
        {/* Top bar sessione */}
        <div className="flex items-center justify-between p-2 sm:p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl light:bg-white light:border-slate-200">
          <button
            onClick={() => {
              setActiveSubjectId(null);
              dismissActiveSession();
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200 light:text-slate-600 flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Esci</span>
          </button>

          <div className="text-xs font-bold text-zinc-200 light:text-slate-800 truncate max-w-[180px]">
            {currentSubjectMeta?.name}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                openDriveMode({
                  questions: sessionQuestions,
                  currentIndex,
                  answers: sessionAnswers,
                  flags: {},
                  onAnswer: (qid: number, ans: 1 | 2 | 3) => handleAnswer(ans, qid),
                  onToggleFlag: () => {},
                  onNavigateIndex: (idx: number) => changeIndex(idx),
                  isExam: false,
                  title: currentSubjectMeta?.name || 'Materia'
                });
              }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Passa alla Modalità Audio"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Audio</span>
            </button>

            <div className="text-xs font-mono text-amber-400 light:text-amber-600 font-semibold">
              {currentIndex + 1}/{sessionQuestions.length}
            </div>
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
          onNext={() => changeIndex(currentIndex + 1)}
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
                    setActiveSubjectId(null);
                    dismissActiveSession();
                  }
                }
              : undefined
          }
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
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 light:bg-white light:border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono text-amber-400 light:text-amber-600 font-bold">
                    0{sub.id}
                  </div>
                  <h3 className="font-bold text-sm text-zinc-100 light:text-slate-900">
                    {sub.name}
                  </h3>
                  <div className="text-xs text-zinc-400 light:text-slate-500 mt-0.5">
                    {sub.seen} viste su {sub.total} quesiti
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-bold ${
                      sub.accuracy >= 90
                        ? 'text-emerald-400 light:text-emerald-600'
                        : sub.accuracy >= 70
                        ? 'text-amber-400 light:text-amber-600'
                        : 'text-zinc-400'
                    }`}
                  >
                    {sub.seen > 0 ? `${sub.accuracy}%` : '-'}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Precisione
                  </div>
                </div>
              </div>

              {/* Progress bar vista */}
              <div className="w-full bg-zinc-950 light:bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${coveragePct}%` }}
                />
              </div>

              {/* Pulsanti Avvio per Filtro */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <button
                  id={`btn-topic-all-${sub.id}`}
                  onClick={() => startTopicSession(sub.id, 'all')}
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Tutte ({sub.total})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {sub.total - sub.seen > 0 && (
                  <button
                    onClick={() => startTopicSession(sub.id, 'unseen')}
                    className="py-2 px-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700 text-xs font-medium"
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
    </div>
  );
};
