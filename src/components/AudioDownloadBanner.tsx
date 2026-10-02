import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { audioDownloadManager, VoiceDownloadProgress, VoiceName } from '../services/audioDownloadManager';

export interface AudioDownloadBannerProps {
  className?: string;
  elevated?: boolean;
}

/**
 * Bottom banner for audio download progression.
 * Sits directly above the bottom navigation bar to prevent top-header UI overflow.
 */
export const AudioDownloadBanner: React.FC<AudioDownloadBannerProps> = ({ className = '', elevated = false }) => {
  const [statuses, setStatuses] = useState<Record<VoiceName, VoiceDownloadProgress>>(
    audioDownloadManager.getAllStatuses()
  );

  useEffect(() => {
    return audioDownloadManager.subscribe(newStatuses => {
      setStatuses(newStatuses);
    });
  }, []);

  const downloadingVoices = (['giuseppe', 'elsa'] as VoiceName[]).filter(
    v => statuses[v].isDownloading
  );

  if (downloadingVoices.length === 0) {
    return null;
  }

  // Calculate aggregated or single voice progression
  let voiceLabel = '';
  let downloadedCount = 0;
  let totalCount = 0;
  let percent = 0;

  if (downloadingVoices.length === 1) {
    const singleVoice = downloadingVoices[0];
    const status = statuses[singleVoice];
    voiceLabel = singleVoice === 'giuseppe' ? 'Giuseppe' : 'Elsa';
    downloadedCount = status.downloadedCount;
    totalCount = status.totalCount;
    percent = status.percent;
  } else {
    voiceLabel = 'Giuseppe ed Elsa';
    downloadedCount = statuses.giuseppe.downloadedCount + statuses.elsa.downloadedCount;
    totalCount = statuses.giuseppe.totalCount + statuses.elsa.totalCount;
    percent = totalCount > 0 ? Math.round((downloadedCount / totalCount) * 100) : 0;
  }

  const handleCancel = () => {
    downloadingVoices.forEach(v => audioDownloadManager.cancelDownload(v));
  };

  if (!elevated) {
    return (
      <aside
        id="audio-download-bottom-banner"
        aria-label={`Progressione scaricamento voci: ${percent}%`}
        className={
          className ||
          'fixed bottom-0 left-0 right-0 z-[60] bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-white/95 border-t border-amber-500/40 light:border-amber-400/60 shadow-2xl backdrop-blur-md pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 sm:pt-3 px-3 sm:px-4 transition-all duration-300 animate-in slide-in-from-bottom fade-in'
        }
      >
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-700 flex-shrink-0">
                <Download className="w-4 h-4 animate-bounce text-amber-400 light:text-amber-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-zinc-100 dark:text-zinc-100 light:text-slate-900 truncate">
                    {`Scaricamento ${voiceLabel}`}
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-amber-400 light:text-amber-600 flex-shrink-0">
                    {`${percent}%`}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 light:text-slate-500 font-mono truncate">
                  {`${downloadedCount.toLocaleString('it-IT')} / ${totalCount.toLocaleString('it-IT')} file`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                id="btn-cancel-audio-download"
                onClick={handleCancel}
                className="px-2.5 py-1 text-xs font-semibold text-rose-400 hover:text-rose-300 light:text-rose-600 light:hover:text-rose-700 hover:bg-rose-500/10 light:hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 active:scale-95"
                title="Annulla download audio"
              >
                <X className="w-3.5 h-3.5" />
                <span>Annulla</span>
              </button>
            </div>
          </div>

          {/* Real-time Progress Bar */}
          <div className="w-full bg-zinc-800 light:bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 light:bg-amber-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(percent, 2)}%` }}
            />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      id="audio-download-bottom-banner"
      aria-label={`Progressione scaricamento voci: ${percent}%`}
      className={
        className ||
        'fixed bottom-[60px] sm:bottom-[68px] left-0 right-0 z-[60] pointer-events-none px-2.5 sm:px-4 pb-1.5 transition-all duration-300'
      }
    >
      <div className="max-w-2xl mx-auto pointer-events-auto bg-zinc-900/95 dark:bg-zinc-900/95 light:bg-white/95 border border-amber-500/40 light:border-amber-400/60 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md text-zinc-100 light:text-slate-900 transition-all animate-in slide-in-from-bottom-2 fade-in flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-700 flex-shrink-0">
              <Download className="w-4 h-4 animate-bounce text-amber-400 light:text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-zinc-100 dark:text-zinc-100 light:text-slate-900 truncate">
                  {`Scaricamento ${voiceLabel}`}
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-amber-400 light:text-amber-600 flex-shrink-0">
                  {`${percent}%`}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 light:text-slate-500 font-mono truncate">
                {`${downloadedCount.toLocaleString('it-IT')} / ${totalCount.toLocaleString('it-IT')} file`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              id="btn-cancel-audio-download"
              onClick={handleCancel}
              className="px-2.5 py-1 text-xs font-semibold text-rose-400 hover:text-rose-300 light:text-rose-600 light:hover:text-rose-700 hover:bg-rose-500/10 light:hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 active:scale-95"
              title="Annulla download audio"
            >
              <X className="w-3.5 h-3.5" />
              <span>Annulla</span>
            </button>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="w-full bg-zinc-800 light:bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 light:bg-amber-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(percent, 2)}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
