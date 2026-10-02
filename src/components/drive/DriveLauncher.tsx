import React from 'react';
import {
  Headphones,
  X,
  Volume2,
  Radio,
  Mic,
  MicOff,
  GraduationCap,
  ArrowRight,
  HelpCircle,
  Zap,
  Flame,
  ListFilter,
  Lightbulb
} from 'lucide-react';
import { OfflineHUDTag } from '../OfflineIndicator';
import { VoiceQuickMenu } from '../VoiceQuickMenu';
import { AudioDownloadBanner } from '../AudioDownloadBanner';

export interface DriveLauncherProps {
  isAutopilotEnabled: boolean;
  onToggleAutopilot: () => void;
  isVoiceCommandsEnabled: boolean;
  isVoiceSupported: boolean;
  onToggleVoiceCommands: () => void;
  audioOutputMode: 'speaker' | 'headphones';
  onToggleAudioOutput: () => void;
  onSetAudioOutputMode?: (mode: 'speaker' | 'headphones') => void;
  isTutorEnabled: boolean;
  onToggleTutor: () => void;
  isIntroActive: boolean;
  onDismissIntro: () => void;
  onReplayIntro: () => void;
  onOpenVoiceGuide: () => void;
  setIsVoiceMenuOpen: (open: boolean) => void;
  onStartExam: (marathon?: boolean) => void;
  onStartTutorExam: () => void;
  onStartRadioQuiz: () => void;
  onStartMistakesQuiz: () => void;
  isWakeLockActive: boolean;
  onClose: () => void;
}

