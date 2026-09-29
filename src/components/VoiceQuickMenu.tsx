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

export interface VoiceQuickMenuProps {
  id?: string;
  popoverId?: string;
  align?: 'left' | 'right';
  className?: string;
  buttonClassName?: string;
  forceDark?: boolean;
  onOpenVoiceGuide?: () => void;
  onReplaySpokenGuide?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export const VoiceQuickMenu: React.FC<VoiceQuickMenuProps> = ({
  id = 'btn-voice-quick-menu',
  popoverId,
  align = 'right',
  className = '',
  buttonClassName = '',
  forceDark = false,
  onOpenVoiceGuide,
  onReplaySpokenGuide,
  onOpenChange
}) => {
  const { settings, updateSetting } = useQuiz();
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceGuideOpen, setIsVoiceGuideOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSetOpen = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSetOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleSetOpen(false);
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

  const idPrefix = id !== 'btn-voice-quick-menu' ? `${id}-` : '';
  const resolvedPopoverId = popoverId || (id !== 'btn-voice-quick-menu' ? `${id}-popover` : 'voice-quick-popover');

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => handleSetOpen(!isOpen)}
        title="Opzioni rapide parlato e voce"
        className={`px-2 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${
          isEnabled
            ? forceDark
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-sm'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-400 light:bg-amber-50 light:border-amber-300 light:text-amber-700 shadow-sm'
            : forceDark
            ? 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            : 'border-transparent text-zinc-400 hover:text-zinc-200 light:text-slate-600 light:hover:text-slate-900 hover:bg-zinc-800/60 light:hover:bg-slate-100'
        } ${buttonClassName}`}
      >
        {isEnabled ? (
          <Headphones className={`w-4 h-4 text-amber-400 ${forceDark ? '' : 'light:text-amber-600'}`} />
        ) : (
          <VolumeX className="w-4 h-4 text-zinc-500" />
        )}
        <span className="hidden sm:inline font-mono text-[11px]">
          {isEnabled ? `${currentRate}x` : 'Muto'}
        </span>
      </button>

