import React from 'react';
import { Download, Volume2, X, Check, CloudOff } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import { audioDownloadManager, VoiceName } from '../services/audioDownloadManager';

interface AudioOfflinePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioOfflinePromptModal: React.FC<AudioOfflinePromptModalProps> = ({
  isOpen,
  onClose
}) => {
  const { settings, updateSetting } = useQuiz();

  if (!isOpen) return null;

  const currentVoice: VoiceName = settings.ttsVoice || 'giuseppe';
  const currentVoiceLabel = currentVoice === 'giuseppe' ? 'Giuseppe (Maschile)' : 'Elsa (Femminile)';
  const currentVoiceSize = currentVoice === 'giuseppe' ? '~154 MB' : '~148 MB';

  const handleDismiss = async () => {
    await updateSetting('audioOfflinePromptDismissed', true);
    onClose();
  };

  const handleDownloadSingle = async () => {
    await updateSetting('audioOfflinePromptDismissed', true);
    // Non-blocking background download
    audioDownloadManager.startDownload(currentVoice).catch(console.error);
    onClose();
  };

  const handleDownloadBoth = async () => {
    await updateSetting('audioOfflinePromptDismissed', true);
    // Non-blocking background downloads for both
    audioDownloadManager.startDownload('giuseppe').catch(console.error);
    audioDownloadManager.startDownload('elsa').catch(console.error);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-zinc-900 light:bg-white border border-zinc-800 light:border-slate-200 rounded-2xl shadow-2xl p-6 text-zinc-100 light:text-slate-900 animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audio-offline-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <CloudOff className="w-5 h-5" />
            </div>
            <div>
              <h3 id="audio-offline-title" className="text-base font-bold text-zinc-100 light:text-slate-900">
                Audio Offline per la Modalità Audio
              </h3>
              <p className="text-xs text-zinc-400 light:text-slate-500">
                Preparazione all'ascolto senza connessione
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-zinc-400 hover:text-zinc-200 light:hover:text-slate-700 rounded-lg hover:bg-zinc-800 light:hover:bg-slate-100 transition-colors"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <p className="text-xs text-zinc-300 light:text-slate-600 leading-relaxed mb-5">
          In viaggio verso il decollo o in zone montane il segnale internet potrebbe non essere disponibile.
          Puoi salvare i file vocali nella memoria del browser per ascoltare tutti i 504 quiz senza consumare traffico.
        </p>

        {/* Options */}
        <div className="space-y-2.5 mb-5">
          {/* Primary Recommended: Current Voice */}
          <button
            id="btn-download-active-voice"
            onClick={handleDownloadSingle}
            className="w-full text-left p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 light:bg-amber-50 light:border-amber-400 light:hover:bg-amber-100 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 light:text-amber-700 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-100 light:text-slate-900">
                    Scarica voce {currentVoiceLabel}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Consigliato
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-slate-500">
                  2.520 quesiti ({currentVoiceSize}) • Download non bloccante
                </p>
              </div>
            </div>
            <Check className="w-4 h-4 text-amber-400 light:text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Secondary: Both Voices */}
          <button
            id="btn-download-both-voices"
            onClick={handleDownloadBoth}
            className="w-full text-left p-3 rounded-xl border border-zinc-800 light:border-slate-200 bg-zinc-950/60 light:bg-slate-50 hover:bg-zinc-800/80 light:hover:bg-slate-100 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 light:bg-slate-200 text-zinc-300 light:text-slate-700 flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-medium text-zinc-200 light:text-slate-800">
                  Scarica entrambe le voci (Giuseppe + Elsa)
                </span>
                <p className="text-[11px] text-zinc-500 light:text-slate-400">
                  5.040 quesiti totali (~302 MB)
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer & Skip */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800 light:border-slate-200 text-xs">
          <span className="text-[11px] text-zinc-500 light:text-slate-400">
            Modificabile sempre in Impostazioni &gt; Voce
          </span>
          <button
            id="btn-dismiss-audio-prompt"
            onClick={handleDismiss}
            className="px-3 py-1.5 font-medium text-zinc-400 hover:text-zinc-200 light:hover:text-slate-800 transition-colors"
          >
            Non ora
          </button>
        </div>
      </div>
    </div>
  );
};
