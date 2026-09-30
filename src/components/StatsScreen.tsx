import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Calendar,
  Clock,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { SubjectDetailModal } from './SubjectDetailModal';
import { QuestionDetailModal } from './QuestionDetailModal';

export interface StatsScreenProps {
  onTrainSubject?: (subjectId: number) => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ onTrainSubject }) => {
  const {
    questions,
    statsMap,
    sessions,
    totalSeen,
    readinessScore,
    mistakesCount,
    subjectsAnalytics
  } = useQuiz();

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const totalQuestionsCount = questions.length;
  const coveragePercent = Math.round((totalSeen / totalQuestionsCount) * 100);

  // Top 10 domande più sbagliate
  const topWrongQuestions = questions
    .map(q => {
      const s = statsMap.get(q.id);
      return {
        question: q,
        timesWrong: s?.timesWrong || 0,
        timesSeen: s?.timesSeen || 0
      };
    })
    .filter(item => item.timesWrong > 0)
    .sort((a, b) => b.timesWrong - a.timesWrong)
    .slice(0, 10);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">I tuoi Progressi</h1>
        <p className="text-xs text-zinc-400 light:text-slate-600">
          Come sta procedendo la tua preparazione per l'esame VDS-VL
        </p>
      </div>

      {/* Card Prontezza Esame Principale */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-md light:bg-white light:border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 light:text-slate-500 uppercase tracking-wider">
              Preparazione Esame
            </span>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 light:text-amber-600">
              {readinessScore}%
            </div>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Award className="w-9 h-9" />
          </div>
        </div>

        {/* Progress bar Prontezza */}
        <div className="w-full bg-zinc-950 light:bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              readinessScore >= 90
                ? 'bg-emerald-500'
                : readinessScore >= 70
                ? 'bg-amber-500'
                : 'bg-amber-600'
            }`}
            style={{ width: `${readinessScore}%` }}
          />
        </div>

        {/* 3 Metric Box */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-950/60 light:bg-slate-50 border border-zinc-800/80 light:border-slate-200">
            <div className="text-zinc-400 light:text-slate-500 text-[10px]">Quiz Visti</div>
            <div className="font-bold text-zinc-200 light:text-slate-800 mt-0.5">
              {totalSeen}/{totalQuestionsCount}
            </div>
            <div className="text-[10px] text-amber-400">{coveragePercent}%</div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 light:bg-slate-50 border border-zinc-800/80 light:border-slate-200">
            <div className="text-zinc-400 light:text-slate-500 text-[10px]">Errori</div>
            <div className="font-bold text-rose-400 mt-0.5">
              {mistakesCount}
            </div>
            <div className="text-[10px] text-zinc-500 light:text-slate-500">da rivedere</div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 light:bg-slate-50 border border-zinc-800/80 light:border-slate-200">
            <div className="text-zinc-400 light:text-slate-500 text-[10px]">Simulazioni</div>
            <div className="font-bold text-zinc-200 light:text-slate-800 mt-0.5">
              {sessions.length}
            </div>
            <div className="text-[10px] text-emerald-400">
              {sessions.filter(s => s.isPassed).length} superate
            </div>
          </div>
        </div>
      </div>

      {/* Radar / Prestazioni per Materia */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900 light:bg-white light:border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Risposte Esatte per Materia</span>
          </h3>
          <span className="text-[10px] text-zinc-500 italic hidden sm:inline">
            Tocca una materia per ispezionarla
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          {subjectsAnalytics.map(sub => {
            return (
              <button
                type="button"
                key={sub.id}
                id={`btn-stat-subject-${sub.id}`}
                onClick={() => setSelectedSubjectId(sub.id)}
                className="w-full text-left space-y-1 p-2 rounded-xl hover:bg-zinc-800/50 light:hover:bg-slate-100 transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 light:text-slate-700 font-medium truncate max-w-[220px] group-hover:text-amber-400 light:group-hover:text-amber-600 transition-colors">
                    0{sub.id} {sub.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-[11px]">
                      {sub.seen}/{sub.total}
                    </span>
                    <span
                      className={`font-bold w-9 text-right ${
                        sub.accuracy >= 90
                          ? 'text-emerald-400'
                          : sub.accuracy >= 70
                          ? 'text-amber-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {sub.seen > 0 ? `${sub.accuracy}%` : '-'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 light:group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                <div className="w-full bg-zinc-950 light:bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      sub.accuracy >= 90
                        ? 'bg-emerald-500'
                        : sub.accuracy >= 70
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${sub.accuracy}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Storico Ultime Simulazioni */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900 light:bg-white light:border-slate-200 space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Storico Simulazioni d'Esame</span>
        </h3>

        {sessions.length === 0 ? (
          <p className="text-xs text-zinc-500 py-3 text-center">
            Nessuna simulazione completata finora.
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s, idx) => {
              const dateStr = new Date(s.date).toLocaleDateString('it-IT', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });
              const mins = Math.floor(s.durationSeconds / 60);

              return (
                <div
                  key={s.id || idx}
                  className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          s.isPassed
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {s.isPassed ? 'IDONEO' : 'NON IDONEO'}
                      </span>
                      <span className="font-mono font-bold text-zinc-200 light:text-slate-800">
                        {s.correctAnswers}/{s.totalQuestions} ({s.wrongAnswers} err)
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {mins} min
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top 10 Domande Più Sbagliate */}
      {topWrongQuestions.length > 0 && (
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900 light:bg-white light:border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Top 10 Domande con Più Errori</span>
            </h3>
            <span className="text-[10px] text-zinc-500 italic hidden sm:inline">
              Tocca una domanda per la scheda completa
            </span>
          </div>

          <div className="space-y-2">
            {topWrongQuestions.map(item => (
              <button
                type="button"
                key={item.question.id}
                id={`btn-stat-wrong-q-${item.question.id}`}
                onClick={() => setSelectedQuestion(item.question)}
                className="w-full text-left p-2.5 rounded-lg border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/50 hover:border-zinc-700 light:bg-slate-50 light:border-slate-200 light:hover:bg-slate-100 text-xs flex items-center justify-between gap-3 transition-colors group cursor-pointer"
              >
                <div className="space-y-0.5 truncate flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">
                      #{item.question.id}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {item.question.subjectName}
                    </span>
                  </div>
                  <p className="text-zinc-300 light:text-slate-700 truncate group-hover:text-zinc-100 light:group-hover:text-slate-900">
                    {item.question.question}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 light:bg-rose-100 light:text-rose-700 font-bold text-[10px]">
                    {item.timesWrong} {item.timesWrong === 1 ? 'errore' : 'errori'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 light:group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modale Dettaglio Materia */}
      <SubjectDetailModal
        subjectId={selectedSubjectId}
        isOpen={selectedSubjectId !== null}
        onClose={() => setSelectedSubjectId(null)}
        onSelectQuestion={(q) => setSelectedQuestion(q)}
        onTrainSubject={onTrainSubject}
      />

      {/* Modale Dettaglio Domanda */}
      <QuestionDetailModal
        question={selectedQuestion}
        isOpen={selectedQuestion !== null}
        onClose={() => setSelectedQuestion(null)}
      />
    </div>
  );
};
