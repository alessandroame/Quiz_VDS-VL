import React, { useEffect } from 'react';
import { PauseCircle, Pause, Trash2, ArrowRight } from 'lucide-react';
import { backNavigation } from '../utils/backNavigation';

export interface SessionInterruptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPause: () => void;
  onTerminate: () => void;
  sessionTitle: string;
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  timeDisplay?: string;
}

export const SessionInterruptModal: React.FC<SessionInterruptModalProps> = ({
  isOpen,
  onClose,
  onPause,
  onTerminate,
  sessionTitle,
  currentIndex,
  totalQuestions,
  answeredCount,
  timeDisplay
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Synchronize with back navigation coordinator
  useEffect(() => {
    if (!isOpen) return;
    const unregister = backNavigation.registerSubModal('session-interrupt-modal', () => {
      onClose();
    });
    return () => unregister();
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl dark:bg-zinc-900 dark:border-zinc-700 light:bg-white light:border-slate-300"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="interrupt-modal-title"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 text-amber-400 light:text-amber-600">
          <PauseCircle className="w-6 h-6 flex-shrink-0" />
          <h3 id="interrupt-modal-title" className="font-bold text-base text-zinc-100 dark:text-zinc-100 light:text-slate-900">
            Interrompi Sessione
          </h3>
        </div>

        {/* Session Snapshot Card */}
        <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 light:bg-slate-50 light:border-slate-200 text-xs space-y-1">
          <div className="font-bold text-zinc-200 light:text-slate-800 truncate">
            {sessionTitle}
          </div>
          <div className="text-zinc-400 light:text-slate-600">
            Domanda {currentIndex + 1} di {totalQuestions} • {answeredCount} risposte fornite
          </div>
          {timeDisplay && (
            <div className="font-mono text-amber-400 light:text-amber-700 font-semibold pt-0.5">
              ⏱️ {timeDisplay}
            </div>
          )}
        </div>

        {/* Explanation Prompt */}
        <p className="text-xs text-zinc-300 dark:text-zinc-300 light:text-slate-600 leading-relaxed">
          Vuoi mettere in pausa per riprenderla in seguito, oppure terminare definitivamente la sessione?
        </p>

        {/* Action Choices */}
        <div className="space-y-2 pt-1">
          {/* Option 1: Put on Pause and Save to Home */}
          <button
            id="btn-interrupt-pause"
            onClick={onPause}
            className="w-full p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 light:bg-amber-100 light:text-amber-900 light:hover:bg-amber-200/80 border border-amber-500/40 text-left transition-all active:scale-[0.99] flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/30 text-amber-400 light:bg-amber-200 light:text-amber-800 flex items-center justify-center flex-shrink-0">
                <Pause className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold">Metti in Pausa</div>
                <div className="text-[10px] text-zinc-400 light:text-slate-600 truncate">
                  Salva lo stato e torna alla Home per riprenderla
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Option 2: Terminate and Discard Session */}
          <button
            id="btn-interrupt-terminate"
            onClick={onTerminate}
            className="w-full p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 light:bg-rose-50 light:text-rose-700 light:hover:bg-rose-100 border border-rose-500/30 text-left transition-all active:scale-[0.99] flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 light:bg-rose-100 light:text-rose-700 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold">Termina ed Elimina</div>
                <div className="text-[10px] text-zinc-400 light:text-slate-600 truncate">
                  Cancella la sessione per cominciarne una nuova
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-rose-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Option 3: Stay in Quiz / Continue */}
          <button
            id="btn-interrupt-resume"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-800 text-xs font-semibold text-center transition-colors active:scale-[0.99]"
          >
            Rimani nel Quiz
          </button>
        </div>
      </div>
    </div>
  );
};
