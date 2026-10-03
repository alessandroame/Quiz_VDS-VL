import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Question } from '../types/quiz';
import type { ExamSession } from '../types/database';
import type { AudioPart } from '../types/audio';
import { useQuiz } from '../context/QuizContext';
import { generateExamQuestions } from '../utils/fairRandomizer';
import { evaluateExam } from '../services/examEvaluator';
import { soundFX, shouldSuspendVoiceMic } from '../utils/audio';
import { triggerHapticFeedback } from '../utils/haptics';
import { useAviationVoice } from '../hooks/useAviationVoice';
import { useWakeLock } from '../hooks/useWakeLock';
import { useDriveVoiceCommands } from '../hooks/useDriveVoiceCommands';
import { parseVoiceCommand, type VoiceCommand } from '../utils/voiceCommandParser';
import { VoiceCommandsModal } from './VoiceCommandsModal';
import { AudioOfflinePromptModal } from './AudioOfflinePromptModal';
import { audioDownloadManager } from '../services/audioDownloadManager';
import { voiceService } from '../services/voiceService';
import { backNavigation } from '../utils/backNavigation';
import { DriveLauncher } from './drive/DriveLauncher';
import { DriveActiveHUD } from './drive/DriveActiveHUD';
import { DriveDebriefing } from './drive/DriveDebriefing';
import { getNextQuestionIndex } from '../utils/quizNavigation';


export interface DriveModeSessionContext {
  questions: Question[];
  currentIndex: number;
  answers: Record<number, 1 | 2 | 3>;
  flags: Record<number, boolean>;
  onAnswer: (questionId: number, answer: 1 | 2 | 3) => void;
  onToggleFlag: (questionId: number) => void;
  onNavigateIndex: (index: number) => void;
  isExam?: boolean;
  isTutor?: boolean;
  secondsRemaining?: number;
  onSubmitExam?: () => void;
  onAbandonSession?: () => void;
  title?: string;
}

interface DriveModeScreenProps {
  isOpen: boolean;
  onClose: () => void;
  sessionContext?: DriveModeSessionContext;
}

