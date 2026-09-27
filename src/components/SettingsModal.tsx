import React, { useState } from 'react';
import {
  X,
  Sun,
  Moon,
  Monitor,
  Volume2,
  VolumeX,
  Cloud,
  Download,
  Upload,
  Trash2
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

  const [googleClientId, setGoogleClientId] = useState(settings.googleClientId || '');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSaveClientId = async () => {
    await updateSetting('googleClientId', googleClientId.trim());
    if (googleClientId.trim()) {
      googleDrive.initTokenClient(googleClientId.trim());
      setSyncStatus('Client ID salvato');
    }
  };

  const handleBackupToDrive = async () => {
    setIsProcessing(true);
    setSyncStatus('Preparazione backup...');
    try {
      if (!settings.googleClientId) {
        throw new Error('Inserisci prima il tuo Google Client ID qui sotto');
      }
      googleDrive.initTokenClient(settings.googleClientId);
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
      if (!settings.googleClientId) {
        throw new Error('Inserisci prima il tuo Google Client ID');
      }
      googleDrive.initTokenClient(settings.googleClientId);
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

        {/* 3. Google Drive Cloud Sync */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80 light:border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span>Backup Google Drive</span>
            </label>
          </div>

          <p className="text-[11px] text-slate-400 light:text-slate-500">
            Sincronizza statistiche, note e progressi sul tuo Google Drive privato (`appDataFolder`).
          </p>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={googleClientId}
                onChange={e => setGoogleClientId(e.target.value)}
                placeholder="Google OAuth Client ID..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-100 light:bg-slate-50 light:border-slate-200 light:text-slate-900 outline-none"
              />
              <button
                onClick={handleSaveClientId}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Salva
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleBackupToDrive}
                disabled={isProcessing}
                className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Salva su Drive</span>
              </button>

              <button
                onClick={handleRestoreFromDrive}
                disabled={isProcessing}
                className="py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ripristina</span>
              </button>
            </div>

            {syncStatus && (
              <div className="text-[11px] p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-sky-300">
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
