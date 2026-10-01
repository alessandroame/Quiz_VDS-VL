import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sun,
  Moon,
  Monitor,
  Volume2,
  Headphones,
  Cloud,
  Download,
  Upload,
  Trash2,
  Palette,
  Database,
  Check,
  Mic,
  HelpCircle,
  CloudOff,
  RotateCcw,
  Info,
  Award,
  ShieldCheck,
  Settings as SettingsIcon,
  ArrowLeft,
  Maximize2,
  Minimize2,
  ChevronDown,
  RefreshCw,
  Speech,
  Tag,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useQuiz } from '../context/QuizContext';
import { googleDrive } from '../services/googleDrive';
import { voiceService } from '../services/voiceService';
import { exportDatabaseBackup, importDatabaseBackup, db } from '../db';
import type { ThemeMode } from '../types/database';
import { FONT_SIZE_OPTIONS, getFontSizeLabel } from '../utils/fontSize';
import { VoiceCommandsModal } from './VoiceCommandsModal';
import { BuildInfoModal } from './BuildInfoModal';
import { getBuildInfo, formatBuildDate, forceReloadPWA } from '../utils/buildInfo';
import { getAppIconUrl, getAppFaviconUrl } from '../utils/assets';
import {
  audioDownloadManager,
  VoiceName,
  VoiceDownloadProgress,
  AudioUpdateCheckResult
} from '../services/audioDownloadManager';

export type SettingsTab = 'appearance' | 'voice' | 'drive' | 'cloud' | 'data' | 'about';

interface AccordionCardProps {
  id: SettingsTab;
  label: string;
  description: string;
  summary: string;
  icon: React.FC<{ className?: string }>;
  isExpanded: boolean;
  onToggle: () => void;
  cardRef?: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}

