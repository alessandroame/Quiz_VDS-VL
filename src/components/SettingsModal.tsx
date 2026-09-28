import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useQuiz } from '../context/QuizContext';
import { googleDrive } from '../services/googleDrive';
import { exportDatabaseBackup, importDatabaseBackup, db } from '../db';
import type { ThemeMode } from '../types/database';

export type SettingsTab = 'appearance' | 'voice' | 'drive' | 'cloud' | 'data';

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
  const { settings, updateSetting } = useQuiz();
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

  const envClientId = (import.meta.env?.VITE_GOOGLE_CLIENT_ID as string) || '182413802928-q7sphls58ob60s2mu3fspbbkk9kq2am9.apps.googleusercontent.com';
  const effectiveClientId = (settings.googleClientId || envClientId).trim();

  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    if (!window.confirm('I dati salvati su Google sostituiranno i progressi attuali su questo dispositivo. Vuoi continuare?')) {
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
    { id: 'data', label: 'Dati', icon: Database }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <span>Impostazioni</span>
          </h2>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation (Segmented Topic Selector) */}
        <div className="flex items-center gap-1 py-2.5 border-b border-slate-800/80 light:border-slate-100 overflow-x-auto no-scrollbar flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 light:bg-sky-50 light:border-sky-500 light:text-sky-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 light:text-slate-600 light:hover:bg-slate-100'
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
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
                            ? 'border-sky-500 bg-sky-500/20 text-sky-400 light:border-sky-600 light:bg-sky-50 light:text-sky-700'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 light:border-slate-200 light:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80 light:border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Feedback di Studio
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
                  <div>
                    <span className="text-slate-300 light:text-slate-700 font-medium block text-xs">
                      Verifica Immediata nelle Materie
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Durante lo studio per materie, mostra subito se la risposta è esatta
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.immediateFeedbackInTopics}
                    onChange={e => updateSetting('immediateFeedbackInTopics', e.target.checked)}
                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VOCE & AUDIO */}
          {activeTab === 'voice' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
                <div>
                  <span className="text-slate-300 light:text-slate-700 font-medium block text-xs">
                    Attiva Voce Guida
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Ascolta domande e opzioni lette a voce alta
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ttsEnabled}
                  onChange={e => updateSetting('ttsEnabled', e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                />
              </div>

              {settings.ttsEnabled && (
                <>
                  {/* Selettore Voce */}
                  <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200 space-y-2">
                    <span className="text-slate-300 light:text-slate-700 font-medium block text-xs">
                      Voce Istruttore
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateSetting('ttsVoice', 'giuseppe')}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                          (settings.ttsVoice || 'giuseppe') === 'giuseppe'
                            ? 'border-sky-500 bg-sky-500/20 text-sky-300 light:border-sky-600 light:bg-sky-50 light:text-sky-800 font-semibold'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 light:border-slate-200 light:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs">👨‍✈️ Giuseppe</span>
                        {(settings.ttsVoice || 'giuseppe') === 'giuseppe' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => updateSetting('ttsVoice', 'elsa')}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                          settings.ttsVoice === 'elsa'
                            ? 'border-sky-500 bg-sky-500/20 text-sky-300 light:border-sky-600 light:bg-sky-50 light:text-sky-800 font-semibold'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 light:border-slate-200 light:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs">👩‍✈️ Elsa</span>
                        {settings.ttsVoice === 'elsa' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Velocità di Lettura */}
                  <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 light:text-slate-700 font-medium">
                        Velocità di Lettura
                      </span>
                      <span className="font-mono font-bold text-sky-400">
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
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 light:bg-slate-200 light:text-slate-700'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Automazioni vocali */}
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center justify-between p-2 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200 cursor-pointer">
                      <span className="text-slate-300 light:text-slate-700">Lettura automatica domanda</span>
                      <input
                        type="checkbox"
                        checked={settings.ttsAutoPlayQuestion}
                        onChange={e => updateSetting('ttsAutoPlayQuestion', e.target.checked)}
                        className="w-4 h-4 accent-sky-500 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200 cursor-pointer">
                      <span className="text-slate-300 light:text-slate-700">Spiegazione vocale su errore</span>
                      <input
                        type="checkbox"
                        checked={settings.ttsAutoExplainOnMistake}
                        onChange={e => updateSetting('ttsAutoExplainOnMistake', e.target.checked)}
                        className="w-4 h-4 accent-sky-500 rounded"
                      />
                    </label>
                  </div>
                </>
              )}

              {/* Effetti Sonori Cockpit */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
                <div>
                  <span className="text-slate-300 light:text-slate-700 font-medium block text-xs">
                    Effetti Sonori Cockpit
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Suoni avionici di tocco e conferma risposta
                  </span>
                </div>
                <button
                  onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                  className={`p-1.5 rounded-lg ${
                    settings.soundEnabled ? 'text-sky-400' : 'text-slate-500'
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
              <p className="text-[11px] text-slate-400 light:text-slate-500 leading-relaxed">
                Pulsanti giganti e audio automatico per ripassare in macchina o con le mani occupate in totale sicurezza.
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
                  <div>
                    <span className="text-slate-300 light:text-slate-700 font-medium block">
                      Radio Quiz Continuo
                    </span>
                    <span className="text-[11px] text-slate-500">
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

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
                  <div>
                    <span className="text-slate-300 light:text-slate-700 font-medium block">
                      Rispondi a Voce
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Pronuncia "Uno", "Due", "Tre" o "Avanti"
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.driveModeVoiceCommands ?? false}
                    onChange={e => updateSetting('driveModeVoiceCommands', e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 light:text-slate-700 font-medium">
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
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 light:bg-slate-200 light:text-slate-700'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & CLOUD */}
          {activeTab === 'cloud' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Salvataggio su Google (Cloud)
                </label>
                <p className="text-[11px] text-slate-400 light:text-slate-500 leading-relaxed">
                  Sincronizza i progressi sul tuo Google Drive privato per ritrovarli su qualsiasi dispositivo.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    id="btn-drive-upload"
                    onClick={handleBackupToDrive}
                    disabled={isProcessing}
                    className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Salva su Google</span>
                  </button>

                  <button
                    id="btn-drive-download"
                    onClick={handleRestoreFromDrive}
                    disabled={isProcessing}
                    className="py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ripristina</span>
                  </button>
                </div>

                {syncStatus && (
                  <div className="text-[11px] p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-sky-300 light:bg-sky-50 light:border-sky-200 light:text-sky-800 animate-in fade-in">
                    {syncStatus}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80 light:border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Copia Locale su File (.json)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportLocalJson}
                    className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Scarica copia</span>
                  </button>

                  <label className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer">
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
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200 space-y-1">
                <div className="text-xs font-bold text-slate-200 light:text-slate-800">
                  VDS-VL Quiz Master 🛩️
                </div>
                <div className="text-[11px] text-slate-400 light:text-slate-500">
                  Database Ufficiale AeCI 2017: 504 quiz completi.
                </div>
                <div className="text-[10px] text-sky-400/80 font-mono">
                  100% Offline-First (IndexedDB + Service Worker)
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 light:border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Area Reset
                </label>
                <p className="text-[11px] text-slate-400 light:text-slate-500">
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
    </div>
  );
};
