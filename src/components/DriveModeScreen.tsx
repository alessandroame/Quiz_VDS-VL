import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Car,
  X,
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
  Lightbulb,
  Zap,
  ListFilter,
  Flame,
  Radio,
  RotateCcw,
  Check,
  HelpCircle,
  Square
} from 'lucide-react';
import type { Question } from '../types/quiz';
import type { ExamSession } from '../types/database';
import { useQuiz } from '../context/QuizContext';
import { generateExamQuestions } from '../utils/fairRandomizer';
import { evaluateExam } from '../services/examEvaluator';
import { formatTime } from '../utils/timer';
import { soundFX } from '../utils/audio';
import { useAviationVoice } from '../hooks/useAviationVoice';
import { useWakeLock } from '../hooks/useWakeLock';
import { useDriveVoiceCommands } from '../hooks/useDriveVoiceCommands';
import type { VoiceCommand } from '../utils/voiceCommandParser';
import { VoiceCommandsModal } from './VoiceCommandsModal';
import { OfflineHUDTag } from './OfflineIndicator';
import { AudioOfflinePromptModal } from './AudioOfflinePromptModal';
import { AudioDownloadProgressHUD } from './AudioDownloadProgressHUD';
import { audioDownloadManager } from '../services/audioDownloadManager';
import { voiceService } from '../services/voiceService';

export interface DriveModeSessionContext {
  questions: Question[];
  currentIndex: number;
  answers: Record<number, 1 | 2 | 3>;
  flags: Record<number, boolean>;
  onAnswer: (questionId: number, answer: 1 | 2 | 3) => void;
  onToggleFlag: (questionId: number) => void;
  onNavigateIndex: (index: number) => void;
  isExam?: boolean;
  secondsRemaining?: number;
  onSubmitExam?: () => void;
  title?: string;
}

interface DriveModeScreenProps {
  isOpen: boolean;
  onClose: () => void;
  sessionContext?: DriveModeSessionContext;
}

const VOICE_HINTS = [
  'Dì "Uno", "Due" o "Tre" per scegliere la risposta',
  'Dì "Ripeti" per riascoltare l\'elemento attivo',
  'Dì "Avanti" o "Indietro" per scorrere i quesiti',
  'Dì "Pausa", "Stop" o "Continua" per il pilota automatico',
  'Dì "Bandiera" per contrassegnare il quiz',
  'Dì "Aiuto" o "Comandi" per aprire la guida a voce'
];

