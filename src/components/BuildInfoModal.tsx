import React, { useState } from 'react';
import { X, RefreshCw, Copy, Check, GitCommit, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { getBuildInfo, formatBuildDate, forceReloadPWA } from '../utils/buildInfo';
import { getAppIconUrl, getAppFaviconUrl } from '../utils/assets';
import { useTheme } from '../context/ThemeContext';

interface BuildInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuildInfoModal: React.FC<BuildInfoModalProps> = ({ isOpen, onClose }) => {
  const { resolvedTheme } = useTheme();
  const [isCopied, setIsCopied] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  if (!isOpen) return null;

  const buildInfo = getBuildInfo();
  const formattedDate = formatBuildDate(buildInfo.buildTime);

  const handleCopy = async () => {
    const textToCopy = `VDS-VL Quiz Master v${buildInfo.version} (Build #${buildInfo.buildNumber} • ${buildInfo.commitHash}) - Data: ${formattedDate}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('[BuildInfoModal] Copy failed:', err);
    }
  };

  const handleForceReload = async () => {
    setIsReloading(true);
    await forceReloadPWA();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="build-info-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl text-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 light:bg-white light:border-slate-200 light:text-slate-900 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 light:border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/40 flex items-center justify-center flex-shrink-0 shadow-sm bg-zinc-900 light:bg-white">
              <img
                id="build-info-app-logo"
                src={getAppIconUrl(resolvedTheme)}
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = getAppFaviconUrl(resolvedTheme);
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
                alt="VDS-VL"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 id="build-info-title" className="text-sm font-bold tracking-tight">
                Versione e Build
              </h2>
              <p className="text-[10px] text-zinc-400 light:text-slate-500">
                Identificativo installazione PWA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 light:text-slate-500 light:hover:text-slate-900 light:hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Build Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Version */}
          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 light:bg-slate-50 light:border-slate-200 space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 light:text-slate-500 font-medium">
              <Tag className="w-3 h-3 text-amber-500" />
              <span>Versione</span>
            </div>
            <div className="font-mono font-bold text-zinc-100 light:text-slate-900 text-sm">
              v{buildInfo.version}
            </div>
          </div>

          {/* Build Number */}
          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 light:bg-slate-50 light:border-slate-200 space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 light:text-slate-500 font-medium">
              <span className="font-mono text-amber-500 font-bold">#</span>
              <span>Numero Build</span>
            </div>
            <div className="font-mono font-bold text-amber-400 light:text-amber-700 text-sm">
              #{buildInfo.buildNumber}
            </div>
          </div>

          {/* Commit Hash */}
          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 light:bg-slate-50 light:border-slate-200 space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 light:text-slate-500 font-medium">
              <GitCommit className="w-3 h-3 text-sky-400" />
              <span>Commit Git</span>
            </div>
            <div className="font-mono font-bold text-sky-300 light:text-sky-700 text-xs">
              {buildInfo.commitHash}
            </div>
          </div>

          {/* Build Date */}
          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 light:bg-slate-50 light:border-slate-200 space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 light:text-slate-500 font-medium">
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span>Data Generazione</span>
            </div>
            <div className="font-mono text-[11px] text-zinc-300 light:text-slate-700 truncate" title={formattedDate}>
              {formattedDate.split(',')[0] || formattedDate}
            </div>
          </div>
        </div>

        {/* PWA Cache Status Banner */}
        <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 light:bg-slate-100/70 light:border-slate-200 flex items-start gap-2 text-[11px] text-zinc-400 light:text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="leading-snug">
              Se hai appena aggiornato o pushato una modifica e sul telefono non la vedi, tocca il tasto in basso per forzare l'aggiornamento e ripulire la cache dell'app.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleForceReload}
            disabled={isReloading}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-98 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
            <span>{isReloading ? 'Aggiornamento in corso...' : 'Forza Aggiornamento PWA'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-2 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Dettagli copiati negli appunti' : 'Copia Dettagli Build'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
