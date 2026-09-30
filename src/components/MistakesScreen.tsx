import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Flame,
  FileText,
  Headphones
} from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { QuestionCard } from './QuestionCard';
import { QuizBottomBar } from './QuizBottomBar';

export const MistakesScreen: React.FC = () => {
  const {
    questions,
    statsMap,
    recordAnswer,
    mistakesCount,
    settings,
    openDriveMode,
    registerAudioSessionContext,
    activeSession,
    persistActiveSession,
    dismissActiveSession
  } = useQuiz();

  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewAnswers, setReviewAnswers] = useState<Record<number, 1 | 2 | 3>>({});

  // Lista domande attualmente nel quaderno errori
  const mistakeQuestions = questions.filter(q => {
    const s = statsMap.get(q.id);
    return s && s.timesWrong > 0 && s.consecutiveCorrect < 2;
  });

  // Auto-resume mistakes review session if present
  React.useEffect(() => {
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

  const startReviewSession = () => {
    if (mistakeQuestions.length === 0) return;
    setReviewQuestions(mistakeQuestions);
    setCurrentIndex(0);
    setReviewAnswers({});
    setIsReviewing(true);

    persistActiveSession({
      type: 'mistakes',
      subjectName: 'Quaderno Errori',
      questionIds: mistakeQuestions.map(q => q.id),
      currentIndex: 0,
      answers: {},
      updatedAt: Date.now()
    });
  };

  const currentQ = reviewQuestions[currentIndex];

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
  };

  const changeIndex = (newIndex: number) => {
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
      <div className="max-w-2xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 space-y-2.5 sm:space-y-3 pb-20 sm:pb-24">
        {/* Top bar ripasso */}
        <div className="flex items-center justify-between p-2 sm:p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl light:bg-white light:border-slate-200">
          <button
            onClick={() => {
              setIsReviewing(false);
              dismissActiveSession();
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200 light:text-slate-600 flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Esci</span>
          </button>

          <div className="text-xs font-bold text-rose-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            <span>Ripasso Errori</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                openDriveMode({
                  questions: reviewQuestions,
                  currentIndex,
                  answers: reviewAnswers,
                  flags: {},
                  onAnswer: (qid, ans) => handleAnswer(ans, qid),
                  onToggleFlag: () => {},
                  onNavigateIndex: (idx) => changeIndex(idx),
                  isExam: false,
                  title: 'Ripasso Errori'
                });
              }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Passa alla Modalità Audio"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Audio</span>
            </button>

            <div className="text-xs font-mono text-amber-400 light:text-amber-600 font-semibold">
              {currentIndex + 1}/{reviewQuestions.length}
            </div>
          </div>
        </div>

        {/* Badge Obiettivo 2 risposte corrette */}
        <div className="px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-zinc-400 flex items-center justify-between">
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
                    setIsReviewing(false);
                    dismissActiveSession();
                  }
                }
              : undefined
          }
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
        <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 light:bg-white light:border-slate-200 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-200 light:text-slate-800">
            Nessun errore da ripassare
          </h3>
          <p className="text-xs text-zinc-400 light:text-slate-600 max-w-sm mx-auto">
            Hai risposto correttamente a tutte le domande affrontate per almeno 2 volte consecutive. Ottimo lavoro! Avvia una simulazione d'esame per metterti alla prova.
          </p>
        </div>
      ) : (
        <>
          <button
            onClick={startReviewSession}
            className="w-full py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ripassa le {mistakesCount} Domande Sbagliate</span>
          </button>

          {/* Elenco dettagliato errori */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider">
              Domande da Ripassare
            </h3>
            <div className="space-y-2">
              {mistakeQuestions.map(q => {
                const s = statsMap.get(q.id);
                return (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/80 light:bg-white light:border-slate-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">#{q.id}</span>
                        <span className="text-zinc-400 light:text-slate-500">{q.subjectName}</span>
                      </div>
                      <p className="text-zinc-200 light:text-slate-800 line-clamp-2">
                        {q.question}
                      </p>
                      {s?.userNote && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-400 light:text-amber-700 bg-amber-950/40 light:bg-amber-50 px-2 py-0.5 rounded border border-amber-800/40 light:border-amber-200 w-fit max-w-full">
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate italic">Nota: "{s.userNote}"</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0 space-y-1">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                        {s?.timesWrong} err
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {s?.consecutiveCorrect || 0}/2 ok
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
