import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame
} from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { QuestionCard } from './QuestionCard';

export const MistakesScreen: React.FC = () => {
  const { questions, statsMap, recordAnswer, mistakesCount, settings } = useQuiz();

  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewAnswers, setReviewAnswers] = useState<Record<number, 1 | 2 | 3>>({});

  // Lista domande attualmente nel quaderno errori
  const mistakeQuestions = questions.filter(q => {
    const s = statsMap.get(q.id);
    return s && s.timesWrong > 0 && s.consecutiveCorrect < 2;
  });

  const startReviewSession = () => {
    if (mistakeQuestions.length === 0) return;
    setReviewQuestions(mistakeQuestions);
    setCurrentIndex(0);
    setReviewAnswers({});
    setIsReviewing(true);
  };

  const currentQ = reviewQuestions[currentIndex];

  const handleAnswer = async (ans: 1 | 2 | 3) => {
    if (!currentQ || reviewAnswers[currentQ.id]) return;

    setReviewAnswers(prev => ({ ...prev, [currentQ.id]: ans }));
    const isCorrect = ans === currentQ.correctAnswer;
    await recordAnswer(currentQ.id, isCorrect);
  };

  // --- Modalità Ripasso in Corso ---
  if (isReviewing && currentQ) {
    const stat = statsMap.get(currentQ.id);
    const consecutive = stat?.consecutiveCorrect || 0;

    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Top bar ripasso */}
        <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl light:bg-white light:border-slate-200">
          <button
            onClick={() => setIsReviewing(false)}
            className="text-xs text-slate-400 hover:text-slate-200 light:text-slate-600 flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Esci</span>
          </button>

          <div className="text-xs font-bold text-rose-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            <span>Ripasso Errori</span>
          </div>

          <div className="text-xs font-mono text-sky-400 light:text-sky-600 font-semibold">
            {currentIndex + 1}/{reviewQuestions.length}
          </div>
        </div>

        {/* Badge Maestria Spaziata */}
        <div className="px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center justify-between">
          <span>Stato padronanza quesito:</span>
          <span className="font-semibold text-slate-200 light:text-slate-700">
            {consecutive}/2 successi consecutivi per uscire
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

        {/* Navigazione */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 light:bg-white light:border-slate-200 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Precedente</span>
          </button>

          {currentIndex < reviewQuestions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <span>Successiva</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsReviewing(false)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concludi Ripasso</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Vista Principale Quaderno Errori ---
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quaderno Errori</h1>
          <p className="text-xs text-slate-400 light:text-slate-600">
            Ripetizione spaziata (richiesti 2 successi consecutivi)
          </p>
        </div>

        <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 font-bold text-xs">
          {mistakesCount} nel quaderno
        </div>
      </div>

      {mistakesCount === 0 ? (
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/60 light:bg-white light:border-slate-200 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200 light:text-slate-800">
            Nessun errore pendente
          </h3>
          <p className="text-xs text-slate-400 light:text-slate-600 max-w-sm mx-auto">
            Tutte le domande affrontate sono state superate per almeno 2 volte consecutive. Esegui una simulazione esame per mettere alla prova la tua preparazione!
          </p>
        </div>
      ) : (
        <>
          <button
            onClick={startReviewSession}
            className="w-full py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ripassa {mistakesCount} Quesiti Sbagliati</span>
          </button>

          {/* Elenco dettagliato errori */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 light:text-slate-600 uppercase tracking-wider">
              Elenco Quesiti da Perfezionare
            </h3>
            <div className="space-y-2">
              {mistakeQuestions.map(q => {
                const s = statsMap.get(q.id);
                return (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 light:bg-white light:border-slate-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-400">#{q.id}</span>
                        <span className="text-slate-400 light:text-slate-500">{q.subjectName}</span>
                      </div>
                      <p className="text-slate-200 light:text-slate-800 line-clamp-2">
                        {q.question}
                      </p>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0 space-y-1">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                        {s?.timesWrong} err
                      </span>
                      <span className="text-[10px] text-slate-500">
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
