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
  KeyRound,
  Car
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useQuiz } from '../context/QuizContext';
import { googleDrive } from '../services/googleDrive';
import { exportDatabaseBackup, importDatabaseBackup, db } from '../db';
import type { ThemeMode } from '../types/database';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = useQuiz();

  const envClientId = (import.meta.env?.VITE_GOOGLE_CLIENT_ID as string) || '';
  const effectiveClientId = (settings.googleClientId || envClientId).trim();

  const [googleClientId, setGoogleClientId] = useState(settings.googleClientId || '');
  const [showAdvancedOAuth, setShowAdvancedOAuth] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSaveClientId = async () => {
    const trimmed = googleClientId.trim();
    await updateSetting('googleClientId', trimmed);
    if (trimmed) {
      googleDrive.initTokenClient(trimmed);
      setSyncStatus('Client ID salvato');
    } else {
      setSyncStatus(envClientId ? 'Ripristinato Client ID da .env' : 'Client ID rimosso');
    }
  };

  const handleBackupToDrive = async () => {
    setIsProcessing(true);
    setSyncStatus('Preparazione backup...');
    try {
      if (!effectiveClientId) {
        setShowAdvancedOAuth(true);
        throw new Error('Configura prima il Google Client ID nelle opzioni avanzate');
      }
      googleDrive.initTokenClient(effectiveClientId);
      const jsonStr = await exportDatabaseBackup();
      const res = await googleDrive.uploadBackup(jsonStr);
      if (res.success) {
        setSyncStatus('Backup completato su Google Drive');
        await updateSetting('lastDriveSyncAt', Date.now());
      } else {
        setSyncStatus(`Errore: ${res.message}`);
      }
    } catch (err: any) {
      setSyncStatus(`Errore: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!window.confirm('Attenzione: il ripristino da Google Drive aggiornerà i dati locali. Continuare?')) {
      return;
    }
    setIsProcessing(true);
    setSyncStatus('Download da Google Drive...');
    try {
      if (!effectiveClientId) {
        setShowAdvancedOAuth(true);
        throw new Error('Configura prima il Google Client ID nelle opzioni avanzate');
      }
      googleDrive.initTokenClient(effectiveClientId);
      const res = await googleDrive.downloadBackup();
      if (res.success && res.data) {
        const importRes = await importDatabaseBackup(res.data);
        setSyncStatus(importRes.message);
      } else {
        setSyncStatus(`Errore: ${res.message}`);
      }
    } catch (err: any) {
      setSyncStatus(`Errore: ${err.message}`);
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
    a.download = `vds_quiz_backup_${new Date().toISOString().slice(0, 10)}.json`;
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
    if (window.confirm('Sei sicuro di voler azzerare tutte le statistiche, i preferiti e lo storico?')) {
      await db.stats.clear();
      await db.sessions.clear();
      alert('Dati azzerati con successo');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl light:bg-white light:border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-100">
          <h2 className="text-base font-bold text-slate-100 light:text-slate-900">
            Impostazioni
          </h2>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 light:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Tema Visivo (Chiaro, Scuro, Auto) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tema Visivo
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

        {/* 2. Preferenze Audio e Studio */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80 light:border-slate-100">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Preferenze Quiz
          </label>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
              <span className="text-slate-300 light:text-slate-700 font-medium">
                Effetti Sonori
              </span>
              <button
                onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                className={`p-1.5 rounded-lg ${
                  settings.soundEnabled ? 'text-sky-400' : 'text-slate-500'
                }`}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
              <span className="text-slate-300 light:text-slate-700 font-medium">
                Feedback Immediato nelle Materie
              </span>
              <input
                type="checkbox"
                checked={settings.immediateFeedbackInTopics}
                onChange={e => updateSetting('immediateFeedbackInTopics', e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded"
              />
            </div>
          </div>
        </div>

        {/* 2.5 Assistente Vocale Neurale (TTS) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80 light:border-slate-100">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-sky-400" />
            <span>Assistente Vocale Neurale</span>
          </label>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
              <div>
                <span className="text-slate-300 light:text-slate-700 font-medium block">
                  Abilita Assistente Vocale
                </span>
                <span className="text-[11px] text-slate-500">
                  Lettura audio neurale ad alta fedeltà di domande e opzioni
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.ttsEnabled}
                onChange={e => updateSetting('ttsEnabled', e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded"
              />
            </div>

            {settings.ttsEnabled && (
              <>
                {/* Selettore Voce Istruttore */}
                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200 space-y-2">
                  <span className="text-slate-300 light:text-slate-700 font-medium block">
                    Voce Istruttore di Volo
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetting('ttsVoice', 'giuseppe')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        (settings.ttsVoice || 'giuseppe') === 'giuseppe'
                          ? 'border-sky-500 bg-sky-500/20 text-sky-300 light:border-sky-600 light:bg-sky-50 light:text-sky-800'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 light:border-slate-200 light:bg-slate-100 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-200 light:text-slate-800">👨‍✈️ Giuseppe</span>
                        {(settings.ttsVoice || 'giuseppe') === 'giuseppe' && (
                          <span className="w-2 h-2 rounded-full bg-sky-400 ring-2 ring-sky-400/30"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 light:text-slate-500 leading-tight">
                        Maschile, tono calmo cockpit
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('ttsVoice', 'elsa')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        settings.ttsVoice === 'elsa'
                          ? 'border-sky-500 bg-sky-500/20 text-sky-300 light:border-sky-600 light:bg-sky-50 light:text-sky-800'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 light:border-slate-200 light:bg-slate-100 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-200 light:text-slate-800">👩‍✈️ Elsa</span>
                        {settings.ttsVoice === 'elsa' && (
                          <span className="w-2 h-2 rounded-full bg-sky-400 ring-2 ring-sky-400/30"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 light:text-slate-500 leading-tight">
                        Femminile, dizione cristallina
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
                  <div>
                    <span className="text-slate-300 light:text-slate-700 font-medium block">
                      Spiegazione Vocale su Errore
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Legge la risposta esatta, la regola e il tranello se sbagli
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.ttsAutoExplainOnMistake}
                    onChange={e => updateSetting('ttsAutoExplainOnMistake', e.target.checked)}
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
                  <div>
                    <span className="text-slate-300 light:text-slate-700 font-medium block">
                      Lettura Automatica Domanda
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Avvia l'ascolto appena si apre un nuovo quiz
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.ttsAutoPlayQuestion}
                    onChange={e => updateSetting('ttsAutoPlayQuestion', e.target.checked)}
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </div>

                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 light:text-slate-700 font-medium">
                      Velocità di Riproduzione
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
                        className={`py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          (settings.ttsPlaybackRate || 1.0) === rate
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 2.6 Modalità Alla Guida */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80 light:border-slate-100">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-amber-400" />
            <span>Modalità Alla Guida</span>
          </label>

          <p className="text-[11px] text-slate-400 light:text-slate-500">
            Pulsanti giganti per cruscotto, zero-scroll, Screen Wake Lock e comandi hands-free.
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
              <div>
                <span className="text-slate-300 light:text-slate-700 font-medium block">
                  Pilota Automatico (Radio Quiz)
                </span>
                <span className="text-[11px] text-slate-500">
                  Legge continuamente le domande per lo studio passivo
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.driveModeAutopilot ?? true}
                onChange={e => updateSetting('driveModeAutopilot', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
              <div>
                <span className="text-slate-300 light:text-slate-700 font-medium block">
                  Comandi Vocali Hands-Free
                </span>
                <span className="text-[11px] text-slate-500">
                  Rispondi pronunciando "Uno", "Due", "Tre" o "Avanti"
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.driveModeVoiceCommands ?? false}
                onChange={e => updateSetting('driveModeVoiceCommands', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
            </div>

            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 light:text-slate-700 font-medium">
                  Tempo Attesa Risposta
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
                    className={`py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      (settings.driveModeAutoAdvanceSeconds || 5) === sec
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Google Drive Cloud Sync */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80 light:border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span>Backup Cloud (Google Drive)</span>
            </label>
            {effectiveClientId && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Pronto
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 light:text-slate-500">
            Sincronizza statistiche, note e progressi sul tuo Google Drive privato (<code className="text-sky-400">appDataFolder</code>).
          </p>

          <div className="space-y-2">
            {/* Pulsanti Rapidi 1-Click Salva/Ripristina */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                id="btn-drive-upload"
                onClick={handleBackupToDrive}
                disabled={isProcessing}
                className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Salva su Drive</span>
              </button>

              <button
                id="btn-drive-download"
                onClick={handleRestoreFromDrive}
                disabled={isProcessing}
                className="py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ripristina da Drive</span>
              </button>
            </div>

            {/* Avviso o configurazione avanzata Client ID */}
            {!effectiveClientId ? (
              <div className="p-3 bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-xl space-y-2">
                <div className="text-[11px] text-slate-400 light:text-slate-600 leading-relaxed">
                  Per il salvataggio diretto su Google Drive serve un <strong>Google Client ID</strong> associato all'app. Se vuoi salvare o trasferire i dati subito senza configurare Google, usa il <strong>Backup Locale (JSON)</strong> qui sotto (100% offline).
                </div>
                <button
                  type="button"
                  id="btn-toggle-advanced-oauth"
                  onClick={() => setShowAdvancedOAuth(!showAdvancedOAuth)}
                  className="text-[11px] text-sky-400 light:text-sky-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>{showAdvancedOAuth ? 'Nascondi opzioni sviluppatore' : 'Configura Client ID manuale (Opzioni Avanzate)'}</span>
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  id="btn-toggle-advanced-oauth"
                  onClick={() => setShowAdvancedOAuth(!showAdvancedOAuth)}
                  className="text-[10px] text-slate-500 hover:text-slate-400 light:hover:text-slate-700 underline"
                >
                  {showAdvancedOAuth ? 'Nascondi Client ID' : 'Dettagli Client ID'}
                </button>
              </div>
            )}

            {/* Pannello opzioni avanzate Client ID (visibile solo se espanso) */}
            {showAdvancedOAuth && (
              <div className="p-3 bg-slate-950/90 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl space-y-2 animate-in fade-in">
                <div className="text-[11px] text-slate-400 light:text-slate-600">
                  {envClientId ? (
                    <span className="text-emerald-400 light:text-emerald-600 font-medium">
                      ✓ Client ID preconfigurato dal file .env del server
                    </span>
                  ) : (
                    <span>Inserisci il tuo Google OAuth 2.0 Client ID (applicazione Web):</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    id="input-google-client-id"
                    type="text"
                    value={googleClientId}
                    onChange={e => setGoogleClientId(e.target.value)}
                    placeholder={envClientId ? `Ereditato da .env (${envClientId.slice(0, 12)}...)` : 'es. 123456...apps.googleusercontent.com'}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-100 light:bg-white light:border-slate-300 light:text-slate-900 outline-none font-mono text-[11px]"
                  />
                  <button
                    id="btn-save-client-id"
                    onClick={handleSaveClientId}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium light:bg-slate-200 light:text-slate-800 light:hover:bg-slate-300"
                  >
                    Salva
                  </button>
                </div>
              </div>
            )}

            {syncStatus && (
              <div className="text-[11px] p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-sky-300 light:bg-sky-50 light:border-sky-200 light:text-sky-800">
                {syncStatus}
              </div>
            )}
          </div>
        </div>

        {/* 4. Backup Locale JSON */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80 light:border-slate-100">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Backup File Locale (JSON)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportLocalJson}
              className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Esporta File</span>
            </button>

            <label className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Importa File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportLocalJson}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* 5. Zona Pericolosa */}
        <div className="pt-2 border-t border-slate-800/80 light:border-slate-100">
          <button
            onClick={handleResetData}
            className="w-full py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Azzera Dati e Statistiche</span>
          </button>
        </div>
      </div>
    </div>
  );
};
