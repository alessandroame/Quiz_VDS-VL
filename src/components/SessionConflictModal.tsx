import React, { useEffect } from 'react';
import { AlertTriangle, Play, RotateCcw } from 'lucide-react';
import { backNavigation } from '../utils/backNavigation';

export interface SessionConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeExisting: () => void;
  onDiscardAndStartNew: () => void;
  existingTitle: string;
  existingProgress: string;
  newSessionTitle: string;
}

export const SessionConflictModal: React.FC<SessionConflictModalProps> = ({
  isOpen,
  onClose,
  onResumeExisting,
  onDiscardAndStartNew,
  existingTitle,
  existingProgress,
  newSessionTitle
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
    const unregister = backNavigation.registerSubModal('session-conflict-modal', () => {
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
        aria-labelledby="conflict-modal-title"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 text-amber-400 light:text-amber-600">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <h3 id="conflict-modal-title" className="font-bold text-base text-zinc-100 dark:text-zinc-100 light:text-slate-900">
            Sessione in Sospeso
          </h3>
        </div>

        {/* Info Box */}
        <div className="text-xs text-zinc-300 dark:text-zinc-300 light:text-slate-600 space-y-2">
          <p>
            Hai già una prova non completata:
          </p>
          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 light:bg-slate-50 light:border-slate-200 space-y-0.5">
            <div className="font-bold text-zinc-200 light:text-slate-900 truncate">
              {existingTitle}
            </div>
            <div className="text-[11px] text-zinc-400 light:text-slate-600">
              {existingProgress}
            </div>
          </div>
          <p>
            Per avviare <strong className="text-zinc-100 dark:text-zinc-100 light:text-slate-900 font-semibold">{newSessionTitle}</strong>, cosa desideri fare?
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          {/* Option 1: Resume existing */}
          <button
            id="btn-conflict-resume"
            onClick={onResumeExisting}
            className="w-full py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Riprendi la Sessione in Sospeso</span>
          </button>

          {/* Option 2: Discard and start new */}
          <button
            id="btn-conflict-discard-start"
            onClick={onDiscardAndStartNew}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-500/50 hover:border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 light:border-rose-300 light:bg-rose-50 light:text-rose-700 text-xs font-semibold transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Abbandona e Inizia Nuova</span>
          </button>

          {/* Option 3: Cancel */}
          <button
            id="btn-conflict-cancel"
            onClick={onClose}
            className="w-full py-2 rounded-xl text-zinc-400 hover:text-zinc-200 light:text-slate-500 light:hover:text-slate-800 text-xs font-medium transition-colors"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
};