const AccordionCard: React.FC<AccordionCardProps> = ({
  id,
  label,
  description,
  summary,
  icon: Icon,
  isExpanded,
  onToggle,
  cardRef,
  children
}) => {
  return (
    <div
      ref={cardRef}
      className={`rounded-2xl border transition-colors duration-150 overflow-hidden scroll-mt-4 ${
        isExpanded
          ? 'border-amber-500/50 bg-zinc-900/80 shadow-md shadow-amber-500/5 light:border-amber-400 light:bg-white ring-1 ring-amber-500/20 light:ring-amber-400/20'
          : 'border-zinc-700/80 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-zinc-600 light:border-slate-300 light:bg-white light:shadow-sm light:hover:bg-slate-50'
      }`}
    >
      <button
        type="button"
        id={`tab-${id}`}
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-colors cursor-pointer select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-2xl touch-manipulation active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isExpanded
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 light:bg-amber-100 light:text-amber-800 light:border-amber-300'
                : 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 group-hover:text-white group-hover:border-zinc-500 light:bg-slate-100 light:text-slate-700 light:border-slate-300 light:shadow-sm light:group-hover:bg-slate-200 light:group-hover:text-slate-900'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-bold tracking-tight transition-colors ${
                  isExpanded
                    ? 'text-amber-400 light:text-amber-800'
                    : 'text-zinc-200 group-hover:text-zinc-100 light:text-slate-800 light:group-hover:text-slate-900'
                }`}
              >
                {label}
              </span>
              <span
                className={`text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full border truncate max-w-[190px] sm:max-w-xs transition-colors ${
                  isExpanded
                    ? 'bg-amber-500/10 text-amber-300/90 border-amber-500/30 light:bg-amber-50 light:text-amber-700 light:border-amber-200'
                    : 'bg-zinc-800/60 text-zinc-300 border-zinc-700 light:bg-slate-100 light:text-slate-700 light:border-slate-300 light:group-hover:text-slate-900'
                }`}
              >
                {summary}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 light:text-slate-600 line-clamp-1 mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center shrink-0 pl-1">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 ${
              isExpanded
                ? 'rotate-180 bg-amber-500/10 text-amber-400 light:bg-amber-100 light:text-amber-800'
                : 'text-zinc-400 group-hover:text-zinc-200 light:text-slate-500 light:group-hover:text-slate-700'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3.5 pb-4 pt-1 sm:px-4 sm:pb-5 border-t border-zinc-700/70 light:border-slate-200 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SettingsTab | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = null
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { settings, updateSetting, syncState, syncNow } = useQuiz();
  const [openSection, setOpenSection] = useState<SettingsTab | null>(defaultTab);

  const envClientId = (import.meta.env?.VITE_GOOGLE_CLIENT_ID as string) || '182413802928-q7sphls58ob60s2mu3fspbbkk9kq2am9.apps.googleusercontent.com';
  const effectiveClientId = (settings.googleClientId || envClientId).trim();

  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVoiceGuideOpen, setIsVoiceGuideOpen] = useState(false);
  const [audioStatuses, setAudioStatuses] = useState<Record<VoiceName, VoiceDownloadProgress>>(
    audioDownloadManager.getAllStatuses()
  );
  const [updateCheckResult, setUpdateCheckResult] = useState<AudioUpdateCheckResult | null>(null);
  const [isCheckingAudioUpdates, setIsCheckingAudioUpdates] = useState(false);
  const [updatingVoices, setUpdatingVoices] = useState<Partial<Record<VoiceName, boolean>>>({});
  const [voiceUpdateProgress, setVoiceUpdateProgress] = useState<Partial<Record<VoiceName, number>>>({});
  const [audioUpdateToast, setAudioUpdateToast] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleStartDownload = async (voice: VoiceName) => {
    if (typeof window !== 'undefined' && !('caches' in window)) {
      setAudioUpdateToast('CacheStorage non supportata su questo browser (necessario HTTPS o localhost)');
      setTimeout(() => setAudioUpdateToast(null), 4000);
      return;
    }
    try {
      setAudioUpdateToast(`Avvio download audio ${voice === 'giuseppe' ? 'Giuseppe' : 'Elsa'}...`);
      setTimeout(() => setAudioUpdateToast(null), 2500);
      await audioDownloadManager.startDownload(voice);
    } catch (err: any) {
      setAudioUpdateToast(`Errore download: ${err?.message || 'operazione non riuscita'}`);
      setTimeout(() => setAudioUpdateToast(null), 4000);
    }
  };

  const handleDeleteCache = async (voice: VoiceName) => {
    try {
      await audioDownloadManager.deleteCache(voice);
      setAudioUpdateToast(`Cache audio di ${voice === 'giuseppe' ? 'Giuseppe' : 'Elsa'} eliminata`);
      setTimeout(() => setAudioUpdateToast(null), 3000);
    } catch (err: any) {
      setAudioUpdateToast(`Errore eliminazione cache: ${err?.message || 'operazione non riuscita'}`);
      setTimeout(() => setAudioUpdateToast(null), 3000);
    }
  };

  const handleCancelDownload = (voice: VoiceName) => {
    audioDownloadManager.cancelDownload(voice);
    setAudioUpdateToast(`Download audio ${voice === 'giuseppe' ? 'Giuseppe' : 'Elsa'} annullato`);
    setTimeout(() => setAudioUpdateToast(null), 2500);
  };

  const handleCheckAudioUpdates = async () => {
    setIsCheckingAudioUpdates(true);
    try {
      const res = await audioDownloadManager.checkAudioUpdates();
      setUpdateCheckResult(res);
      if (!res.hasUpdates) {
        setAudioUpdateToast(res.isOffline ? 'Offline: impossibile verificare aggiornamenti' : 'Archivio audio già aggiornato!');
        setTimeout(() => setAudioUpdateToast(null), 3000);
      }
    } catch {
      setAudioUpdateToast('Errore durante la verifica');
      setTimeout(() => setAudioUpdateToast(null), 3000);
    } finally {
      setIsCheckingAudioUpdates(false);
    }
  };

  const handleApplyAudioUpdates = async (voice: VoiceName) => {
    setUpdatingVoices(prev => ({ ...prev, [voice]: true }));
    setVoiceUpdateProgress(prev => ({ ...prev, [voice]: 0 }));
    try {
      const res = await audioDownloadManager.applyAudioUpdates(voice, (pct) => {
        setVoiceUpdateProgress(prev => ({ ...prev, [voice]: pct }));
      });
      if (res.updatedCount > 0) {
        setAudioUpdateToast(`Aggiornati ${res.updatedCount} file audio di ${voice === 'giuseppe' ? 'Giuseppe' : 'Elsa'}`);
        setTimeout(() => setAudioUpdateToast(null), 3500);
      }
      const updatedCheck = await audioDownloadManager.checkAudioUpdates();
      setUpdateCheckResult(updatedCheck);
    } catch (err: any) {
      setAudioUpdateToast(err?.message || 'Errore aggiornamento');
      setTimeout(() => setAudioUpdateToast(null), 3000);
    } finally {
      setUpdatingVoices(prev => ({ ...prev, [voice]: false }));
    }
  };


  useEffect(() => {
    if (isOpen) {
      setOpenSection(defaultTab);
      if (defaultTab) {
        const timer = setTimeout(() => {
          const el = sectionRefs.current[defaultTab];
          if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, defaultTab]);

  const toggleSection = (tabId: SettingsTab) => {
    setOpenSection(prev => {
      const next = prev === tabId ? null : tabId;
      if (next) {
        setTimeout(() => {
          const el = sectionRefs.current[next];
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top < 60 || rect.bottom > window.innerHeight) {
              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }, 120);
      }
      return next;
    });
  };

  useEffect(() => {
    const unsub = audioDownloadManager.subscribe(newStatuses => {
      setAudioStatuses(newStatuses);
    });
    if (isOpen) {
      audioDownloadManager.checkAllStatuses().catch(console.error);
    }
    return unsub;
  }, [isOpen]);

  const [isFullscreen, setIsFullscreen] = useState(
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );
  const [isBuildInfoOpen, setIsBuildInfoOpen] = useState(false);
  const [isRefreshingPwa, setIsRefreshingPwa] = useState(false);
  const buildInfo = getBuildInfo();

  const handleForcePwaRefresh = async () => {
    setIsRefreshingPwa(true);
    await forceReloadPWA();
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      voiceService.stopDriveIntro();
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackupToDrive = async () => {
    setIsProcessing(true);
    setSyncStatus('Connessione a Google in corso...');
    try {
      googleDrive.initTokenClient(effectiveClientId);
      const jsonStr = await exportDatabaseBackup();
      const res = await googleDrive.uploadBackup(jsonStr);
      if (res.success) {
        setSyncStatus('Salvataggio completato con successo!');
        await updateSetting('lastDriveSyncAt', Date.now());
      } else {
        setSyncStatus(`Attenzione: ${res.message}`);
      }
    } catch (err: any) {
      setSyncStatus(`Accesso o salvataggio non riuscito (${err.message || 'operazione annullata'})`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!window.confirm('I dati salvati su Google verranno uniti ai progressi attuali su questo dispositivo (Smart Merge), senza cancellare i tuoi esami. Vuoi continuare?')) {
      return;
    }
    setIsProcessing(true);
    setSyncStatus('Recupero dati da Google in corso...');
    try {
      googleDrive.initTokenClient(effectiveClientId);
      const res = await googleDrive.downloadBackup();
      if (res.success && res.data) {
        const importRes = await importDatabaseBackup(res.data);
        setSyncStatus(importRes.message || 'Dati ripristinati con successo!');
      } else {
        setSyncStatus(`Attenzione: ${res.message}`);
      }
    } catch (err: any) {
      setSyncStatus(`Recupero non riuscito (${err.message || 'operazione annullata'})`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportLocalJson = async () => {
    const jsonStr = await exportDatabaseBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_vds_salvataggio_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportLocalJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      if (text) {
        const res = await importDatabaseBackup(text);
        alert(res.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (window.confirm('Vuoi davvero cancellare tutti i tuoi progressi, le statistiche e le domande salvate? Ricomincerai completamente da capo.')) {
      await db.stats.clear();
      await db.sessions.clear();
      alert('Tutti i progressi sono stati azzerati.');
      onClose();
    }
  };

  const fontLabel = getFontSizeLabel(settings.fontSizePreference || 'normal');
  const appearanceSummary = `${theme === 'dark' ? 'Scuro' : theme === 'light' ? 'Chiaro' : 'Auto'} • ${fontLabel} • ${
    settings.immediateFeedbackInTopics ? 'Feedback ON' : 'Feedback OFF'
  }`;

  const voiceSummary = `${settings.ttsVoice === 'elsa' ? 'Elsa' : 'Giuseppe'} • ${
    settings.ttsPlaybackRate || 1.0
  }x • ${audioStatuses.giuseppe.isComplete || audioStatuses.elsa.isComplete ? 'Offline OK' : 'TTS Web'}`;

  const driveSummary = `${
    settings.driveModeVoiceCommands
      ? `Voce (${settings.driveModeAudioOutput === 'headphones' ? 'Cuffie' : 'Altoparlante'})`
      : settings.driveModeAutopilot ?? true
      ? 'Radio ON'
      : 'Manuale'
  } • ${settings.driveModeAutoAdvanceSeconds || 5}s${settings.driveModeTutor ? ' • Tutor ON' : ''}`;

  const cloudSummary = `${
    settings.autoSyncDrive ? 'Auto-Sync ON' : syncState?.lastSyncedAt ? 'Drive Sincronizzato' : 'Manuale'
  }`;

  const dataSummary = '504 Quiz • Dexie SSOT';

  const aboutSummary = `v${buildInfo.version} • #${buildInfo.buildNumber}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Impostazioni"
      className="fixed inset-0 z-50 flex flex-col h-[100dvh] w-full bg-zinc-950 text-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 light:bg-slate-50 light:text-slate-900 overflow-hidden font-sans animate-in fade-in duration-150"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-20 w-full border-b backdrop-blur bg-zinc-950/90 border-zinc-700 dark:bg-zinc-950/90 dark:border-zinc-700 light:bg-white/90 light:border-slate-300 light:shadow-sm transition-colors flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              id="btn-close-settings"
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100 transition-colors flex items-center gap-1.5 active:scale-95"
              title="Torna indietro"
              aria-label="Torna indietro"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs font-semibold hidden sm:inline">Indietro</span>
            </button>
            <div className="h-4 w-px bg-zinc-700 light:bg-slate-300 mx-1 hidden sm:block" />
            <h1 className="text-base font-bold text-zinc-100 light:text-slate-900 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-amber-500" />
              <span>Impostazioni</span>
              <button
                id="settings-version-badge"
                onClick={() => setIsBuildInfoOpen(true)}
                title={buildInfo.buildId}
                aria-label="Dettagli versione e build"
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 light:bg-slate-200 light:hover:bg-slate-300 light:text-slate-700 light:border-slate-300 font-normal cursor-pointer select-none active:scale-95 transition-all shadow-sm"
              >
                v{buildInfo.version}
                {buildInfo.buildNumber && buildInfo.buildNumber !== '0' && (
                  <span className="text-zinc-400 light:text-slate-500 font-normal">
                    {' '}#{buildInfo.buildNumber}
                  </span>
                )}
              </button>
            </h1>
          </div>

          <button
            id="btn-close-settings-x"
            onClick={onClose}
            className="p-2 -mr-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100 transition-colors active:scale-95"
            title="Chiudi"
            aria-label="Chiudi impostazioni"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Accordion Body (Full-height Scrollable Area) */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3 pb-24">
          
          {/* Quick Toolbar / Overview */}
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400 light:text-slate-600">
              <span className="font-semibold text-zinc-300 light:text-slate-700">Pannelli di Controllo</span>
              <span>•</span>
              <span>6 sezioni configurabili</span>
            </div>
            {openSection !== null ? (
              <button
                type="button"
                id="btn-settings-collapse-all"
                onClick={() => setOpenSection(null)}
                className="text-[11px] font-semibold text-zinc-400 hover:text-amber-400 light:text-slate-600 light:hover:text-amber-600 transition-colors py-1 px-2 rounded-lg hover:bg-zinc-800/40 light:hover:bg-slate-100 cursor-pointer"
              >
                Comprimi tutto
              </button>
            ) : (
              <button
                type="button"
                id="btn-settings-expand-first"
                onClick={() => setOpenSection('appearance')}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 light:text-amber-600 light:hover:text-amber-700 transition-colors py-1 px-2 rounded-lg hover:bg-zinc-800/40 light:hover:bg-slate-100 cursor-pointer"
              >
                Espandi prima
              </button>
            )}
          </div>

          {/* SEZIONE 1: ASPETTO & TEMA */}
          <AccordionCard
            id="appearance"
            label="Aspetto & Tema"
            description="Tema scuro/chiaro, schermo intero e feedback immediato nelle materie"
            summary={appearanceSummary}
            icon={Palette}
            isExpanded={openSection === 'appearance'}
            onToggle={() => toggleSection('appearance')}
            cardRef={el => {
              sectionRefs.current['appearance'] = el;
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider block">
                  Tema dell'applicazione
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'dark' as ThemeMode, label: 'Scuro', icon: Moon },
                    { id: 'light' as ThemeMode, label: 'Chiaro', icon: Sun },
                    { id: 'system' as ThemeMode, label: 'Auto', icon: Monitor }
                  ].map(item => {
                    const Icon = item.icon;
                    const isSelected = theme === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`theme-btn-${item.id}`}
                        onClick={() => setTheme(item.id)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 touch-manipulation ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/20 text-amber-400 light:border-amber-600 light:bg-amber-50 light:text-amber-700'
                            : 'border-zinc-700 bg-zinc-950/60 text-zinc-300 hover:text-white light:border-slate-300 light:bg-slate-50 light:text-slate-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selezione Scala Caratteri (Font Scaling) */}
              <div className="space-y-2 pt-2 border-t border-zinc-700/80 light:border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider block">
                    Dimensione Caratteri
                  </label>
                  <span className="text-[11px] font-mono text-amber-400 font-semibold">
                    {fontLabel}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {FONT_SIZE_OPTIONS.map(opt => {
                    const isSelected = (settings.fontSizePreference || 'normal') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        id={`font-size-btn-${opt.id}`}
                        type="button"
                        onClick={() => updateSetting('fontSizePreference', opt.id)}
                        className={`py-2 px-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer active:scale-95 touch-manipulation ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300 light:border-amber-600 light:bg-amber-50 light:text-amber-800 shadow-sm'
                            : 'border-zinc-700 bg-zinc-950/60 text-zinc-300 hover:text-white hover:bg-zinc-800/40 light:border-slate-300 light:bg-slate-50 light:text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">{opt.label}</span>
                          <span className="text-[10px] font-mono opacity-70">{opt.sizeLabel}</span>
                        </div>
                        <span className="text-[10px] opacity-75 mt-0.5 line-clamp-1">
                          {opt.id === 'compact' ? 'Zero-scroll' : opt.id === 'large' ? 'Outdoor/Bici' : 'Standard'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-700/80 light:border-slate-200">
                <label className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider block">
                  Feedback di Studio
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 cursor-pointer select-none active:scale-[0.99] touch-manipulation transition-all">
                  <div>
                    <span className="text-zinc-300 light:text-slate-700 font-medium block text-xs">
                      Verifica Immediata nelle Materie
                    </span>
                    <span className="text-[11px] text-zinc-400 light:text-slate-600 block">
                      Durante lo studio per materie, mostra subito se la risposta è esatta
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.immediateFeedbackInTopics}
                    onChange={e => updateSetting('immediateFeedbackInTopics', e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 cursor-pointer select-none active:scale-[0.99] touch-manipulation transition-all">
                  <div>
                    <span className="text-zinc-300 light:text-slate-700 font-medium block text-xs">
                      Avanzamento Automatico su Risposta Esatta
                    </span>
                    <span className="text-[11px] text-zinc-400 light:text-slate-600 block">
                      Passa da solo alla domanda successiva se indovini. In caso di errore si ferma per farti studiare Regola e Tranello.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="setting-auto-advance-on-correct"
                    checked={settings.autoAdvanceOnCorrect !== false}
                    onChange={e => updateSetting('autoAdvanceOnCorrect', e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Opzione Schermo Intero Browser */}
              {typeof document !== 'undefined' && Boolean(document.fullscreenEnabled) && (
                <div className="space-y-2 pt-2 border-t border-zinc-700/80 light:border-slate-200">
                  <label className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider block">
                    Schermo Intero
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300">
                    <div>
                      <span className="text-zinc-300 light:text-slate-700 font-medium block text-xs">
                        Modalità a Schermo Intero (Fullscreen)
                      </span>
                      <span className="text-[11px] text-zinc-400 light:text-slate-600 block">
                        Massimizza l'applicazione nascondendo le barre del browser
                      </span>
                    </div>
                    <button
                      type="button"
                      id="btn-toggle-fullscreen"
                      onClick={toggleBrowserFullscreen}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 touch-manipulation ${
                        isFullscreen
                          ? 'border-amber-500 bg-amber-500/20 text-amber-400 light:border-amber-600 light:bg-amber-50 light:text-amber-700'
                          : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 light:border-slate-300 light:bg-slate-200 light:text-slate-700'
                      }`}
                    >
                      {isFullscreen ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span>Disattiva</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Attiva</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </AccordionCard>

          {/* SEZIONE 2: VOCE & AUDIO */}
          <AccordionCard
            id="voice"
            label="Voce & Audio"
            description="Sintesi vocale quesiti, velocità di lettura e archivio offline PWA"
            summary={voiceSummary}
            icon={Speech}
            isExpanded={openSection === 'voice'}
            onToggle={() => toggleSection('voice')}
            cardRef={el => {
              sectionRefs.current['voice'] = el;
            }}
          >
            <div className="space-y-3.5">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 cursor-pointer select-none active:scale-[0.99] touch-manipulation transition-all">
                <div>
                  <span className="text-zinc-300 light:text-slate-700 font-medium block text-xs">
                    Attiva Lettura Vocale
                  </span>
                  <span className="text-[11px] text-zinc-400 light:text-slate-600 block">
                    Ascolta domande e opzioni lette a voce alta
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ttsEnabled}
                  onChange={e => updateSetting('ttsEnabled', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              {settings.ttsEnabled && (
                <>
                  {/* Selettore Voce */}
                  <div className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 space-y-2">
                    <span className="text-zinc-300 light:text-slate-700 font-medium block text-xs">
                      Voce Istruttore
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateSetting('ttsVoice', 'giuseppe')}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-95 touch-manipulation ${
                          (settings.ttsVoice || 'giuseppe') === 'giuseppe'
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300 light:border-amber-600 light:bg-amber-50 light:text-amber-800 font-semibold'
                            : 'border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white light:border-slate-300 light:bg-slate-100 light:text-slate-700'
                        }`}
                      >
                        <span className="text-xs">👨‍✈️ Giuseppe</span>
                        {(settings.ttsVoice || 'giuseppe') === 'giuseppe' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => updateSetting('ttsVoice', 'elsa')}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-95 touch-manipulation ${
                          settings.ttsVoice === 'elsa'
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300 light:border-amber-600 light:bg-amber-50 light:text-amber-800 font-semibold'
                            : 'border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white light:border-slate-300 light:bg-slate-100 light:text-slate-700'
                        }`}
                      >
                        <span className="text-xs">👩‍✈️ Elsa</span>
                        {settings.ttsVoice === 'elsa' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Velocità di Lettura */}
                  <div className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 light:text-slate-700 font-medium">
                        Velocità di Lettura
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        {settings.ttsPlaybackRate || 1.0}x
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[0.9, 1.0, 1.15, 1.25].map(rate => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => updateSetting('ttsPlaybackRate', rate)}
                          className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                            (settings.ttsPlaybackRate || 1.0) === rate
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 light:bg-slate-200 light:text-slate-700'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Automazioni vocali */}
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 cursor-pointer select-none active:scale-[0.99] touch-manipulation transition-all">
                      <span className="text-zinc-300 light:text-slate-700">Lettura automatica domanda</span>
                      <input
                        type="checkbox"
                        checked={settings.ttsAutoPlayQuestion}
                        onChange={e => updateSetting('ttsAutoPlayQuestion', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 cursor-pointer select-none active:scale-[0.99] touch-manipulation transition-all">
                      <span className="text-zinc-300 light:text-slate-700">Spiegazione vocale su errore</span>
                      <input
                        type="checkbox"
                        checked={settings.ttsAutoExplainOnMistake}
                        onChange={e => updateSetting('ttsAutoExplainOnMistake', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Sezione Offline Audio TTS */}
                  <div className="p-3 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-zinc-300 light:text-slate-700 font-bold block text-xs">
                          Archivio Audio Offline (PWA)
                        </span>
                        <span className="text-[11px] text-zinc-400 light:text-slate-600 block">
                          2.520 file audio MP3 per voce salvati nella cache del dispositivo
                        </span>
                      </div>
                      <CloudOff className="w-4 h-4 text-amber-500/70" />
                    </div>

                    {/* Giuseppe Card */}
                    <div className="p-2.5 rounded-xl border border-zinc-700/80 bg-zinc-900/60 light:bg-white light:border-slate-300 light:shadow-sm flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-200 light:text-slate-800">
                              👨‍✈️ Giuseppe (Maschile)
                            </span>
                            {audioStatuses.giuseppe.isComplete && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                Scaricato
                              </span>
                            )}
                            {updateCheckResult?.voiceUpdates.giuseppe.hasUpdates && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold animate-pulse">
                                {updateCheckResult.voiceUpdates.giuseppe.staleFiles.length} file modificati
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 light:text-slate-600 block">
                            {audioStatuses.giuseppe.isDownloading
                              ? `Download in corso: ${audioStatuses.giuseppe.percent}% (${audioStatuses.giuseppe.downloadedCount}/${audioStatuses.giuseppe.totalCount})`
                              : updatingVoices.giuseppe
                              ? `Aggiornamento in corso: ${voiceUpdateProgress.giuseppe || 0}%`
                              : audioStatuses.giuseppe.isComplete
                              ? '2.520 quesiti pronti offline (~154 MB)'
                              : audioStatuses.giuseppe.downloadedCount > 0
                              ? `Parziale: ${audioStatuses.giuseppe.downloadedCount} di ${audioStatuses.giuseppe.totalCount} file`
                              : 'Non scaricato (~154 MB)'}
                          </span>
                          {audioStatuses.giuseppe.error && (
                            <span className="text-[11px] text-rose-400 font-medium block mt-0.5">
                              ⚠️ {audioStatuses.giuseppe.error}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {updatingVoices.giuseppe ? (
                            <span className="text-[11px] text-amber-400 font-semibold px-2 py-1 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Aggiornamento...</span>
                            </span>
                          ) : audioStatuses.giuseppe.isDownloading ? (
                            <button
                              type="button"
                              id="btn-cancel-download-giuseppe"
                              onClick={() => handleCancelDownload('giuseppe')}
                              className="px-3 py-1.5 text-xs font-bold text-rose-400 border border-rose-500/40 rounded-lg hover:bg-rose-500/10 active:scale-95 cursor-pointer touch-manipulation transition-all"
                            >
                              Annulla
                            </button>
                          ) : (
                            <>
                              {updateCheckResult?.voiceUpdates.giuseppe.hasUpdates && (
                                <button
                                  type="button"
                                  id="btn-update-audio-giuseppe"
                                  onClick={() => handleApplyAudioUpdates('giuseppe')}
                                  className="px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 active:scale-95 cursor-pointer touch-manipulation transition-all flex items-center gap-1.5"
                                  title="Scarica solo i file modificati per la voce di Giuseppe"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Aggiorna ({updateCheckResult.voiceUpdates.giuseppe.staleFiles.length})</span>
                                </button>
                              )}
                              {audioStatuses.giuseppe.isComplete || audioStatuses.giuseppe.downloadedCount > 0 ? (
                                <button
                                  type="button"
                                  id="btn-delete-cache-giuseppe"
                                  onClick={() => handleDeleteCache('giuseppe')}
                                  className="px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-rose-400 border border-zinc-700 hover:border-rose-500/40 light:border-slate-300 light:text-slate-700 rounded-lg hover:bg-rose-500/10 active:scale-95 cursor-pointer touch-manipulation transition-all flex items-center gap-1.5"
                                  title="Elimina cache audio di Giuseppe"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Elimina</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  id="btn-download-giuseppe"
                                  onClick={() => handleStartDownload('giuseppe')}
                                  className="px-3 py-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 active:scale-95 cursor-pointer touch-manipulation transition-all flex items-center gap-1.5"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Scarica</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {audioStatuses.giuseppe.isDownloading && (
                        <div className="w-full bg-zinc-800 light:bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full transition-all duration-300"
                            style={{ width: `${audioStatuses.giuseppe.percent}%` }}
                          />
                        </div>
                      )}
                      {updatingVoices.giuseppe && (
                        <div className="w-full bg-zinc-800 light:bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full transition-all duration-300"
                            style={{ width: `${voiceUpdateProgress.giuseppe || 0}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Elsa Card */}
                    <div className="p-2.5 rounded-xl border border-zinc-700/80 bg-zinc-900/60 light:bg-white light:border-slate-300 light:shadow-sm flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-200 light:text-slate-800">
                              👩‍✈️ Elsa (Femminile)
                            </span>
                            {audioStatuses.elsa.isComplete && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                Scaricato
                              </span>
                            )}
                            {updateCheckResult?.voiceUpdates.elsa.hasUpdates && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold animate-pulse">
                                {updateCheckResult.voiceUpdates.elsa.staleFiles.length} file modificati
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 light:text-slate-600 block">
                            {audioStatuses.elsa.isDownloading
                              ? `Download in corso: ${audioStatuses.elsa.percent}% (${audioStatuses.elsa.downloadedCount}/${audioStatuses.elsa.totalCount})`
                              : updatingVoices.elsa
                              ? `Aggiornamento in corso: ${voiceUpdateProgress.elsa || 0}%`
                              : audioStatuses.elsa.isComplete
                              ? '2.520 quesiti pronti offline (~148 MB)'
                              : audioStatuses.elsa.downloadedCount > 0
                              ? `Parziale: ${audioStatuses.elsa.downloadedCount} di ${audioStatuses.elsa.totalCount} file`
                              : 'Non scaricato (~148 MB)'}
                          </span>
                          {audioStatuses.elsa.error && (
                            <span className="text-[11px] text-rose-400 font-medium block mt-0.5">
                              ⚠️ {audioStatuses.elsa.error}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {updatingVoices.elsa ? (
                            <span className="text-[11px] text-amber-400 font-semibold px-2 py-1 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Aggiornamento...</span>
                            </span>
                          ) : audioStatuses.elsa.isDownloading ? (
                            <button
                              type="button"
                              id="btn-cancel-download-elsa"
                              onClick={() => handleCancelDownload('elsa')}
                              className="px-3 py-1.5 text-xs font-bold text-rose-400 border border-rose-500/40 rounded-lg hover:bg-rose-500/10 active:scale-95 cursor-pointer touch-manipulation transition-all"
                            >
                              Annulla
                            </button>
                          ) : (
                            <>
                              {updateCheckResult?.voiceUpdates.elsa.hasUpdates && (
                                <button
                                  type="button"
                                  id="btn-update-audio-elsa"
                                  onClick={() => handleApplyAudioUpdates('elsa')}
                                  className="px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 active:scale-95 cursor-pointer touch-manipulation transition-all flex items-center gap-1.5"
                                  title="Scarica solo i file modificati per la voce di Elsa"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Aggiorna ({updateCheckResult.voiceUpdates.elsa.staleFiles.length})</span>
                                </button>
                              )}
                              {audioStatuses.elsa.isComplete || audioStatuses.elsa.downloadedCount > 0 ? (
                                <button
                                  type="button"
                                  id="btn-delete-cache-elsa"
                                  onClick={() => handleDeleteCache('elsa')}
                                  className="px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-rose-400 border border-zinc-700 hover:border-rose-500/40 light:border-slate-300 light:text-slate-700 rounded-lg hover:bg-rose-500/10 active:scale-95 cursor-pointer touch-manipulation transition-all flex items-center gap-1.5"
                                  title="Elimina cache audio di Elsa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Elimina</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  id="btn-download-elsa"
                                  onClick={() => handleStartDownload('elsa')}
                                  className="px-3 py-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 active:scale-95 cursor-pointer touch-manipulation transition-all flex items-center gap-1.5"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Scarica</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {audioStatuses.elsa.isDownloading && (
                        <div className="w-full bg-zinc-800 light:bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full transition-all duration-300"
                            style={{ width: `${audioStatuses.elsa.percent}%` }}
                          />
                        </div>
                      )}
                      {updatingVoices.elsa && (
                        <div className="w-full bg-zinc-800 light:bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full transition-all duration-300"
                            style={{ width: `${voiceUpdateProgress.elsa || 0}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Control Panel: Verifica manuale + Switch Auto-Update */}
                    <div className="p-2.5 rounded-xl border border-zinc-700/80 bg-zinc-900/60 light:bg-white light:border-slate-300 light:shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-semibold text-zinc-200 light:text-slate-800 block">
                            Verifica aggiornamenti audio
                          </span>
                          <span className="text-[11px] text-zinc-400 light:text-slate-600 block">
                            {settings.lastAudioCheckAt
                              ? `Ultima verifica: ${new Date(settings.lastAudioCheckAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}`
                              : 'Confronta la cache locale con le modifiche su server'}
                          </span>
                        </div>
                        <button
                          type="button"
                          id="btn-check-audio-updates"
                          disabled={isCheckingAudioUpdates}
                          onClick={handleCheckAudioUpdates}
                          className="px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-amber-400 border border-zinc-700 hover:border-amber-500/40 rounded-lg hover:bg-amber-500/10 active:scale-95 cursor-pointer touch-manipulation transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingAudioUpdates ? 'animate-spin text-amber-400' : ''}`} />
                          <span>{isCheckingAudioUpdates ? 'Verifica...' : 'Verifica ora'}</span>
                        </button>
                      </div>

                      {audioUpdateToast && (
                        <div className="text-[11px] px-2.5 py-1.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium animate-in fade-in duration-200">
                          {audioUpdateToast}
                        </div>
                      )}

                      <div className="pt-2 border-t border-zinc-700 light:border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-zinc-300 light:text-slate-700 font-medium block">
                            Aggiornamento automatico online
                          </span>
                          <span className="text-[10px] text-zinc-400 light:text-slate-600 block">
                            Sincronizza silenziosamente file audio modificati all'avvio dell'app
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none touch-manipulation p-1">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.audioAutoUpdateOnline ?? true}
                            onChange={(e) => updateSetting('audioAutoUpdateOnline', e.target.checked)}
                          />
                          <div className="w-8 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[6px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                    </div>

                    {/* Note fallback & reset */}
                    <div className="pt-2 border-t border-zinc-700/80 light:border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-zinc-400 light:text-slate-600">
                      <span>
                        💡 Se sei offline e la voce scelta non è scaricata, l'app usa l'altra voce presente.
                      </span>
                      {settings.audioOfflinePromptDismissed && (
                        <button
                          type="button"
                          id="btn-reset-audio-prompt"
                          onClick={() => {
                            updateSetting('audioOfflinePromptDismissed', false);
                            setAudioUpdateToast('Intro audio ripristinata per il prossimo avvio');
                            setTimeout(() => setAudioUpdateToast(null), 3000);
                          }}
                          className="text-amber-400 hover:underline shrink-0 text-left cursor-pointer active:opacity-75 touch-manipulation py-1"
                        >
                          Ripristina intro Audio
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Effetti Sonori */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 cursor-pointer select-none active:scale-[0.99] touch-manipulation transition-all">
                <div>
                  <span className="text-zinc-300 light:text-slate-700 font-medium block text-xs">
                    Effetti sonori
                  </span>
                  <span className="text-[11px] text-zinc-400 light:text-slate-600 block">
                    Feedback sonoro per tocco e conferma delle risposte
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={e => updateSetting('soundEnabled', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </AccordionCard>

          {/* SEZIONE 3: MODALITÀ MANI LIBERE */}
          <AccordionCard
            id="drive"
            label="Modalità Mani Libere"
            description="Avanzamento automatico, comandi vocali hands-free e macro-target outdoor"
            summary={driveSummary}
            icon={Headphones}
            isExpanded={openSection === 'drive'}
            onToggle={() => toggleSection('drive')}
            cardRef={el => {
              sectionRefs.current['drive'] = el;
            }}
          >
            <div className="space-y-3">
              <p className="text-[11px] text-zinc-400 light:text-slate-600 leading-relaxed">
                Macro-pulsanti per bici/corsa e audio automatico per ripassare senza guardare lo schermo in totale sicurezza.
              </p>

              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 cursor-pointer select-none active:scale-[0.99] touch-manipulation transition-all">
                  <div>
                    <span className="text-zinc-300 light:text-slate-700 font-medium block">
                      Avanzamento Automatico Continuo
                    </span>
                    <span className="text-[11px] text-zinc-400 light:text-slate-600">
                      Legge le domande a catena senza tocco fisico
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.driveModeAutopilot ?? true}
                    onChange={e => updateSetting('driveModeAutopilot', e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                {/* Modalità Tutor Didattica */}
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 cursor-pointer select-none active:scale-[0.99] touch-manipulation transition-all">
                  <div>
                    <span className="text-zinc-300 light:text-slate-700 font-medium block flex items-center gap-1.5">
                      <span>Modalità Tutor Didattica</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                        REGOLA + TRANELLO
                      </span>
                    </span>
                    <span className="text-[11px] text-zinc-400 light:text-slate-600">
                      Legge ad alta voce risposta esatta, regola e tranello in caso di errore prima di avanzare
                    </span>
                  </div>
                  <input
                    id="setting-drive-tutor-toggle"
                    type="checkbox"
                    checked={settings.driveModeTutor ?? false}
                    onChange={e => updateSetting('driveModeTutor', e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                <div className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer select-none touch-manipulation">
                    <div>
                      <span className="text-zinc-300 light:text-slate-700 font-medium block">
                        Rispondi a Voce (Hands-Free)
                      </span>
                      <span className="text-[11px] text-zinc-400 light:text-slate-600">
                        Controlla quiz e navigazione a mani libere
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.driveModeVoiceCommands ?? false}
                      onChange={e => updateSetting('driveModeVoiceCommands', e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </label>

                  {/* Cheat Sheet rapido & Bottone Guida */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-zinc-300 light:text-slate-700">
                    <div className="p-1.5 rounded-lg bg-zinc-900/60 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300">
                      <span className="font-bold text-emerald-400 light:text-emerald-600">Risposte:</span> "Uno", "Due", "Tre"
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-900/60 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300">
                      <span className="font-bold text-amber-400 light:text-amber-600">Scorri:</span> "Avanti", "Indietro"
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-900/60 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300">
                      <span className="font-bold text-amber-400 light:text-amber-600">Audio:</span> "Ripeti", "Pausa"
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-900/60 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300">
                      <span className="font-bold text-indigo-400 light:text-indigo-600">Assistente:</span> "Aiuto", "Bandiera"
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsVoiceGuideOpen(true)}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 light:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 touch-manipulation"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Apri Guida Completa Comandi Vocali</span>
                    <HelpCircle className="w-3.5 h-3.5 opacity-70" />
                  </button>
                </div>

                {/* Modalità Audio Output / Microfono (Altoparlante vs Cuffie) */}
                <div className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-zinc-300 light:text-slate-700 font-medium block">
                        Dispositivo di Ascolto
                      </span>
                      <span className="text-[11px] text-zinc-400 light:text-slate-600">
                        Gestione anti-eco del microfono per i comandi vocali
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 light:bg-slate-200 light:text-slate-700 border border-zinc-700/60 light:border-slate-300">
                      {settings.driveModeAudioOutput === 'headphones' ? 'CUFFIE' : 'ALTOPARLANTE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updateSetting('driveModeAudioOutput', 'speaker')}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer active:scale-98 touch-manipulation ${
                        (settings.driveModeAudioOutput || 'speaker') === 'speaker'
                          ? 'bg-amber-950/70 border-amber-500 text-amber-200 font-bold light:bg-amber-100 light:border-amber-500 light:text-amber-900'
                          : 'bg-zinc-900/60 border-zinc-700 text-zinc-300 hover:text-white light:bg-white light:border-slate-300 light:text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-0.5">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Altoparlante (Anti-Eco)</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 light:text-slate-600 leading-tight">
                        Microfono attivo solo a fine lettura o in pausa. Elimina l'eco dell'altoparlante.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('driveModeAudioOutput', 'headphones')}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer active:scale-98 touch-manipulation ${
                        settings.driveModeAudioOutput === 'headphones'
                          ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200 font-bold light:bg-indigo-100 light:border-indigo-500 light:text-indigo-900'
                          : 'bg-zinc-900/60 border-zinc-700 text-zinc-300 hover:text-white light:bg-white light:border-slate-300 light:text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-0.5">
                        <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Cuffie con Mic</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 light:text-slate-600 leading-tight">
                        Microfono sempre attivo. Permette di interrompere il parlato in qualsiasi momento.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-300 light:text-slate-700 font-medium">
                      Tempo per Pensare alla Risposta
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {settings.driveModeAutoAdvanceSeconds || 5} secondi
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[3, 5, 8].map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => updateSetting('driveModeAutoAdvanceSeconds', sec)}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                          (settings.driveModeAutoAdvanceSeconds || 5) === sec
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 light:bg-slate-200 light:text-slate-700'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spiegazione Vocale Iniziale */}
                <div className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-zinc-300 light:text-slate-700 font-medium block">
                        Spiegazione Vocale Iniziale
                      </span>
                      <span className="text-[11px] text-zinc-400 light:text-slate-600">
                        {settings.driveModeIntroPlayed
                          ? 'Completata (non si ripeterà all\'avvio)'
                          : "Verrà riprodotta all'apertura della modalità mani libere"}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      settings.driveModeIntroPlayed
                        ? 'bg-zinc-800 text-zinc-300 light:bg-slate-200 light:text-slate-700 border border-zinc-700 light:border-slate-300'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {settings.driveModeIntroPlayed ? 'Completata' : 'All\'avvio'}
                    </span>
                  </div>

                  <div className="flex gap-1.5 pt-0.5">
                    <button
                      type="button"
                      id="btn-settings-replay-intro"
                      onClick={() => voiceService.playDriveIntro()}
                      className="flex-1 py-2 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 light:bg-slate-200 light:hover:bg-slate-300 text-zinc-200 light:text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 touch-manipulation"
                      title="Ascolta adesso la spiegazione vocale"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Riascolta adesso</span>
                    </button>
                    <button
                      type="button"
                      id="btn-settings-toggle-intro"
                      onClick={() => updateSetting('driveModeIntroPlayed', !settings.driveModeIntroPlayed ? true : false)}
                      className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border cursor-pointer active:scale-95 touch-manipulation ${
                        !settings.driveModeIntroPlayed
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-800/80 border-zinc-700 hover:border-amber-500/50 text-zinc-300 light:bg-slate-200 light:border-slate-300 light:text-slate-700'
                      }`}
                      title="Riattiva la spiegazione vocale al prossimo avvio della modalità mani libere"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{settings.driveModeIntroPlayed ? "Riattiva all'avvio" : "Già attiva all'avvio"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </AccordionCard>

          {/* SEZIONE 4: BACKUP & CLOUD */}
          <AccordionCard
            id="cloud"
            label="Backup Cloud"
            description="Google Drive, auto-sync, smart merge e salvataggio file JSON"
            summary={cloudSummary}
            icon={Cloud}
            isExpanded={openSection === 'cloud'}
            onToggle={() => toggleSection('cloud')}
            cardRef={el => {
              sectionRefs.current['cloud'] = el;
            }}
          >
            <div className="space-y-3.5">
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider block">
                  Sincronizzazione Cloud Google
                </label>

                {/* Toggle Sincronizzazione Automatica */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 cursor-pointer select-none active:scale-[0.99] touch-manipulation transition-all">
                  <div className="pr-3">
                    <span className="text-zinc-200 light:text-slate-800 font-semibold block text-xs">
                      Sincronizzazione Automatica (Auto-Sync)
                    </span>
                    <span className="text-[11px] text-zinc-400 light:text-slate-600 block leading-tight pt-0.5">
                      Salva e sincronizza i progressi in background tra i tuoi dispositivi (PC, telefono)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-auto-sync-drive"
                    checked={settings.autoSyncDrive ?? false}
                    onChange={async e => {
                      const val = e.target.checked;
                      await updateSetting('autoSyncDrive', val);
                      if (val) {
                        googleDrive.initTokenClient(effectiveClientId);
                        setSyncStatus('Avvio sincronizzazione cloud...');
                        const res = await syncNow();
                        setSyncStatus(res.message);
                      }
                    }}
                    className="w-4 h-4 accent-amber-500 rounded flex-shrink-0 cursor-pointer"
                  />
                </label>

                {/* Barra di Stato Sincronizzazione */}
                {settings.autoSyncDrive && (
                  <div className="p-2.5 rounded-xl border border-zinc-700/80 bg-zinc-950/40 light:bg-slate-100/60 light:border-slate-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        syncState.status === 'syncing' ? 'bg-amber-400 animate-pulse' :
                        syncState.status === 'offline' ? 'bg-zinc-500' :
                        syncState.status === 'needs_auth' ? 'bg-amber-400' :
                        'bg-emerald-400'
                      }`} />
                      <span className="text-zinc-300 light:text-slate-700 font-medium">
                        {syncState.status === 'syncing' ? 'Sincronizzazione in corso...' :
                         syncState.status === 'offline' ? 'Dispositivo offline' :
                         syncState.status === 'needs_auth' ? 'Accesso scaduto' :
                         'Connesso a Google Drive'}
                      </span>
                    </div>

                    <span className="text-[11px] text-zinc-400 light:text-slate-600 font-mono">
                      {syncState.lastSyncedAt
                        ? `Ultimo: ${new Date(syncState.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Mai salvato'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    id="btn-drive-upload"
                    onClick={handleBackupToDrive}
                    disabled={isProcessing}
                    className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95 touch-manipulation"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Salva adesso</span>
                  </button>

                  <button
                    id="btn-drive-download"
                    onClick={handleRestoreFromDrive}
                    disabled={isProcessing}
                    className="py-2.5 px-3 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 light:bg-white light:border-slate-300 light:text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer active:scale-95 touch-manipulation shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unisci dati (Merge)</span>
                  </button>
                </div>

                {syncStatus && (
                  <div className="text-[11px] p-2 rounded-lg bg-zinc-950/80 border border-zinc-700 text-amber-300 light:bg-amber-50 light:border-amber-200 light:text-amber-800 animate-in fade-in">
                    {syncStatus}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-700/80 light:border-slate-200">
                <label className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider block">
                  Copia Locale su File (.json)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportLocalJson}
                    className="py-2 px-3 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 light:bg-white light:border-slate-300 light:text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Scarica copia</span>
                  </button>

                  <label className="py-2 px-3 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 light:bg-white light:border-slate-300 light:text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carica copia</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportLocalJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </AccordionCard>

          {/* SEZIONE 5: ARCHIVIO DATI & RESET */}
          <AccordionCard
            id="data"
            label="Gestione Dati"
            description="Stato database IndexedDB locale e azzeramento progressi"
            summary={dataSummary}
            icon={Database}
            isExpanded={openSection === 'data'}
            onToggle={() => toggleSection('data')}
            cardRef={el => {
              sectionRefs.current['data'] = el;
            }}
          >
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 space-y-1.5">
                <div className="text-xs font-bold text-zinc-200 light:text-slate-800 flex items-center justify-between">
                  <span>Archivio Locale IndexedDB</span>
                  <span className="text-[10px] text-amber-400 font-mono px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">Dexie SSOT</span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-slate-600 leading-relaxed">
                  Tutti i progressi, le sessioni d'esame, gli errori, le note e le impostazioni sono salvati in locale nel database del tuo browser (nessun dato inviato a server esterni).
                </p>
                <div className="text-[10px] text-zinc-400 light:text-slate-600 font-mono pt-1">
                  Database: <span className="text-zinc-300 light:text-slate-700">VDSQuizDB</span> · Versione: <span className="text-zinc-300 light:text-slate-700">1</span> · Quiz: <span className="text-zinc-300 light:text-slate-700">504 AeCI</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-700/80 light:border-slate-200 space-y-2">
                <label className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider block">
                  Area Reset
                </label>
                <p className="text-[11px] text-zinc-400 light:text-slate-600">
                  Azzera lo storico delle simulazioni, il quaderno errori e le note per ricominciare la preparazione da zero.
                </p>
                <button
                  id="btn-reset-data"
                  onClick={handleResetData}
                  className="w-full py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-98 touch-manipulation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancella tutti i dati e ricomincia da zero</span>
                </button>
              </div>
            </div>
          </AccordionCard>

          {/* SEZIONE 6: ABOUT & REGOLAMENTO */}
          <AccordionCard
            id="about"
            label="Informazioni & Regolamento"
            description="Conformità esame AeCI, D.P.R. 133/2010 e quote ufficiali materie"
            summary={aboutSummary}
            icon={Info}
            isExpanded={openSection === 'about'}
            onToggle={() => toggleSection('about')}
            cardRef={el => {
              sectionRefs.current['about'] = el;
            }}
          >
            <div className="space-y-4">
              {/* App Identity Banner */}
              <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 light:from-amber-50/80 light:via-white light:to-white light:border-amber-400/40 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 flex items-center justify-center flex-shrink-0 shadow-inner bg-zinc-900 light:bg-white">
                    <img
                      id="settings-about-app-logo"
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-zinc-100 light:text-slate-900 tracking-tight">
                        VDS-VL Quiz Master
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 light:bg-amber-100 light:text-amber-800">
                        v{buildInfo.version}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 light:text-slate-600 mt-1 leading-relaxed">
                      Applicazione per la preparazione all'esame teorico di Volo da Diporto o Sportivo (VDS/VL - Parapendio e Deltaplano).
                    </p>
                  </div>
                </div>
              </div>

              {/* Guida Rapida & Manuale Utente */}
              <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 light:bg-emerald-50/60 light:border-emerald-300 flex items-center justify-between gap-3 shadow-sm">
                <div className="space-y-0.5 min-w-0">
                  <span className="font-bold text-xs text-emerald-400 light:text-emerald-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Manuale Utente Illustrato</span>
                  </span>
                  <p className="text-[11px] text-zinc-400 light:text-slate-600 truncate">
                    Guida rapida con screenshot reali, comandi vocali e scorciatoie.
                  </p>
                </div>
                <a
                  id="btn-open-user-manual"
                  href="https://github.com/alessandroame/Quiz_VDS-VL/blob/main/docs/MANUALE_UTENTE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-all shadow-sm active:scale-95 cursor-pointer select-none"
                  title="Apri il manuale utente completo su GitHub"
                >
                  <span>Apri Guida</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Identificativo Release & PWA */}
              <div className="p-3 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-700/80 light:border-slate-300 pb-2">
                  <span className="font-bold text-zinc-200 light:text-slate-800 flex items-center gap-1.5 text-xs">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Release & Dettagli Build</span>
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                    v{buildInfo.version}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/80 light:bg-white light:border-slate-300 light:shadow-sm">
                    <span className="text-[10px] text-zinc-400 light:text-slate-600 block">Numero Build</span>
                    <span className="font-mono font-bold text-amber-400 light:text-amber-700">#{buildInfo.buildNumber}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/80 light:bg-white light:border-slate-300 light:shadow-sm">
                    <span className="text-[10px] text-zinc-400 light:text-slate-600 block">Commit Git</span>
                    <span className="font-mono font-bold text-sky-400 light:text-sky-700">{buildInfo.commitHash}</span>
                  </div>
                  <div className="col-span-2 p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/80 light:bg-white light:border-slate-300 light:shadow-sm">
                    <span className="text-[10px] text-zinc-400 light:text-slate-600 block">Data/Ora Compilazione</span>
                    <span className="font-mono text-zinc-300 light:text-slate-700">{formatBuildDate(buildInfo.buildTime)}</span>
                  </div>
                </div>
                <button
                  onClick={handleForcePwaRefresh}
                  disabled={isRefreshingPwa}
                  className="w-full py-2 px-3 rounded-lg bg-zinc-800/90 hover:bg-zinc-800 active:scale-98 text-zinc-200 hover:text-white border border-zinc-700/60 light:bg-white light:hover:bg-slate-100 light:text-slate-800 light:border-slate-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPwa ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingPwa ? 'Aggiornamento in corso...' : 'Forza Aggiornamento PWA'}</span>
                </button>
              </div>

              {/* Riferimenti Normativi AeCI & D.P.R. 133/2010 */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Conformità Esame Ufficiale AeCI</span>
                </label>
                <div className="p-3 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 space-y-2 text-[11px]">
                  <div className="grid grid-cols-2 gap-2 text-zinc-300 light:text-slate-700">
                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/80 light:bg-white light:border-slate-300">
                      <span className="text-[10px] text-zinc-400 light:text-slate-600 block">Norma di Legge</span>
                      <span className="font-semibold text-zinc-200 light:text-slate-800">D.P.R. 133/2010</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/80 light:bg-white light:border-slate-300">
                      <span className="text-[10px] text-zinc-400 light:text-slate-600 block">Database Ufficiale</span>
                      <span className="font-semibold text-zinc-200 light:text-slate-800">504 Quiz (Ed. 2017)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/80 light:bg-white light:border-slate-300">
                      <span className="text-[10px] text-zinc-400 light:text-slate-600 block">Regola Esame</span>
                      <span className="font-semibold text-zinc-200 light:text-slate-800">30 Quiz · 45 Minuti</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/80 light:bg-white light:border-slate-300">
                      <span className="text-[10px] text-zinc-400 light:text-slate-600 block">Soglia Idoneità</span>
                      <span className="font-semibold text-emerald-400 light:text-emerald-700">Max 3 errori (≥27/30)</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-400 light:text-slate-600 pt-1 border-t border-zinc-700/60 light:border-slate-300">
                    Quote canoniche per materia: Aerodinamica (9), Meteo (8), Tecnica (5), Normativa (2), Sicurezza (2), Primo Soccorso (1), Fisiopatologia (1), Strumenti (1), Materiali (1).
                  </div>
                </div>
              </div>

              {/* Caratteristiche & Privacy */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Funzionalità & Privacy</span>
                </label>
                <div className="p-3 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 space-y-2 text-[11px] text-zinc-300 light:text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span>
                      <strong className="text-zinc-200 light:text-slate-900">Funzionamento Offline:</strong> Tutti i quiz e le funzioni sono disponibili anche in assenza di connessione internet.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span>
                      <strong className="text-zinc-200 light:text-slate-900">Copertura Completa:</strong> Estrazione bilanciata per assicurare la pratica su tutti i 504 quesiti ufficiali.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span>
                      <strong className="text-zinc-200 light:text-slate-900">Quaderno Errori:</strong> Ripasso mirato delle domande sbagliate fino a due risposte corrette consecutive.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span>
                      <strong className="text-zinc-200 light:text-slate-900">Supporto Vocale:</strong> Lettura audio dei quiz per lo studio e modalità a mani libere.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span>
                      <strong className="text-zinc-200 light:text-slate-900">Privacy dei Dati:</strong> Nessun tracciamento o invio a server esterni; i progressi restano sul tuo dispositivo con backup opzionale su Google Drive.
                    </span>
                  </div>
                </div>
              </div>

              {/* Dedica */}
              <div className="p-3 rounded-xl border border-zinc-700/80 bg-zinc-900/40 light:bg-slate-50 light:border-slate-300 text-center">
                <p className="text-[11px] text-zinc-400 light:text-slate-600">
                  Progettato per gli allievi piloti di Volo Libero italiani 🪂🦅
                </p>
              </div>
            </div>
          </AccordionCard>

        </div>
      </main>

      {/* Modale Guida Comandi Vocali (Cheat Sheet) */}
      <VoiceCommandsModal
        isOpen={isVoiceGuideOpen}
        onClose={() => setIsVoiceGuideOpen(false)}
      />

      {/* Modale Dettagli Versione e Build */}
      <BuildInfoModal
        isOpen={isBuildInfoOpen}
        onClose={() => setIsBuildInfoOpen(false)}
      />
    </div>
  );
};

export const SettingsScreen = SettingsModal;
