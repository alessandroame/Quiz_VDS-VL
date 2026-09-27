import { useState, useEffect, useRef, useCallback } from 'react';
import { parseVoiceCommand, type VoiceCommand } from '../utils/voiceCommandParser';

export interface UseDriveVoiceCommandsProps {
  enabled: boolean;
  onCommand: (command: VoiceCommand) => void;
}

export interface UseDriveVoiceCommandsResult {
  isListening: boolean;
  isSupported: boolean;
  lastTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Hook per il riconoscimento vocale continuo delle parole chiave in Modalità Alla Guida.
 * Utilizza la Web Speech Recognition API con lingua 'it-IT'.
 */
export function useDriveVoiceCommands({
  enabled,
  onCommand
}: UseDriveVoiceCommandsProps): UseDriveVoiceCommandsResult {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldBeListeningRef = useRef(enabled);
  const onCommandRef = useRef(onCommand);

  onCommandRef.current = onCommand;
  shouldBeListeningRef.current = enabled;

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const start = useCallback(() => {
    if (!isSupported || recognitionRef.current) return;
    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();

      rec.lang = 'it-IT';
      rec.continuous = true;
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onresult = (event: any) => {
        const lastIdx = event.results.length - 1;
        const result = event.results[lastIdx];
        if (result && result[0]) {
          const text = result[0].transcript;
          setLastTranscript(text);
          const cmd = parseVoiceCommand(text);
          if (cmd) {
            onCommandRef.current(cmd);
          }
        }
      };

      rec.onerror = (e: any) => {
        // 'no-speech' è normale nei periodi di silenzio, non è un errore fatale
        if (e.error !== 'no-speech') {
          setError(e.error);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        // Se il listener deve rimanere attivo, riavvia la sessione
        if (shouldBeListeningRef.current) {
          try {
            rec.start();
          } catch {
            // Ignora se già in avvio
          }
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      setError(err?.message || 'Errore microfono');
      setIsListening(false);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    shouldBeListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignora
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

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
    isSupported,
    lastTranscript,
    error,
    start,
    stop
  };
}
