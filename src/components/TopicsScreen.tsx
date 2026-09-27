import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { QuestionCard } from './QuestionCard';

export const TopicsScreen: React.FC = () => {
  const { questions, statsMap, recordAnswer, subjectsAnalytics, settings } = useQuiz();

  const [activeSubjectId, setActiveSubjectId] = useState<number | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, 1 | 2 | 3>>({});

  const startTopicSession = (subId: number, mode: 'all' | 'unseen' | 'wrong' = 'all') => {
    setActiveSubjectId(subId);
    setCurrentIndex(0);
    setSessionAnswers({});

    let list = questions.filter(q => q.subjectId === subId);

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

    // Se il filtro non produce risultati, prendi tutti
    if (list.length === 0) {
      list = questions.filter(q => q.subjectId === subId);
    }

    setSessionQuestions(list);
  };

  const currentQ = sessionQuestions[currentIndex];

  const handleAnswer = async (ans: 1 | 2 | 3) => {
    if (!currentQ || sessionAnswers[currentQ.id]) return;

    setSessionAnswers(prev => ({ ...prev, [currentQ.id]: ans }));
    const isCorrect = ans === currentQ.correctAnswer;
    await recordAnswer(currentQ.id, isCorrect);
  };

  // --- Vista Sessione Quiz per Materia ---
  if (activeSubjectId !== null && currentQ) {
    const answeredCount = Object.keys(sessionAnswers).length;
    const currentSubjectMeta = subjectsAnalytics.find(s => s.id === activeSubjectId);

    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Top bar sessione */}
        <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl light:bg-white light:border-slate-200">
          <button
            onClick={() => setActiveSubjectId(null)}
            className="text-xs text-slate-400 hover:text-slate-200 light:text-slate-600 flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Esci</span>
          </button>

          <div className="text-xs font-bold text-slate-200 light:text-slate-800 truncate max-w-[180px]">
            {currentSubjectMeta?.name}
          </div>

          <div className="text-xs font-mono text-sky-400 light:text-sky-600 font-semibold">
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

          {currentIndex < sessionQuestions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <span>Successiva</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setActiveSubjectId(null)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concludi ({answeredCount})</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Vista Elenco 9 Materie ---
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Materie Ufficiali</h1>
          <p className="text-xs text-slate-400 light:text-slate-600">
            9 argomenti codificati AeCI VDS-VL
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {subjectsAnalytics.map(sub => {
          const coveragePct = sub.total > 0 ? Math.round((sub.seen / sub.total) * 100) : 0;

          return (
            <div
              key={sub.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 light:bg-white light:border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono text-sky-400 light:text-sky-600 font-bold">
                    0{sub.id}
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">
                    {sub.name}
                  </h3>
                  <div className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
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
                        : 'text-slate-400'
                    }`}
                  >
                    {sub.seen > 0 ? `${sub.accuracy}%` : '-'}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Precisione
                  </div>
                </div>
              </div>

              {/* Progress bar vista */}
              <div className="w-full bg-slate-950 light:bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${coveragePct}%` }}
                />
              </div>

              {/* Pulsanti Avvio per Filtro */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <button
                  onClick={() => startTopicSession(sub.id, 'all')}
                  className="flex-1 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Tutte ({sub.total})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {sub.total - sub.seen > 0 && (
                  <button
                    onClick={() => startTopicSession(sub.id, 'unseen')}
                    className="py-2 px-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700 text-xs font-medium"
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
