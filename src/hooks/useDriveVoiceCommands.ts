import { useState, useEffect, useRef, useCallback } from 'react';
import type { AdaptiveVoiceAliasEntry } from '../types/database';
import {
  isImmediateVoiceCommand,
  isPrefixAmbiguousCommand,
  resolveVoiceCommand,
  type VoiceCommand,
  type VoiceResolutionResult,
  type VoiceSpeechAlternative
} from '../utils/voiceCommandParser';

export interface UseDriveVoiceCommandsProps {
  enabled: boolean;
  onCommand: (command: VoiceCommand) => void;
  isSuspended?: boolean;
  /**
   * Stabilization window (ms) to let live transcripts refine before dispatching commands.
   * Pass ~340 in Drive Mode for progressive refinement; defaults to 0 for immediate interim dispatch.
   */
  settleMs?: number;
  /** Active question options (3 items) for distinctive keyword matching once speech stabilizes. */
  optionTexts?: readonly string[];
  /** User-specific adaptive pronunciation aliases persisted in IndexedDB. */
  adaptiveAliases?: Record<string, AdaptiveVoiceAliasEntry>;
}

export interface UseDriveVoiceCommandsResult {
  isListening: boolean;
  isReceiving: boolean;
  isRefining: boolean;
  isSupported: boolean;
  isSuspended: boolean;
  committedTranscript: string;
  lastTranscript: string;
  interimTranscript: string;
  pendingCommand: VoiceCommand | null;
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Hook for continuous Italian speech recognition and progressive transcript refinement in Drive Mode.
 * Supports multi-alternative N-best scoring, interim stabilization windows, prefix disambiguation,
 * contextual quiz option matching, and clean state resets across recognizer restarts.
 */
export function useDriveVoiceCommands({
  enabled,
  onCommand,
  isSuspended = false,
  settleMs = 0,
  optionTexts,
  adaptiveAliases
}: UseDriveVoiceCommandsProps): UseDriveVoiceCommandsResult {
  const [isListening, setIsListening] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [committedTranscript, setCommittedTranscript] = useState('');
  const [lastTranscript, setLastTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [pendingCommand, setPendingCommand] = useState<VoiceCommand | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSuspendedEffective = Boolean(isSuspended);
  const isSuspendedRef = useRef(isSuspendedEffective);
  isSuspendedRef.current = isSuspendedEffective;

  const settleMsRef = useRef(settleMs);
  settleMsRef.current = settleMs;

  const optionTextsRef = useRef(optionTexts);
  optionTextsRef.current = optionTexts;

  const adaptiveAliasesRef = useRef(adaptiveAliases);
  adaptiveAliasesRef.current = adaptiveAliases;

  const recognitionRef = useRef<any>(null);
  const recSessionIdRef = useRef<number>(0);
  const shouldBeListeningRef = useRef(enabled && !isSuspendedEffective);
  const onCommandRef = useRef(onCommand);
  const fatalErrorRef = useRef(false);
  const restartTimeoutRef = useRef<any>(null);
  const receivingTimeoutRef = useRef<any>(null);
  const acousticCooldownRef = useRef<any>(null);
  const settleTimeoutRef = useRef<any>(null);
  const pendingFlushRef = useRef<(() => void) | null>(null);
  const ignoreResultsBeforeRef = useRef<number>(0);
  const lastHandledIndexRef = useRef<number>(-1);

  onCommandRef.current = onCommand;
  shouldBeListeningRef.current = enabled && !isSuspendedEffective;

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const clearPendingSettle = useCallback(() => {
    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
    pendingFlushRef.current = null;
  }, []);

  const markReceiving = useCallback((active: boolean, persistMs = 1500) => {
    if (receivingTimeoutRef.current) {
      clearTimeout(receivingTimeoutRef.current);
      receivingTimeoutRef.current = null;
    }
    if (active) {
      setIsReceiving(true);
    } else {
      receivingTimeoutRef.current = setTimeout(() => {
        setIsReceiving(false);
      }, persistMs);
    }
  }, []);

  const stop = useCallback(
    (useAbort: boolean = false) => {
      shouldBeListeningRef.current = false;
      fatalErrorRef.current = false;

      clearPendingSettle();

      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (receivingTimeoutRef.current) {
        clearTimeout(receivingTimeoutRef.current);
        receivingTimeoutRef.current = null;
      }
      if (acousticCooldownRef.current) {
        clearTimeout(acousticCooldownRef.current);
        acousticCooldownRef.current = null;
      }

      if (recognitionRef.current) {
        try {
          if (useAbort) {
            recognitionRef.current.abort();
          } else {
            recognitionRef.current.stop();
          }
        } catch {
          // Ignore errors on stopping an already stopped instance
        }
        recognitionRef.current = null;
      }

      lastHandledIndexRef.current = -1;
      setIsListening(false);
      setIsReceiving(false);
      setIsRefining(false);
      setCommittedTranscript('');
      setInterimTranscript('');
      setPendingCommand(null);
    },
    [clearPendingSettle]
  );

  const start = useCallback(() => {
    if (!isSupported || recognitionRef.current) return;

    fatalErrorRef.current = false;
    setError(null);
    clearPendingSettle();
    lastHandledIndexRef.current = -1;

    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();
      const sessionId = ++recSessionIdRef.current;

      rec.lang = 'it-IT';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 5;

      rec.onstart = () => {
        if (recSessionIdRef.current !== sessionId) return;
        lastHandledIndexRef.current = -1;
        setIsListening(true);
        setError(null);
      };

      // Sound and speech detection events for instant visual responsiveness
      rec.onaudiostart = () => {
        markReceiving(true);
      };

      rec.onsoundstart = () => {
        markReceiving(true);
      };

      rec.onspeechstart = () => {
        markReceiving(true);
      };

      rec.onspeechend = () => {
        markReceiving(false, 1500);
      };

      rec.onsoundend = () => {
        markReceiving(false, 1500);
      };

      rec.onaudioend = () => {
        markReceiving(false, 1500);
      };

      rec.onresult = (event: any) => {
        if (recSessionIdRef.current !== sessionId) return;

        // Discard any sound or speech captured during speaker playback or during acoustic settling
        if (isSuspendedRef.current || Date.now() < ignoreResultsBeforeRef.current) {
          return;
        }

        const results = event?.results;
        if (!results || results.length === 0) return;

        const lastIdx = results.length - 1;
        const startIdx = Math.max(0, lastHandledIndexRef.current + 1);
        if (startIdx > lastIdx) return;

        const tailResult = results[lastIdx];
        if (!tailResult || !tailResult[0]) return;

        markReceiving(true);
        clearPendingSettle();

        const committedParts: string[] = [];
        const interimParts: string[] = [];
        const prefixParts: string[] = [];

        for (let i = startIdx; i <= lastIdx; i++) {
          const seg = results[i];
          const segText = (seg?.[0]?.transcript || '').trim();
          if (!segText) continue;

          if (seg.isFinal) {
            committedParts.push(segText);
          } else {
            interimParts.push(segText);
          }

          if (i < lastIdx) {
            prefixParts.push(segText);
          }
        }

        const committedText = committedParts.join(' ').trim();
        const interimText = interimParts.join(' ').trim();
        const prefixText = prefixParts.join(' ').trim();
        const fullPrimaryText = [committedText, interimText].filter(Boolean).join(' ').trim();
        const allFinal = Boolean(tailResult.isFinal) && interimParts.length === 0;

        // Build N-best alternatives combining any uncommitted prefix with top-K tail hypotheses
        const altCount = typeof tailResult.length === 'number' && tailResult.length > 0 ? tailResult.length : 1;
        const alternatives: VoiceSpeechAlternative[] = [];
        for (let k = 0; k < altCount; k++) {
          const item = tailResult[k];
          if (!item || typeof item.transcript !== 'string') continue;
          const combined = [prefixText, item.transcript.trim()].filter(Boolean).join(' ').trim();
          if (combined) {
            alternatives.push({
              transcript: combined,
              confidence: typeof item.confidence === 'number' ? item.confidence : undefined
            });
          }
        }

        if (alternatives.length === 0 && fullPrimaryText) {
          alternatives.push({ transcript: fullPrimaryText });
        }

        const effectiveSettleMs = settleMsRef.current;

        const commitResolvedCommand = (resolved: VoiceResolutionResult | null, fallbackText: string) => {
          if (recSessionIdRef.current !== sessionId) return;
          if (isSuspendedRef.current) return;

          setIsRefining(false);
          setPendingCommand(null);
          setCommittedTranscript('');
          setInterimTranscript('');
          setLastTranscript(resolved ? resolved.matchedTranscript : fallbackText);
          markReceiving(false, 1800);

          if (resolved && lastHandledIndexRef.current < lastIdx) {
            lastHandledIndexRef.current = lastIdx;
            onCommandRef.current(resolved.command);
          } else if (!resolved && allFinal && lastHandledIndexRef.current < lastIdx) {
            // Advance past finalized unrecognized noise so it does not pollute future commands
            lastHandledIndexRef.current = lastIdx;
          }
        };

        if (!allFinal) {
          setCommittedTranscript(committedText);
          setInterimTranscript(interimText || fullPrimaryText);

          // Legacy zero-settle mode: immediate interim command execution
          if (effectiveSettleMs <= 0) {
            const immediate = resolveVoiceCommand(alternatives, {
              adaptiveAliases: adaptiveAliasesRef.current,
              allowOptionContext: false
            });
            if (immediate && lastHandledIndexRef.current < lastIdx) {
              commitResolvedCommand(immediate, fullPrimaryText);
            }
            return;
          }

          // Progressive refinement mode: preview live intent and wait for speech to settle
          const preview = resolveVoiceCommand(alternatives, {
            optionTexts: optionTextsRef.current,
            adaptiveAliases: adaptiveAliasesRef.current,
            allowOptionContext: true
          });

          // Fast-path emergency audio halt ("stop" / "pausa") with zero stabilization delay
          if (preview && isImmediateVoiceCommand(preview.command) && lastHandledIndexRef.current < lastIdx) {
            commitResolvedCommand(preview, fullPrimaryText);
            return;
          }

          setIsRefining(true);
          setPendingCommand(preview ? preview.command : null);

          const flushSettledInterim = () => {
            clearPendingSettle();
            const settled = resolveVoiceCommand(alternatives, {
              optionTexts: optionTextsRef.current,
              adaptiveAliases: adaptiveAliasesRef.current,
              allowOptionContext: true
            });
            commitResolvedCommand(settled, fullPrimaryText);
          };

          pendingFlushRef.current = flushSettledInterim;
          settleTimeoutRef.current = setTimeout(flushSettledInterim, effectiveSettleMs);
        } else {
          // Finalized utterance from SpeechRecognition
          const resolved = resolveVoiceCommand(alternatives, {
            optionTexts: optionTextsRef.current,
            adaptiveAliases: adaptiveAliasesRef.current,
            allowOptionContext: effectiveSettleMs > 0 || Boolean(optionTextsRef.current?.length)
          });

          // If a prefix-extendable word ("ripeti") finalized mid-breath in continuous mode,
          // hold briefly so a trailing chunk ("la due" / "domanda") can merge into it
          if (
            effectiveSettleMs > 0 &&
            resolved &&
            isPrefixAmbiguousCommand(resolved.command, fullPrimaryText)
          ) {
            setCommittedTranscript(fullPrimaryText);
            setInterimTranscript('');
            setIsRefining(true);
            setPendingCommand(resolved.command);

            const prefixGraceMs = Math.min(240, effectiveSettleMs);
            const flushPrefixCommand = () => {
              clearPendingSettle();
              commitResolvedCommand(resolved, fullPrimaryText);
            };

            pendingFlushRef.current = flushPrefixCommand;
            settleTimeoutRef.current = setTimeout(flushPrefixCommand, prefixGraceMs);
            return;
          }

          commitResolvedCommand(resolved, fullPrimaryText);
        }
      };

      rec.onerror = (e: any) => {
        if (recSessionIdRef.current !== sessionId) return;

        // 'no-speech' is normal during silence periods; not a fatal error
        if (e.error === 'no-speech') {
          return;
        }

        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          fatalErrorRef.current = true;
          shouldBeListeningRef.current = false;
          clearPendingSettle();
          setError('not-allowed');
          setIsListening(false);
          setIsReceiving(false);
          setIsRefining(false);
          setPendingCommand(null);
          return;
        }

        if (e.error === 'audio-capture') {
          fatalErrorRef.current = true;
          shouldBeListeningRef.current = false;
          clearPendingSettle();
          setError('audio-capture');
          setIsListening(false);
          setIsReceiving(false);
          setIsRefining(false);
          setPendingCommand(null);
          return;
        }

        if (e.error === 'network') {
          setError('network');
          return;
        }

        setError(e.error || 'Errore microfono');
      };

      rec.onend = () => {
        if (recSessionIdRef.current !== sessionId) return;

        // Flush any unsettled interim transcript if recognition ended naturally on silence
        if (
          pendingFlushRef.current &&
          shouldBeListeningRef.current &&
          !isSuspendedRef.current &&
          !fatalErrorRef.current
        ) {
          const flush = pendingFlushRef.current;
          clearPendingSettle();
          flush();
        } else {
          clearPendingSettle();
        }

        setIsListening(false);
        setIsRefining(false);
        setPendingCommand(null);
        recognitionRef.current = null;
        lastHandledIndexRef.current = -1;

        // Restart cleanly after silence if still enabled and no fatal error occurred
        if (shouldBeListeningRef.current && !fatalErrorRef.current) {
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (shouldBeListeningRef.current && !recognitionRef.current) {
              start();
            }
          }, 150);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      setError(err?.message || 'Errore microfono');
      setIsListening(false);
      setIsReceiving(false);
      setIsRefining(false);
      setPendingCommand(null);
      recognitionRef.current = null;
    }
  }, [isSupported, markReceiving, clearPendingSettle]);

