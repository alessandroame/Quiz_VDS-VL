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
              <div>
                <span className="text-slate-300 light:text-slate-700 font-medium block">
                  Effetti Sonori
                </span>
                <span className="text-[11px] text-slate-500">
                  Suoni al tocco e alla conferma delle risposte
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

            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
              <div>
                <span className="text-slate-300 light:text-slate-700 font-medium block">
                  Verifica Immediata nelle Materie
                </span>
                <span className="text-[11px] text-slate-500">
                  Durante l'allenamento per materie, scopri subito se hai risposto giusto
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.immediateFeedbackInTopics}
                onChange={e => updateSetting('immediateFeedbackInTopics', e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded"
              />
            </div>
          </div>
        </div>

        {/* 2.5 Assistente Vocale */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80 light:border-slate-100">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-sky-400" />
            <span>Assistente Vocale</span>
          </label>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
              <div>
                <span className="text-slate-300 light:text-slate-700 font-medium block">
                  Attiva Voce Guida
                </span>
                <span className="text-[11px] text-slate-500">
                  Ascolta le domande e le opzioni lette a voce alta
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
                    Voce Istruttore
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
                        Voce maschile calma e rassicurante
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
                        Voce femminile chiara e scandita
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
                  <div>
                    <span className="text-slate-300 light:text-slate-700 font-medium block">
                      Spiegazione Vocale se Sbagli
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Ti spiega subito a voce la regola e il tranello della domanda
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
                      Lettura Automatica
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Inizia a leggere la domanda appena compare a schermo
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
            <span>Modalità Alla Guida (In Auto)</span>
          </label>

          <p className="text-[11px] text-slate-400 light:text-slate-500">
            Pulsanti giganti e audio automatico per ripassare in macchina o con le mani occupate in totale sicurezza.
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 light:bg-slate-50 light:border-slate-200">
              <div>
                <span className="text-slate-300 light:text-slate-700 font-medium block">
                  Radio Quiz Continuo
                </span>
                <span className="text-[11px] text-slate-500">
                  Legge le domande una dopo l'altra senza dover toccare il telefono
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
                className="w-4 h-4 accent-amber-500 rounded"
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

        {/* 3. Salvataggio Cloud Google */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80 light:border-slate-100">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-sky-400" />
            <span>Salvataggio su Google (Cloud)</span>
          </label>

          <p className="text-[11px] text-slate-400 light:text-slate-500 leading-relaxed">
            Salva e sincronizza i tuoi progressi, le simulazioni e le domande sbagliate sul tuo account Google, per ritrovarli su qualsiasi telefono o computer.
          </p>

          <div className="space-y-2">
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
                <span>Ripristina da Google</span>
              </button>
            </div>

            {syncStatus && (
              <div className="text-[11px] p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-sky-300 light:bg-sky-50 light:border-sky-200 light:text-sky-800 animate-in fade-in">
                {syncStatus}
              </div>
            )}
          </div>
        </div>

        {/* 4. Salvataggio su File */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80 light:border-slate-100">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Salva o Carica da File
          </label>
          <p className="text-[11px] text-slate-400 light:text-slate-500">
            Se preferisci non usare Google, puoi scaricare una copia di sicurezza sul tuo dispositivo o caricare un salvataggio precedente.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
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

        {/* 5. Ricomincia da Capo */}
        <div className="pt-2 border-t border-slate-800/80 light:border-slate-100">
          <button
            onClick={handleResetData}
            className="w-full py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Cancella tutti i dati e ricomincia da zero</span>
          </button>
        </div>
      </div>
    </div>
  );
};
