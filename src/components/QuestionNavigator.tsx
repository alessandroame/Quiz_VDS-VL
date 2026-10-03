import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Question } from '../types/quiz';
import type { ExamModeType } from '../types/database';

export interface QuestionNavigatorProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<number, 1 | 2 | 3>;
  flags: Record<number, boolean>;
  examMode: ExamModeType;
  onSelectIndex: (index: number) => void;
  defaultCompressed?: boolean;
}

const STORAGE_KEY = 'vds_exam_nav_compressed';

/**
 * Collapsible Question Navigator component.
 * Allows toggling between an expanded 3-row grid and an ultra-compact single-row view
 * to maximize vertical screen space during exam simulations.
 */
export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentIndex,
  answers,
  flags,
  examMode,
  onSelectIndex,
  defaultCompressed = false
}) => {
  const [isCompressed, setIsCompressed] = useState<boolean>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          return stored === 'true';
        }
      }
    } catch {
      // Storage unavailable, fallback to default
    }
    // Mobile default: compress navigator on mobile viewports to maximize vertical reading space
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return true;
    }
    return defaultCompressed;
  });

  const toggleCompressed = () => {
    setIsCompressed(prev => {
      const next = !prev;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, String(next));
        }
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const flaggedCount = Object.values(flags).filter(Boolean).length;

  const getBubbleStatus = (q: Question, idx: number) => {
    const isAnswered = answers[q.id] !== undefined;
    const isFlagged = flags[q.id] === true;
    const isCurrent = currentIndex === idx;

    let baseStyle = 'border-zinc-700 bg-zinc-950/90 text-zinc-300 light:border-slate-300 light:bg-slate-100 light:text-slate-700 font-medium';
    if (isAnswered) {
      const isCorrect = answers[q.id] === q.correctAnswer;
      baseStyle = isCorrect
        ? 'border-emerald-500 bg-emerald-500/25 text-emerald-300 light:border-emerald-600 light:bg-emerald-100 light:text-emerald-900 font-bold border shadow-sm'
        : 'border-rose-500 bg-rose-500/25 text-rose-300 light:border-rose-600 light:bg-rose-100 light:text-rose-900 font-bold border shadow-sm';
    }

    return { isAnswered, isFlagged, isCurrent, baseStyle };
  };

  return (
    <div className="p-2 sm:p-2.5 bg-zinc-900/80 border border-zinc-700 rounded-xl light:bg-white light:border-slate-300 light:shadow-sm transition-all">
      {/* Header bar with counter, flag summary and expand/collapse toggle */}
      <div
        onClick={toggleCompressed}
        className="flex items-center justify-between cursor-pointer select-none py-0.5"
        role="button"
        tabIndex={0}
        aria-expanded={!isCompressed}
        aria-label={isCompressed ? 'Espandi navigatore quiz' : 'Comprimi navigatore quiz'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCompressed();
          }
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-300 light:text-slate-700 tracking-wide">
            Quesiti
          </span>
          <span className="font-mono text-[11px] font-semibold text-amber-400 light:text-amber-900 bg-amber-500/10 light:bg-amber-100 px-1.5 py-0.5 rounded">
            {`${currentIndex + 1} / ${questions.length}`}
          </span>
          {flaggedCount > 0 && (
            <span className="text-[10px] font-mono text-amber-400 font-medium">
              {`(${flaggedCount} ⚑)`}
            </span>
          )}
        </div>

        <button
          type="button"
          id="btn-toggle-navigator"
          onClick={(e) => {
            e.stopPropagation();
            toggleCompressed();
          }}
          className="text-xs font-medium text-zinc-400 hover:text-zinc-200 light:text-slate-500 light:hover:text-slate-800 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800/60 light:hover:bg-slate-100 transition-colors"
          title={isCompressed ? 'Espandi su più righe' : 'Comprimi su una sola riga'}
        >
          <span className="text-[11px] hidden sm:inline">
            {isCompressed ? 'Espandi' : 'Comprimi'}
          </span>
          {isCompressed ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </button>
      </div>

      {/* Navigator Content */}
      {isCompressed ? (
        /* Compressed mode: all questions fit on a single row */
        <div
          data-testid="navigator-compressed-row"
          className="flex items-center gap-0.5 sm:gap-1 w-full justify-between pt-1.5 pb-0.5"
        >
          {questions.map((q, idx) => {
            const { isAnswered, isFlagged, isCurrent, baseStyle } = getBubbleStatus(q, idx);
            let style = baseStyle;
            if (isFlagged) {
              style += ' ring-1 ring-amber-400';
            }
            if (isCurrent) {
              style += ' ring-2 ring-amber-400 ring-offset-1 sm:ring-offset-2 ring-offset-zinc-950 light:ring-offset-white scale-y-110 sm:scale-105 z-10';
            }

            return (
              <button
                key={q.id}
                id={`bubble-q-${idx + 1}`}
                onClick={() => onSelectIndex(idx)}
                className={`flex-1 min-w-0 h-6 sm:h-7 rounded sm:rounded-md border text-[10px] sm:text-xs flex items-center justify-center transition-all ${style}`}
                title={`Quesito #${q.id}${isAnswered && examMode === 'tutor' ? (answers[q.id] === q.correctAnswer ? ' (Esatta)' : ' (Errata)') : ''}`}
                aria-label={`Quesito ${idx + 1}`}
                aria-current={isCurrent ? 'true' : undefined}
              >
                <span className="hidden sm:inline font-mono font-bold">
                  {idx + 1}
                </span>
                {isCurrent && (
                  <span className="sm:hidden w-1 h-1 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Expanded mode: multi-row grid (3 rows of 10) */
        <div
          data-testid="navigator-expanded-grid"
          className="flex flex-wrap gap-1.5 justify-center pt-2"
        >
          {questions.map((q, idx) => {
            const { isAnswered, isFlagged, isCurrent, baseStyle } = getBubbleStatus(q, idx);
            let style = baseStyle;
            if (isFlagged) {
              style += ' ring-1 ring-amber-400';
            }
            if (isCurrent) {
              style += ' ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950 light:ring-offset-white';
            }

            return (
              <button
                key={q.id}
                id={`bubble-q-${idx + 1}`}
                onClick={() => onSelectIndex(idx)}
                className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center transition-all ${style}`}
                title={`Quesito #${q.id}${isAnswered && examMode === 'tutor' ? (answers[q.id] === q.correctAnswer ? ' (Esatta)' : ' (Errata)') : ''}`}
                aria-label={`Quesito ${idx + 1}`}
                aria-current={isCurrent ? 'true' : undefined}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
