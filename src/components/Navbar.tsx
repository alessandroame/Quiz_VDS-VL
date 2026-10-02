import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Cloud,
  CloudOff,
  RefreshCw,
  ChevronLeft,
  Headphones
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useQuiz } from '../context/QuizContext';
import { VoiceQuickMenu } from './VoiceQuickMenu';
import { OfflineIndicator } from './OfflineIndicator';
import { AudioDownloadBanner } from './AudioDownloadBanner';
import { BuildInfoModal } from './BuildInfoModal';
import { getBuildInfo } from '../utils/buildInfo';
import { getAppIconUrl, getAppFaviconUrl } from '../utils/assets';

import { getHeaderTitle, type NavTab } from '../utils/navigation';
import type { SettingsTab } from './SettingsModal';

export type { NavTab };

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  openSettings: (tab?: SettingsTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openSettings }) => {
  const { theme, cycleTheme, resolvedTheme } = useTheme();
  const { readinessScore, isExamRunning, activeSession, toggleDriveMode, isDriveModeOpen, settings, syncState } = useQuiz();
  const [isBuildInfoOpen, setIsBuildInfoOpen] = useState(false);
  const buildInfo = getBuildInfo();

  const getSyncTooltip = () => {
    switch (syncState.status) {
      case 'syncing':
        return 'Sincronizzazione in corso...';
      case 'synced':
        return syncState.lastSyncedAt
          ? `Sincronizzato: ${new Date(syncState.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'Sincronizzato con Google Drive';
      case 'offline':
        return 'Offline: i salvataggi verranno inviati appena torni online';
      case 'needs_auth':
        if (syncState.isPopupBlocked || syncState.errorDetail?.toLowerCase().includes('popup')) {
          return '⚠️ Popup bloccato dal browser: tocca per scoprire come abilitarlo';
        }
        return 'Accesso Google richiesto: tocca per ri-autorizzare';
      case 'error':
        if (syncState.isPopupBlocked || syncState.errorDetail?.toLowerCase().includes('popup')) {
          return '⚠️ Popup bloccato dal browser: tocca per scoprire come abilitarlo';
        }
        return `Errore sincronizzazione: ${syncState.errorDetail || 'controlla le impostazioni'}`;
      default:
        return 'Sincronizzazione Google Drive';
    }
  };

  // MINI-HEADER PER LE SCHERMATE INTERNE (Recupera ~50px verticali)
  if (activeTab !== 'home') {
    return (
      <>
        <header
          id="mini-header"
          className="fixed top-0 left-0 right-0 z-40 w-full h-12 border-b backdrop-blur bg-zinc-950/95 border-zinc-700/80 dark:bg-zinc-950/95 dark:border-zinc-700/80 light:bg-white/95 light:border-slate-300 light:text-slate-900 transition-colors shadow-sm"
        >
          <div className="max-w-4xl mx-auto px-2 sm:px-4 h-full flex items-center justify-between gap-2">
            {/* Tasto Ritorno a Home Hub */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                id="btn-nav-back-home"
                onClick={() => setActiveTab('home')}
                className="group flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-200 hover:text-white light:bg-slate-100 light:border-slate-300 light:text-slate-800 text-xs font-bold transition-all active:scale-95 shadow-sm flex-shrink-0"
                title="Torna alla Home"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-white light:text-slate-500 light:group-hover:text-slate-900 transition-colors" />
                <span className="font-mono">Home</span>
              </button>

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-xs sm:text-sm uppercase tracking-wider text-zinc-200 light:text-slate-800 truncate">
                  {getHeaderTitle(activeTab)}
                </span>
                {activeTab === 'tutor' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold hidden sm:inline flex-shrink-0">
                    Senza Limiti
                  </span>
                )}
                {(activeTab === 'exam' || activeTab === 'tutor') && isExamRunning && (
                  <span
                    title="Sessione in corso"
                    className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 light:bg-rose-100 light:text-rose-700 light:border-rose-300 font-bold flex items-center gap-1 animate-pulse flex-shrink-0"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="hidden sm:inline">ATTIVO</span>
                  </span>
                )}
              </div>
            </div>

            {/* Controlli Rapidi Mini-Header */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              {/* Tasto Switch Rapido Modalità Mani Libere */}
              <button
                id="btn-mini-audio"
                onClick={() => toggleDriveMode()}
                title={isDriveModeOpen ? 'Torna alla vista normale' : "Passa all'ascolto hands-free (Modalità Mani Libere)"}
                className={`group p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border flex items-center gap-1 text-xs font-semibold transition-all active:scale-95 shadow-sm ${
                  isDriveModeOpen
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 light:bg-amber-100 light:border-amber-400 light:text-amber-800'
                    : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white light:bg-slate-100 light:border-slate-200 light:text-slate-700 light:hover:text-slate-900'
                }`}
              >
                <Headphones className={`w-3.5 h-3.5 transition-colors ${
                  isDriveModeOpen
                    ? 'text-amber-400 light:text-amber-700'
                    : 'text-zinc-400 group-hover:text-zinc-200 light:text-slate-500 light:group-hover:text-slate-800'
                }`} />
                <span className="hidden sm:inline">Mani Libere</span>
              </button>

              {/* Quick Speech Menu */}
              <VoiceQuickMenu />

              {/* Theme quick toggle (desktop only during exam/study) */}
              <button
                id="btn-mini-theme-toggle"
                onClick={cycleTheme}
                title={`Tema: ${theme}`}
                className="hidden sm:flex p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 light:text-slate-600 light:hover:text-slate-900 hover:bg-zinc-800/60 light:hover:bg-slate-100 transition-colors"
              >
                {theme === 'dark' && <Moon className="w-4 h-4" />}
                {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
                {theme === 'system' && <Monitor className="w-4 h-4" />}
              </button>

              {/* Settings button */}
              <button
                id="btn-mini-settings"
                aria-label="Impostazioni"
                onClick={() => openSettings()}
                title="Impostazioni"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 light:text-slate-600 light:hover:text-slate-900 hover:bg-zinc-800/60 light:hover:bg-slate-100 transition-colors"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Audio Download Bottom Banner */}
        <AudioDownloadBanner elevated={isExamRunning || Boolean(activeSession)} />

        {/* Modal Dettagli Versione e Build */}
        <BuildInfoModal isOpen={isBuildInfoOpen} onClose={() => setIsBuildInfoOpen(false)} />
      </>
    );
  }

  // HEADER COMPLETO PER HOME HUB (Singola barra da 56px, zero clutter)
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full h-14 border-b backdrop-blur bg-zinc-950/95 border-zinc-700/80 dark:bg-zinc-950/95 dark:border-zinc-700/80 light:bg-white/95 light:border-slate-300 light:text-slate-900 transition-colors shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-full flex items-center justify-between gap-1 sm:gap-2">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer min-w-0"
            onClick={() => setActiveTab('home')}
          >
            <img
              id="navbar-app-logo"
              src={getAppIconUrl(resolvedTheme)}
              onError={(e) => {
                const target = e.currentTarget;
                const fallback = getAppFaviconUrl(resolvedTheme);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
              alt="VDS-VL"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-sm flex-shrink-0 object-cover"
            />
            <div className="min-w-0">
              <div className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                <span className="flex-shrink-0">VDS-VL</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 light:bg-slate-100 light:text-slate-600 light:border-slate-200 font-mono hidden sm:inline-flex flex-shrink-0">
                  2017
                </span>
                {/* Global dynamic version badge - touch-friendly and visible on mobile & desktop */}
                <button
                  id="app-version-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBuildInfoOpen(true);
                  }}
                  title={buildInfo.buildId}
                  aria-label={`Versione ${buildInfo.version} build ${buildInfo.buildNumber}`}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 light:hover:text-slate-900 light:border-slate-300 font-mono inline-flex items-center flex-shrink-0 cursor-pointer select-none active:scale-95 transition-all shadow-sm"
                >
                  v{buildInfo.version}
                  {buildInfo.buildNumber && buildInfo.buildNumber !== '0' && (
                    <span className="hidden sm:inline text-zinc-400 light:text-slate-700 font-normal">
                      {' '}#{buildInfo.buildNumber}
                    </span>
                  )}
                </button>
                {/* Indicatore Stato Offline */}
                <OfflineIndicator />
              </div>
              {/* Secondary telemetry subtitle - hidden on mobile to avoid overlap */}
              <div className="text-[11px] text-zinc-400 light:text-slate-600 truncate hidden sm:block">
                Preparazione: <strong className="text-amber-400 light:text-amber-800">{readinessScore}%</strong>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Modalità Mani Libere */}
            <button
              id="btn-drive-mode"
              onClick={() => toggleDriveMode()}
              title={isDriveModeOpen ? 'Torna alla vista normale' : 'Modalità Mani Libere (Macro-target & Hands-free)'}
              className={`group p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 shadow-sm ${
                isDriveModeOpen
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300 light:bg-amber-100 light:border-amber-400 light:text-amber-800'
                  : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white light:bg-slate-100 light:border-slate-200 light:text-slate-700 light:hover:text-slate-900'
              }`}
            >
              <Headphones className={`w-4 h-4 transition-colors ${
                isDriveModeOpen
                  ? 'text-amber-400 light:text-amber-700'
                  : 'text-zinc-400 group-hover:text-zinc-200 light:text-slate-500 light:group-hover:text-slate-800'
              }`} />
              <span className="hidden sm:inline">Mani Libere</span>
            </button>

            {/* Quick Voice / Speech Menu */}
            <VoiceQuickMenu />

            {/* Cloud Sync Status Indicator */}
            {settings.autoSyncDrive && (
              <button
                id="btn-cloud-sync"
                onClick={() => openSettings('cloud')}
                title={getSyncTooltip()}
                aria-label={getSyncTooltip()}
                className="p-1.5 sm:p-2 rounded-lg text-zinc-300 hover:text-white light:text-slate-700 light:hover:text-slate-900 border border-zinc-700 hover:border-zinc-600 light:border-slate-300 light:shadow-sm hover:bg-zinc-800/60 light:hover:bg-slate-100 transition-colors"
              >
                {syncState.status === 'syncing' ? (
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                ) : syncState.status === 'needs_auth' || syncState.status === 'error' ? (
                  <div className="relative">
                    <Cloud className="w-4 h-4 text-amber-400" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                ) : syncState.status === 'offline' ? (
                  <CloudOff className="w-4 h-4 text-zinc-400" />
                ) : (
                  <Cloud className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            )}

            {/* Theme quick toggle */}
            <button
              id="btn-theme-toggle"
              onClick={cycleTheme}
              title={`Tema: ${theme}`}
              className="p-1.5 sm:p-2 rounded-lg text-zinc-300 hover:text-white light:text-slate-700 light:hover:text-slate-900 border border-zinc-700 hover:border-zinc-600 light:border-slate-300 light:shadow-sm hover:bg-zinc-800/60 light:hover:bg-slate-100 transition-colors"
            >
              {theme === 'dark' && <Moon className="w-4 h-4" />}
              {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
              {theme === 'system' && <Monitor className="w-4 h-4" />}
            </button>

            {/* Settings button */}
            <button
              id="btn-settings"
              aria-label="Impostazioni"
              onClick={() => openSettings()}
              title="Impostazioni"
              className="p-1.5 sm:p-2 rounded-lg text-zinc-300 hover:text-white light:text-slate-700 light:hover:text-slate-900 border border-zinc-700 hover:border-zinc-600 light:border-slate-300 light:shadow-sm hover:bg-zinc-800/60 light:hover:bg-slate-100 transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Audio Download Bottom Banner */}
      <AudioDownloadBanner elevated={isExamRunning || Boolean(activeSession)} />

      {/* Modal Dettagli Versione e Build */}
      <BuildInfoModal isOpen={isBuildInfoOpen} onClose={() => setIsBuildInfoOpen(false)} />
    </>
  );
};