const VOICE_HINTS = [
  'Dì "Uno", "Due" o "Tre" per scegliere la risposta',
  'Dì "Ripeti domanda" o "Ripeti due" per riascoltare singoli elementi',
  'Dì "Spiega" o "Regola" per ascoltare la spiegazione didattica',
  'Dì "Attiva Tutor" o "Disattiva Tutor" per la modalità didattica',
  'Dì "Ripeti" per riascoltare l\'elemento attivo',
  'Dì "Avanti" o "Indietro" per scorrere i quesiti',
  'Dì "Pausa", "Stop" o "Continua" per l\'avanzamento automatico',
  'Dì "Bandiera" per contrassegnare il quiz',
  'Dì "Aiuto" o "Comandi" per l\'elenco comandi a voce'
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
  const [isTutorEnabled, setIsTutorEnabled] = useState<boolean>(
    sessionContext?.isTutor !== undefined
      ? sessionContext.isTutor
      : (settings.driveModeTutor ?? false)
  );
  const [isWaitingForExplanationEnd, setIsWaitingForExplanationEnd] = useState<boolean>(false);
  const isWaitingForExplanationEndRef = useRef<boolean>(false);
  const [assimilationCountdown, setAssimilationCountdown] = useState<number | null>(null);
  const assimilationTimeoutRef = useRef<any>(null);

  // Sincronizza stato Tutor se aggiornato dall'esterno (es. Settings o VoiceQuickMenu)
  useEffect(() => {
    if (sessionContext?.isTutor !== undefined) {
      setIsTutorEnabled(sessionContext.isTutor);
    } else if (settings.driveModeTutor !== undefined) {
      setIsTutorEnabled(settings.driveModeTutor);
    }
  }, [settings.driveModeTutor, sessionContext?.isTutor]);

  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const [waitingCountdown, setWaitingCountdown] = useState<number | null>(null);
  const [revealedQuestionId, setRevealedQuestionId] = useState<number | null>(null);
  const [isVoiceGuideOpen, setIsVoiceGuideOpen] = useState<boolean>(false);
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState<boolean>(false);
  const [voiceHintIndex, setVoiceHintIndex] = useState<number>(0);
  const [showOfflinePrompt, setShowOfflinePrompt] = useState<boolean>(false);
  const [isIntroActive, setIsIntroActive] = useState<boolean>(false);
  const [lastRecognizedLabel, setLastRecognizedLabel] = useState<string | null>(null);
  const [unrecognizedSpeech, setUnrecognizedSpeech] = useState<string | null>(null);
  const recognizedLabelTimerRef = useRef<any>(null);
  const unrecognizedTimerRef = useRef<any>(null);

  // Registra sub-modali interne con il coordinatore back navigation
  useEffect(() => {
    if (!showOfflinePrompt) return;
    const unregister = backNavigation.registerSubModal('drive-offline-prompt', () => {
      setShowOfflinePrompt(false);
    });
    return () => unregister();
  }, [showOfflinePrompt]);

  // Trigger prompt audio offline solo se nel Launcher e nessuna voce è già scaricata offline
  useEffect(() => {
    let isCancelled = false;
    if (isOpen && internalMode === 'launcher' && !settings.audioOfflinePromptDismissed) {
      const activeVoice = settings.ttsVoice || 'giuseppe';

      // Verifica accurata asincrona dello stato effettivo in CacheStorage
      audioDownloadManager.checkAllStatuses().then(statuses => {
        if (isCancelled) return;
        const activeStatus = statuses[activeVoice];
        const isActiveDownloaded = activeStatus.isComplete || activeStatus.downloadedCount >= 2000;
        const isAnyDownloaded = statuses.giuseppe.isComplete || statuses.giuseppe.downloadedCount >= 2000 ||
                               statuses.elsa.isComplete || statuses.elsa.downloadedCount >= 2000;

        // Se la voce attiva o almeno una voce completa è già presente offline, NON mostrare il prompt
        if (isActiveDownloaded || isAnyDownloaded) {
          updateSetting('audioOfflinePromptDismissed', true);
        } else {
          setShowOfflinePrompt(true);
        }
      }).catch(() => {
        if (!isCancelled && !audioDownloadManager.isVoiceReady(activeVoice) && !audioDownloadManager.getAvailableOfflineVoice()) {
          setShowOfflinePrompt(true);
        }
      });
    }
    return () => {
      isCancelled = true;
    };
  }, [isOpen, settings.audioOfflinePromptDismissed, settings.ttsVoice, updateSetting]);

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
  const autopilotAdvanceTimerRef = useRef<any>(null);
  const autoExplainTimerRef = useRef<any>(null);
  const autoPlayTimerRef = useRef<any>(null);
  const handleNextQuestionRef = useRef<() => void>(() => {});
  const handleSubmitExamRef = useRef<() => Promise<void> | void>(() => {});
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Micro-cooldown di sicurezza (250ms) al cambio domanda per prevenire click accidentali residui
  const [isQuestionSwitching, setIsQuestionSwitching] = useState<boolean>(false);
  const questionSwitchTimeoutRef = useRef<any>(null);
  const prevQuestionIdRef = useRef<number | null>(null);

  // Safety micro-cooldown (500ms) when voice switches option to prevent accidental clicks during expansion
  const [isOptionSwitchingCooldown, setIsOptionSwitchingCooldown] = useState<boolean>(false);
  const optionSwitchTimeoutRef = useRef<any>(null);
  const prevActivePartRef = useRef<AudioPart | null>(null);

  const clearAllDriveTimers = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (autopilotAdvanceTimerRef.current) {
      clearTimeout(autopilotAdvanceTimerRef.current);
      autopilotAdvanceTimerRef.current = null;
    }
    if (autoExplainTimerRef.current) {
      clearTimeout(autoExplainTimerRef.current);
      autoExplainTimerRef.current = null;
    }
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (assimilationTimeoutRef.current) {
      clearTimeout(assimilationTimeoutRef.current);
      assimilationTimeoutRef.current = null;
    }
    if (questionSwitchTimeoutRef.current) {
      clearTimeout(questionSwitchTimeoutRef.current);
      questionSwitchTimeoutRef.current = null;
    }
    if (optionSwitchTimeoutRef.current) {
      clearTimeout(optionSwitchTimeoutRef.current);
      optionSwitchTimeoutRef.current = null;
    }
    setWaitingCountdown(null);
    setAssimilationCountdown(null);
    setIsWaitingForExplanationEnd(false);
    isWaitingForExplanationEndRef.current = false;
    setIsOptionSwitchingCooldown(false);
  }, []);

  // Sincronizza stato iniziale all'apertura o cambio di context
  useEffect(() => {
    if (!isOpen) {
      setInternalMode('launcher');
      prevQuestionIdRef.current = null;
      prevActivePartRef.current = null;
      setIsQuestionSwitching(false);
      setIsOptionSwitchingCooldown(false);
      return;
    }
    if (sessionContext) {
      setInternalQuestions(sessionContext.questions);
      setCurrentIndex(sessionContext.currentIndex);
      setAnswers(sessionContext.answers);
      setFlags(sessionContext.flags);
      setIsExamSession(sessionContext.isExam ?? false);
      if (sessionContext.isTutor !== undefined) {
        setIsTutorEnabled(sessionContext.isTutor);
      }
      if (sessionContext.secondsRemaining !== undefined) {
        setSecondsRemaining(sessionContext.secondsRemaining);
      }
      setInternalMode('running');
    }
  }, [sessionContext, isOpen]);

  // Domanda attiva
  const currentQ = internalQuestions[currentIndex];
  const totalCount = internalQuestions.length;

  // Grace period anti-misclick (250ms) al cambio domanda per prevenire risposte accidentali alla cieca
  useEffect(() => {
    if (!isOpen || internalMode !== 'running' || !currentQ?.id) return;

    if (prevQuestionIdRef.current !== null && prevQuestionIdRef.current !== currentQ.id) {
      setIsQuestionSwitching(true);
      if (questionSwitchTimeoutRef.current) clearTimeout(questionSwitchTimeoutRef.current);
      questionSwitchTimeoutRef.current = setTimeout(() => {
        setIsQuestionSwitching(false);
        questionSwitchTimeoutRef.current = null;
      }, 250);
    } else {
      setIsQuestionSwitching(false);
    }
    prevQuestionIdRef.current = currentQ.id;

    return () => {
      if (questionSwitchTimeoutRef.current) {
        clearTimeout(questionSwitchTimeoutRef.current);
      }
    };
  }, [isOpen, internalMode, currentQ?.id]);

  const {
    isPlaying,
    isPaused,
    isSequencePlaying,
    isPartPlaying,
    isDriveIntroPlaying,
    togglePlayPause,
    restartCurrentOrSequence,
    playFullSequence,
    playQuestion,
    playOption,
    playExplanation,
    playDriveIntro,
    stopDriveIntro,
    stop: stopVoice,
    pause: pauseVoice,
    resume: resumeVoice,
    activePart
  } = useAviationVoice(currentQ?.id);

  // Anti-misclick micro-cooldown (500ms) when voice switches spoken option
  useEffect(() => {
    if (!isOpen || internalMode !== 'running') return;

    if (
      isPlaying &&
      prevActivePartRef.current &&
      activePart &&
      prevActivePartRef.current !== activePart &&
      (activePart.startsWith('opt') || prevActivePartRef.current.startsWith('opt'))
    ) {
      setIsOptionSwitchingCooldown(true);
      if (optionSwitchTimeoutRef.current) clearTimeout(optionSwitchTimeoutRef.current);
      optionSwitchTimeoutRef.current = setTimeout(() => {
        setIsOptionSwitchingCooldown(false);
        optionSwitchTimeoutRef.current = null;
      }, 500);
    }

    prevActivePartRef.current = activePart;

    return () => {
      if (optionSwitchTimeoutRef.current) {
        clearTimeout(optionSwitchTimeoutRef.current);
      }
    };
  }, [isOpen, internalMode, activePart, isPlaying]);

  const isExplanationPlaying = isPartPlaying('explanation');

  // Auto-trigger della spiegazione vocale alla partenza solo se non ancora ascoltata
  const hasTriggeredInitialIntroRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      hasTriggeredInitialIntroRef.current = false;
      setIsIntroActive(false);
      return;
    }

    if (internalMode === 'launcher' && !settings.driveModeIntroPlayed && !hasTriggeredInitialIntroRef.current) {
      hasTriggeredInitialIntroRef.current = true;
      setIsIntroActive(true);
      const t = setTimeout(() => {
        playDriveIntro();
      }, 350);
      return () => clearTimeout(t);
    }
  }, [isOpen, internalMode, settings.driveModeIntroPlayed, playDriveIntro]);

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

  // Timer per esame attivo (count-up se Tutor, countdown se Esame Ufficiale)
  useEffect(() => {
    if (!isOpen || internalMode !== 'running' || !isExamSession) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (isTutorEnabled) {
          return prev + 1;
        }
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, internalMode, isExamSession, isTutorEnabled]);

  // Avvio sequenza audio con Pilota Automatico
  const autoPlayTriggeredForRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      autoPlayTriggeredForRef.current = null;
      return;
    }
    if (internalMode !== 'running' || !currentQ || isIntroActive) return;

    // Reset stati di attesa per la nuova domanda
    setWaitingCountdown(null);
    setRevealedQuestionId(null);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    const voiceState = voiceService.getState();
    const isAlreadyPlayingThisQ =
      voiceState.currentQuestionId === currentQ.id &&
      (voiceState.isPlaying || voiceState.isPaused || voiceState.isSequencePlaying);

    if (isAlreadyPlayingThisQ) {
      autoPlayTriggeredForRef.current = currentQ.id;
    } else if (isAutopilotEnabled && autoPlayTriggeredForRef.current !== currentQ.id) {
      autoPlayTriggeredForRef.current = currentQ.id;
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
      playFullSequence();
    }
  }, [isOpen, internalMode, currentQ?.id, isAutopilotEnabled, isIntroActive, playFullSequence]);
  // Studio sereno a ritmo dell'allievo: al termine della lettura audio, la domanda
  // attende la risposta (touch, vocale o tastiera) senza countdown o avanzamenti forzati.

  // Riascolto selettivo di sola domanda o singola opzione
  const handlePlayQuestion = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setWaitingCountdown(null);
    triggerHapticFeedback('tap');
    playQuestion();
  }, [playQuestion]);

  const handlePlayOption = useCallback((option: 1 | 2 | 3) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setWaitingCountdown(null);
    triggerHapticFeedback('tap');
    playOption(option);
  }, [playOption]);

  // Navigazione tra le domande
  const handleNextQuestion = useCallback(() => {
    if (internalMode !== 'running') return;
    clearAllDriveTimers();
    stopVoice();

    const nextIdx = getNextQuestionIndex(currentIndex, internalQuestions, answers);
    if (nextIdx !== currentIndex) {
      triggerHapticFeedback('tap');
      setCurrentIndex(nextIdx);
      if (sessionContext) sessionContext.onNavigateIndex(nextIdx);
    } else if (isExamSession) {
      handleSubmitExamRef.current();
    }
  }, [internalMode, clearAllDriveTimers, stopVoice, currentIndex, internalQuestions, answers, sessionContext, isExamSession]);

  handleNextQuestionRef.current = handleNextQuestion;

  const handlePrevQuestion = useCallback(() => {
    if (internalMode !== 'running') return;
    clearAllDriveTimers();
    stopVoice();

    if (currentIndex > 0) {
      triggerHapticFeedback('tap');
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      if (sessionContext) sessionContext.onNavigateIndex(prevIdx);
    }
  }, [internalMode, clearAllDriveTimers, stopVoice, currentIndex, sessionContext]);

  // Gestione audio spiegazione & pausa di assimilazione in Modalità Tutor
  const prevExplanationPlayingRef = useRef<boolean>(false);

  const startAssimilationPause = useCallback((seconds: number = 2.5) => {
    if (assimilationTimeoutRef.current) clearTimeout(assimilationTimeoutRef.current);
    setAssimilationCountdown(seconds);

    assimilationTimeoutRef.current = setTimeout(() => {
      setAssimilationCountdown(null);
      if (internalMode === 'running') {
        handleNextQuestionRef.current();
      }
    }, seconds * 1000);
  }, [internalMode]);

  // Rileva quando la spiegazione vocale didattica finisce di parlare
  useEffect(() => {
    if (prevExplanationPlayingRef.current && !isExplanationPlaying && isWaitingForExplanationEndRef.current) {
      isWaitingForExplanationEndRef.current = false;
      setIsWaitingForExplanationEnd(false);

      if (isAutopilotEnabled && internalMode === 'running') {
        startAssimilationPause(2.5);
      }
    }
    prevExplanationPlayingRef.current = isExplanationPlaying;
  }, [isExplanationPlaying, isAutopilotEnabled, internalMode, startAssimilationPause]);

  // Safety guard se l'audio della spiegazione non parte o fallisce entro 4.5s
  useEffect(() => {
    if (isWaitingForExplanationEnd && internalMode === 'running') {
      const guardTimer = setTimeout(() => {
        if (isWaitingForExplanationEndRef.current && !isExplanationPlaying) {
          isWaitingForExplanationEndRef.current = false;
          setIsWaitingForExplanationEnd(false);
          if (isAutopilotEnabled && internalMode === 'running') {
            handleNextQuestionRef.current();
          }
        }
      }, 4500);
      return () => clearTimeout(guardTimer);
    }
  }, [isWaitingForExplanationEnd, isExplanationPlaying, isAutopilotEnabled, internalMode]);

  // Seleziona risposta
  const handleSelectAnswer = async (ans: 1 | 2 | 3) => {
    if (!currentQ || internalMode !== 'running') return;

    // Ignore clicks during safety micro-cooldown (250ms on question switch or 500ms on spoken option switch with layout shift)
    if (isQuestionSwitching || isOptionSwitchingCooldown) return;

    // Se l'esame è già terminato o la domanda è già rivelata
    if (answers[currentQ.id] !== undefined && (!isExamSession || isTutorEnabled)) return;

    triggerHapticFeedback('tap');

    clearAllDriveTimers();
    stopVoice();

    const isCorrect = ans === currentQ.correctAnswer;
    triggerHapticFeedback(isCorrect ? 'success' : 'error');

    // Aggiorna stato locale e notifica context padre se esistente
    setAnswers(prev => ({ ...prev, [currentQ.id]: ans }));
    if (sessionContext) {
      sessionContext.onAnswer(currentQ.id, ans);
    }

    if (settings.soundEnabled) {
      if (isCorrect) soundFX.playCorrect();
      else soundFX.playWrong();
    }

    if (!isExamSession || isTutorEnabled) {
      setRevealedQuestionId(currentQ.id);
      if (!sessionContext && (!isExamSession || isTutorEnabled)) {
        await recordAnswer(currentQ.id, isCorrect, ans, 'audio_mode');
      }

      if (!isCorrect && (isTutorEnabled || settings.ttsAutoExplainOnMistake)) {
        // MODALITÀ TUTOR su errore o spiegazione automatica su errore:
        // riproduce la spiegazione didattica (Regola + Tranello) e sincronizza l'autopilota
        isWaitingForExplanationEndRef.current = true;
        setIsWaitingForExplanationEnd(true);
        if (autoExplainTimerRef.current) clearTimeout(autoExplainTimerRef.current);
        autoExplainTimerRef.current = setTimeout(() => {
          autoExplainTimerRef.current = null;
          if (internalMode === 'running') {
            playExplanation();
          }
        }, 300);
        return; // L'avanzamento avverrà al termine della lettura vocale + pausa di assimilazione
      }
    }

    // Se il pilota automatico è attivo (risposta corretta o modalità senza spiegazione), avanza dopo tempo standard
    if (isAutopilotEnabled && internalMode === 'running') {
      if (autopilotAdvanceTimerRef.current) clearTimeout(autopilotAdvanceTimerRef.current);
      autopilotAdvanceTimerRef.current = setTimeout(() => {
        autopilotAdvanceTimerRef.current = null;
        if (internalMode === 'running') {
          handleNextQuestionRef.current();
        }
      }, isCorrect ? 1800 : 3500);
    }
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    triggerHapticFeedback('warning');
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

    const cmdLabels: Record<VoiceCommand, string> = {
      opt1: 'Opzione 1 ("Uno")',
      opt2: 'Opzione 2 ("Due")',
      opt3: 'Opzione 3 ("Tre")',
      repeat_question: 'Ripeti Domanda',
      repeat_opt1: 'Ripeti Opzione 1',
      repeat_opt2: 'Ripeti Opzione 2',
      repeat_opt3: 'Ripeti Opzione 3',
      next: 'Successiva ("Avanti")',
      prev: 'Precedente ("Indietro")',
      repeat: 'Ripeti Audio',
      flag: 'Bandierina',
      pause: 'Pausa',
      stop: 'Stop',
      resume: 'Riprendi',
      explain: 'Spiegazione ("Spiega")',
      tutor_on: 'Attiva Tutor',
      tutor_off: 'Disattiva Tutor',
      toggle_tutor: 'Tutor',
      help: 'Guida Comandi'
    };

    if (recognizedLabelTimerRef.current) clearTimeout(recognizedLabelTimerRef.current);
    setLastRecognizedLabel(cmdLabels[cmd] || cmd);
    recognizedLabelTimerRef.current = setTimeout(() => {
      setLastRecognizedLabel(null);
    }, 2500);

    if (cmd === 'repeat_question') {
      showToast('🗣️ "Ripeti Domanda"');
      handlePlayQuestion();
    } else if (cmd === 'repeat_opt1') {
      showToast('🗣️ "Ripeti Uno"');
      handlePlayOption(1);
    } else if (cmd === 'repeat_opt2') {
      showToast('🗣️ "Ripeti Due"');
      handlePlayOption(2);
    } else if (cmd === 'repeat_opt3') {
      showToast('🗣️ "Ripeti Tre"');
      handlePlayOption(3);
    } else if (cmd === 'opt1') {
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
    } else if (cmd === 'explain') {
      showToast('🗣️ "Spiega" - Regola & Tranello');
      if (currentQ) {
        setRevealedQuestionId(currentQ.id);
      }
      if (isAutopilotEnabled) {
        if (assimilationTimeoutRef.current) {
          clearTimeout(assimilationTimeoutRef.current);
          assimilationTimeoutRef.current = null;
          setAssimilationCountdown(null);
        }
        isWaitingForExplanationEndRef.current = true;
        setIsWaitingForExplanationEnd(true);
      }
      playExplanation();
    } else if (cmd === 'tutor_on') {
      showToast('🗣️ "Tutor Attivo"');
      setIsTutorEnabled(true);
      updateSetting('driveModeTutor', true);
    } else if (cmd === 'tutor_off') {
      showToast('🗣️ "Tutor Disattivato"');
      setIsTutorEnabled(false);
      updateSetting('driveModeTutor', false);
    } else if (cmd === 'toggle_tutor') {
      setIsTutorEnabled(prev => {
        const next = !prev;
        updateSetting('driveModeTutor', next);
        showToast(`🗣️ Tutor ${next ? 'Attivo' : 'Disattivato'}`);
        return next;
      });
    } else if (cmd === 'help') {
      showToast('🗣️ "Aiuto" - Guida Comandi');
      setIsVoiceGuideOpen(true);
      setIsAutopilotEnabled(false);
      pauseVoice();
    }
  }, [currentQ, handleSelectAnswer, handleNextQuestion, handlePrevQuestion, handlePlayQuestion, handlePlayOption, playFullSequence, restartCurrentOrSequence, handleToggleFlag, pauseVoice, stopVoice, resumeVoice, isPaused, playExplanation, updateSetting]);

  // Audio output preference: 'speaker' (mic only after speech/paused) or 'headphones' (continuous listening)
  const audioOutputMode = settings.driveModeAudioOutput || 'speaker';

  const handleToggleAudioOutput = () => {
    const nextVal = audioOutputMode === 'speaker' ? 'headphones' : 'speaker';
    updateSetting('driveModeAudioOutput', nextVal);
    showToast(
      nextVal === 'headphones'
        ? '🎧 Cuffie: microfono sempre attivo'
        : '🔊 Altoparlante: microfono attivo a fine parlato'
    );
  };

  const handleSetAudioOutput = (mode: 'speaker' | 'headphones') => {
    if (audioOutputMode === mode) return;
    updateSetting('driveModeAudioOutput', mode);
    showToast(
      mode === 'headphones'
        ? '🎧 Cuffie: microfono sempre attivo'
        : '🔊 Altoparlante: microfono attivo a fine parlato'
    );
  };

  // In speaker mode, suspend microphone during speech playback to prevent self-triggering from loudspeaker
  const shouldSuspendVoiceCommands = shouldSuspendVoiceMic(audioOutputMode, {
    isPlaying,
    isSequencePlaying,
    isDriveIntroPlaying,
    isPaused
  });

  // Hook Comandi Vocali
  const {
    isSupported: isVoiceSupported,
    isListening: isVoiceListening,
    isReceiving: isVoiceReceiving,
    isSuspended: isVoiceSuspended,
    lastTranscript: voiceLastTranscript,
    interimTranscript: voiceInterimTranscript,
    error: voiceError
  } = useDriveVoiceCommands({
    enabled: isOpen && isVoiceCommandsEnabled && internalMode === 'running',
    isSuspended: shouldSuspendVoiceCommands,
    onCommand: handleVoiceCommand
  });

  // Track unrecognized speech to provide clear diagnostic feedback to the user
  useEffect(() => {
    if (!voiceLastTranscript) return;
    if (!parseVoiceCommand(voiceLastTranscript)) {
      if (unrecognizedTimerRef.current) clearTimeout(unrecognizedTimerRef.current);
      setUnrecognizedSpeech(voiceLastTranscript);
      unrecognizedTimerRef.current = setTimeout(() => {
        setUnrecognizedSpeech(null);
      }, 2500);
    }
  }, [voiceLastTranscript]);

  // Clean up feedback timers on unmount
  useEffect(() => {
    return () => {
      clearAllDriveTimers();
      if (recognizedLabelTimerRef.current) clearTimeout(recognizedLabelTimerRef.current);
      if (unrecognizedTimerRef.current) clearTimeout(unrecognizedTimerRef.current);
    };
  }, [clearAllDriveTimers]);

  // Stop voice and clear timers whenever debriefing is entered
  useEffect(() => {
    if (internalMode === 'debriefing') {
      clearAllDriveTimers();
      stopVoice();
    }
  }, [internalMode, clearAllDriveTimers, stopVoice]);

  // Consegna Esame
  const handleSubmitExam = async () => {
    clearAllDriveTimers();
    stopVoice();

    // Se l'esame proviene da una sessione genitore (es. ExamScreen), deleghiamo il salvataggio
    if (sessionContext?.onSubmitExam) {
      sessionContext.onSubmitExam();
      onClose();
      return;
    }

    setInternalMode('debriefing');
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
  };

  handleSubmitExamRef.current = handleSubmitExam;

  // Keyboard Navigation per telecomandi Bluetooth da volante o tastierini
  useEffect(() => {
    if (!isOpen || internalMode !== 'running') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVoiceGuideOpen || showOfflinePrompt || isVoiceMenuOpen) {
        if (e.key === 'Escape') {
          if (isVoiceGuideOpen) setIsVoiceGuideOpen(false);
          else if (showOfflinePrompt) setShowOfflinePrompt(false);
        }
        return;
      }

      if (e.key === '1') {
        if (e.altKey) {
          e.preventDefault();
          handlePlayOption(1);
        } else {
          handleSelectAnswer(1);
        }
      }
      else if (e.key === '2') {
        if (e.altKey) {
          e.preventDefault();
          handlePlayOption(2);
        } else {
          handleSelectAnswer(2);
        }
      }
      else if (e.key === '3') {
        if (e.altKey) {
          e.preventDefault();
          handlePlayOption(3);
        } else {
          handleSelectAnswer(3);
        }
      }
      else if (e.key === 'ArrowRight' || e.key === ' ') handleNextQuestion();
      else if (e.key === 'ArrowLeft') handlePrevQuestion();
      else if (e.key.toLowerCase() === 'f') handleToggleFlag();
      else if (e.key.toLowerCase() === 'q' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlePlayQuestion();
      }
      else if (e.key.toLowerCase() === 'r') {
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
  }, [isOpen, internalMode, currentQ, currentIndex, totalCount, isAutopilotEnabled, isPlaying, isPaused, isVoiceGuideOpen, showOfflinePrompt, isVoiceMenuOpen, handlePlayQuestion, handlePlayOption, restartCurrentOrSequence, togglePlayPause, pauseVoice, stopVoice, resumeVoice]);

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
    setIsTutorEnabled(false);
    updateSetting('driveModeTutor', false);
    const qs = generateExamQuestions(questions, statsMap, marathon);
    setInternalQuestions(qs);
    setCurrentIndex(0);
    setAnswers({});
    setFlags({});
    setSecondsRemaining((marathon ? 60 : 45) * 60);
    setStartTime(Date.now());
    setInternalMode('running');
  };

  const startDriveTutorExam = () => {
    setIsMarathon(false);
    setIsExamSession(true);
    setIsTutorEnabled(true);
    updateSetting('driveModeTutor', true);
    const qs = generateExamQuestions(questions, statsMap, false);
    setInternalQuestions(qs);
    setCurrentIndex(0);
    setAnswers({});
    setFlags({});
    setSecondsRemaining(0);
    setStartTime(Date.now());
    setInternalMode('running');
  };

  const handleReplayExplanation = useCallback(() => {
    if (isAutopilotEnabled) {
      if (assimilationTimeoutRef.current) {
        clearTimeout(assimilationTimeoutRef.current);
        assimilationTimeoutRef.current = null;
        setAssimilationCountdown(null);
      }
      isWaitingForExplanationEndRef.current = true;
      setIsWaitingForExplanationEnd(true);
    }
    playExplanation();
  }, [isAutopilotEnabled, playExplanation]);

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
    executeClose();
  };

  const executeClose = () => {
    clearAllDriveTimers();
    stopVoice();
    stopDriveIntro();
    setIsIntroActive(false);
    onClose();
  };

  const handleToggleAutopilot = () => {
    const nextVal = !isAutopilotEnabled;
    setIsAutopilotEnabled(nextVal);
    updateSetting('driveModeAutopilot', nextVal);
  };

  const handleToggleVoiceCommands = () => {
    const nextVal = !isVoiceCommandsEnabled;
    setIsVoiceCommandsEnabled(nextVal);
    updateSetting('driveModeVoiceCommands', nextVal);
  };

  const handleToggleTutor = () => {
    const nextVal = !isTutorEnabled;
    setIsTutorEnabled(nextVal);
    updateSetting('driveModeTutor', nextVal);
  };

  if (!isOpen) return null;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 bg-black text-zinc-100 light:bg-slate-50 light:text-slate-900 flex flex-col h-[100dvh] w-full overflow-hidden select-none font-sans"
    >
      {/* Toast Notifiche Vocali */}
      {voiceToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm shadow-2xl animate-in fade-in slide-in-from-top-2">
          {voiceToast}
        </div>
      )}

      {/* --- STATO 1: LAUNCHER GUIDA --- */}
      {internalMode === 'launcher' && (
        <DriveLauncher
          isAutopilotEnabled={isAutopilotEnabled}
          onToggleAutopilot={handleToggleAutopilot}
          isVoiceCommandsEnabled={isVoiceCommandsEnabled}
          isVoiceSupported={isVoiceSupported}
          onToggleVoiceCommands={handleToggleVoiceCommands}
          audioOutputMode={audioOutputMode}
          onToggleAudioOutput={handleToggleAudioOutput}
          onSetAudioOutputMode={handleSetAudioOutput}
          isTutorEnabled={isTutorEnabled}
          onToggleTutor={handleToggleTutor}
          isIntroActive={isIntroActive}
          onDismissIntro={handleDismissIntro}
          onReplayIntro={handleReplayIntro}
          onOpenVoiceGuide={() => setIsVoiceGuideOpen(true)}
          setIsVoiceMenuOpen={setIsVoiceMenuOpen}
          onStartExam={startDriveExam}
          onStartTutorExam={startDriveTutorExam}
          onStartRadioQuiz={startDriveRadioQuiz}
          onStartMistakesQuiz={startDriveMistakes}
          isWakeLockActive={isWakeLockActive}
          onClose={handleClose}
        />
      )}

      {/* --- STATO 2: QUIZ ATTIVO IN MODALITÀ GUIDA (ZERO-SCROLL 100dvh) --- */}
      {internalMode === 'running' && currentQ && (
        <DriveActiveHUD
          currentQ={currentQ}
          currentIndex={currentIndex}
          totalCount={totalCount}
          isExamSession={isExamSession}
          secondsRemaining={secondsRemaining}
          sessionContext={sessionContext}
          isIntroActive={isIntroActive}
          onDismissIntro={handleDismissIntro}
          onReplayIntro={handleReplayIntro}
          onOpenVoiceGuide={() => setIsVoiceGuideOpen(true)}
          setIsVoiceMenuOpen={setIsVoiceMenuOpen}
          onClose={handleClose}
          onExecuteClose={executeClose}
          isAutopilotEnabled={isAutopilotEnabled}
          onToggleAutopilot={handleToggleAutopilot}
          isTutorEnabled={isTutorEnabled}
          onToggleTutor={handleToggleTutor}
          isVoiceSupported={isVoiceSupported}
          isVoiceCommandsEnabled={isVoiceCommandsEnabled}
          voiceError={voiceError}
          isVoiceReceiving={isVoiceReceiving}
          isVoiceListening={isVoiceListening}
          isVoiceSuspended={isVoiceSuspended}
          audioOutputMode={audioOutputMode}
          onToggleAudioOutput={handleToggleAudioOutput}
          onToggleVoiceCommands={handleToggleVoiceCommands}
          isPlaying={isPlaying}
          isPaused={isPaused}
          isPartPlaying={isPartPlaying}
          isExplanationPlaying={isExplanationPlaying}
          onTogglePlayPause={togglePlayPause}
          onRestartCurrentOrSequence={restartCurrentOrSequence}
          onStopVoice={stopVoice}
          onPlayExplanation={handleReplayExplanation}
          onPlayQuestion={handlePlayQuestion}
          onPlayOption={handlePlayOption}
          waitingCountdown={waitingCountdown}
          assimilationCountdown={assimilationCountdown}
          voiceInterimTranscript={voiceInterimTranscript}
          voiceLastTranscript={voiceLastTranscript}
          lastRecognizedLabel={lastRecognizedLabel}
          unrecognizedSpeech={unrecognizedSpeech}
          voiceHint={VOICE_HINTS[voiceHintIndex]}
          answers={answers}
          flags={flags}
          revealedQuestionId={revealedQuestionId}
          onSelectAnswer={handleSelectAnswer}
          onPrevQuestion={handlePrevQuestion}
          onNextQuestion={handleNextQuestion}
          onToggleFlag={handleToggleFlag}
          onSubmitExam={handleSubmitExam}
          isQuestionSwitching={isQuestionSwitching}
          isCooldownActive={isQuestionSwitching || isOptionSwitchingCooldown}
        />
      )}

      {/* --- STATO 3: DEBRIEFING ESITO ESAME --- */}
      {internalMode === 'debriefing' && completedSession && (
        <DriveDebriefing
          completedSession={completedSession}
          isMarathon={isMarathon}
          onRestartExam={startDriveExam}
          onClose={handleClose}
          onOpenVoiceGuide={() => setIsVoiceGuideOpen(true)}
          onReplayIntro={handleReplayIntro}
          setIsVoiceMenuOpen={setIsVoiceMenuOpen}
        />
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
