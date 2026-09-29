import React from 'react';
import {
  X,
  RotateCcw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import type { ExamSession } from '../../types/database';
import { VoiceQuickMenu } from '../VoiceQuickMenu';

export interface DriveDebriefingProps {
  completedSession: ExamSession;
  isMarathon: boolean;
  onRestartExam: (marathon: boolean) => void;
  onClose: () => void;
  onOpenVoiceGuide: () => void;
  onReplayIntro: () => void;
  setIsVoiceMenuOpen: (open: boolean) => void;
}

export const DriveDebriefing: React.FC<DriveDebriefingProps> = ({
  completedSession,
  isMarathon,
  onRestartExam,
  onClose,
  onOpenVoiceGuide,
  onReplayIntro,
  setIsVoiceMenuOpen
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto w-full">
      {/* Header Debriefing */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 light:border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-700 flex items-center justify-center font-bold text-xs">
            VDS
          </div>
          <span className="text-sm font-bold text-zinc-300 light:text-slate-700">Riepilogo Esame</span>
        </div>
        <div className="flex items-center gap-2">
          <VoiceQuickMenu
            id="btn-drive-debriefing-voice-menu"
            onOpenVoiceGuide={onOpenVoiceGuide}
            onReplaySpokenGuide={onReplayIntro}
            onOpenChange={setIsVoiceMenuOpen}
          />
          <button
            id="btn-drive-debriefing-exit"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white light:bg-white light:border-slate-200 light:text-slate-600 light:hover:text-slate-900 light:shadow-sm"
            title="Esci dalla modalità guida"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-6 pt-4 text-center">
        <div
          className={`p-6 rounded-3xl border-2 space-y-3 ${
            completedSession.isPassed
              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-100 light:bg-emerald-50 light:border-emerald-500 light:text-emerald-950'
              : 'bg-rose-950/40 border-rose-500 text-rose-100 light:bg-rose-50 light:border-rose-500 light:text-rose-950'
          }`}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto">
            {completedSession.isPassed ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-400" />
            ) : (
              <XCircle className="w-16 h-16 text-rose-400" />
            )}
          </div>
          <h2 className="text-3xl font-black tracking-tight">
            {completedSession.isPassed ? 'ESAME IDONEO' : 'NON IDONEO'}
          </h2>
          <p className="text-sm font-semibold opacity-90">
            {completedSession.isPassed
              ? `Complimenti! ${completedSession.wrongAnswers} errori (massimo 3 ammessi)`
              : `${completedSession.wrongAnswers} errori su ${completedSession.totalQuestions} quesiti`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center light:bg-white light:border-slate-200 light:shadow-sm">
            <div className="text-2xl font-black text-emerald-400">
              {completedSession.correctAnswers}
            </div>
            <div className="text-xs text-zinc-400 light:text-slate-500 font-bold uppercase">Esatte</div>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center light:bg-white light:border-slate-200 light:shadow-sm">
            <div className="text-2xl font-black text-rose-400">
              {completedSession.wrongAnswers}
            </div>
            <div className="text-xs text-zinc-400 light:text-slate-500 font-bold uppercase">Errate</div>
          </div>
        </div>
      </div>

      <div className="space-y-3 pb-4">
        <button
          onClick={() => onRestartExam(isMarathon)}
          className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-950 light:shadow-amber-200 active:scale-[0.98]"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Riprova Esame</span>
        </button>
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white light:bg-white light:border-slate-200 light:text-slate-700 light:hover:text-slate-900 light:shadow-sm font-bold text-base flex items-center justify-center gap-2"
        >
          <span>Chiudi Modalità Audio</span>
        </button>
      </div>
    </div>
  );
};
