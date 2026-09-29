import React from 'react';
import type { Discipline } from '../types/quiz';
import { DISCIPLINE_OPTIONS } from '../utils/discipline';
import { Layers, Wind, Compass } from 'lucide-react';

interface DisciplineSelectorProps {
  value: Discipline;
  onChange: (discipline: Discipline) => void;
  size?: 'sm' | 'md';
  showCounts?: boolean;
  className?: string;
  idPrefix?: string;
}

export const DisciplineSelector: React.FC<DisciplineSelectorProps> = ({
  value,
  onChange,
  size = 'md',
  showCounts = true,
  className = '',
  idPrefix = 'discipline'
}) => {
  const isSm = size === 'sm';

  const getIcon = (id: Discipline) => {
    switch (id) {
      case 'all':
        return <Layers className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
      case 'paraglider':
        return <Wind className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
      case 'hang_glider':
        return <Compass className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Filtro disciplina"
      className={`inline-flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 light:bg-slate-100 light:border-slate-200 ${className}`}
    >
      {DISCIPLINE_OPTIONS.map(opt => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            id={`${idPrefix}-${opt.id}`}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.id)}
            title={opt.description}
            className={`flex items-center justify-center gap-1.5 font-mono font-medium transition-all rounded-lg ${
              isSm ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
            } ${
              isSelected
                ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm light:bg-amber-500 light:text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-200/60'
            }`}
          >
            {getIcon(opt.id)}
            <span>{opt.shortLabel}</span>
            {showCounts && (
              <span
                className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? 'bg-zinc-950/20 text-zinc-950 font-bold'
                    : 'bg-zinc-800/80 text-zinc-400 light:bg-slate-200 light:text-slate-600'
                }`}
              >
                {opt.totalCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
