import React from 'react';
import {
  Volume2,
  Flag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Mic,
  MicOff,
  RotateCcw,
  Check,
  AlertTriangle,
  HelpCircle,
  Square,
  GraduationCap,
  Headphones,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Question } from '../../types/quiz';
import { formatTime } from '../../utils/timer';
import { OfflineHUDTag } from '../OfflineIndicator';
import { VoiceQuickMenu } from '../VoiceQuickMenu';
import { voiceService } from '../../services/voiceService';
import type { DriveModeSessionContext } from '../DriveModeScreen';

export interface DriveActiveHUDProps {
  currentQ: Question;
  currentIndex: number;
  totalCount: number;
  isExamSession: boolean;
  secondsRemaining: number;
  sessionContext?: DriveModeSessionContext;
  isIntroActive: boolean;
  onDismissIntro: () => void;
  onReplayIntro: () => void;
  onOpenVoiceGuide: () => void;
  setIsVoiceMenuOpen: (open: boolean) => void;
  onClose: () => void;
  onExecuteClose: () => void;
  isAutopilotEnabled: boolean;
  onToggleAutopilot: () => void;
  isTutorEnabled: boolean;
  onToggleTutor?: () => void;
  isVoiceSupported: boolean;
  isVoiceCommandsEnabled: boolean;
  voiceError: string | null;
  isVoiceReceiving: boolean;
  isVoiceListening: boolean;
  isVoiceSuspended?: boolean;
  audioOutputMode?: 'speaker' | 'headphones';
  onToggleAudioOutput?: () => void;
  onToggleVoiceCommands: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  isPartPlaying: (part: any) => boolean;
  isExplanationPlaying: boolean;
  onTogglePlayPause: () => void;
  onRestartCurrentOrSequence: () => void;
  onStopVoice: () => void;
  onPlayExplanation: () => void;
  onPlayQuestion?: () => void;
  onPlayOption?: (option: 1 | 2 | 3) => void;
  waitingCountdown: number | null;
  assimilationCountdown: number | null;
  voiceInterimTranscript: string;
  voiceLastTranscript: string;
  lastRecognizedLabel: string | null;
  unrecognizedSpeech: string | null;
  voiceHint: string;
  answers: Record<number, 1 | 2 | 3>;
  flags: Record<number, boolean>;
  revealedQuestionId: number | null;
  onSelectAnswer: (answer: 1 | 2 | 3) => void;
  onPrevQuestion: () => void;
  onNextQuestion: () => void;
  onToggleFlag: () => void;
  onSubmitExam: () => void;
  isQuestionSwitching?: boolean;
  isCooldownActive?: boolean;
}

