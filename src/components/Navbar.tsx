import React from 'react';
import {
  Compass,
  BookOpen,
  AlertTriangle,
  Database,
  BarChart3,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Car,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useQuiz } from '../context/QuizContext';
import { VoiceQuickMenu } from './VoiceQuickMenu';
import { OfflineIndicator } from './OfflineIndicator';
import { AudioDownloadProgressHUD } from './AudioDownloadProgressHUD';

export type NavTab = 'exam' | 'topics' | 'mistakes' | 'archive' | 'stats';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  openSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openSettings }) => {
  const { theme, cycleTheme } = useTheme();
  const { mistakesCount, readinessScore, isExamRunning, openDriveMode, settings, syncState } = useQuiz();

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
        return 'Accesso Google richiesto: tocca per ri-autorizzare';
      case 'error':
        return `Errore sincronizzazione: ${syncState.errorDetail || 'controlla le impostazioni'}`;
      default:
        return 'Sincronizzazione Google Drive';
    }
  };

  const navItems = [
    { id: 'exam' as NavTab, label: 'Esame', icon: Compass },
    { id: 'topics' as NavTab, label: 'Materie', icon: BookOpen },
    {
      id: 'mistakes' as NavTab,
      label: 'Errori',
      icon: AlertTriangle,
      badge: mistakesCount > 0 ? mistakesCount : undefined
    },
    { id: 'archive' as NavTab, label: 'Archivio', icon: Database },
    { id: 'stats' as NavTab, label: 'Stats', icon: BarChart3 }
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b backdrop-blur bg-zinc-950/80 border-zinc-800 dark:bg-zinc-950/80 dark:border-zinc-800 light:bg-white/80 light:border-slate-200 light:text-slate-900 transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('exam')}>
            <img src="/favicon.svg" alt="VDS-VL" className="w-8 h-8 rounded-lg shadow-sm flex-shrink-0" />
            <div>
              <div className="font-bold text-sm tracking-wide flex items-center gap-1.5 whitespace-nowrap">
                <span className="flex-shrink-0">VDS-VL</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono flex-shrink-0">2017</span>
                {/* Indicatore Stato Offline adiacente al logo */}
                <OfflineIndicator />
                {isExamRunning && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold flex items-center gap-1 animate-pulse flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    <span className="hidden sm:inline">ESAME </span>
                    <span>IN CORSO</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] text-zinc-400 light:text-slate-500">
                Prontezza: <strong className="text-amber-400 light:text-amber-600">{readinessScore}%</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Indicatore Download Audio Background */}
            <AudioDownloadProgressHUD />

            {/* Modalità Alla Guida */}
            <button
              id="btn-drive-mode"
              onClick={() => openDriveMode()}
              title="Modalità Alla Guida (Pulsanti giganti & Hands-free)"
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-800 border border-amber-500/30 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Car className="w-4 h-4 text-amber-400 light:text-amber-700" />
              <span className="hidden sm:inline">Alla Guida</span>
            </button>

            {/* Quick Voice / Speech Menu */}
            <VoiceQuickMenu />

            {/* Cloud Sync Status Indicator */}
            {settings.autoSyncDrive && (
              <button
                id="btn-cloud-sync"
                onClick={openSettings}
                title={getSyncTooltip()}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 light:text-slate-600 light:hover:text-slate-900 hover:bg-zinc-800/60 light:hover:bg-slate-100 transition-colors"
              >
                {syncState.status === 'syncing' ? (
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                ) : syncState.status === 'needs_auth' || syncState.status === 'error' ? (
                  <div className="relative">
                    <Cloud className="w-4 h-4 text-amber-400" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                ) : syncState.status === 'offline' ? (
                  <CloudOff className="w-4 h-4 text-zinc-500" />
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
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 light:text-slate-600 light:hover:text-slate-900 hover:bg-zinc-800/60 light:hover:bg-slate-100 transition-colors"
            >
              {theme === 'dark' && <Moon className="w-4 h-4" />}
              {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
              {theme === 'system' && <Monitor className="w-4 h-4" />}
            </button>

            {/* Settings button */}
            <button
              id="btn-settings"
              onClick={openSettings}
              title="Impostazioni"
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 light:text-slate-600 light:hover:text-slate-900 hover:bg-zinc-800/60 light:hover:bg-slate-100 transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Nav Bar (Mobile & Desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur bg-zinc-950/95 border-zinc-800 dark:bg-zinc-950/95 dark:border-zinc-800 light:bg-white/95 light:border-slate-200 transition-colors">
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
                  isActive
                    ? 'text-amber-400 light:text-amber-600 font-semibold'
                    : 'text-zinc-400 light:text-slate-500 hover:text-zinc-200 light:hover:text-slate-900'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2.5 px-1 py-0.2 min-w-4 text-[10px] font-bold rounded-full bg-rose-500 text-white text-center">
                      {item.badge}
                    </span>
                  )}
                  {item.id === 'exam' && isExamRunning && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] tracking-tight">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 w-8 h-0.5 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