export const DriveLauncher: React.FC<DriveLauncherProps> = ({
  isAutopilotEnabled,
  onToggleAutopilot,
  isVoiceCommandsEnabled,
  isVoiceSupported,
  onToggleVoiceCommands,
  audioOutputMode,
  onToggleAudioOutput,
  onSetAudioOutputMode,
  isTutorEnabled,
  onToggleTutor,
  isIntroActive,
  onDismissIntro,
  onReplayIntro,
  onOpenVoiceGuide,
  setIsVoiceMenuOpen,
  onStartExam,
  onStartTutorExam,
  onStartRadioQuiz,
  onStartMistakesQuiz,
  isWakeLockActive,
  onClose
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto w-full">
      {/* Header Launcher */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 light:border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-700 flex items-center justify-center">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white light:text-slate-900 flex items-center gap-2">
              <span>Modalità Mani Libere</span>
              <OfflineHUDTag />
            </h1>
            <p className="text-xs text-zinc-400 light:text-slate-500 font-medium">
              Stile audiolibro • Macro-target bici/corsa • Zero-scroll
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VoiceQuickMenu
            id="btn-drive-launcher-voice-menu"
            onOpenVoiceGuide={onOpenVoiceGuide}
            onReplaySpokenGuide={onReplayIntro}
            onOpenChange={setIsVoiceMenuOpen}
          />
          <button
            id="btn-drive-exit"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white light:bg-white light:border-slate-200 light:text-slate-600 light:hover:text-slate-900 light:shadow-sm"
            title="Esci dalla Modalità Mani Libere"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Quick Settings Bar */}
      <div className="grid grid-cols-2 gap-2.5 py-3">
        {/* Toggle Avanzamento Automatico */}
        <button
          id="btn-drive-toggle-autopilot"
          onClick={onToggleAutopilot}
          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
            isAutopilotEnabled
              ? 'bg-amber-950/80 border-amber-500 text-amber-200 light:bg-amber-100 light:border-amber-500 light:text-amber-900'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 light:bg-white light:border-slate-200 light:text-slate-700 light:shadow-sm'
          }`}
          title="Tocca per commutare avanzamento automatico tra le domande"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-4 h-4 flex-shrink-0" />
            <div className="text-left min-w-0">
              <div className="text-[10px] text-zinc-400 light:text-slate-500 uppercase font-semibold truncate">
                Avanzamento
              </div>
              <div className="truncate">
                {isAutopilotEnabled ? 'ATTIVO (Radio)' : 'Manuale'}
              </div>
            </div>
          </div>
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              isAutopilotEnabled
                ? 'bg-amber-500 text-zinc-950 font-black'
                : 'bg-zinc-800 text-zinc-400 light:bg-slate-200 light:text-slate-600'
            }`}
          >
            {isAutopilotEnabled ? 'AUTO' : 'MAN'}
          </span>
        </button>

        {/* Toggle Modalità Tutor Didattica nel Launcher */}
        <button
          id="btn-drive-toggle-tutor-launcher"
          onClick={onToggleTutor}
          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
            isTutorEnabled
              ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-1 ring-amber-500/50 light:bg-amber-100 light:border-amber-500 light:text-amber-900'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 light:bg-white light:border-slate-200 light:text-slate-700 light:hover:text-slate-900 light:shadow-sm'
          }`}
          title="Tocca per attivare o disattivare il Tutor"
        >
          <div className="flex items-center gap-2 min-w-0">
            <GraduationCap
              className={`w-4 h-4 flex-shrink-0 ${isTutorEnabled ? 'text-amber-400' : 'text-zinc-500'}`}
            />
            <div className="text-left min-w-0">
              <div className="text-[10px] text-zinc-400 light:text-slate-500 uppercase font-semibold truncate">
                Tutor
              </div>
              <div
                className="text-[11px] font-medium truncate"
                title={isTutorEnabled ? 'ATTIVA (Regola + Tranello su errore)' : 'Disattivata (Avanzamento rapido)'}
              >
                {isTutorEnabled ? 'ATTIVA (Regola + Tranello su errore)' : 'Disattivata'}
              </div>
            </div>
          </div>
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              isTutorEnabled
                ? 'bg-amber-500 text-zinc-950 font-black'
                : 'bg-zinc-800 text-zinc-400 light:bg-slate-200 light:text-slate-600'
            }`}
          >
            {isTutorEnabled ? 'TUTOR ON' : 'OFF'}
          </span>
        </button>

        {/* Scheda Unificata Comandi Vocali & Microfono (col-span-2) */}
        {isVoiceSupported && (
          <div
            id="card-drive-voice-commands-unified"
            className={`col-span-2 rounded-xl border transition-all overflow-hidden ${
              isVoiceCommandsEnabled
                ? 'bg-emerald-950/40 border-emerald-500/70 light:bg-emerald-50 light:border-emerald-400 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 light:bg-white light:border-slate-200 light:shadow-sm'
            }`}
          >
            {/* Header / Interruttore Principale Comandi Vocali */}
            <button
              type="button"
              id="btn-drive-toggle-voice-launcher"
              onClick={onToggleVoiceCommands}
              className="w-full p-3 flex items-center justify-between text-xs font-bold transition-all cursor-pointer active:scale-99 text-left"
              title={
                isVoiceCommandsEnabled
                  ? 'Comandi vocali attivi. Tocca per disattivare il microfono.'
                  : 'Comandi vocali disattivati. Tocca per attivare il microfono.'
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isVoiceCommandsEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-700'
                      : 'bg-zinc-800 text-zinc-500 light:bg-slate-100 light:text-slate-500'
                  }`}
                >
                  {isVoiceCommandsEnabled ? (
                    <Mic className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-zinc-400 light:text-slate-500 uppercase font-semibold">
                    Comandi Vocali & Microfono
                  </div>
                  <div
                    className={`text-xs font-bold truncate ${
                      isVoiceCommandsEnabled
                        ? 'text-emerald-300 light:text-emerald-900'
                        : 'text-zinc-400 light:text-slate-600'
                    }`}
                  >
                    {isVoiceCommandsEnabled ? 'ATTIVO (in sessione)' : 'Microfono Disattivato'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isVoiceCommandsEnabled
                      ? 'bg-emerald-500 text-zinc-950 font-black'
                      : 'bg-zinc-800 text-zinc-400 light:bg-slate-200 light:text-slate-600'
                  }`}
                >
                  {isVoiceCommandsEnabled ? 'VOCE ON' : 'SPENTO'}
                </span>
              </div>
            </button>

            {/* Sotto-sezione Modalità Microfono: visibile SOLO se i Comandi Vocali sono ATTIVI */}
            {isVoiceCommandsEnabled && (
              <div className="px-3 pb-3 pt-1.5 border-t border-emerald-500/20 light:border-emerald-200 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-emerald-300/80 light:text-emerald-800 uppercase font-semibold">
                    Modalità di Ascolto:
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 light:bg-emerald-100 light:text-emerald-800 font-bold">
                    {audioOutputMode === 'speaker' ? 'ALTOPARLANTE' : 'CUFFIE'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-drive-toggle-audio-output"
                    onClick={() => {
                      if (onSetAudioOutputMode) {
                        onSetAudioOutputMode('speaker');
                      } else if (audioOutputMode !== 'speaker') {
                        onToggleAudioOutput();
                      }
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer active:scale-98 ${
                      audioOutputMode === 'speaker'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-1 ring-amber-500/60 light:bg-amber-100 light:border-amber-500 light:text-amber-900 font-bold'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 light:bg-white light:border-slate-200 light:text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-xs font-bold">Altoparlante</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 light:text-slate-500 leading-tight">
                      Anti-eco: mic attivo a fine lettura o in pausa
                    </p>
                  </button>

                  <button
                    type="button"
                    id="btn-drive-toggle-audio-output-headphones"
                    onClick={() => {
                      if (onSetAudioOutputMode) {
                        onSetAudioOutputMode('headphones');
                      } else if (audioOutputMode !== 'headphones') {
                        onToggleAudioOutput();
                      }
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer active:scale-98 ${
                      audioOutputMode === 'headphones'
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/60 light:bg-indigo-100 light:border-indigo-500 light:text-indigo-900 font-bold'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 light:bg-white light:border-slate-200 light:text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Headphones className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span className="text-xs font-bold">Cuffie con Mic</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 light:text-slate-500 leading-tight">
                      Ascolto continuo: puoi interrompere a voce
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spiegazione Vocale Briefing Banner (se attiva) */}
      {isIntroActive && (
        <div className="p-3.5 rounded-2xl bg-amber-950/80 border-2 border-amber-500/80 text-amber-100 light:bg-amber-50 light:border-amber-400 light:text-amber-950 shadow-2xl light:shadow-md animate-in fade-in slide-in-from-top-2 mb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 text-zinc-950 font-black flex-shrink-0">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-amber-200 light:text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Briefing Vocale Iniziale</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 light:bg-amber-200 light:text-amber-900 font-bold">AUDIO</span>
                </div>
                <p className="text-[11px] text-zinc-300 light:text-amber-900 truncate">
                  Ascolto spiegazione: comandi vocali e risposte touch...
                </p>
              </div>
            </div>
            <button
              id="btn-skip-drive-intro"
              onClick={onDismissIntro}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all flex-shrink-0"
              title="Salta introduzione vocale"
            >
              <span>Salta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Link Guida Comandi Vocali & Riascolto Spiegazione */}
      <div className="flex items-center justify-center gap-2 -mt-1 mb-2">
        <button
          id="btn-replay-drive-intro"
          type="button"
          onClick={onReplayIntro}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            isIntroActive
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse light:bg-amber-100 light:border-amber-400 light:text-amber-800'
              : 'bg-zinc-900 border-zinc-800 hover:border-amber-500/50 text-zinc-300 hover:text-amber-300 light:bg-white light:border-slate-200 light:text-slate-700 light:hover:text-amber-700 light:shadow-sm'
          }`}
          title="Riascolta spiegazione vocale"
        >
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Spiegazione Vocale</span>
        </button>
        <button
          id="btn-drive-voice-guide-launcher"
          type="button"
          onClick={onOpenVoiceGuide}
          className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-zinc-400 hover:text-emerald-300 light:bg-white light:border-slate-200 light:text-slate-700 light:hover:text-emerald-700 light:shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Guida Comandi</span>
        </button>
      </div>

      {/* Banner Progressione Download Voci in Background */}
      <AudioDownloadBanner className="w-full mb-2 pointer-events-auto" />

      {/* Opzioni di Avvio Rapido */}
      <div className="flex-1 flex flex-col justify-center gap-3">
        <button
          id="btn-drive-start-tutor"
          onClick={onStartTutorExam}
          className="w-full py-4 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:scale-[0.98] text-white font-black text-base flex items-center justify-between shadow-xl transition-all"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-emerald-200" />
            <div className="text-left">
              <div>Tutor (30 Quiz)</div>
              <div className="text-xs text-emerald-200 font-medium">Spiegazioni vocali • Regola & Tranello • Senza fretta</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          id="btn-drive-start-exam"
          onClick={() => onStartExam(false)}
          className="w-full py-4 px-5 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-black text-base flex items-center justify-between shadow-xl transition-all"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-amber-200" />
            <div className="text-left">
              <div>Esame Ufficiale AeCI</div>
              <div className="text-xs text-amber-200 font-medium">30 Quiz • 45 Minuti • Max 3 Errori (alla cieca)</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          id="btn-drive-start-radio"
          onClick={onStartRadioQuiz}
          className="w-full py-5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-black text-lg flex items-center justify-between shadow-xl transition-all"
        >
          <div className="flex items-center gap-3">
            <Radio className="w-7 h-7 text-amber-200" />
            <div className="text-left">
              <div>Radio Quiz Continuo</div>
              <div className="text-xs text-amber-200 font-medium">Tutti i 504 quiz con ascolto continuo</div>
            </div>
          </div>
          <ArrowRight className="w-6 h-6" />
        </button>

        <button
          id="btn-drive-start-mistakes"
          onClick={onStartMistakesQuiz}
          className="w-full py-4 px-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-[0.98] text-rose-300 light:bg-white light:border-slate-200 light:hover:border-rose-300 light:text-rose-600 light:shadow-sm font-bold text-base flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-rose-400" />
            <div className="text-left">
              <div>Ripasso Quaderno Errori</div>
              <div className="text-xs text-zinc-400 light:text-slate-500 font-medium">Solo le domande con errori attivi</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400 light:text-slate-400" />
        </button>

        <button
          id="btn-drive-start-marathon"
          onClick={() => onStartExam(true)}
          className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 light:bg-white light:border-slate-200 light:text-slate-700 light:shadow-sm font-semibold text-sm flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4" />
            <span>Maratona Intensiva (60 Quiz)</span>
          </div>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Indicatori Sicurezza & Wake Lock */}
      <div className="pt-3 border-t border-zinc-900 light:border-slate-200 flex items-center justify-between text-xs text-zinc-500 light:text-slate-500">
        <div className="flex items-center gap-1.5">
          <Lightbulb className={`w-3.5 h-3.5 ${isWakeLockActive ? 'text-emerald-400' : 'text-zinc-600'}`} />
          <span>{isWakeLockActive ? 'Schermo sempre acceso a mani libere' : 'Standby schermo attivo'}</span>
        </div>
        <span>VDS-VL 2017</span>
      </div>
    </div>
  );
};