  useEffect(() => {
    if (acousticCooldownRef.current) {
      clearTimeout(acousticCooldownRef.current);
      acousticCooldownRef.current = null;
    }

    if (enabled && isSupported) {
      if (isSuspendedEffective) {
        // Speech output active: immediately abort capture to prevent acoustic speaker feedback
        shouldBeListeningRef.current = false;
        ignoreResultsBeforeRef.current = Date.now() + 300;
        stop(true);
      } else {
        // Speech output ended or is paused: wait brief acoustic settling cooldown (250ms) before starting capture
        shouldBeListeningRef.current = true;
        ignoreResultsBeforeRef.current = Date.now() + 250;
        acousticCooldownRef.current = setTimeout(() => {
          if (shouldBeListeningRef.current && !recognitionRef.current) {
            start();
          }
        }, 250);
      }
    } else {
      shouldBeListeningRef.current = false;
      stop(false);
    }

    return () => {
      if (acousticCooldownRef.current) {
        clearTimeout(acousticCooldownRef.current);
        acousticCooldownRef.current = null;
      }
      stop(true);
    };
  }, [enabled, isSupported, isSuspendedEffective, start, stop]);

  return {
    isListening,
    isReceiving,
    isRefining,
    isSupported,
    isSuspended: isSuspendedEffective,
    committedTranscript,
    lastTranscript,
    interimTranscript,
    pendingCommand,
    error,
    start,
    stop
  };
}