export const DriveActiveHUD: React.FC<DriveActiveHUDProps> = ({
  currentQ,
  currentIndex,
  totalCount,
  isExamSession,
  secondsRemaining,
  isIntroActive,
  onDismissIntro,
  onReplayIntro,
  onOpenVoiceGuide,
  setIsVoiceMenuOpen,
  onExecuteClose,
  isAutopilotEnabled,
  onToggleAutopilot,
  isTutorEnabled,
  isVoiceSupported,
  isVoiceCommandsEnabled,
  voiceError,
  isVoiceReceiving,
  isVoiceListening,
  isVoiceSuspended = false,
  audioOutputMode = 'speaker',
  onToggleAudioOutput,
  onToggleVoiceCommands,
  isPlaying,
  isPaused,
  isPartPlaying,
  isExplanationPlaying,
  onTogglePlayPause,
  onRestartCurrentOrSequence,
  onStopVoice,
  onPlayExplanation,
  onPlayQuestion = () => {},
  onPlayOption = () => {},
  waitingCountdown,
  assimilationCountdown,
  voiceInterimTranscript,
  voiceLastTranscript,
  lastRecognizedLabel,
  unrecognizedSpeech,
  voiceHint,
  answers,
  flags,
  revealedQuestionId,
  onSelectAnswer,
  onPrevQuestion,
  onNextQuestion,
  onToggleFlag,
  onSubmitExam,
  isQuestionSwitching = false,
  isCooldownActive = false
}) => {
  const isCurrentRevealed =
    revealedQuestionId === currentQ.id || answers[currentQ.id] !== undefined;
  const isLocked = isCurrentRevealed || isCooldownActive || isQuestionSwitching;

  // DOM element refs for accurate overflow / truncation measurement
  const questionTextRef = React.useRef<HTMLHeadingElement | null>(null);
  const optionTextRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

  // Dynamic truncation flags based on actual DOM layout
  const [truncatedOpts, setTruncatedOpts] = React.useState<Record<number, boolean>>({});
  const [isQuestionTruncated, setIsQuestionTruncated] = React.useState<boolean | null>(null);

  // Manual expansion state per option and question
  const [manuallyExpandedOpts, setManuallyExpandedOpts] = React.useState<Record<number, boolean>>({});
  const [isQuestionManuallyExpanded, setIsQuestionManuallyExpanded] = React.useState(false);

  // Reset manual expansions on question change
  React.useEffect(() => {
    setManuallyExpandedOpts({});
    setIsQuestionManuallyExpanded(false);
  }, [currentQ.id]);

  const updateTruncation = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    // Measure question
    if (questionTextRef.current) {
      const el = questionTextRef.current;
      const computed = window.getComputedStyle(el);
      const rawLh = parseFloat(computed.lineHeight);
      const lh = !isNaN(rawLh) && rawLh > 0 ? rawLh : (parseFloat(computed.fontSize) * 1.375) || 22;
      const isMobile = window.innerWidth < 640;
      const maxLines = isMobile ? 3 : 4;
      const isClampedNow = el.scrollHeight > el.clientHeight + 1;
      const exceedsMaxLines = el.scrollHeight > (lh * maxLines) + 3;
      setIsQuestionTruncated(isClampedNow || exceedsMaxLines);
    }

    // Measure options
    const newTruncated: Record<number, boolean> = {};
    ([1, 2, 3] as const).forEach((optNum) => {
      const el = optionTextRefs.current[optNum];
      if (el) {
        const computed = window.getComputedStyle(el);
        const rawLh = parseFloat(computed.lineHeight);
        const lh = !isNaN(rawLh) && rawLh > 0 ? rawLh : (parseFloat(computed.fontSize) * 1.375) || 20;
        const isClampedNow = el.scrollHeight > el.clientHeight + 1;
        const exceeds2Lines = el.scrollHeight > (lh * 2) + 3;
        newTruncated[optNum] = isClampedNow || exceeds2Lines;
      }
    });
    setTruncatedOpts(newTruncated);
  }, []);

  React.useEffect(() => {
    updateTruncation();
    const rafId = requestAnimationFrame(updateTruncation);

    window.addEventListener('resize', updateTruncation);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateTruncation);
    };
  }, [currentQ.id, currentQ.question, currentQ.options, isCurrentRevealed, updateTruncation]);

  const toggleOptionExpansion = (optNum: 1 | 2 | 3, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setManuallyExpandedOpts((prev) => {
      const isCurrentlyExpanded = prev[optNum] !== undefined ? prev[optNum] : isPartPlaying(`opt${optNum}` as any);
      if (isCurrentlyExpanded) {
        return { 1: false, 2: false, 3: false };
      } else {
        return { 1: false, 2: false, 3: false, [optNum]: true };
      }
    });
  };

  const isQuestionPlaying = isPartPlaying('question');
  const isQuestionExpanded = isQuestionManuallyExpanded || isQuestionPlaying;
  const isLongQuestion = isQuestionTruncated !== null
    ? isQuestionTruncated
    : currentQ.question.length > 105;

  const isAnyOptionExpanded = currentQ.options.some((_, i) => {
    const optNum = (i + 1) as 1 | 2 | 3;
    const isCurrentOptPlaying = isPartPlaying(`opt${optNum}` as any);
    return manuallyExpandedOpts[optNum] !== undefined
      ? manuallyExpandedOpts[optNum]
      : isCurrentOptPlaying;
  });

  return (
    <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 max-w-2xl mx-auto w-full h-full overflow-hidden">
      {/* Spoken Intro Active HUD Banner */}
      {isIntroActive && (
        <div className="mb-2 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 light:bg-amber-50 light:border-amber-300 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs text-amber-200 light:text-amber-900">
            <Volume2 className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
            <span>Introduzione vocale in corso... Ascolta o tocca Salta</span>
          </div>
          <button
            type="button"
            onClick={onDismissIntro}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white light:bg-white light:border-slate-200 light:text-slate-700 light:hover:text-slate-900 light:shadow-sm text-xs font-bold transition-colors"
          >
            Salta
          </button>
        </div>
      )}

      {/* Top Bar HUD */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 pb-2 border-b border-zinc-800/90 light:border-slate-200 text-xs">
        {/* Sinistra: Contatore Domanda & Timer */}
        <div className="flex items-center gap-2 font-mono flex-shrink-0">
          <span className="font-black text-sm text-amber-400 light:text-amber-600">
            {currentIndex + 1} / {totalCount}
          </span>
          {isExamSession && (
            <span
              className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                isTutorEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 light:bg-emerald-100 light:text-emerald-800'
                  : 'bg-amber-500/20 text-amber-300 light:bg-amber-100 light:text-amber-800'
              }`}
              title={isTutorEnabled ? 'Tempo trascorso (Tutor Didattico)' : 'Tempo rimanente esame'}
            >
              ⏱ {formatTime(secondsRemaining)}
            </span>
          )}
          <OfflineHUDTag />
        </div>

        {/* Destra: Tasto Cuffia (stessa posizione della Navbar) + Controlli Audio */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Tasto Ritorno a Vista Normale (posizionato a destra in corrispondenza del pulsante Mani Libere della Navbar) */}
          <button
            id="btn-drive-exit"
            onClick={onExecuteClose}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-amber-500 bg-amber-500/20 text-amber-300 light:bg-amber-100 light:border-amber-400 light:text-amber-800 font-bold flex items-center gap-1.5 transition-all flex-shrink-0 shadow-sm active:scale-95"
            title="Torna alla vista normale del quiz"
            aria-label="Torna alla vista normale"
          >
            <Headphones className="w-4 h-4 text-amber-400 light:text-amber-700" />
            <span className="hidden sm:inline">Vista Normale</span>
          </button>

          {/* Menu Rapido Impostazioni Voce */}
          <VoiceQuickMenu
            id="btn-drive-voice-quick-menu"
            onOpenVoiceGuide={onOpenVoiceGuide}
            onReplaySpokenGuide={onReplayIntro}
            onOpenChange={setIsVoiceMenuOpen}
          />

          {/* Toggle Avanzamento Automatico */}
          <button
            id="btn-drive-autopilot-toggle"
            onClick={onToggleAutopilot}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
              isAutopilotEnabled
                ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-500/50 light:bg-amber-100 light:text-amber-800 light:ring-amber-400'
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800 light:bg-white light:text-slate-600 light:border-slate-200 light:shadow-sm'
            }`}
            title="Avanzamento Automatico"
          >
            {isAutopilotEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutopilotEnabled ? 'Auto ON' : 'Manuale'}</span>
          </button>

          {/* Toggle Comandi Vocali & Guida Rapida */}
          {isVoiceSupported && (
            <div className="flex items-center gap-1">
              {onToggleAudioOutput && isVoiceCommandsEnabled && (
                <button
                  type="button"
                  id="btn-drive-hud-toggle-output"
                  onClick={onToggleAudioOutput}
                  className={`p-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center ${
                    audioOutputMode === 'headphones'
                      ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 light:bg-indigo-100 light:border-indigo-400 light:text-indigo-800'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white light:bg-white light:border-slate-200 light:text-slate-600'
                  }`}
                  title={
                    audioOutputMode === 'headphones'
                      ? 'Modalità Cuffie (ascolto continuo). Tocca per passare ad Altoparlante.'
                      : 'Modalità Altoparlante (mic attivo solo a fine lettura o in pausa). Tocca per passare a Cuffie.'
                  }
                >
                  {audioOutputMode === 'headphones' ? (
                    <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
              )}

              <button
                id="btn-drive-toggle-voice"
                onClick={onToggleVoiceCommands}
                className={`relative p-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isVoiceCommandsEnabled
                    ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 light:bg-white light:text-slate-600 light:border-slate-200 light:shadow-sm'
                    : voiceError
                    ? 'bg-rose-950/60 border border-rose-500 text-rose-300 light:bg-rose-50 light:border-rose-300 light:text-rose-700'
                    : isVoiceReceiving
                    ? 'bg-emerald-500/40 text-emerald-200 ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)] light:bg-emerald-100 light:text-emerald-900 light:ring-emerald-500'
                    : isVoiceSuspended
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 light:bg-amber-100 light:text-amber-800 light:border-amber-300'
                    : 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50 light:bg-emerald-100 light:text-emerald-800 light:ring-emerald-400'
                }`}
                title={
                  !isVoiceCommandsEnabled
                    ? 'Attiva comandi vocali'
                    : voiceError
                    ? `Errore microfono: ${voiceError}`
                    : isVoiceSuspended
                    ? 'Microfono in pausa durante la lettura (anti-eco altoparlante)'
                    : isVoiceReceiving
                    ? 'Microfono: ricezione comandi vocali...'
                    : isVoiceListening
                    ? 'Microfono in ascolto (tocca per disattivare)'
                    : 'Microfono attivo'
                }
              >
                {isVoiceCommandsEnabled ? (
                  <div className="relative flex items-center justify-center">
                    <Mic
                      className={`w-3.5 h-3.5 transition-transform ${
                        isVoiceReceiving
                          ? 'animate-pulse text-emerald-200 scale-125'
                          : isVoiceSuspended
                          ? 'text-amber-300 opacity-80'
                          : isVoiceListening
                          ? 'text-emerald-300'
                          : 'text-emerald-400/70'
                      }`}
                    />
                    {isVoiceReceiving && (
                      <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-75 animate-ping pointer-events-none" />
                    )}
                  </div>
                ) : (
                  <MicOff className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={onOpenVoiceGuide}
                className="p-1.5 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 light:bg-white light:hover:bg-slate-100 light:text-slate-600 light:hover:text-slate-900 light:border-slate-200 light:shadow-sm transition-colors"
                title="Guida comandi vocali"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Banner Spiegazione Vocale Iniziale in Running Mode */}
      {isIntroActive && (
        <div className="my-2 p-3 sm:p-4 rounded-2xl bg-amber-950/90 border-2 border-amber-500 text-amber-100 light:bg-amber-50 light:border-amber-400 light:text-amber-950 shadow-2xl light:shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 font-black flex-shrink-0">
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
                <p className="text-xs text-zinc-300 light:text-amber-900 mt-0.5 truncate sm:text-clip">
                  Ascolto briefing: rispondi a voce ("Uno", "Due", "Tre") o tocca le fasce.
                </p>
              </div>
            </div>
            <button
              id="btn-skip-running-intro"
              onClick={onDismissIntro}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all flex-shrink-0"
              title="Inizia subito il quiz"
            >
              <span>Inizia Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Area Domanda (Zero Scroll) */}
      <div className="my-2 p-3 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 light:bg-white light:border-slate-200 light:shadow-sm flex items-start gap-3">
        <div
          className="flex-1 min-w-0 cursor-pointer active:opacity-85 select-none"
          onClick={onPlayQuestion}
          title="Tocca per riascoltare solo la domanda (Tasto Q)"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950 border border-amber-800/50 light:text-amber-700 light:bg-amber-100 light:border-amber-300 px-2 py-0.5 rounded">
                #{currentQ.id}
              </span>
              <span className="text-xs text-zinc-400 light:text-slate-500 font-semibold truncate">
                {currentQ.subjectName}
              </span>
            </div>
            <button
              type="button"
              id="btn-drive-play-question"
              onClick={(e) => {
                e.stopPropagation();
                onPlayQuestion();
              }}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
                isPartPlaying('question')
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-400 light:bg-amber-100 light:border-amber-400 light:text-amber-800'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 light:bg-slate-100 light:border-slate-300 light:text-slate-700'
              }`}
              title="Riascolta solo la domanda (Tasto Q)"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPartPlaying('question') ? 'text-amber-400 animate-pulse' : ''}`} />
              <span className="hidden sm:inline">Solo Domanda</span>
            </button>
          </div>
          <h2
            ref={questionTextRef}
            lang="it"
            translate="no"
            className={`text-base sm:text-xl font-bold leading-snug tracking-tight transition-colors ${
              isQuestionExpanded ? 'line-clamp-none' : 'line-clamp-3 sm:line-clamp-4'
            } ${
              isQuestionPlaying ? 'text-amber-300 light:text-amber-600' : 'text-white light:text-slate-900'
            }`}
          >
            {currentQ.question}
          </h2>
          {isLongQuestion && (
            <div className="mt-1 flex items-center">
              <span
                role="button"
                tabIndex={0}
                id="btn-drive-question-expand"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQuestionManuallyExpanded((prev) => !prev);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsQuestionManuallyExpanded((prev) => !prev);
                  }
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-zinc-200 light:text-slate-600 light:hover:text-slate-900 bg-zinc-800/60 hover:bg-zinc-800 light:bg-slate-100 px-2 py-0.5 rounded-md border border-zinc-700/50 light:border-slate-300 transition-colors cursor-pointer select-none"
                title={isQuestionExpanded ? 'Comprimi testo domanda' : 'Leggi domanda completa'}
                aria-label={isQuestionExpanded ? 'Comprimi testo domanda' : 'Leggi domanda completa'}
              >
                {isQuestionExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Riduci</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Leggi tutto</span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            id="btn-drive-play-pause"
            onClick={onTogglePlayPause}
            className={`p-3 rounded-xl transition-all ${
              isPlaying
                ? 'bg-amber-500 text-zinc-950 animate-pulse'
                : isPaused
                ? 'bg-amber-500 text-zinc-950 ring-2 ring-amber-400'
                : 'bg-zinc-800 text-zinc-300 hover:text-white light:bg-slate-100 light:text-slate-700 light:hover:text-slate-900'
            }`}
            title={isPlaying ? 'Pausa (Tasto P)' : isPaused ? 'Riprendi (Tasto P)' : 'Ascolta quesito (Tasto Q)'}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : isPaused ? <Play className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>

          {(isPlaying || isPaused || waitingCountdown !== null) && (
            <div className="flex items-center gap-1 animate-in fade-in">
              <button
                id="btn-drive-repeat"
                onClick={onRestartCurrentOrSequence}
                className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors flex items-center justify-center flex-1"
                title="Ripeti elemento attivo (Tasto R)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                id="btn-drive-stop"
                onClick={onStopVoice}
                className="p-2 rounded-lg bg-zinc-800/80 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-transparent hover:border-rose-800/50 light:bg-slate-100 light:hover:bg-rose-50 light:text-slate-500 light:hover:text-rose-600 light:hover:border-rose-200 transition-colors flex items-center justify-center"
                title="Ferma audio (Esc)"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Countdown attesa Pilota Automatico */}
      {waitingCountdown !== null && (
        <div
          className={`flex items-center justify-between px-3 py-1.5 border rounded-xl text-xs font-bold transition-all ${
            isVoiceReceiving
              ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.3)] light:bg-emerald-100 light:border-emerald-500 light:text-emerald-900'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-300 light:bg-amber-50 light:border-amber-300 light:text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <div className="relative flex items-center justify-center flex-shrink-0">
              <Mic
                className={`w-4 h-4 transition-transform ${
                  isVoiceReceiving ? 'text-emerald-300 animate-pulse scale-125' : 'text-amber-400'
                }`}
              />
              {isVoiceReceiving && (
                <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-75 animate-ping pointer-events-none" />
              )}
            </div>
            <span className="truncate">
              {isVoiceReceiving
                ? 'Ascolto comando in corso...'
                : isVoiceCommandsEnabled
                ? 'Pronuncia "Uno", "Due" o "Tre"...'
                : 'In attesa risposta o avanzamento...'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono flex-shrink-0 ml-2">
            <span className="text-[10px] text-zinc-400 light:text-slate-500 uppercase font-semibold hidden sm:inline">Attesa</span>
            <span className="text-base font-black text-amber-400 light:text-amber-600 animate-pulse">
              {waitingCountdown}s
            </span>
          </div>
        </div>
      )}

      {/* Banner Trascrizione Comandi Vocali in Tempo Reale */}
      {isVoiceSupported && isVoiceCommandsEnabled && (
        <button
          type="button"
          onClick={onOpenVoiceGuide}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs text-left transition-all ${
            isVoiceReceiving
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.4)] ring-1 ring-emerald-400/50 light:bg-emerald-50 light:border-emerald-400 light:text-emerald-950'
              : lastRecognizedLabel
              ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-200 light:bg-emerald-50 light:border-emerald-300 light:text-emerald-900'
              : unrecognizedSpeech
              ? 'bg-amber-950/60 border-amber-600 text-amber-200 light:bg-amber-50 light:border-amber-400 light:text-amber-950'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 light:bg-white light:border-slate-200 light:text-slate-700'
          }`}
          title="Tocca per aprire il cheat sheet completo dei comandi vocali"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative flex items-center justify-center flex-shrink-0">
              <Mic
                className={`w-3.5 h-3.5 ${
                  isVoiceReceiving
                    ? 'text-emerald-300 animate-pulse scale-125'
                    : lastRecognizedLabel
                    ? 'text-emerald-400'
                    : unrecognizedSpeech
                    ? 'text-amber-400'
                    : isVoiceListening
                    ? 'text-emerald-400'
                    : 'text-zinc-500'
                }`}
              />
              {isVoiceReceiving && (
                <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-75 animate-ping pointer-events-none" />
              )}
            </div>

            {voiceError ? (
              <span className="text-rose-400 font-bold truncate">Mic: {voiceError}</span>
            ) : isVoiceReceiving ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-black text-emerald-300 flex-shrink-0 animate-pulse">
                  In ricezione:
                </span>
                <span className="text-white light:text-slate-900 font-bold truncate">
                  "{voiceInterimTranscript || voiceLastTranscript || 'Rilevamento voce...'}"
                </span>
              </div>
            ) : lastRecognizedLabel ? (
              <div className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="font-bold text-emerald-300 flex-shrink-0">Comando:</span>
                <span className="text-white light:text-slate-900 font-black truncate">{lastRecognizedLabel} ✓</span>
              </div>
            ) : unrecognizedSpeech ? (
              <div className="flex items-center gap-1.5 truncate">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="font-bold text-amber-400 flex-shrink-0">Sentito:</span>
                <span className="text-zinc-200 light:text-slate-700 truncate">"{unrecognizedSpeech}" (non riconosciuto)</span>
              </div>
            ) : isVoiceSuspended ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="font-bold text-amber-400 flex-shrink-0">Lettura in corso:</span>
                <span className="text-zinc-300 light:text-slate-600 truncate">Microfono attivo a fine parlato</span>
              </div>
            ) : isPaused ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="font-bold text-emerald-400 flex-shrink-0">In pausa:</span>
                <span className="text-emerald-200/90 light:text-emerald-800 truncate">Dì "Riprendi", "Uno", "Due" o "Tre"</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="font-bold text-emerald-400 flex-shrink-0">In ascolto:</span>
                <span className="text-emerald-200/90 light:text-emerald-800 truncate">{voiceHint}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-400/80 font-bold ml-2 flex-shrink-0">
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guida</span>
          </div>
        </button>
      )}

      {/* 3 Macro-Fasce di Risposta & Card Didattica (Regola + Tranello) */}
      <div className="flex-1 flex flex-col gap-2.5 sm:gap-3.5 my-1 sm:my-2 min-h-0">
        <div className={`flex flex-col gap-2.5 sm:gap-3.5 ${isCurrentRevealed ? 'flex-none' : 'flex-1'} min-h-0 overflow-y-auto custom-scrollbar transition-opacity duration-200 ${isLocked ? 'opacity-80' : 'opacity-100'}`}>
          {currentQ.options.map((opt, idx) => {
            const optNum = (idx + 1) as 1 | 2 | 3;
            const isSelected = answers[currentQ.id] === optNum;
            const isCorrectAnswer = currentQ.correctAnswer === optNum;
            const isCurrentOptPlaying = isPartPlaying(`opt${optNum}` as any);
            const isExpanded = manuallyExpandedOpts[optNum] !== undefined
              ? manuallyExpandedOpts[optNum]
              : isCurrentOptPlaying;
            const isLongOption = truncatedOpts[optNum] !== undefined
              ? truncatedOpts[optNum]
              : opt.length > 95;

            let style =
              'bg-zinc-900/80 border-zinc-800 text-zinc-100 hover:border-zinc-700 active:scale-[0.99] light:bg-white light:border-slate-200 light:text-slate-900 light:hover:border-slate-300 light:shadow-sm';

            if (isCurrentRevealed) {
              if (isCorrectAnswer) {
                style =
                  'bg-emerald-950/80 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500 font-bold light:bg-emerald-50 light:border-emerald-500 light:text-emerald-950';
              } else if (isSelected && !isCorrectAnswer) {
                style =
                  'bg-rose-950/80 border-rose-500 text-rose-100 ring-2 ring-rose-500 light:bg-rose-50 light:border-rose-500 light:text-rose-950';
              } else {
                style =
                  'opacity-40 bg-zinc-950 border-zinc-900 text-zinc-400 light:bg-slate-100 light:border-slate-200 light:text-slate-400';
              }
            } else if (isSelected) {
              style =
                'bg-amber-950 border-amber-500 text-amber-100 ring-2 ring-amber-500 font-bold light:bg-amber-50 light:border-amber-500 light:text-amber-950';
            } else if (isCurrentOptPlaying) {
              style =
                'bg-amber-950/60 border-amber-400 text-amber-200 ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] light:bg-amber-50 light:border-amber-400 light:text-amber-950 light:ring-amber-400';
            }

            return (
              <button
                key={optNum}
                id={`btn-drive-opt-${optNum}`}
                lang="it"
                translate="no"
                disabled={isLocked}
                onClick={() => {
                  voiceService.stop();
                  onStopVoice();
                  onSelectAnswer(optNum);
                }}
                className={`overflow-hidden ${
                  isCurrentRevealed
                    ? 'w-full rounded-xl border p-2 sm:p-2.5 flex items-center gap-2.5 sm:gap-3 text-left transition-all duration-300'
                    : `${isAnyOptionExpanded ? (isExpanded ? 'flex-1' : 'flex-none') : 'flex-1'} w-full min-h-[74px] sm:min-h-[85px] rounded-2xl border-2 p-3 sm:p-4 flex items-center gap-3.5 sm:gap-5 text-left transition-all duration-300 shadow-md active:scale-[0.98]`
                } ${style} ${isLocked ? 'pointer-events-none' : ''}`}
              >
                <div
                  className={`${
                    isCurrentRevealed
                      ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-black text-xs sm:text-sm'
                      : 'w-11 h-11 sm:w-14 sm:h-14 rounded-xl font-black text-xl sm:text-2xl ring-2 ring-black/20'
                  } flex items-center justify-center flex-shrink-0 transition-transform ${
                    isCurrentRevealed && isCorrectAnswer
                      ? 'bg-emerald-500 text-white'
                      : isCurrentRevealed && isSelected && !isCorrectAnswer
                      ? 'bg-rose-500 text-white'
                      : isSelected
                      ? 'bg-amber-500 text-zinc-950'
                      : isCurrentOptPlaying
                      ? 'bg-amber-500 text-zinc-950 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-105'
                      : 'bg-zinc-800 text-zinc-300 light:bg-slate-100 light:text-slate-700'
                  }`}
                >
                  {optNum}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    ref={(el) => {
                      optionTextRefs.current[optNum] = el;
                    }}
                    lang="it"
                    className={`break-words ${
                      isCurrentRevealed
                        ? `text-xs sm:text-sm font-medium leading-tight ${isExpanded ? 'line-clamp-none' : 'line-clamp-2'}`
                        : `text-sm sm:text-base font-semibold leading-snug ${isExpanded ? 'line-clamp-none' : 'line-clamp-2'}`
                    }`}
                  >
                    {opt}
                  </div>
                  {isLongOption && (
                    <div className="mt-1 flex items-center">
                      <span
                        role="button"
                        tabIndex={0}
                        id={`btn-drive-opt-expand-${optNum}`}
                        onClick={(e) => toggleOptionExpansion(optNum, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleOptionExpansion(optNum, e);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 light:text-amber-700 light:hover:text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 light:bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-500/30 transition-colors cursor-pointer select-none"
                        title={isExpanded ? 'Comprimi risposta' : 'Leggi risposta completa'}
                        aria-label={isExpanded ? `Comprimi risposta ${optNum}` : `Leggi risposta completa ${optNum}`}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            <span>Riduci</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            <span>Leggi tutto</span>
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pulsante dedicato per riascolto isolato della singola opzione (senza selezionarla) */}
                <span
                  role="button"
                  tabIndex={0}
                  id={`btn-drive-opt-audio-${optNum}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayOption(optNum);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onPlayOption(optNum);
                    }
                  }}
                  className={`flex items-center justify-center flex-shrink-0 transition-all border ${
                    isCurrentRevealed
                      ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs'
                      : 'w-11 h-11 sm:w-12 sm:h-12 rounded-xl'
                  } ${
                    isCurrentOptPlaying
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-400/50 shadow-sm light:bg-amber-100 light:border-amber-400 light:text-amber-800'
                      : 'bg-zinc-800/80 hover:bg-zinc-700/80 border-zinc-700/60 text-zinc-400 hover:text-white light:bg-slate-100 light:hover:bg-slate-200 light:border-slate-300 light:text-slate-600'
                  }`}
                  title={`Riascolta solo opzione ${optNum} (Alt+${optNum})`}
                  aria-label={`Riascolta solo opzione ${optNum}`}
                >
                  <Volume2 className={`${isCurrentRevealed ? 'w-3.5 h-3.5' : 'w-5 h-5'} ${isCurrentOptPlaying ? 'text-amber-400 animate-pulse' : ''}`} />
                </span>

                {isCurrentRevealed && isCorrectAnswer && (
                  <CheckCircle2 className={`${isCurrentRevealed ? 'w-5 h-5' : 'w-7 h-7'} text-emerald-400 flex-shrink-0`} />
                )}
                {isCurrentRevealed && isSelected && !isCorrectAnswer && (
                  <XCircle className={`${isCurrentRevealed ? 'w-5 h-5' : 'w-7 h-7'} text-rose-400 flex-shrink-0`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Scheda Didattica (Regola e Tranello) in Debriefing / Tutor Mode */}
        {isCurrentRevealed && currentQ.explanation && (
          <div
            id="drive-didactic-card"
            lang="it"
            translate="no"
            className="flex-1 min-h-0 mt-1 p-2.5 sm:p-3 rounded-2xl bg-zinc-900/95 border-2 border-amber-500/50 text-zinc-100 light:bg-white light:border-amber-500/60 light:text-slate-900 shadow-2xl light:shadow-md flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {/* Header Scheda Didattica */}
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-zinc-800 light:border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-400 light:text-amber-600">
                  <GraduationCap className="w-4 h-4 text-amber-400 light:text-amber-600 flex-shrink-0" />
                  <span>Spiegazione Didattica</span>
                </div>

                <div className="flex items-center gap-2">
                  {isExplanationPlaying ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold animate-pulse">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Lettura in corso...</span>
                    </span>
                  ) : assimilationCountdown !== null ? (
                    <span className="text-[11px] font-mono text-amber-400 font-bold animate-pulse">
                      Prossima in {assimilationCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      id="btn-drive-replay-explanation"
                      onClick={onPlayExplanation}
                      className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 light:hover:text-slate-900 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      title={answers[currentQ.id] === currentQ.correctAnswer ? 'Ascolta spiegazione vocale' : 'Riascolta spiegazione vocale'}
                    >
                      {answers[currentQ.id] === currentQ.correctAnswer ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Ascolta</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Riascolta</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Regola */}
              {currentQ.explanation.rule && (
                <div className="flex items-start gap-2 text-xs sm:text-sm">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 light:bg-amber-100 light:text-amber-800 font-black text-[10px] uppercase tracking-wider flex-shrink-0 mt-0.5">
                    Regola
                  </span>
                  <p className="text-zinc-200 light:text-slate-800 font-medium leading-relaxed">
                    {currentQ.explanation.rule}
                  </p>
                </div>
              )}

              {/* Tranello (se presente) */}
              {currentQ.explanation.trap && (
                <div className="flex items-start gap-2 text-xs sm:text-sm pt-1 border-t border-zinc-800/60 light:border-slate-200">
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 light:bg-rose-100 light:text-rose-800 font-black text-[10px] uppercase tracking-wider flex-shrink-0 mt-0.5">
                    Tranello
                  </span>
                  <p className="text-zinc-300 light:text-slate-700 font-medium leading-relaxed">
                    {currentQ.explanation.trap}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barra Azioni Inferiore (Pulsanti Giganti) */}
      <div className="grid grid-cols-12 gap-2 pt-2 border-t border-zinc-800/90 light:border-slate-200">
        <button
          id="btn-drive-prev"
          onClick={onPrevQuestion}
          disabled={currentIndex === 0}
          className="col-span-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white light:bg-white light:border-slate-200 light:text-slate-700 light:hover:text-slate-900 light:shadow-sm font-black text-sm flex items-center justify-center gap-1.5 disabled:opacity-30 active:scale-[0.98]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Prec</span>
        </button>

        <button
          id="btn-drive-flag"
          onClick={onToggleFlag}
          className={`col-span-4 py-3.5 rounded-xl border font-black text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] ${
            flags[currentQ.id]
              ? 'bg-amber-500 border-amber-400 text-black'
              : 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800 light:bg-white light:border-slate-200 light:text-amber-600 light:hover:bg-slate-100 light:shadow-sm'
          }`}
        >
          <Flag className={`w-5 h-5 ${flags[currentQ.id] ? 'fill-black' : ''}`} />
          <span>Rivedi</span>
        </button>

        {currentIndex === totalCount - 1 && isExamSession ? (
          <button
            id="btn-drive-submit"
            onClick={onSubmitExam}
            className="col-span-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-1 shadow-lg shadow-emerald-950 light:shadow-emerald-200 active:scale-[0.98]"
          >
            <Check className="w-5 h-5" />
            <span>Consegna</span>
          </button>
        ) : (
          <button
            id="btn-drive-next"
            onClick={onNextQuestion}
            disabled={currentIndex === totalCount - 1 && !isExamSession}
            className="col-span-4 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm flex items-center justify-center gap-1.5 disabled:opacity-30 shadow-lg shadow-amber-950 light:shadow-amber-200 active:scale-[0.98]"
          >
            <span>Succ</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
