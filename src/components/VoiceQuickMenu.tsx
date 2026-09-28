import React, { useState, useRef, useEffect } from 'react';
import {
  VolumeX,
  Headphones,
  Check,
  X,
  Mic
} from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import { voiceService } from '../services/voiceService';
import { VoiceCommandsModal } from './VoiceCommandsModal';

export const VoiceQuickMenu: React.FC = () => {
  const { settings, updateSetting } = useQuiz();
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceGuideOpen, setIsVoiceGuideOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggleTts = async () => {
    const nextState = !settings.ttsEnabled;
    if (!nextState) {
      voiceService.stop();
    }
    await updateSetting('ttsEnabled', nextState);
  };

  const handleSelectVoice = async (voice: 'giuseppe' | 'elsa') => {
    await updateSetting('ttsVoice', voice);
  };

  const handleSelectSpeed = async (rate: number) => {
    await updateSetting('ttsPlaybackRate', rate);
  };

  const currentVoice = settings.ttsVoice || 'giuseppe';
  const currentRate = settings.ttsPlaybackRate || 1.0;
  const isEnabled = settings.ttsEnabled;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        id="btn-voice-quick-menu"
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        title="Opzioni rapide parlato e voce"
        className={`px-2 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${
          isEnabled
            ? 'bg-sky-500/15 border-sky-500/30 text-sky-400 light:bg-sky-50 light:border-sky-300 light:text-sky-700 shadow-sm'
            : 'border-transparent text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 hover:bg-slate-800/60 light:hover:bg-slate-100'
        }`}
      >
        {isEnabled ? (
          <Headphones className="w-4 h-4 text-sky-400 light:text-sky-600" />
        ) : (
          <VolumeX className="w-4 h-4 text-slate-500" />
        )}
        <span className="hidden sm:inline font-mono text-[11px]">
          {isEnabled ? `${currentRate}x` : 'Muto'}
        </span>
      </button>

      {/* Flyout / Popover Menu */}
      {isOpen && (
        <div
          id="voice-quick-popover"
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 z-50 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-200 light:text-slate-900 animate-in fade-in zoom-in-95 space-y-3.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 light:border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold tracking-wide uppercase text-slate-200 light:text-slate-800">
                Controllo Voce Rapido
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Master Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 light:bg-slate-50 light:border-slate-200">
            <div>
              <span className="text-xs font-semibold text-slate-200 light:text-slate-800 block">
                Voce Guida
              </span>
              <span className="text-[10px] text-slate-400 light:text-slate-500">
                {isEnabled ? 'Attiva (lettura quesiti)' : 'Disattivata'}
              </span>
            </div>
            <button
              id="quick-toggle-tts"
              type="button"
              onClick={handleToggleTts}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                isEnabled
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 light:bg-slate-200 light:text-slate-700'
              }`}
            >
              {isEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Instructor Voice Selection */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 light:text-slate-500 flex items-center justify-between">
              <span>Istruttore</span>
              <span className="text-[10px] lowercase font-normal opacity-70">1-clic</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="quick-voice-giuseppe"
                onClick={() => handleSelectVoice('giuseppe')}
                className={`py-2 px-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentVoice === 'giuseppe'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300 light:border-sky-600 light:bg-sky-50 light:text-sky-800 font-semibold shadow-sm'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 light:border-slate-200 light:bg-slate-50 light:text-slate-600'
                }`}
              >
                <span className="text-xs">👨‍✈️ Giuseppe</span>
                {currentVoice === 'giuseppe' && <Check className="w-3.5 h-3.5 text-sky-400" />}
              </button>

              <button
                type="button"
                id="quick-voice-elsa"
                onClick={() => handleSelectVoice('elsa')}
                className={`py-2 px-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentVoice === 'elsa'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300 light:border-sky-600 light:bg-sky-50 light:text-sky-800 font-semibold shadow-sm'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 light:border-slate-200 light:bg-slate-50 light:text-slate-600'
                }`}
              >
                <span className="text-xs">👩‍✈️ Elsa</span>
                {currentVoice === 'elsa' && <Check className="w-3.5 h-3.5 text-sky-400" />}
              </button>
            </div>
          </div>

          {/* Playback Rate Selection */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 light:text-slate-500 flex items-center justify-between">
              <span>Velocità di Lettura</span>
              <span className="font-mono text-sky-400 light:text-sky-600 font-bold">{currentRate}x</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0.9, 1.0, 1.15, 1.25].map(rate => (
                <button
                  key={rate}
                  type="button"
                  id={`quick-speed-${rate}`}
                  onClick={() => handleSelectSpeed(rate)}
                  className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                    currentRate === rate
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200 light:bg-slate-100 light:border-slate-200 light:text-slate-700'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Quick Automation Toggles */}
          <div className="pt-2 border-t border-slate-800/80 light:border-slate-100 space-y-2 text-xs">
            <label className="flex items-center justify-between cursor-pointer py-0.5">
              <span className="text-slate-300 light:text-slate-700">Lettura automatica domanda</span>
              <input
                type="checkbox"
                checked={settings.ttsAutoPlayQuestion}
                onChange={e => updateSetting('ttsAutoPlayQuestion', e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-0.5">
              <span className="text-slate-300 light:text-slate-700">Spiega subito se sbagli</span>
              <input
                type="checkbox"
                checked={settings.ttsAutoExplainOnMistake}
                onChange={e => updateSetting('ttsAutoExplainOnMistake', e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-0.5">
              <span className="text-slate-300 light:text-slate-700">Effetti sonori cockpit</span>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={e => updateSetting('soundEnabled', e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Quick Voice Commands Link */}
          <div className="pt-2 border-t border-slate-800/80 light:border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsVoiceGuideOpen(true);
              }}
              className="text-[11px] font-semibold text-emerald-400 light:text-emerald-600 hover:underline flex items-center gap-1.5 py-0.5"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Guida Comandi Vocali (Hands-Free)</span>
            </button>
          </div>
        </div>
      )}

      {/* Modale Guida Comandi Vocali (Cheat Sheet) */}
      <VoiceCommandsModal
        isOpen={isVoiceGuideOpen}
        onClose={() => setIsVoiceGuideOpen(false)}
      />
    </div>
  );
};
