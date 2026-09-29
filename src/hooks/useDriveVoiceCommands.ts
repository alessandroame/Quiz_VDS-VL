import { useState, useEffect, useRef, useCallback } from 'react';
import { parseVoiceCommand, type VoiceCommand } from '../utils/voiceCommandParser';

export interface UseDriveVoiceCommandsProps {
  enabled: boolean;
  onCommand: (command: VoiceCommand) => void;
}

export interface UseDriveVoiceCommandsResult {
  isListening: boolean;
  isReceiving: boolean;
  isSupported: boolean;
  lastTranscript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Hook for continuous Italian speech recognition and keyword detection in Drive Mode.
 * Leverages the Web Speech Recognition API with real-time receiving detection and command parsing.
 */
export function useDriveVoiceCommands({
  enabled,
  onCommand
}: UseDriveVoiceCommandsProps): UseDriveVoiceCommandsResult {
  const [isListening, setIsListening] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldBeListeningRef = useRef(enabled);
  const onCommandRef = useRef(onCommand);
  const fatalErrorRef = useRef(false);
  const restartTimeoutRef = useRef<any>(null);
  const receivingTimeoutRef = useRef<any>(null);
  const lastHandledIndexRef = useRef<number>(-1);

  onCommandRef.current = onCommand;
  shouldBeListeningRef.current = enabled;

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

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

  const stop = useCallback(() => {
    shouldBeListeningRef.current = false;
    fatalErrorRef.current = false;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (receivingTimeoutRef.current) {
      clearTimeout(receivingTimeoutRef.current);
      receivingTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors on stopping an already stopped instance
      }
      recognitionRef.current = null;
    }

    setIsListening(false);
    setIsReceiving(false);
    setInterimTranscript('');
  }, []);

  const start = useCallback(() => {
    if (!isSupported || recognitionRef.current) return;

    fatalErrorRef.current = false;
    setError(null);

    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();

      rec.lang = 'it-IT';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
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
        // Keep pulsing briefly so the user sees confirmation
        markReceiving(false, 1500);
      };

      rec.onsoundend = () => {
        markReceiving(false, 1500);
      };

      rec.onaudioend = () => {
        markReceiving(false, 1500);
      };

      rec.onresult = (event: any) => {
        markReceiving(true);

        const lastIdx = event.results.length - 1;
        const result = event.results[lastIdx];
        if (!result || !result[0]) return;

        const text = result[0].transcript || '';

        if (!result.isFinal) {
          setInterimTranscript(text);
          // Try early command match on interim results for snappy feedback
          const cmd = parseVoiceCommand(text);
          if (cmd && lastHandledIndexRef.current < lastIdx) {
            lastHandledIndexRef.current = lastIdx;
            setLastTranscript(text);
            setInterimTranscript('');
            markReceiving(false, 1800);
            onCommandRef.current(cmd);
          }
        } else {
          // Final transcript for this speech chunk
          setLastTranscript(text);
          setInterimTranscript('');
          markReceiving(false, 1800);

          if (lastHandledIndexRef.current < lastIdx) {
            const cmd = parseVoiceCommand(text);
            if (cmd) {
              lastHandledIndexRef.current = lastIdx;
              onCommandRef.current(cmd);
            }
          }
        }
      };

      rec.onerror = (e: any) => {
        // 'no-speech' is normal during silence periods; not a fatal error
        if (e.error === 'no-speech') {
          return;
        }

        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          fatalErrorRef.current = true;
          shouldBeListeningRef.current = false;
          setError('not-allowed');
          setIsListening(false);
          setIsReceiving(false);
          return;
        }

        if (e.error === 'audio-capture') {
          fatalErrorRef.current = true;
          shouldBeListeningRef.current = false;
          setError('audio-capture');
          setIsListening(false);
          setIsReceiving(false);
          return;
        }

        if (e.error === 'network') {
          setError('network');
          return;
        }

        setError(e.error || 'Errore microfono');
      };

      rec.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;

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
      recognitionRef.current = null;
    }
  }, [isSupported, markReceiving]);

  useEffect(() => {
    if (enabled && isSupported) {
      shouldBeListeningRef.current = true;
      start();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [enabled, isSupported, start, stop]);

  return {
    isListening,
    isReceiving,
    isSupported,
    lastTranscript,
    interimTranscript,
    error,
    start,
    stop
  };
}