export const DriveModeScreen: React.FC<DriveModeScreenProps> = ({
  isOpen,
  onClose,
  sessionContext
}) => {
  const { questions, statsMap, saveExam, recordAnswer, settings, updateSetting } = useQuiz();

  // Screen Wake Lock API sempre attivo in Modalità Guida
  const { isActive: isWakeLockActive } = useWakeLock(isOpen);

  // Modalità sessione interna (se non viene fornito sessionContext da un esame esistente)
  const [internalMode, setInternalMode] = useState<'launcher' | 'running' | 'debriefing'>(
    sessionContext ? 'running' : 'launcher'
  );
  const [internalQuestions, setInternalQuestions] = useState<Question[]>(
    sessionContext ? sessionContext.questions : []
  );
  const [currentIndex, setCurrentIndex] = useState<number>(
    sessionContext ? sessionContext.currentIndex : 0
  );
  const [answers, setAnswers] = useState<Record<number, 1 | 2 | 3>>(
    sessionContext ? sessionContext.answers : {}
  );
  const [flags, setFlags] = useState<Record<number, boolean>>(
    sessionContext ? sessionContext.flags : {}
  );
  const [isExamSession, setIsExamSession] = useState<boolean>(
    sessionContext?.isExam ?? false
  );
  const [isMarathon, setIsMarathon] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [completedSession, setCompletedSession] = useState<ExamSession | null>(null);

  // Pilota Automatico & Hands-Free
  const [isAutopilotEnabled, setIsAutopilotEnabled] = useState<boolean>(
    settings.driveModeAutopilot ?? true
  );
  const [isVoiceCommandsEnabled, setIsVoiceCommandsEnabled] = useState<boolean>(
    settings.driveModeVoiceCommands ?? false
  );
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const [waitingCountdown, setWaitingCountdown] = useState<number | null>(null);
  const [revealedQuestionId, setRevealedQuestionId] = useState<number | null>(null);
  const [isVoiceGuideOpen, setIsVoiceGuideOpen] = useState<boolean>(false);
  const [voiceHintIndex, setVoiceHintIndex] = useState<number>(0);
  const [showOfflinePrompt, setShowOfflinePrompt] = useState<boolean>(false);
  const [isIntroActive, setIsIntroActive] = useState<boolean>(false);

  // Trigger prompt audio offline al primo avvio della Guida se la voce attiva non è scaricata
  useEffect(() => {
    if (isOpen && !settings.audioOfflinePromptDismissed) {
      const activeVoice = settings.ttsVoice || 'giuseppe';
      if (!audioDownloadManager.isVoiceReady(activeVoice)) {
        setShowOfflinePrompt(true);
      }
    }
  }, [isOpen, settings.audioOfflinePromptDismissed, settings.ttsVoice]);

  // Listener notifica fallback vocale cockpit
  useEffect(() => {
    return voiceService.onFallback(({ from, to }) => {
      const fromLabel = from === 'giuseppe' ? 'Giuseppe' : 'Elsa';
      const toLabel = to === 'giuseppe' ? 'Giuseppe' : 'Elsa';
      setVoiceToast(`Offline: uso voce ${toLabel} (${fromLabel} non presente)`);
      setTimeout(() => setVoiceToast(null), 4000);
    });
  }, []);

  // Rotazione periodica suggerimenti vocali nell'HUD (ogni 4.5s)
  useEffect(() => {
    if (!isOpen || internalMode !== 'running' || !isVoiceCommandsEnabled) return;
    const interval = setInterval(() => {
      setVoiceHintIndex(prev => (prev + 1) % VOICE_HINTS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isOpen, internalMode, isVoiceCommandsEnabled]);

  const countdownTimerRef = useRef<any>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Sincronizza stato iniziale all'apertura o cambio di context
  useEffect(() => {
    if (!isOpen) {
      setInternalMode('launcher');
      return;
    }
    if (sessionContext) {
      setInternalQuestions(sessionContext.questions);
      setCurrentIndex(sessionContext.currentIndex);
      setAnswers(sessionContext.answers);
      setFlags(sessionContext.flags);
      setIsExamSession(sessionContext.isExam ?? false);
      if (sessionContext.secondsRemaining !== undefined) {
        setSecondsRemaining(sessionContext.secondsRemaining);
      }
      setInternalMode('running');
    }
  }, [sessionContext, isOpen]);

  // Domanda attiva
  const currentQ = internalQuestions[currentIndex];
  const totalCount = internalQuestions.length;

  const {
    isThisQuestionActive,
    isPlaying,
    isPaused,
    isSequencePlaying,
    isPartPlaying,
    isDriveIntroPlaying,
    togglePlayPause,
    restartCurrentOrSequence,
    playFullSequence,
    playExplanation,
    playDriveIntro,
    stopDriveIntro,
    stop: stopVoice,
    pause: pauseVoice,
    resume: resumeVoice
  } = useAviationVoice(currentQ?.id);

  // Auto-trigger della spiegazione vocale alla partenza solo se non ancora ascoltata
  const hasTriggeredInitialIntroRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      hasTriggeredInitialIntroRef.current = false;
      setIsIntroActive(false);
      return;
    }

    if (!settings.driveModeIntroPlayed && !hasTriggeredInitialIntroRef.current) {
      hasTriggeredInitialIntroRef.current = true;
      setIsIntroActive(true);
      const t = setTimeout(() => {
        playDriveIntro();
      }, 350);
      return () => clearTimeout(t);
    }
  }, [isOpen, settings.driveModeIntroPlayed, playDriveIntro]);

  // Rileva quando la guida vocale finisce di parlare
  const prevIntroPlayingRef = useRef<boolean>(false);
  useEffect(() => {
    if (prevIntroPlayingRef.current && !isDriveIntroPlaying && isIntroActive) {
      setIsIntroActive(false);
      updateSetting('driveModeIntroPlayed', true);
    }
    prevIntroPlayingRef.current = !!isDriveIntroPlaying;
  }, [isDriveIntroPlaying, isIntroActive, updateSetting]);

  const handleDismissIntro = useCallback(() => {
    stopDriveIntro();
    setIsIntroActive(false);
    updateSetting('driveModeIntroPlayed', true);
  }, [stopDriveIntro, updateSetting]);

  const handleReplayIntro = useCallback(() => {
    stopVoice();
    setIsIntroActive(true);
    playDriveIntro();
  }, [stopVoice, playDriveIntro]);

  // Countdown timer per esame attivo
  useEffect(() => {
    if (!isOpen || internalMode !== 'running' || !isExamSession) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, internalMode, isExamSession]);

  // Avvio sequenza audio con Pilota Automatico
  const autoPlayTriggeredForRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || internalMode !== 'running' || !currentQ || isIntroActive) return;

    // Reset stati di attesa per la nuova domanda
    setWaitingCountdown(null);
    setRevealedQuestionId(null);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (isAutopilotEnabled && autoPlayTriggeredForRef.current !== currentQ.id) {
      autoPlayTriggeredForRef.current = currentQ.id;
      // Breve delay di 250ms per transizione fluida
      const t = setTimeout(() => {
        playFullSequence();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [isOpen, internalMode, currentQ?.id, isAutopilotEnabled, isIntroActive]);

  // Gestione termine sequenza audio vocale -> avvio countdown attesa risposta
  const prevSequencePlayingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen || internalMode !== 'running' || !isAutopilotEnabled || !currentQ) return;

    // Rileva quando la sequenza vocale finisce di leggere le opzioni
    if (prevSequencePlayingRef.current && !isSequencePlaying && isThisQuestionActive) {
      // Se l'utente non ha ancora risposto a questa domanda
      if (!answers[currentQ.id] && revealedQuestionId !== currentQ.id) {
        startWaitingCountdown();
      }
    }
    prevSequencePlayingRef.current = isSequencePlaying;
  }, [isSequencePlaying, isThisQuestionActive, isAutopilotEnabled, currentQ?.id, answers, revealedQuestionId]);

  // Avvia il countdown di attesa risposta (default 5s)
  const startWaitingCountdown = useCallback(() => {
    if (!currentQ) return;
    const waitSeconds = settings.driveModeAutoAdvanceSeconds || 5;
    setWaitingCountdown(waitSeconds);

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      setWaitingCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          handleAutoRevealAndAdvance();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [currentQ, settings.driveModeAutoAdvanceSeconds]);

  // Auto-rivelazione in modalità Pilota Automatico passivo (se l'utente non tocca nulla)
  const handleAutoRevealAndAdvance = useCallback(async () => {
    if (!currentQ) return;
    setRevealedQuestionId(currentQ.id);

    // Feedback sonoro didattico
    if (settings.soundEnabled) {
      soundFX.playClick();
    }

    // Lettura spiegazione
    playExplanation();

    // Registra come vista/non risposta (solo se fuori esame e senza context padre)
    if (!isExamSession && !sessionContext) {
      await recordAnswer(currentQ.id, false);
    }

    // Passa alla prossima domanda dopo 3.5 secondi
    setTimeout(() => {
      handleNextQuestion();
    }, 3500);
  }, [currentQ, settings.soundEnabled, playExplanation, recordAnswer]);

  // Seleziona risposta
  const handleSelectAnswer = async (ans: 1 | 2 | 3) => {
    if (!currentQ) return;

    // Se l'esame è già terminato o la domanda è già rivelata
    if (answers[currentQ.id] !== undefined && !isExamSession) return;

    stopVoice();
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setWaitingCountdown(null);

    const isCorrect = ans === currentQ.correctAnswer;

    // Aggiorna stato locale e notifica context padre se esistente
    setAnswers(prev => ({ ...prev, [currentQ.id]: ans }));
    if (sessionContext) {
      sessionContext.onAnswer(currentQ.id, ans);
    }

    if (settings.soundEnabled) {
      if (isCorrect) soundFX.playCorrect();
      else soundFX.playWrong();
    }

    if (!isExamSession) {
      setRevealedQuestionId(currentQ.id);
      if (!sessionContext) {
        await recordAnswer(currentQ.id, isCorrect);
      }

      if (!isCorrect) {
        playExplanation();
      }
    }

    // Se il pilota automatico è attivo, avanza dopo 2 secondi
    if (isAutopilotEnabled) {
      setTimeout(() => {
        handleNextQuestion();
      }, isCorrect ? 1800 : 3500);
    }
  };

  // Navigazione
  const handleNextQuestion = () => {
    stopVoice();
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setWaitingCountdown(null);

    if (currentIndex < totalCount - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (sessionContext) sessionContext.onNavigateIndex(nextIdx);
    } else if (isExamSession) {
      handleSubmitExam();
    }
  };

  const handlePrevQuestion = () => {
    stopVoice();
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setWaitingCountdown(null);

    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      if (sessionContext) sessionContext.onNavigateIndex(prevIdx);
    }
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    const nextVal = !flags[currentQ.id];
    setFlags(prev => ({ ...prev, [currentQ.id]: nextVal }));
    if (sessionContext) sessionContext.onToggleFlag(currentQ.id);
    if (settings.soundEnabled) soundFX.playClick();
    showToast(nextVal ? '⚑ Contrassegnata' : 'Bandierina rimossa');
  };

  const showToast = (msg: string) => {
    setVoiceToast(msg);
    setTimeout(() => {
      setVoiceToast(null);
    }, 2000);
  };

  // Esecuzione comandi vocali Hands-Free
  const handleVoiceCommand = useCallback((cmd: VoiceCommand) => {
    if (!currentQ) return;

    if (cmd === 'opt1') {
      showToast('🗣️ "Uno"');
      handleSelectAnswer(1);
    } else if (cmd === 'opt2') {
      showToast('🗣️ "Due"');
      handleSelectAnswer(2);
    } else if (cmd === 'opt3') {
      showToast('🗣️ "Tre"');
      handleSelectAnswer(3);
    } else if (cmd === 'next') {
      showToast('🗣️ "Avanti"');
      handleNextQuestion();
    } else if (cmd === 'prev') {
      showToast('🗣️ "Indietro"');
      handlePrevQuestion();
    } else if (cmd === 'repeat') {
      showToast('🗣️ "Ripeti"');
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setWaitingCountdown(null);
      restartCurrentOrSequence();
    } else if (cmd === 'flag') {
      handleToggleFlag();
    } else if (cmd === 'pause') {
      showToast('🗣️ "Pausa"');
      setIsAutopilotEnabled(false);
      pauseVoice();
    } else if (cmd === 'stop') {
      showToast('🗣️ "Stop"');
      setIsAutopilotEnabled(false);
      stopVoice();
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setWaitingCountdown(null);
    } else if (cmd === 'resume') {
      showToast('🗣️ "Riprendi"');
      setIsAutopilotEnabled(true);
      if (isPaused) {
        resumeVoice();
      } else {
        playFullSequence();
      }
    } else if (cmd === 'help') {
      showToast('🗣️ "Aiuto" - Guida Comandi');
      setIsVoiceGuideOpen(true);
      setIsAutopilotEnabled(false);
      pauseVoice();
    }
  }, [currentQ, handleSelectAnswer, handleNextQuestion, handlePrevQuestion, playFullSequence, restartCurrentOrSequence, handleToggleFlag, pauseVoice, stopVoice, resumeVoice, isPaused]);

  // Hook Comandi Vocali
  const { isSupported: isVoiceSupported } = useDriveVoiceCommands({
    enabled: isOpen && isVoiceCommandsEnabled && internalMode === 'running',
    onCommand: handleVoiceCommand
  });

  // Consegna Esame
  const handleSubmitExam = async () => {
    stopVoice();

    // Se l'esame proviene da una sessione genitore (es. ExamScreen), deleghiamo il salvataggio
    if (sessionContext?.onSubmitExam) {
      sessionContext.onSubmitExam();
      onClose();
      return;
    }

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    const session = evaluateExam({
      questions: internalQuestions,
      answers,
      flags,
      durationSeconds,
      isMarathon
    });

    for (const snap of session.snapshots) {
      if (snap.userAnswer !== undefined) {
        await recordAnswer(snap.questionId, snap.isCorrect);
      }
    }

    await saveExam(session);
    setCompletedSession(session);
    setInternalMode('debriefing');
  };

  // Keyboard Navigation per telecomandi Bluetooth da volante o tastierini
  useEffect(() => {
    if (!isOpen || internalMode !== 'running') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') handleSelectAnswer(1);
      else if (e.key === '2') handleSelectAnswer(2);
      else if (e.key === '3') handleSelectAnswer(3);
      else if (e.key === 'ArrowRight' || e.key === ' ') handleNextQuestion();
      else if (e.key === 'ArrowLeft') handlePrevQuestion();
      else if (e.key.toLowerCase() === 'f') handleToggleFlag();
      else if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'q') {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setWaitingCountdown(null);
        restartCurrentOrSequence();
      }
      else if (e.key === 'Escape') {
        setIsAutopilotEnabled(false);
        stopVoice();
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setWaitingCountdown(null);
      }
      else if (e.key.toLowerCase() === 'p') {
        if (isPlaying) {
          setIsAutopilotEnabled(false);
          pauseVoice();
        } else if (isPaused) {
          setIsAutopilotEnabled(true);
          resumeVoice();
        } else {
          setIsAutopilotEnabled(prev => !prev);
          togglePlayPause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, internalMode, currentQ, currentIndex, totalCount, isAutopilotEnabled, isPlaying, isPaused, restartCurrentOrSequence, togglePlayPause, pauseVoice, stopVoice, resumeVoice]);

  // Gestione Swipe Touch a schermo intero
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartXRef.current;
    const diffY = touch.clientY - touchStartYRef.current;

    // Solo swipe orizzontali netti (> 60px) senza troppo scorrimento verticale
    if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
      if (diffX < 0) {
        // Swipe verso sinistra = Successiva
        handleNextQuestion();
      } else {
        // Swipe verso destra = Precedente
        handlePrevQuestion();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Avvio sessioni dal Launcher Guida
  const startDriveExam = (marathon = false) => {
    setIsMarathon(marathon);
    setIsExamSession(true);
    const qs = generateExamQuestions(questions, statsMap, marathon);
    setInternalQuestions(qs);
    setCurrentIndex(0);
    setAnswers({});
    setFlags({});
    setSecondsRemaining((marathon ? 60 : 45) * 60);
    setStartTime(Date.now());
    setInternalMode('running');
  };

  const startDriveMistakes = () => {
    const wrongQs = questions.filter(q => {
      const s = statsMap.get(q.id);
      return s && s.timesWrong > 0 && s.consecutiveCorrect < 2;
    });
    if (wrongQs.length === 0) {
      showToast('Nessun errore nel quaderno!');
      return;
    }
    setIsExamSession(false);
    setInternalQuestions(wrongQs);
    setCurrentIndex(0);
    setAnswers({});
    setFlags({});
    setInternalMode('running');
  };

  const startDriveRadioQuiz = () => {
    setIsExamSession(false);
    // Fair randomizer su tutti i 504 quiz
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setInternalQuestions(shuffled);
    setCurrentIndex(0);
    setAnswers({});
    setFlags({});
    setInternalMode('running');
  };

  const handleClose = () => {
    stopVoice();
    stopDriveIntro();
    setIsIntroActive(false);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col h-[100dvh] w-full overflow-hidden select-none font-sans"
    >
      {/* Toast Notifiche Vocali */}
      {voiceToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm shadow-2xl animate-in fade-in slide-in-from-top-2">
          {voiceToast}
        </div>
      )}

      {/* --- STATO 1: LAUNCHER GUIDA --- */}
      {internalMode === 'launcher' && (
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto w-full">
          {/* Header Launcher */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>Modalità Alla Guida</span>
                  <AudioDownloadProgressHUD />
                  <OfflineHUDTag />
                </h1>
                <p className="text-xs text-zinc-400 font-medium">
                  Pulsanti giganti • Rispondi a voce • Nessun bisogno di scorrere
                </p>
              </div>
            </div>
            <button
              id="btn-drive-exit"
              onClick={handleClose}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              title="Esci dalla modalità guida"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Settings Bar */}
          <div className="grid grid-cols-2 gap-2.5 py-3">
            <button
              onClick={() => setIsAutopilotEnabled(!isAutopilotEnabled)}
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                isAutopilotEnabled
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <Radio className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <div className="text-[10px] text-zinc-400 uppercase">Pilota Automatico</div>
                <div>{isAutopilotEnabled ? 'ATTIVO (Radio)' : 'Manuale'}</div>
              </div>
            </button>

            <button
              onClick={() => setIsVoiceCommandsEnabled(!isVoiceCommandsEnabled)}
              disabled={!isVoiceSupported}
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                isVoiceCommandsEnabled
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {isVoiceCommandsEnabled ? (
                <Mic className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              ) : (
                <MicOff className="w-4 h-4 flex-shrink-0" />
              )}
              <div className="text-left">
                <div className="text-[10px] text-zinc-400 uppercase">Comandi Vocali</div>
                <div>{isVoiceSupported ? (isVoiceCommandsEnabled ? 'ATTIVO' : 'Spento') : 'Non supportato'}</div>
              </div>
            </button>
          </div>

          {/* Spiegazione Vocale Briefing Banner (se attiva) */}
          {isIntroActive && (
            <div className="p-3.5 rounded-2xl bg-amber-950/80 border-2 border-amber-500/80 text-amber-100 shadow-2xl animate-in fade-in slide-in-from-top-2 mb-2">
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
                    <div className="text-xs font-black text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Guida Vocale Iniziale</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">AUDIO</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 truncate">
                      Ascolto spiegazione: comandi vocali e risposte touch...
                    </p>
                  </div>
                </div>
                <button
                  id="btn-skip-drive-intro"
                  onClick={handleDismissIntro}
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
              onClick={handleReplayIntro}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isIntroActive
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                  : 'bg-zinc-900 border-zinc-800 hover:border-amber-500/50 text-zinc-300 hover:text-amber-300'
              }`}
              title="Riascolta spiegazione vocale"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Spiegazione Vocale</span>
            </button>
            <button
              type="button"
              onClick={() => setIsVoiceGuideOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-zinc-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guida Comandi</span>
            </button>
          </div>

          {/* Opzioni di Avvio Rapido */}
          <div className="flex-1 flex flex-col justify-center gap-3.5">
            <button
              id="btn-drive-start-exam"
              onClick={() => startDriveExam(false)}
              className="w-full py-5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-black text-lg flex items-center justify-between shadow-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-7 h-7 text-amber-200" />
                <div className="text-left">
                  <div>Esame Ufficiale AeCI</div>
                  <div className="text-xs text-amber-200 font-medium">30 Quiz • 45 Minuti • Max 3 Errori</div>
                </div>
              </div>
              <ArrowRight className="w-6 h-6" />
            </button>

            <button
              id="btn-drive-start-radio"
              onClick={startDriveRadioQuiz}
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
              onClick={startDriveMistakes}
              className="w-full py-4 px-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-[0.98] text-rose-300 font-bold text-base flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <Flame className="w-6 h-6 text-rose-400" />
                <div className="text-left">
                  <div>Ripasso Quaderno Errori</div>
                  <div className="text-xs text-zinc-400 font-medium">Solo le domande con errori attivi</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-400" />
            </button>

            <button
              id="btn-drive-start-marathon"
              onClick={() => startDriveExam(true)}
              className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 font-semibold text-sm flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4" />
                <span>Maratona Intensiva (60 Quiz)</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Indicatori Sicurezza & Wake Lock */}
          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Lightbulb className={`w-3.5 h-3.5 ${isWakeLockActive ? 'text-emerald-400' : 'text-zinc-600'}`} />
              <span>{isWakeLockActive ? 'Schermo sempre acceso durante la guida' : 'Standby schermo attivo'}</span>
            </div>
            <span>VDS-VL 2017</span>
          </div>
        </div>
      )}

      {/* --- STATO 2: QUIZ ATTIVO IN MODALITÀ GUIDA (ZERO-SCROLL 100dvh) --- */}
      {internalMode === 'running' && currentQ && (
        <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 max-w-2xl mx-auto w-full h-full overflow-hidden">
          {/* Spoken Intro Active HUD Banner */}
          {isIntroActive && (
            <div className="mb-2 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs text-amber-200">
                <Volume2 className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
                <span>Introduzione vocale in corso... Ascolta o tocca Salta</span>
              </div>
              <button
                type="button"
                onClick={handleDismissIntro}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-colors"
              >
                Salta
              </button>
            </div>
          )}

          {/* Top Bar HUD */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-800/90 text-xs">
            <button
              id="btn-drive-exit"
              onClick={handleClose}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold flex items-center gap-1 hover:text-white"
            >
              <X className="w-4 h-4" />
              <span>Esci</span>
            </button>

            <div className="flex items-center gap-2 font-mono">
              <span className="font-black text-sm text-amber-400">
                {currentIndex + 1} / {totalCount}
              </span>
              {isExamSession && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-xs">
                  ⏱ {formatTime(secondsRemaining)}
                </span>
              )}
              <AudioDownloadProgressHUD />
              <OfflineHUDTag />
            </div>

            <div className="flex items-center gap-1.5">
              {/* Toggle Pilota Automatico */}
              <button
                onClick={() => {
                  if (isAutopilotEnabled) {
                    setIsAutopilotEnabled(false);
                    stopVoice();
                  } else {
                    setIsAutopilotEnabled(true);
                    playFullSequence();
                  }
                }}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  isAutopilotEnabled
                    ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-500/50'
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                }`}
                title="Pilota Automatico"
              >
                {isAutopilotEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isAutopilotEnabled ? 'Pilota ON' : 'Manuale'}</span>
              </button>

              {/* Toggle Comandi Vocali & Guida Rapida */}
              {isVoiceSupported && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsVoiceCommandsEnabled(!isVoiceCommandsEnabled)}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isVoiceCommandsEnabled
                        ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50'
                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                    }`}
                    title={isVoiceCommandsEnabled ? 'Disattiva comandi vocali' : 'Attiva comandi vocali'}
                  >
                    {isVoiceCommandsEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsVoiceGuideOpen(true)}
                    className="p-1.5 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
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
            <div className="my-2 p-3 sm:p-4 rounded-2xl bg-amber-950/90 border-2 border-amber-500 text-amber-100 shadow-2xl animate-in fade-in slide-in-from-top-2">
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
                    <div className="text-xs font-black text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Guida Vocale Iniziale</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">AUDIO</span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-0.5 truncate sm:text-clip">
                      Ascolto briefing: rispondi a voce ("Uno", "Due", "Tre") o tocca le fasce.
                    </p>
                  </div>
                </div>
                <button
                  id="btn-skip-running-intro"
                  onClick={handleDismissIntro}
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
          <div className="my-2 p-3 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/50">
                  #{currentQ.id}
                </span>
                <span className="text-xs text-zinc-400 font-semibold truncate">
                  {currentQ.subjectName}
                </span>
              </div>
              <h2
                className={`text-base sm:text-xl font-bold leading-snug tracking-tight transition-colors line-clamp-3 sm:line-clamp-4 ${
                  isPartPlaying('question') ? 'text-amber-300' : 'text-white'
                }`}
              >
                {currentQ.question}
              </h2>
            </div>

            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button
                id="btn-drive-play-pause"
                onClick={() => togglePlayPause()}
                className={`p-3 rounded-xl transition-all ${
                  isPlaying
                    ? 'bg-amber-500 text-zinc-950 animate-pulse'
                    : isPaused
                    ? 'bg-amber-500 text-zinc-950 ring-2 ring-amber-400'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title={isPlaying ? 'Pausa (Tasto P)' : isPaused ? 'Riprendi (Tasto P)' : 'Ascolta quesito (Tasto Q)'}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : isPaused ? <Play className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>

              {(isPlaying || isPaused || waitingCountdown !== null) && (
                <div className="flex items-center gap-1 animate-in fade-in">
                  <button
                    id="btn-drive-repeat"
                    onClick={() => {
                      if (countdownTimerRef.current) {
                        clearInterval(countdownTimerRef.current);
                        countdownTimerRef.current = null;
                      }
                      setWaitingCountdown(null);
                      restartCurrentOrSequence();
                    }}
                    className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors flex items-center justify-center flex-1"
                    title="Ripeti elemento attivo (Tasto R)"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    id="btn-drive-stop"
                    onClick={() => {
                      setIsAutopilotEnabled(false);
                      stopVoice();
                      if (countdownTimerRef.current) {
                        clearInterval(countdownTimerRef.current);
                        countdownTimerRef.current = null;
                      }
                      setWaitingCountdown(null);
                    }}
                    className="p-2 rounded-lg bg-zinc-800/80 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-transparent hover:border-rose-800/50 transition-colors flex items-center justify-center"
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
            <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-bold animate-pulse">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>In attesa di risposta... dì "Uno", "Due" o "Tre"</span>
              </div>
              <span className="font-mono text-sm">{waitingCountdown}s</span>
            </div>
          )}

          {/* HUD Suggerimento Vocale Live (Rotativo) */}
          {waitingCountdown === null && isVoiceCommandsEnabled && isVoiceSupported && (
            <button
              type="button"
              onClick={() => setIsVoiceGuideOpen(true)}
              className="flex items-center justify-between px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-medium transition-colors cursor-pointer"
              title="Tocca per visualizzare tutti i comandi vocali"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="font-bold text-emerald-400 flex-shrink-0">Microfono ON:</span>
                <span className="text-emerald-200/90 truncate">{VOICE_HINTS[voiceHintIndex]}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400/80 font-bold ml-2 flex-shrink-0">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guida</span>
              </div>
            </button>
          )}

          {/* 3 Macro-Fasce di Risposta (Riempiono lo spazio verticale uniformemente) */}
          <div className="flex-1 flex flex-col gap-2 sm:gap-3 my-1 sm:my-2 min-h-0">
            {currentQ.options.map((opt, idx) => {
              const optNum = (idx + 1) as 1 | 2 | 3;
              const isSelected = answers[currentQ.id] === optNum;
              const isCorrectAnswer = currentQ.correctAnswer === optNum;
              const isRevealed = revealedQuestionId === currentQ.id;
              const isCurrentOptPlaying = isPartPlaying(`opt${optNum}` as any);

              let style = 'bg-zinc-900/80 border-zinc-800 text-zinc-100 hover:border-zinc-700 active:scale-[0.99]';

              if (isRevealed || (!isExamSession && answers[currentQ.id] !== undefined)) {
                if (isCorrectAnswer) {
                  style = 'bg-emerald-950/80 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500 font-bold';
                } else if (isSelected && !isCorrectAnswer) {
                  style = 'bg-rose-950/80 border-rose-500 text-rose-100 ring-2 ring-rose-500';
                } else {
                  style = 'opacity-40 bg-zinc-950 border-zinc-900 text-zinc-400';
                }
              } else if (isSelected) {
                style = 'bg-amber-950 border-amber-500 text-amber-100 ring-2 ring-amber-500 font-bold';
              } else if (isCurrentOptPlaying) {
                style = 'bg-amber-950/60 border-amber-400 text-amber-200 ring-1 ring-amber-400';
              }

              return (
                <button
                  key={optNum}
                  id={`btn-drive-opt-${optNum}`}
                  onClick={() => handleSelectAnswer(optNum)}
                  className={`flex-1 w-full rounded-2xl border-2 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 text-left transition-all ${style}`}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-lg sm:text-2xl flex-shrink-0 ${
                      (isRevealed || (!isExamSession && answers[currentQ.id])) && isCorrectAnswer
                        ? 'bg-emerald-500 text-white'
                        : isSelected
                        ? 'bg-amber-500 text-zinc-950'
                        : isCurrentOptPlaying
                        ? 'bg-amber-500 text-zinc-950 animate-pulse'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {optNum}
                  </div>

                  <div className="flex-1 text-sm sm:text-lg font-semibold leading-snug line-clamp-3">
                    {opt}
                  </div>

                  {(isRevealed || (!isExamSession && answers[currentQ.id])) && isCorrectAnswer && (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                  )}
                  {(isRevealed || (!isExamSession && answers[currentQ.id])) && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-7 h-7 text-rose-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Barra Azioni Inferiore (Pulsanti Giganti) */}
          <div className="grid grid-cols-12 gap-2 pt-2 border-t border-zinc-800/90">
            <button
              onClick={handlePrevQuestion}
              disabled={currentIndex === 0}
              className="col-span-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white font-black text-sm flex items-center justify-center gap-1.5 disabled:opacity-30 active:scale-[0.98]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Prec</span>
            </button>

            <button
              onClick={handleToggleFlag}
              className={`col-span-4 py-3.5 rounded-xl border font-black text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] ${
                flags[currentQ.id]
                  ? 'bg-amber-500 border-amber-400 text-black'
                  : 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800'
              }`}
            >
              <Flag className={`w-5 h-5 ${flags[currentQ.id] ? 'fill-black' : ''}`} />
              <span>Rivedi</span>
            </button>

            {currentIndex === totalCount - 1 && isExamSession ? (
              <button
                onClick={handleSubmitExam}
                className="col-span-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-1 shadow-lg shadow-emerald-950 active:scale-[0.98]"
              >
                <Check className="w-5 h-5" />
                <span>Consegna</span>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                disabled={currentIndex === totalCount - 1 && !isExamSession}
                className="col-span-4 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm flex items-center justify-center gap-1.5 disabled:opacity-30 shadow-lg shadow-amber-950 active:scale-[0.98]"
              >
                <span>Succ</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- STATO 3: DEBRIEFING ESITO ESAME --- */}
      {internalMode === 'debriefing' && completedSession && (
        <div className="flex-1 flex flex-col justify-between p-6 max-w-lg mx-auto w-full">
          <div className="space-y-6 pt-4 text-center">
            <div
              className={`p-6 rounded-3xl border-2 space-y-3 ${
                completedSession.isPassed
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-100'
                  : 'bg-rose-950/40 border-rose-500 text-rose-100'
              }`}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto">
                {completedSession.isPassed ? (
                  <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                ) : (
                  <XCircle className="w-16 h-16 text-rose-400" />
                )}
              </div>
              <h2 className="text-3xl font-black tracking-tight">
                {completedSession.isPassed ? 'ESAME IDONEO' : 'NON IDONEO'}
              </h2>
              <p className="text-sm font-semibold opacity-90">
                {completedSession.isPassed
                  ? `Complimenti! ${completedSession.wrongAnswers} errori (massimo 3 ammessi)`
                  : `${completedSession.wrongAnswers} errori su ${completedSession.totalQuestions} quesiti`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                <div className="text-2xl font-black text-emerald-400">
                  {completedSession.correctAnswers}
                </div>
                <div className="text-xs text-zinc-400 font-bold uppercase">Esatte</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                <div className="text-2xl font-black text-rose-400">
                  {completedSession.wrongAnswers}
                </div>
                <div className="text-xs text-zinc-400 font-bold uppercase">Errate</div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pb-4">
            <button
              onClick={() => startDriveExam(isMarathon)}
              className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-lg flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Riprova Esame</span>
            </button>
            <button
              onClick={handleClose}
              className="w-full py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-base flex items-center justify-center gap-2"
            >
              <span>Chiudi Modalità Guida</span>
            </button>
          </div>
        </div>
      )}

      {/* Modale Guida Comandi Vocali (Cheat Sheet) */}
      <VoiceCommandsModal
        isOpen={isVoiceGuideOpen}
        onClose={() => setIsVoiceGuideOpen(false)}
        onReplaySpokenGuide={handleReplayIntro}
      />

      {/* Modale Prompt Download Audio Offline (Primo Accesso Guida) */}
      <AudioOfflinePromptModal
        isOpen={showOfflinePrompt}
        onClose={() => setShowOfflinePrompt(false)}
      />
    </div>
  );
};
