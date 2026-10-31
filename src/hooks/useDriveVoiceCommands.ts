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
  /** Invoked strictly when a settled/finalized non-empty utterance matches no command. */
  onUnrecognized?: (transcript: string) => void;
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
  /** Question identifier used to wipe stale transcripts/banners immediately on question transition. */
  resetKey?: string | number;
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

interface CachedInterimSnapshot {
  lastIdx: number;
  alternatives: VoiceSpeechAlternative[];
  tailAlternatives: VoiceSpeechAlternative[];
  fullPrimaryText: string;
}

/**
 * Hook for continuous Italian speech recognition and progressive transcript refinement in Drive Mode.
 * Supports multi-alternative N-best scoring, interim stabilization windows, prefix disambiguation,
 * contextual quiz option matching, mobile empty-final / no-match recovery, and clean cursor resets.
 */
export function useDriveVoiceCommands({
  enabled,
  onCommand,
  onUnrecognized,
  isSuspended = false,
  settleMs = 0,
  optionTexts,
  adaptiveAliases,
  resetKey
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
  const onUnrecognizedRef = useRef(onUnrecognized);
  const fatalErrorRef = useRef(false);
  const restartTimeoutRef = useRef<any>(null);
  const receivingTimeoutRef = useRef<any>(null);
  const acousticCooldownRef = useRef<any>(null);
  const settleTimeoutRef = useRef<any>(null);
  const pendingFlushRef = useRef<(() => void) | null>(null);
  const ignoreResultsBeforeRef = useRef<number>(0);

  const lastHandledIndexRef = useRef<number>(-1);
  const lastHandledWasFinalRef = useRef<boolean>(false);
  const lastCommitResolvedRef = useRef<boolean>(false);
  const lastCommitAtRef = useRef<number>(0);
  const lastValidInterimRef = useRef<CachedInterimSnapshot | null>(null);

  onCommandRef.current = onCommand;
  onUnrecognizedRef.current = onUnrecognized;
  shouldBeListeningRef.current = enabled && !isSuspendedEffective;

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const resetUtteranceCursor = useCallback(() => {
    lastHandledIndexRef.current = -1;
    lastHandledWasFinalRef.current = false;
    lastCommitResolvedRef.current = false;
    lastCommitAtRef.current = 0;
    lastValidInterimRef.current = null;
  }, []);

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

  const resolveCandidatesWithTailFallback = useCallback(
    (
      combinedAlts: readonly VoiceSpeechAlternative[],
      tailAlts: readonly VoiceSpeechAlternative[],
      allowOptionContext: boolean
    ): VoiceResolutionResult | null => {
      const ctx = {
        optionTexts: optionTextsRef.current,
        adaptiveAliases: adaptiveAliasesRef.current,
        allowOptionContext
      };
      const primaryMatch = resolveVoiceCommand(combinedAlts, ctx);
      if (primaryMatch) return primaryMatch;
      if (tailAlts.length > 0) {
        return resolveVoiceCommand(tailAlts, ctx);
      }
      return null;
    },
    []
  );

  const stop = useCallback(
    (useAbort: boolean = false) => {
      shouldBeListeningRef.current = false;
      fatalErrorRef.current = false;

      clearPendingSettle();
      resetUtteranceCursor();

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

      setIsListening(false);
      setIsReceiving(false);
      setIsRefining(false);
      setCommittedTranscript('');
      setInterimTranscript('');
      setLastTranscript('');
      setPendingCommand(null);
      setError(null);
    },
    [clearPendingSettle, resetUtteranceCursor]
  );

  const start = useCallback(() => {
    if (!isSupported || recognitionRef.current) return;

    fatalErrorRef.current = false;
    setError(null);
    clearPendingSettle();
    resetUtteranceCursor();

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
        resetUtteranceCursor();
        setCommittedTranscript('');
        setInterimTranscript('');
        setLastTranscript('');
        setPendingCommand(null);
        setIsListening(true);
        setError(null);
      };

      // Trigger visual receiving state strictly on actual speech onset (not silent hardware mic open)
      rec.onspeechstart = () => {
        markReceiving(true);
      };

      rec.onspeechend = () => {
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
        const tailResult = results[lastIdx];
        if (!tailResult) return;

        // Recover when mobile WebView shrinks event.results or reuses slot 0 in-place
        if (lastIdx < lastHandledIndexRef.current) {
          resetUtteranceCursor();
        } else if (lastIdx === lastHandledIndexRef.current) {
          if (tailResult.isFinal) {
            if (lastCommitResolvedRef.current) {
              lastHandledWasFinalRef.current = true;
              return;
            }
            lastHandledIndexRef.current = lastIdx - 1;
          } else if (
            lastHandledWasFinalRef.current ||
            !lastCommitResolvedRef.current ||
            Date.now() - lastCommitAtRef.current > 700
          ) {
            lastHandledIndexRef.current = lastIdx - 1;
            lastHandledWasFinalRef.current = false;
          } else {
            return;
          }
        }

        const startIdx = Math.max(0, lastHandledIndexRef.current + 1);
        if (startIdx > lastIdx) return;

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
        let fullPrimaryText = [committedText, interimText].filter(Boolean).join(' ').trim();
        const allFinal = Boolean(tailResult.isFinal) && interimParts.length === 0;

        // Build N-best alternatives combining any uncommitted prefix with top-K tail hypotheses
        const altCount = typeof tailResult.length === 'number' ? tailResult.length : 0;
        let alternatives: VoiceSpeechAlternative[] = [];
        let tailAlternatives: VoiceSpeechAlternative[] = [];

        for (let k = 0; k < altCount; k++) {
          const item = tailResult[k];
          if (!item || typeof item.transcript !== 'string') continue;
          const rawTail = item.transcript.trim();
          const conf = typeof item.confidence === 'number' ? item.confidence : undefined;
          const combined = [prefixText, rawTail].filter(Boolean).join(' ').trim();
          if (combined) {
            alternatives.push({
              transcript: combined,
              confidence: conf
            });
          }
          if (prefixText && rawTail) {
            tailAlternatives.push({
              transcript: rawTail,
              confidence: conf
            });
          }
        }

        if (alternatives.length === 0 && fullPrimaryText) {
          alternatives.push({ transcript: fullPrimaryText });
        }

        // Mobile Chrome/WebView frequently emits an empty isFinal=true packet after streaming a
        // valid short 1-word interim ("due"): recover the cached interim snapshot instead of dropping it
        if (allFinal && alternatives.length === 0 && !fullPrimaryText && lastValidInterimRef.current) {
          alternatives = lastValidInterimRef.current.alternatives;
          tailAlternatives = lastValidInterimRef.current.tailAlternatives;
          fullPrimaryText = lastValidInterimRef.current.fullPrimaryText;
        }

        const effectiveSettleMs = settleMsRef.current;

        const commitResolvedCommand = (
          resolved: VoiceResolutionResult | null,
          fallbackText: string,
          wasFinalPacket: boolean
        ) => {
          if (recSessionIdRef.current !== sessionId) return;
          if (isSuspendedRef.current) return;

          lastValidInterimRef.current = null;
          setIsRefining(false);
          setPendingCommand(null);
          setCommittedTranscript('');
          setInterimTranscript('');
          markReceiving(false, 1800);

          const trimmedFallback = fallbackText.trim();
          if (resolved || trimmedFallback) {
            setLastTranscript(resolved ? resolved.matchedTranscript : trimmedFallback);
          }

          if (resolved && lastHandledIndexRef.current < lastIdx) {
            lastHandledIndexRef.current = lastIdx;
            lastHandledWasFinalRef.current = wasFinalPacket;
            lastCommitResolvedRef.current = true;
            lastCommitAtRef.current = Date.now();
            onCommandRef.current(resolved.command);
          } else if (!resolved) {
            // Always advance cursor past unrecognized noise (final or settled interim) so it cannot poison next utterance
            if (lastHandledIndexRef.current < lastIdx) {
              lastHandledIndexRef.current = lastIdx;
            }
            lastHandledWasFinalRef.current = wasFinalPacket;
            lastCommitResolvedRef.current = false;
            lastCommitAtRef.current = Date.now();
            if (trimmedFallback) {
              onUnrecognizedRef.current?.(trimmedFallback);
            }
          }
        };

        if (!allFinal) {
          if (alternatives.length > 0 && fullPrimaryText) {
            lastValidInterimRef.current = {
              lastIdx,
              alternatives,
              tailAlternatives,
              fullPrimaryText
            };
          }

          setCommittedTranscript(committedText);
          setInterimTranscript(interimText || fullPrimaryText);

          // Legacy zero-settle mode: immediate interim command execution
          if (effectiveSettleMs <= 0) {
            const immediate = resolveCandidatesWithTailFallback(alternatives, tailAlternatives, false);
            if (immediate && lastHandledIndexRef.current < lastIdx) {
              commitResolvedCommand(immediate, fullPrimaryText, false);
            }
            return;
          }

          // Progressive refinement mode: preview live intent and wait for speech to settle
          const preview = resolveCandidatesWithTailFallback(alternatives, tailAlternatives, true);

          // Fast-path emergency audio halt ("stop" / "pausa") with zero stabilization delay
          if (preview && isImmediateVoiceCommand(preview.command) && lastHandledIndexRef.current < lastIdx) {
            commitResolvedCommand(preview, fullPrimaryText, false);
            return;
          }

          setIsRefining(true);
          setPendingCommand(preview ? preview.command : null);

          const flushSettledInterim = () => {
            clearPendingSettle();
            const settled = resolveCandidatesWithTailFallback(alternatives, tailAlternatives, true);
            commitResolvedCommand(settled, fullPrimaryText, false);
          };

          pendingFlushRef.current = flushSettledInterim;
          settleTimeoutRef.current = setTimeout(flushSettledInterim, effectiveSettleMs);
        } else {
          // Pure empty finalization packet with no prior interim: reset refining state silently
          if (alternatives.length === 0 && !fullPrimaryText) {
            lastHandledIndexRef.current = lastIdx;
            lastHandledWasFinalRef.current = true;
            setIsRefining(false);
            setPendingCommand(null);
            setCommittedTranscript('');
            setInterimTranscript('');
            return;
          }

          // Finalized utterance from SpeechRecognition
          const allowOptCtx = effectiveSettleMs > 0 || Boolean(optionTextsRef.current?.length);
          const resolved = resolveCandidatesWithTailFallback(alternatives, tailAlternatives, allowOptCtx);

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
              commitResolvedCommand(resolved, fullPrimaryText, true);
            };

            pendingFlushRef.current = flushPrefixCommand;
            settleTimeoutRef.current = setTimeout(flushPrefixCommand, prefixGraceMs);
            return;
          }

          commitResolvedCommand(resolved, fullPrimaryText, true);
        }
      };

      rec.onerror = (e: any) => {
        if (recSessionIdRef.current !== sessionId) return;

        const errCode = e?.error || '';

        // Mobile recognizers frequently emit 'no-match', 'no-speech', 'aborted', or 'speech-timeout'
        // right after streaming a valid short interim word ("due" in letters). Flush any pending
        // interim command immediately and never surface these transient statuses as hardware mic errors.
        if (
          errCode === 'no-speech' ||
          errCode === 'no-match' ||
          errCode === 'aborted' ||
          errCode === 'speech-timeout'
        ) {
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
            lastValidInterimRef.current = null;
            setIsRefining(false);
            setPendingCommand(null);
            setCommittedTranscript('');
            setInterimTranscript('');
          }
          return;
        }

        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          fatalErrorRef.current = true;
          shouldBeListeningRef.current = false;
          clearPendingSettle();
          resetUtteranceCursor();
          setError('not-allowed');
          setIsListening(false);
          setIsReceiving(false);
          setIsRefining(false);
          setPendingCommand(null);
          return;
        }

        if (errCode === 'audio-capture') {
          fatalErrorRef.current = true;
          shouldBeListeningRef.current = false;
          clearPendingSettle();
          resetUtteranceCursor();
          setError('audio-capture');
          setIsListening(false);
          setIsReceiving(false);
          setIsRefining(false);
          setPendingCommand(null);
          return;
        }

        if (errCode === 'network') {
          if (
            pendingFlushRef.current &&
            shouldBeListeningRef.current &&
            !isSuspendedRef.current &&
            !fatalErrorRef.current
          ) {
            const flush = pendingFlushRef.current;
            clearPendingSettle();
            flush();
          }
          setError('network');
          return;
        }

        setError(errCode || 'Errore microfono');
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
        resetUtteranceCursor();

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
  }, [isSupported, markReceiving, clearPendingSettle, resetUtteranceCursor, resolveCandidatesWithTailFallback]);

  // Clear stale transcripts and receiving pulse immediately when transitioning to a new question
  useEffect(() => {
    if (resetKey === undefined) return;
    clearPendingSettle();
    lastValidInterimRef.current = null;
    if (receivingTimeoutRef.current) {
      clearTimeout(receivingTimeoutRef.current);
      receivingTimeoutRef.current = null;
    }
    setIsReceiving(false);
    setIsRefining(false);
    setCommittedTranscript('');
    setInterimTranscript('');
    setLastTranscript('');
    setPendingCommand(null);
  }, [resetKey, clearPendingSettle]);

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
