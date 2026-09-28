import React, { useState, useEffect } from 'react';
import {
  X,
  Sun,
  Moon,
  Monitor,
  Volume2,
  VolumeX,
  Headphones,
  Cloud,
  Download,
  Upload,
  Trash2,
  Car,
  Palette,
  Database,
  Check,
  Mic,
  HelpCircle,
  CloudOff,
  RotateCcw,
  Info,
  Award,
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useQuiz } from '../context/QuizContext';
import { googleDrive } from '../services/googleDrive';
import { voiceService } from '../services/voiceService';
import { exportDatabaseBackup, importDatabaseBackup, db } from '../db';
import type { ThemeMode } from '../types/database';
import { VoiceCommandsModal } from './VoiceCommandsModal';
import { audioDownloadManager, VoiceName, VoiceDownloadProgress } from '../services/audioDownloadManager';

export type SettingsTab = 'appearance' | 'voice' | 'drive' | 'cloud' | 'data' | 'about';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SettingsTab;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'appearance'
}) => {
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting, syncState, syncNow } = useQuiz();
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

  const envClientId = (import.meta.env?.VITE_GOOGLE_CLIENT_ID as string) || '182413802928-q7sphls58ob60s2mu3fspbbkk9kq2am9.apps.googleusercontent.com';
  const effectiveClientId = (settings.googleClientId || envClientId).trim();

  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVoiceGuideOpen, setIsVoiceGuideOpen] = useState(false);
  const [audioStatuses, setAudioStatuses] = useState<Record<VoiceName, VoiceDownloadProgress>>(
    audioDownloadManager.getAllStatuses()
  );

  useEffect(() => {
    const unsub = audioDownloadManager.subscribe(newStatuses => {
      setAudioStatuses(newStatuses);
    });
    if (isOpen) {
      audioDownloadManager.checkAllStatuses().catch(console.error);
    }
    return unsub;
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

  const tabs: { id: SettingsTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'appearance', label: 'Aspetto', icon: Palette },
    { id: 'voice', label: 'Voce', icon: Headphones },
    { id: 'drive', label: 'Guida', icon: Car },
    { id: 'cloud', label: 'Backup', icon: Cloud },
    { id: 'data', label: 'Dati', icon: Database },
    { id: 'about', label: 'About', icon: Info }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl dark:bg-zinc-900 dark:border-zinc-800 light:bg-white light:border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 light:border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-zinc-100 light:text-slate-900 flex items-center gap-2">
            <span>Impostazioni</span>
          </h2>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 light:text-slate-600 light:hover:text-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation (Segmented Topic Selector) */}
        <div className="flex items-center gap-1 py-2.5 border-b border-zinc-800/80 light:border-slate-100 overflow-x-auto no-scrollbar flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-1.5 sm:px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-all whitespace-nowrap min-w-fit sm:min-w-0 ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 light:bg-amber-50 light:border-amber-500 light:text-amber-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 light:text-slate-600 light:hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body (Categorized & Zero-Scroll) */}
        <div className="pt-3 pb-1 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: ASPETTO & TEMA */}
          {activeTab === 'appearance' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Tema Visivo Cockpit
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
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/20 text-amber-400 light:border-amber-600 light:bg-amber-50 light:text-amber-700'
                            : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 light:border-slate-200 light:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80 light:border-slate-100">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Feedback di Studio
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200">
                  <div>
                    <span className="text-zinc-300 light:text-slate-700 font-medium block text-xs">
                      Verifica Immediata nelle Materie
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                      Durante lo studio per materie, mostra subito se la risposta è esatta
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.immediateFeedbackInTopics}
                    onChange={e => updateSetting('immediateFeedbackInTopics', e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VOCE & AUDIO */}
          {activeTab === 'voice' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200">
                <div>
                  <span className="text-zinc-300 light:text-slate-700 font-medium block text-xs">
                    Attiva Lettura Vocale
                  </span>
                  <span className="text-[11px] text-zinc-500 block">
                    Ascolta domande e opzioni lette a voce alta
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ttsEnabled}
                  onChange={e => updateSetting('ttsEnabled', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {settings.ttsEnabled && (
                <>
                  {/* Selettore Voce */}
                  <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200 space-y-2">
                    <span className="text-zinc-300 light:text-slate-700 font-medium block text-xs">
                      Voce Istruttore
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateSetting('ttsVoice', 'giuseppe')}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                          (settings.ttsVoice || 'giuseppe') === 'giuseppe'
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300 light:border-amber-600 light:bg-amber-50 light:text-amber-800 font-semibold'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 light:border-slate-200 light:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs">👨‍✈️ Giuseppe</span>
                        {(settings.ttsVoice || 'giuseppe') === 'giuseppe' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => updateSetting('ttsVoice', 'elsa')}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                          settings.ttsVoice === 'elsa'
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300 light:border-amber-600 light:bg-amber-50 light:text-amber-800 font-semibold'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 light:border-slate-200 light:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs">👩‍✈️ Elsa</span>
                        {settings.ttsVoice === 'elsa' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Velocità di Lettura */}
                  <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200 space-y-1.5">
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
                          onClick={() => updateSetting('ttsPlaybackRate', rate)}
                          className={`py-1 rounded-lg text-xs font-semibold transition-colors ${
                            (settings.ttsPlaybackRate || 1.0) === rate
                              ? 'bg-amber-600 text-white'
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
                    <label className="flex items-center justify-between p-2 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200 cursor-pointer">
                      <span className="text-zinc-300 light:text-slate-700">Lettura automatica domanda</span>
                      <input
                        type="checkbox"
                        checked={settings.ttsAutoPlayQuestion}
                        onChange={e => updateSetting('ttsAutoPlayQuestion', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200 cursor-pointer">
                      <span className="text-zinc-300 light:text-slate-700">Spiegazione vocale su errore</span>
                      <input
                        type="checkbox"
                        checked={settings.ttsAutoExplainOnMistake}
                        onChange={e => updateSetting('ttsAutoExplainOnMistake', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                    </label>
                  </div>

                  {/* Sezione Offline Audio TTS */}
                  <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-zinc-300 light:text-slate-700 font-bold block text-xs">
                          Archivio Audio Offline (PWA)
                        </span>
                        <span className="text-[11px] text-zinc-500 block">
                          2.520 file audio MP3 per voce salvati nella cache del dispositivo
                        </span>
                      </div>
                      <CloudOff className="w-4 h-4 text-amber-500/70" />
                    </div>

                    {/* Giuseppe Card */}
                    <div className="p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 light:bg-white light:border-slate-200 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-zinc-200 light:text-slate-800">
                              👨‍✈️ Giuseppe (Maschile)
                            </span>
                            {audioStatuses.giuseppe.isComplete && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                Scaricato
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 light:text-slate-500 block">
                            {audioStatuses.giuseppe.isDownloading
                              ? `Download in corso: ${audioStatuses.giuseppe.percent}% (${audioStatuses.giuseppe.downloadedCount}/${audioStatuses.giuseppe.totalCount})`
                              : audioStatuses.giuseppe.isComplete
                              ? '2.520 quesiti pronti offline (~154 MB)'
                              : audioStatuses.giuseppe.downloadedCount > 0
                              ? `Parziale: ${audioStatuses.giuseppe.downloadedCount} di ${audioStatuses.giuseppe.totalCount} file`
                              : 'Non scaricato (~154 MB)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {audioStatuses.giuseppe.isDownloading ? (
                            <button
                              type="button"
                              id="btn-cancel-download-giuseppe"
                              onClick={() => audioDownloadManager.cancelDownload('giuseppe')}
                              className="px-2.5 py-1 text-[11px] font-bold text-rose-400 border border-rose-500/40 rounded-lg hover:bg-rose-500/10 transition-colors"
                            >
                              Annulla
                            </button>
                          ) : audioStatuses.giuseppe.isComplete || audioStatuses.giuseppe.downloadedCount > 0 ? (
                            <button
                              type="button"
                              id="btn-delete-cache-giuseppe"
                              onClick={() => audioDownloadManager.deleteCache('giuseppe')}
                              className="px-2.5 py-1 text-[11px] font-bold text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/40 rounded-lg hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                              title="Elimina cache audio di Giuseppe"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Elimina</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              id="btn-download-giuseppe"
                              onClick={() => audioDownloadManager.startDownload('giuseppe')}
                              className="px-2.5 py-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>Scarica</span>
                            </button>
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
                    </div>

                    {/* Elsa Card */}
                    <div className="p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 light:bg-white light:border-slate-200 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-zinc-200 light:text-slate-800">
                              👩‍✈️ Elsa (Femminile)
                            </span>
                            {audioStatuses.elsa.isComplete && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                Scaricato
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 light:text-slate-500 block">
                            {audioStatuses.elsa.isDownloading
                              ? `Download in corso: ${audioStatuses.elsa.percent}% (${audioStatuses.elsa.downloadedCount}/${audioStatuses.elsa.totalCount})`
                              : audioStatuses.elsa.isComplete
                              ? '2.520 quesiti pronti offline (~148 MB)'
                              : audioStatuses.elsa.downloadedCount > 0
                              ? `Parziale: ${audioStatuses.elsa.downloadedCount} di ${audioStatuses.elsa.totalCount} file`
                              : 'Non scaricato (~148 MB)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {audioStatuses.elsa.isDownloading ? (
                            <button
                              type="button"
                              id="btn-cancel-download-elsa"
                              onClick={() => audioDownloadManager.cancelDownload('elsa')}
                              className="px-2.5 py-1 text-[11px] font-bold text-rose-400 border border-rose-500/40 rounded-lg hover:bg-rose-500/10 transition-colors"
                            >
                              Annulla
                            </button>
                          ) : audioStatuses.elsa.isComplete || audioStatuses.elsa.downloadedCount > 0 ? (
                            <button
                              type="button"
                              id="btn-delete-cache-elsa"
                              onClick={() => audioDownloadManager.deleteCache('elsa')}
                              className="px-2.5 py-1 text-[11px] font-bold text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/40 rounded-lg hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                              title="Elimina cache audio di Elsa"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Elimina</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              id="btn-download-elsa"
                              onClick={() => audioDownloadManager.startDownload('elsa')}
                              className="px-2.5 py-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>Scarica</span>
                            </button>
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
                    </div>

                    {/* Note fallback & reset */}
                    <div className="pt-2 border-t border-zinc-800/80 light:border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-zinc-400 light:text-slate-500">
                      <span>
                        💡 Se sei offline e la voce scelta non è scaricata, l'app usa l'altra voce presente.
                      </span>
                      {settings.audioOfflinePromptDismissed && (
                        <button
                          type="button"
                          id="btn-reset-audio-prompt"
                          onClick={() => updateSetting('audioOfflinePromptDismissed', false)}
                          className="text-amber-400 hover:underline shrink-0 text-left"
                        >
                          Ripristina avviso Guida
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Effetti Sonori Cockpit */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200">
                <div>
                  <span className="text-zinc-300 light:text-slate-700 font-medium block text-xs">
                    Effetti Sonori Cockpit
                  </span>
                  <span className="text-[11px] text-zinc-500 block">
                    Suoni avionici di tocco e conferma risposta
                  </span>
                </div>
                <button
                  onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                  className={`p-1.5 rounded-lg ${
                    settings.soundEnabled ? 'text-amber-400' : 'text-zinc-500'
                  }`}
                >
                  {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ALLA GUIDA */}
          {activeTab === 'drive' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-[11px] text-zinc-400 light:text-slate-500 leading-relaxed">
                Pulsanti giganti e audio automatico per ripassare in macchina o con le mani occupate in totale sicurezza.
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200">
                  <div>
                    <span className="text-zinc-300 light:text-slate-700 font-medium block">
                      Radio Quiz Continuo
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Legge le domande a catena senza tocco fisico
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.driveModeAutopilot ?? true}
                    onChange={e => updateSetting('driveModeAutopilot', e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-zinc-300 light:text-slate-700 font-medium block">
                        Rispondi a Voce (Hands-Free)
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Controlla quiz e navigazione a mani libere
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.driveModeVoiceCommands ?? false}
                      onChange={e => updateSetting('driveModeVoiceCommands', e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Cheat Sheet rapido & Bottone Guida */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-zinc-400 light:text-slate-600">
                    <div className="p-1.5 rounded-lg bg-zinc-900/60 light:bg-slate-100 border border-zinc-800/80 light:border-slate-200">
                      <span className="font-bold text-emerald-400 light:text-emerald-600">Risposte:</span> "Uno", "Due", "Tre"
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-900/60 light:bg-slate-100 border border-zinc-800/80 light:border-slate-200">
                      <span className="font-bold text-amber-400 light:text-amber-600">Scorri:</span> "Avanti", "Indietro"
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-900/60 light:bg-slate-100 border border-zinc-800/80 light:border-slate-200">
                      <span className="font-bold text-amber-400 light:text-amber-600">Audio:</span> "Ripeti", "Pausa"
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-900/60 light:bg-slate-100 border border-zinc-800/80 light:border-slate-200">
                      <span className="font-bold text-indigo-400 light:text-indigo-600">Assistente:</span> "Aiuto", "Bandiera"
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsVoiceGuideOpen(true)}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 light:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Apri Guida Completa Comandi Vocali</span>
                    <HelpCircle className="w-3.5 h-3.5 opacity-70" />
                  </button>
                </div>

                <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200 space-y-1.5">
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
                        onClick={() => updateSetting('driveModeAutoAdvanceSeconds', sec)}
                        className={`py-1 rounded-lg text-xs font-semibold transition-colors ${
                          (settings.driveModeAutoAdvanceSeconds || 5) === sec
                            ? 'bg-amber-600 text-white'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 light:bg-slate-200 light:text-slate-700'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spiegazione Vocale Iniziale */}
                <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-zinc-300 light:text-slate-700 font-medium block">
                        Spiegazione Vocale Iniziale
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {settings.driveModeIntroPlayed
                          ? 'Completata (non si ripeterà all\'avvio)'
                          : "Verrà riprodotta all'apertura della guida"}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      settings.driveModeIntroPlayed
                        ? 'bg-zinc-800 text-zinc-400 light:bg-slate-200 light:text-slate-600'
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
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 light:bg-slate-200 light:hover:bg-slate-300 text-zinc-200 light:text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      title="Ascolta adesso la spiegazione vocale"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Riascolta adesso</span>
                    </button>
                    <button
                      type="button"
                      id="btn-settings-toggle-intro"
                      onClick={() => updateSetting('driveModeIntroPlayed', !settings.driveModeIntroPlayed ? true : false)}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
                        !settings.driveModeIntroPlayed
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-800/80 border-zinc-700 hover:border-amber-500/50 text-zinc-300 light:bg-slate-200 light:border-slate-300 light:text-slate-700'
                      }`}
                      title="Riattiva la spiegazione vocale al prossimo avvio della modalità guida"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{settings.driveModeIntroPlayed ? "Riattiva all'avvio" : "Già attiva all'avvio"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & CLOUD */}
          {activeTab === 'cloud' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Sincronizzazione Cloud Google
                </label>

                {/* Toggle Sincronizzazione Automatica */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200">
                  <div className="pr-3">
                    <span className="text-zinc-200 light:text-slate-800 font-semibold block text-xs">
                      Sincronizzazione Automatica (Auto-Sync)
                    </span>
                    <span className="text-[11px] text-zinc-400 light:text-slate-500 block leading-tight pt-0.5">
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
                    className="w-4 h-4 accent-amber-500 rounded flex-shrink-0"
                  />
                </div>

                {/* Barra di Stato Sincronizzazione */}
                {settings.autoSyncDrive && (
                  <div className="p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/40 light:bg-slate-100/60 light:border-slate-200 text-xs flex items-center justify-between">
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

                    <span className="text-[11px] text-zinc-500 font-mono">
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
                    className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Salva adesso</span>
                  </button>

                  <button
                    id="btn-drive-download"
                    onClick={handleRestoreFromDrive}
                    disabled={isProcessing}
                    className="py-2.5 px-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unisci dati (Merge)</span>
                  </button>
                </div>

                {syncStatus && (
                  <div className="text-[11px] p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 text-amber-300 light:bg-amber-50 light:border-amber-200 light:text-amber-800 animate-in fade-in">
                    {syncStatus}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80 light:border-slate-100">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Copia Locale su File (.json)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportLocalJson}
                    className="py-2 px-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Scarica copia</span>
                  </button>

                  <label className="py-2 px-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer">
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
          )}

          {/* TAB 5: DATI & INFO */}
          {activeTab === 'data' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200 space-y-1">
                <div className="text-xs font-bold text-zinc-200 light:text-slate-800">
                  VDS-VL Quiz Master 🛩️
                </div>
                <div className="text-[11px] text-zinc-400 light:text-slate-500">
                  Database Ufficiale AeCI 2017: 504 quiz completi.
                </div>
                <div className="text-[10px] text-amber-400/80 font-mono">
                  100% Offline-First (IndexedDB + Service Worker)
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 light:border-slate-100 space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Area Reset
                </label>
                <p className="text-[11px] text-zinc-400 light:text-slate-500">
                  Azzera lo storico delle simulazioni, il quaderno errori e le note per ricominciare la preparazione da zero.
                </p>
                <button
                  onClick={handleResetData}
                  className="w-full py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancella tutti i dati e ricomincia da zero</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Modale Guida Comandi Vocali (Cheat Sheet) */}
      <VoiceCommandsModal
        isOpen={isVoiceGuideOpen}
        onClose={() => setIsVoiceGuideOpen(false)}
      />
    </div>
  );
};