      {/* Flyout / Popover Menu */}
      {isOpen && (
        <div
          id={resolvedPopoverId}
          data-testid="voice-quick-popover"
          onTouchStart={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          className={`absolute ${
            align === 'left' ? 'left-0' : 'right-0'
          } top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] max-h-[calc(100dvh-80px)] overflow-y-auto z-[60] bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl ${
            forceDark ? 'text-zinc-100' : 'dark:bg-zinc-900 dark:border-zinc-800 light:bg-white light:border-slate-200 light:text-slate-900'
          } animate-in fade-in zoom-in-95 space-y-3.5 custom-scrollbar`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-2 border-b ${
            forceDark ? 'border-zinc-800/80' : 'border-zinc-800/80 light:border-slate-100'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <span className={`text-xs font-bold tracking-wide uppercase ${
                forceDark ? 'text-zinc-200' : 'text-zinc-200 light:text-slate-800'
              }`}>
                Controllo Voce Rapido
              </span>
            </div>
            <button
              onClick={() => handleSetOpen(false)}
              className={`p-1 rounded-md ${
                forceDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-400 hover:text-zinc-200 light:text-slate-500 light:hover:text-slate-800'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Master Toggle */}
          <div className={`flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border ${
            forceDark
              ? 'border-zinc-800/80'
              : 'border-zinc-800/80 light:bg-slate-50 light:border-slate-200'
          }`}>
            <div>
              <span className={`text-xs font-semibold block ${
                forceDark ? 'text-zinc-200' : 'text-zinc-200 light:text-slate-800'
              }`}>
                Lettura Vocale
              </span>
              <span className={`text-[10px] ${
                forceDark ? 'text-zinc-400' : 'text-zinc-400 light:text-slate-500'
              }`}>
                {isEnabled ? 'Attiva (lettura quesiti)' : 'Disattivata'}
              </span>
            </div>
            <button
              id={`${idPrefix}quick-toggle-tts`}
              data-testid="quick-toggle-tts"
              type="button"
              onClick={handleToggleTts}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                isEnabled
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : forceDark
                  ? 'bg-zinc-800 text-zinc-400'
                  : 'bg-zinc-800 text-zinc-400 light:bg-slate-200 light:text-slate-700'
              }`}
            >
              {isEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Instructor Voice Selection */}
          <div className="space-y-1.5">
            <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${
              forceDark ? 'text-zinc-400' : 'text-zinc-400 light:text-slate-500'
            }`}>
              <span>Istruttore</span>
              <span className="text-[10px] lowercase font-normal opacity-70">1-clic</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id={`${idPrefix}quick-voice-giuseppe`}
                data-testid="quick-voice-giuseppe"
                onClick={() => handleSelectVoice('giuseppe')}
                className={`py-2 px-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentVoice === 'giuseppe'
                    ? forceDark
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-semibold shadow-sm'
                      : 'border-amber-500 bg-amber-500/20 text-amber-300 light:border-amber-600 light:bg-amber-50 light:text-amber-800 font-semibold shadow-sm'
                    : forceDark
                    ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                    : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 light:border-slate-200 light:bg-slate-50 light:text-slate-600'
                }`}
              >
                <span className="text-xs">👨‍✈️ Giuseppe</span>
                {currentVoice === 'giuseppe' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              <button
                type="button"
                id={`${idPrefix}quick-voice-elsa`}
                data-testid="quick-voice-elsa"
                onClick={() => handleSelectVoice('elsa')}
                className={`py-2 px-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentVoice === 'elsa'
                    ? forceDark
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-semibold shadow-sm'
                      : 'border-amber-500 bg-amber-500/20 text-amber-300 light:border-amber-600 light:bg-amber-50 light:text-amber-800 font-semibold shadow-sm'
                    : forceDark
                    ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                    : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 light:border-slate-200 light:bg-slate-50 light:text-slate-600'
                }`}
              >
                <span className="text-xs">👩‍✈️ Elsa</span>
                {currentVoice === 'elsa' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            </div>
          </div>

          {/* Playback Rate Selection */}
          <div className="space-y-1.5">
            <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${
              forceDark ? 'text-zinc-400' : 'text-zinc-400 light:text-slate-500'
            }`}>
              <span>Velocità di Lettura</span>
              <span className={`font-mono font-bold ${
                forceDark ? 'text-amber-400' : 'text-amber-400 light:text-amber-600'
              }`}>{currentRate}x</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0.9, 1.0, 1.15, 1.25].map(rate => (
                <button
                  key={rate}
                  type="button"
                  id={`${idPrefix}quick-speed-${rate}`}
                  data-testid={`quick-speed-${rate}`}
                  onClick={() => handleSelectSpeed(rate)}
                  className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                    currentRate === rate
                      ? 'bg-amber-600 text-white shadow-sm'
                      : forceDark
                      ? 'bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      : 'bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 light:bg-slate-100 light:border-slate-200 light:text-slate-700'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Quick Automation Toggles */}
          <div className={`pt-2 border-t space-y-2 text-xs ${
            forceDark ? 'border-zinc-800/80' : 'border-zinc-800/80 light:border-slate-100'
          }`}>
            <label className="flex items-center justify-between cursor-pointer py-0.5">
              <span className={forceDark ? 'text-zinc-300' : 'text-zinc-300 light:text-slate-700'}>
                Lettura automatica domanda
              </span>
              <input
                type="checkbox"
                checked={settings.ttsAutoPlayQuestion}
                onChange={e => updateSetting('ttsAutoPlayQuestion', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-0.5">
              <span className={forceDark ? 'text-zinc-300' : 'text-zinc-300 light:text-slate-700'}>
                Spiega subito se sbagli
              </span>
              <input
                type="checkbox"
                checked={settings.ttsAutoExplainOnMistake}
                onChange={e => updateSetting('ttsAutoExplainOnMistake', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-0.5">
              <span className={forceDark ? 'text-zinc-300' : 'text-zinc-300 light:text-slate-700'}>
                Effetti sonori
              </span>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={e => updateSetting('soundEnabled', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-0.5">
              <span className={forceDark ? 'text-zinc-300' : 'text-zinc-300 light:text-slate-700'}>
                Tutor didattico alla guida
              </span>
              <input
                id="quick-menu-toggle-tutor"
                type="checkbox"
                checked={settings.driveModeTutor ?? false}
                onChange={e => updateSetting('driveModeTutor', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Quick Voice Commands Link */}
          <div className={`pt-2 border-t flex justify-center ${
            forceDark ? 'border-zinc-800/80' : 'border-zinc-800/80 light:border-slate-100'
          }`}>
            <button
              type="button"
              onClick={() => {
                handleSetOpen(false);
                if (onOpenVoiceGuide) {
                  onOpenVoiceGuide();
                } else {
                  setIsVoiceGuideOpen(true);
                }
              }}
              className={`text-[11px] font-semibold hover:underline flex items-center gap-1.5 py-0.5 ${
                forceDark ? 'text-emerald-400' : 'text-emerald-400 light:text-emerald-600'
              }`}
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
        onReplaySpokenGuide={onReplaySpokenGuide}
      />
    </div>
  );
};
