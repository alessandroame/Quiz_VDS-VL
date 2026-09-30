import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  HelpCircle
} from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { backNavigation } from '../utils/backNavigation';
import { isMistakeQuestion } from '../utils/analytics';
import { formatSubjectCode } from '../utils/archiveFilters';

export type SubjectFilterMode = 'all' | 'wrong' | 'unseen' | 'correct';

export interface SubjectDetailModalProps {
  subjectId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (question: Question) => void;
  onTrainSubject?: (subjectId: number) => void;
}

export const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({
  subjectId,
  isOpen,
  onClose,
  onSelectQuestion,
  onTrainSubject
}) => {
  const { filteredQuestions, statsMap, subjectsAnalytics } = useQuiz();
  const [filterMode, setFilterMode] = useState<SubjectFilterMode>('all');

  // Reset filter when subject changes
  useEffect(() => {
    setFilterMode('all');
  }, [subjectId]);

  // Synchronize with back navigation coordinator
  useEffect(() => {
    if (!isOpen || subjectId === null) return;

    const unregister = backNavigation.registerSubModal('subject-detail-modal', onClose);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unregister();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, subjectId, onClose]);

  const subjectMeta = useMemo(() => {
    if (subjectId === null) return null;
    return subjectsAnalytics.find(s => s.id === subjectId) || null;
  }, [subjectId, subjectsAnalytics]);

  const subjectQuestions = useMemo(() => {
    if (subjectId === null) return [];
    return filteredQuestions.filter(q => q.subjectId === subjectId);
  }, [subjectId, filteredQuestions]);

  const wrongQuestions = useMemo(() => {
    return subjectQuestions.filter(q => isMistakeQuestion(statsMap.get(q.id)));
  }, [subjectQuestions, statsMap]);

  const unseenQuestions = useMemo(() => {
    return subjectQuestions.filter(q => {
      const s = statsMap.get(q.id);
      return !s || s.timesSeen === 0;
    });
  }, [subjectQuestions, statsMap]);

  const correctQuestions = useMemo(() => {
    return subjectQuestions.filter(q => {
      const s = statsMap.get(q.id);
      return s && s.timesSeen > 0 && s.lastResult === 'correct' && !isMistakeQuestion(s);
    });
  }, [subjectQuestions, statsMap]);

  const displayedQuestions = useMemo(() => {
    switch (filterMode) {
      case 'wrong':
        return wrongQuestions;
      case 'unseen':
        return unseenQuestions;
      case 'correct':
        return correctQuestions;
      case 'all':
      default:
        return subjectQuestions;
    }
  }, [filterMode, subjectQuestions, wrongQuestions, unseenQuestions, correctQuestions]);

  if (!isOpen || subjectId === null || !subjectMeta) return null;

  const coveragePercent = Math.round((subjectMeta.seen / subjectMeta.total) * 100);

  return (
    <div
      id="subject-detail-view"
      role="region"
      aria-label={`Dettaglio materia: ${subjectMeta.name}`}
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 flex flex-col h-[100dvh] w-full !m-0 !p-0 bg-zinc-950 text-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 light:bg-slate-50 light:text-slate-900 overflow-hidden font-sans animate-in fade-in duration-150"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-20 w-full border-b backdrop-blur bg-zinc-950/90 border-zinc-700 dark:bg-zinc-950/90 dark:border-zinc-700 light:bg-white/90 light:border-slate-300 light:shadow-sm transition-colors flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              id="btn-close-subject-detail"
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100 transition-colors flex items-center gap-1.5 active:scale-95"
              title="Torna alle Statistiche"
              aria-label="Torna alle Statistiche"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs font-semibold hidden sm:inline">Statistiche</span>
            </button>
            <div className="h-4 w-px bg-zinc-700 light:bg-slate-300 mx-1 hidden sm:block" />
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-800 font-mono text-xs font-bold flex-shrink-0">
              {formatSubjectCode(subjectId)}
            </span>
            <h1
              id="subject-detail-title"
              className="font-bold text-sm sm:text-base text-zinc-100 light:text-slate-900 truncate"
            >
              {subjectMeta.name}
            </h1>
          </div>

          <button
            type="button"
            id="btn-close-subject-detail-x"
            onClick={onClose}
            className="p-2 -mr-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100 transition-colors active:scale-95 flex-shrink-0"
            title="Chiudi"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Full-Height Scrollable Area */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-24">
          {/* Dashboard Statistiche Materia */}
          <div className="p-4 sm:p-5 rounded-2xl border border-zinc-700 bg-zinc-900/90 light:bg-white light:border-slate-300 light:shadow-sm space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-400 light:text-slate-600 uppercase tracking-wider font-semibold">
                  Accuratezza Risposte
                </span>
                <div
                  className={`text-2xl sm:text-3xl font-black ${
                    subjectMeta.accuracy >= 90
                      ? 'text-emerald-400'
                      : subjectMeta.accuracy >= 70
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {subjectMeta.seen > 0 ? `${subjectMeta.accuracy}%` : '-'}
                </div>
              </div>

              {/* Pulsante Allenati su questa materia */}
              {onTrainSubject && (
                <button
                  type="button"
                  id="btn-train-subject"
                  onClick={() => {
                    onClose();
                    onTrainSubject(subjectId);
                  }}
                  className="px-3.5 sm:px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 flex-shrink-0"
                >
                  <span>Allenati su questa materia</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Progress Bar Copertura */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 light:text-slate-600">
                <span>Copertura Quesiti</span>
                <span className="font-mono font-medium">
                  {subjectMeta.seen} / {subjectMeta.total} ({coveragePercent}%)
                </span>
              </div>
              <div className="w-full bg-zinc-950/80 rounded-full h-2 overflow-hidden border border-zinc-800 light:bg-slate-200 light:border-slate-300/60">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    subjectMeta.accuracy >= 90
                      ? 'bg-emerald-500'
                      : subjectMeta.accuracy >= 70
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${coveragePercent}%` }}
                />
              </div>
            </div>

            {/* 1-Touch Filter Chips */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                id="filter-chip-all"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                  filterMode === 'all'
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100 light:bg-slate-200 light:border-slate-400 light:text-slate-900'
                    : 'bg-zinc-950/60 border-zinc-700 text-zinc-300 hover:text-zinc-100 light:bg-white light:border-slate-300 light:text-slate-700'
                }`}
              >
                <span>Tutte</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    filterMode === 'all'
                      ? 'bg-zinc-700 text-zinc-200 light:bg-slate-300 light:text-slate-800'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300 light:bg-slate-100 light:border-slate-300 light:text-slate-700'
                  }`}
                >
                  {subjectQuestions.length}
                </span>
              </button>

              <button
                type="button"
                id="filter-chip-wrong"
                onClick={() => setFilterMode('wrong')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                  filterMode === 'wrong'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 light:bg-rose-50 light:border-rose-300 light:text-rose-800'
                    : 'bg-zinc-950/60 border-zinc-700 text-zinc-300 hover:text-rose-400 light:bg-white light:border-slate-300 light:text-slate-700'
                }`}
              >
                <span>Errori</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    filterMode === 'wrong'
                      ? 'bg-rose-500/30 text-rose-200 light:bg-rose-200 light:text-rose-900'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300 light:bg-slate-100 light:border-slate-300 light:text-slate-700'
                  }`}
                >
                  {wrongQuestions.length}
                </span>
              </button>

              <button
                type="button"
                id="filter-chip-unseen"
                onClick={() => setFilterMode('unseen')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                  filterMode === 'unseen'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 light:bg-amber-50 light:border-amber-300 light:text-amber-800'
                    : 'bg-zinc-950/60 border-zinc-700 text-zinc-300 hover:text-amber-400 light:bg-white light:border-slate-300 light:text-slate-700'
                }`}
              >
                <span>Non viste</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    filterMode === 'unseen'
                      ? 'bg-amber-500/30 text-amber-200 light:bg-amber-200 light:text-amber-900'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300 light:bg-slate-100 light:border-slate-300 light:text-slate-700'
                  }`}
                >
                  {unseenQuestions.length}
                </span>
              </button>

              <button
                type="button"
                id="filter-chip-correct"
                onClick={() => setFilterMode('correct')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                  filterMode === 'correct'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 light:bg-emerald-50 light:border-emerald-300 light:text-emerald-800'
                    : 'bg-zinc-950/60 border-zinc-700 text-zinc-300 hover:text-emerald-400 light:bg-white light:border-slate-300 light:text-slate-700'
                }`}
              >
                <span>Corrette</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    filterMode === 'correct'
                      ? 'bg-emerald-500/30 text-emerald-200 light:bg-emerald-200 light:text-emerald-900'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300 light:bg-slate-100 light:border-slate-300 light:text-slate-700'
                  }`}
                >
                  {correctQuestions.length}
                </span>
              </button>
            </div>
          </div>

          {/* Scrollable Questions List */}
          <div className="space-y-2">
            {displayedQuestions.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400 light:text-slate-600 space-y-2 p-6 rounded-2xl border border-zinc-700 bg-zinc-900/60 light:bg-white light:border-slate-300 light:shadow-sm">
                <HelpCircle className="w-7 h-7 mx-auto text-zinc-500 opacity-60" />
                <p className="font-medium">Nessun quesito corrispondente al filtro selezionato.</p>
              </div>
            ) : (
              displayedQuestions.map(q => {
                const stat = statsMap.get(q.id);
                const isMistake = isMistakeQuestion(stat);
                const isCorrect = stat && stat.timesSeen > 0 && stat.lastResult === 'correct' && !isMistake;

                return (
                  <button
                    type="button"
                    key={q.id}
                    id={`btn-subject-q-${q.id}`}
                    onClick={() => onSelectQuestion(q)}
                    className="w-full text-left p-3 sm:p-3.5 rounded-xl border border-zinc-700/80 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-zinc-600 text-xs flex items-center justify-between gap-3 transition-all group light:bg-white light:border-slate-300 light:hover:bg-slate-50 cursor-pointer light:shadow-sm active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Status dot */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          isMistake
                            ? 'bg-rose-500 ring-2 ring-rose-500/30'
                            : isCorrect
                            ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                            : 'bg-zinc-700 light:bg-slate-300'
                        }`}
                        title={
                          isMistake
                            ? 'Errore da rivedere'
                            : isCorrect
                            ? 'Risposta corretta'
                            : 'Non ancora affrontata'
                        }
                      />

                      <span className="font-mono font-bold text-amber-400 light:text-amber-600 flex-shrink-0">
                        #{q.id}
                      </span>

                      <span className="text-zinc-200 light:text-slate-800 truncate leading-snug">
                        {q.question}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 text-zinc-400 group-hover:text-zinc-200 light:text-slate-500 light:group-hover:text-slate-700">
                      {stat && stat.timesWrong > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 light:bg-rose-100 light:text-rose-700">
                          {stat.timesWrong} {stat.timesWrong === 1 ? 'err' : 'err'}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
