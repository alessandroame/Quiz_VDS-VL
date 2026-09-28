import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { audioDownloadManager, VoiceDownloadProgress, VoiceName } from '../services/audioDownloadManager';

export const AudioDownloadProgressHUD: React.FC = () => {
  const [statuses, setStatuses] = useState<Record<VoiceName, VoiceDownloadProgress>>(
    audioDownloadManager.getAllStatuses()
  );
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    return audioDownloadManager.subscribe(newStatuses => {
      setStatuses(newStatuses);
    });
  }, []);

  const downloadingVoice = (['giuseppe', 'elsa'] as VoiceName[]).find(
    v => statuses[v].isDownloading
  );

  if (!downloadingVoice) {
    return null;
  }

  const activeStatus = statuses[downloadingVoice];
  const voiceLabel = downloadingVoice === 'giuseppe' ? 'Giuseppe' : 'Elsa';

  return (
    <div className="relative inline-flex items-center">
      {/* Pill Badge */}
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all text-xs font-medium"
        title="Download audio in background attivo. Clicca per dettagli."
        aria-label={`Scaricamento audio ${voiceLabel}: ${activeStatus.percent}%`}
      >
        <Download className="w-3.5 h-3.5 animate-bounce text-amber-400" />
        <span className="hidden sm:inline">Audio {voiceLabel}</span>
        <span className="font-mono font-bold">{activeStatus.percent}%</span>
      </button>

      {/* Popover on click */}
      {isExpanded && (
        <div className="absolute top-full mt-2 right-0 z-50 w-64 p-3 bg-zinc-900 light:bg-white border border-zinc-800 light:border-slate-200 rounded-xl shadow-xl text-zinc-100 light:text-slate-900 animate-fade-in text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-zinc-200 light:text-slate-800">
              Scaricamento {voiceLabel}
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-zinc-500 hover:text-zinc-300 light:hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-800 light:bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${activeStatus.percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 light:text-slate-500 mb-2">
            <span>
              {activeStatus.downloadedCount.toLocaleString('it-IT')} / {activeStatus.totalCount.toLocaleString('it-IT')} file
            </span>
            <span className="font-bold text-amber-400">{activeStatus.percent}%</span>
          </div>

          <p className="text-[10px] text-zinc-500 light:text-slate-400 mb-2">
            Puoi continuare a utilizzare l'app mentre il download procede in background.
          </p>

          <button
            onClick={() => audioDownloadManager.cancelDownload(downloadingVoice)}
            className="w-full py-1 text-center font-medium text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
          >
            Annulla Download
          </button>
        </div>
      )}
    </div>
  );
};
