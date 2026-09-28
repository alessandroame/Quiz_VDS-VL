import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WifiOff, Wifi, X, CheckCircle2, Database, Cloud } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

/**
 * Top header offline indicator badge.
 * Displays an amber cockpit pill when offline and an emerald pill briefly upon reconnection.
 * Clicking opens a cockpit advisory modal explaining offline capabilities.
 */
export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline, offlineSince } = useOnlineStatus();
  const [showModal, setShowModal] = useState(false);

  if (isOnline && !wasOffline) {
    return null;
  }

  const formatOfflineDuration = () => {
    if (!offlineSince) return '';
    const minutes = Math.floor((Date.now() - offlineSince) / 60000);
    if (minutes < 1) return 'da meno di un minuto';
    if (minutes === 1) return 'da 1 minuto';
    return `da ${minutes} minuti`;
  };

  return (
    <>
      {/* Header Cockpit Badge */}
      <button
        id="btn-offline-status"
        type="button"
        onClick={() => setShowModal(true)}
        className={`px-2 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
          !isOnline
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25 light:bg-amber-100 light:border-amber-300 light:text-amber-800'
            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 light:bg-emerald-100 light:border-emerald-300 light:text-emerald-800 animate-in fade-in'
        }`}
        title={!isOnline ? 'Sei offline - Tocca per dettagli sullo stato locale' : 'Connessione ripristinata'}
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-400 light:text-amber-700 animate-pulse" />
            <span className="font-mono text-[11px] tracking-wider font-black">OFFLINE</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-700" />
            <span className="font-mono text-[11px] tracking-wider font-black">ONLINE</span>
          </>
        )}
      </button>

      {/* Cockpit Status Briefing Modal */}
      {showModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl dark:bg-zinc-900 dark:border-zinc-800 light:bg-white light:border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 light:border-slate-200">
                <div className="flex items-center gap-2">
                  {!isOnline ? (
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-700">
                      <WifiOff className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-700">
                      <Wifi className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100 dark:text-zinc-100 light:text-slate-900">
                      {!isOnline ? 'Modalità Offline' : 'Connessione Attiva'}
                    </h3>
                    <div className="text-[11px] text-zinc-400 light:text-slate-500 font-mono">
                      {!isOnline ? `Disconnesso ${formatOfflineDuration()}` : 'Rete disponibile'}
                    </div>
                  </div>
                </div>
                <button
                  id="btn-close-offline-modal"
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 light:text-slate-500 light:hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300 dark:text-zinc-300 light:text-slate-600">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-800/50 light:bg-slate-100 border border-zinc-800 light:border-slate-200">
                  <Database className="w-4 h-4 text-amber-400 light:text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-100 light:text-slate-900 block font-semibold">100% Autonomo</strong>
                    I 504 quiz AeCI, risposte, note e quaderno errori risiedono sul dispositivo in IndexedDB.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-800/50 light:bg-slate-100 border border-zinc-800 light:border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 light:text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-100 light:text-slate-900 block font-semibold">Esami & Studio Operativi</strong>
                    Puoi svolgere qualsiasi sessione d'esame e studio senza alcuna limitazione o interruzione.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-800/50 light:bg-slate-100 border border-zinc-800 light:border-slate-200">
                  <Cloud className="w-4 h-4 text-sky-400 light:text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-100 light:text-slate-900 block font-semibold">Sincronizzazione Differita</strong>
                    Se abilitato il backup Google Drive, i progressi verranno inviati automaticamente al rientro online.
                  </div>
                </div>
              </div>

              <button
                id="btn-confirm-offline-modal"
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-md"
              >
                Ricevuto, Continua
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

/**
 * Dismissable top banner rendered below the header when network state changes.
 */
export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline]);

  if (isOnline && !wasOffline) {
    return null;
  }

  if (isDismissed && !wasOffline) {
    return null;
  }

  return (
    <div id="offline-banner" className="max-w-2xl mx-auto px-4 pt-3">
      {!isOnline ? (
        <div className="p-3 bg-zinc-900/95 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in light:bg-amber-50 light:border-amber-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-600 flex-shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-amber-300 light:text-amber-900 flex items-center gap-1.5">
                <span>Nessuna Connessione</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">
                  OFFLINE
                </span>
              </div>
              <div className="text-[11px] text-zinc-300 light:text-slate-600 truncate">
                L'app funziona al 100% in locale. Quiz ed esami sono pienamente operativi.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 light:text-slate-500 light:hover:text-slate-800 flex-shrink-0"
            title="Chiudi avviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-3 bg-zinc-900/95 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in light:bg-emerald-50 light:border-emerald-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-600 flex-shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-emerald-300 light:text-emerald-900 flex items-center gap-1.5">
                <span>Connessione Ripristinata</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                  ONLINE
                </span>
              </div>
              <div className="text-[11px] text-zinc-300 light:text-slate-600">
                Sei di nuovo online. La sincronizzazione riprenderà regolarmente.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact HUD badge for DriveModeScreen.
 */
export const OfflineHUDTag: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  if (isOnline) return null;

  return (
    <span
      id="drive-offline-tag"
      className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1 shadow-sm"
      title="Modalità offline attiva: quiz ed esami 100% operativi in locale"
    >
      <WifiOff className="w-3.5 h-3.5 animate-pulse" />
      <span>OFFLINE</span>
    </span>
  );
};
