import React from 'react';
import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';

export interface QuizBottomBarProps {
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext?: () => void;
  isPreviousDisabled?: boolean;
  isNextDisabled?: boolean;
  previousLabel?: string;
  nextLabel?: string;
  previousId?: string;
  nextId?: string;
  flagAction?: {
    isFlagged: boolean;
    onToggle: () => void;
    id?: string;
  };
  centerContent?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    id?: string;
    variant?: 'amber' | 'emerald' | 'default';
    icon?: React.ReactNode;
  };
  className?: string;
}

/**
 * Sticky/fixed bottom navigation bar for in-quiz execution (Exam, Topics, Mistakes).
 * Anchors previous/next/tutor actions to the bottom viewport for optimal single-hand thumb reach.
 */
export const QuizBottomBar: React.FC<QuizBottomBarProps> = ({
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
  isPreviousDisabled = false,
  isNextDisabled = false,
  previousLabel = 'Precedente',
  nextLabel = 'Successiva',
  previousId = 'btn-prev-question',
  nextId = 'btn-next-question',
  flagAction,
  centerContent,
  primaryAction,
  className = ''
}) => {
  return (
    <nav
      id="quiz-bottom-bar"
      aria-label={`Navigazione quiz: quesito ${currentIndex + 1} di ${totalCount}`}
      className={`fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-white/95 backdrop-blur-md border-t border-zinc-800 light:border-slate-200 shadow-lg px-4 py-2.5 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all ${className}`}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2.5">
        {/* Previous button */}
        <button
          id={previousId}
          onClick={onPrevious}
          disabled={isPreviousDisabled}
          className="px-3.5 sm:px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 light:bg-slate-100 light:border-slate-200 light:text-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 light:hover:bg-slate-200 transition-colors shrink-0 active:scale-[0.98]"
          title="Domanda precedente"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{previousLabel}</span>
        </button>

        {/* Optional Flag Action in thumb zone */}
        {flagAction && (
          <button
            id={flagAction.id || 'btn-flag-question-bottom'}
            onClick={flagAction.onToggle}
            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors active:scale-[0.98] ${
              flagAction.isFlagged
                ? 'border-amber-500/60 bg-amber-500/20 text-amber-300 light:bg-amber-100 light:border-amber-400 light:text-amber-800 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 light:bg-slate-100 light:border-slate-200 light:text-slate-600 hover:text-zinc-200 light:hover:text-slate-800'
            }`}
            title={flagAction.isFlagged ? 'Rimuovi contrassegno (F)' : 'Contrassegna da rivedere (F)'}
          >
            <Flag className={`w-3.5 h-3.5 ${flagAction.isFlagged ? 'fill-current text-amber-400' : ''}`} />
            <span className="hidden sm:inline">{flagAction.isFlagged ? 'Rivedi' : 'Segna'}</span>
          </button>
        )}

        {/* Center content or default counter if primaryAction is not taking full width */}
        {!primaryAction && (
          <div className="flex-1 flex justify-center text-xs font-mono text-zinc-400 light:text-slate-500 truncate px-1">
            {centerContent || (
              <span className="font-semibold">
                {currentIndex + 1} / {totalCount}
              </span>
            )}
          </div>
        )}

        {/* Primary action or Next button */}
        {primaryAction ? (
          <button
            id={primaryAction.id}
            onClick={primaryAction.onClick}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] flex-1 max-w-sm ${
              primaryAction.variant === 'emerald'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/30'
                : primaryAction.variant === 'default'
                ? 'border border-zinc-800 bg-zinc-900 text-zinc-200 light:bg-slate-100 light:border-slate-200 light:text-slate-800 hover:bg-zinc-800 light:hover:bg-slate-200'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/30'
            }`}
          >
            <span className="truncate">{primaryAction.label}</span>
            {primaryAction.icon || <ArrowRight className="w-4 h-4 shrink-0" />}
          </button>
        ) : (
          onNext && (
            <button
              id={nextId}
              onClick={onNext}
              disabled={isNextDisabled}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 light:bg-slate-100 light:border-slate-200 light:text-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 light:hover:bg-slate-200 transition-colors shrink-0 active:scale-[0.98]"
              title="Domanda successiva"
            >
              <span>{nextLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </nav>
  );
};
