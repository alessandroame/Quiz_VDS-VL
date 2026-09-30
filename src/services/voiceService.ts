// Singleton neural voice service for VDS-VL Quiz Master
// Manages atomic playback of audio snippets, full question-option sequences, play/pause and restarts

import type { AudioPart, VoicePlaybackState } from '../types/audio';
import { audioDownloadManager } from './audioDownloadManager';

type StateListener = (state: VoicePlaybackState) => void;
export type VoiceFallbackListener = (info: { from: 'giuseppe' | 'elsa'; to: 'giuseppe' | 'elsa' }) => void;

export class VoiceService {
  private audio: HTMLAudioElement | null = null;
  private currentQuestionId: number | null = null;
  private activePart: AudioPart | null = null;
  private isSequencePlaying: boolean = false;
  private isPaused: boolean = false;
  private pendingSequencePart: AudioPart | null = null;
  private listeners: Set<StateListener> = new Set();
  private fallbackListeners: Set<VoiceFallbackListener> = new Set();
  private playbackRate: number = 1.0;
  private voiceName: 'giuseppe' | 'elsa' = 'giuseppe';
  private effectiveVoice: 'giuseppe' | 'elsa' | null = null;
  private isDriveIntroPlaying: boolean = false;
  private sequenceTimeout: any = null;
  private isNotificationPending: boolean = false;

  constructor() {
    if (typeof Audio !== 'undefined') {
      this.audio = new Audio();
      this.audio.preload = 'auto';

      this.audio.addEventListener('ended', () => {
        this.handleAudioEnded();
      });

      this.audio.addEventListener('error', (e) => {
        console.warn('Audio snippet unavailable or playback error:', e);
        if (this.isDriveIntroPlaying) {
          this.playSpeechSynthesisFallback();
          return;
        }
        // Fallback retry if the other voice is available offline
        const currentActive = this.effectiveVoice || this.voiceName;
        const otherVoice = currentActive === 'giuseppe' ? 'elsa' : 'giuseppe';
        if (
          audioDownloadManager.isVoiceReady(otherVoice) &&
          this.currentQuestionId &&
          this.activePart &&
          this.effectiveVoice !== otherVoice
        ) {
          this.effectiveVoice = otherVoice;
          this.notifyFallback(currentActive, otherVoice);
          if (this.audio) {
            this.audio.src = this.getAudioUrl(this.currentQuestionId, this.activePart, otherVoice);
            this.audio.play().catch(() => this.stop());
            return;
          }
        }
        this.stop();
      });

      // MediaSession API integration for background & lockscreen playback
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('stop', () => this.stop());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('play', () => this.resume());
      }
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public onFallback(listener: VoiceFallbackListener): () => void {
    this.fallbackListeners.add(listener);
    return () => this.fallbackListeners.delete(listener);
  }

  private notifyFallback(from: 'giuseppe' | 'elsa', to: 'giuseppe' | 'elsa') {
    this.fallbackListeners.forEach(fn => fn({ from, to }));
  }

  public resolveEffectiveVoice(targetVoice: 'giuseppe' | 'elsa'): 'giuseppe' | 'elsa' {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      return targetVoice;
    }

    if (audioDownloadManager.isVoiceReady(targetVoice)) {
      return targetVoice;
    }

    const fallback = audioDownloadManager.getAvailableOfflineVoice();
    if (fallback && fallback !== targetVoice) {
      this.notifyFallback(targetVoice, fallback);
      return fallback;
    }

    return targetVoice;
  }

  private notify() {
    if (this.isNotificationPending) return;
    this.isNotificationPending = true;

    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        this.isNotificationPending = false;
        const state = this.getState();
        this.listeners.forEach(fn => {
          try {
            fn(state);
          } catch (err) {
            console.error('Error notifying voice listener:', err);
          }
        });
      });
    } else {
      this.isNotificationPending = false;
      const state = this.getState();
      this.listeners.forEach(fn => {
        try {
          fn(state);
        } catch (err) {
          console.error('Error notifying voice listener:', err);
        }
      });
    }
  }

  public getState(): VoicePlaybackState {
    const isPlaying = Boolean(
      this.audio &&
      !this.audio.paused &&
      !this.isPaused &&
      (this.currentQuestionId !== null || this.isDriveIntroPlaying)
    );

    return {
      isPlaying,
      isPaused: this.isPaused,
      currentQuestionId: this.currentQuestionId,
      activePart: this.activePart,
      isSequencePlaying: this.isSequencePlaying,
      isDriveIntroPlaying: this.isDriveIntroPlaying
    };
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
  }

  public setVoice(voice: 'giuseppe' | 'elsa') {
    if (this.voiceName !== voice) {
      this.voiceName = voice;
      this.effectiveVoice = null;
      // Stop ongoing playback on voice change to prevent voice mismatch
      if (this.getState().isPlaying || this.isPaused) {
        this.stop();
      }
    }
  }

  public getVoice(): 'giuseppe' | 'elsa' {
    return this.voiceName;
  }

  public getEffectiveVoice(): 'giuseppe' | 'elsa' {
    return this.effectiveVoice || this.voiceName;
  }

  public getAudioUrl(questionId: number, part: AudioPart, voiceOverride?: 'giuseppe' | 'elsa'): string {
    const suffixMap: Record<AudioPart, string> = {
      question: 'q',
      opt1: '1',
      opt2: '2',
      opt3: '3',
      explanation: 'e',
      intro: 'drive_intro'
    };
    const voice = voiceOverride || this.effectiveVoice || this.voiceName;
    const baseUrl = (import.meta.env?.BASE_URL || '/').replace(/\/+$/, '');
    return `${baseUrl}/audio/${voice}/${questionId}_${suffixMap[part]}.mp3`;
  }

  public getDriveIntroAudioUrl(voiceOverride?: 'giuseppe' | 'elsa'): string {
    const voice = voiceOverride || this.effectiveVoice || this.voiceName;
    const baseUrl = (import.meta.env?.BASE_URL || '/').replace(/\/+$/, '');
    return `${baseUrl}/audio/${voice}/drive_intro.mp3`;
  }

  private updateMediaSession(questionId: number, titlePart: string) {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Quiz #${questionId} - ${titlePart}`,
        artist: 'VDS-VL Quiz Master',
        album: 'Preparazione Esame AeCI'
      });
      navigator.mediaSession.playbackState = 'playing';
    }
  }

  /**
   * Plays a single atomic fragment (e.g. question text only, or option 2)
   */
  public async playSinglePart(questionId: number, part: AudioPart): Promise<void> {
    // If currently playing this exact fragment -> pause
    if (this.currentQuestionId === questionId && this.activePart === part && this.getState().isPlaying) {
      this.pause();
      return;
    }

    // If currently paused on this exact fragment -> resume
    if (this.currentQuestionId === questionId && this.activePart === part && this.isPaused) {
      await this.resume();
      return;
    }

    this.clearSequence();
    this.currentQuestionId = questionId;
    this.activePart = part;
    this.effectiveVoice = this.resolveEffectiveVoice(this.voiceName);
    this.isSequencePlaying = false;
    this.isPaused = false;

    if (!this.audio) return;

    try {
      this.audio.src = this.getAudioUrl(questionId, part);
      this.audio.playbackRate = this.playbackRate;
      await this.audio.play();
      this.updateMediaSession(questionId, part.toUpperCase());
      this.notify();
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') return;
      console.warn(`Could not play fragment ${part} for question #${questionId}:`, err);
      this.stop();
    }
  }

  /**
   * Restarts a single fragment from the beginning (currentTime = 0).
   * If this part was part of an ongoing sequence, it restarts this part
   * and preserves sequence continuity.
   */
  public async restartSinglePart(questionId: number, part: AudioPart): Promise<void> {
    const wasSequence = this.isSequencePlaying && this.currentQuestionId === questionId;
    this.clearSequence();
    this.isPaused = false;
    this.pendingSequencePart = null;

    if (this.currentQuestionId === questionId && this.activePart === part && this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isSequencePlaying = wasSequence;
      try {
        await this.audio.play();
        this.updateMediaSession(questionId, part.toUpperCase());
        this.notify();
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') return;
        console.warn(`Error restarting fragment ${part} for question #${questionId}:`, err);
        this.stop();
      }
      return;
    }

    this.currentQuestionId = questionId;
    this.activePart = part;
    this.effectiveVoice = this.resolveEffectiveVoice(this.voiceName);
    this.isSequencePlaying = wasSequence;

    if (!this.audio) return;
    try {
      this.audio.src = this.getAudioUrl(questionId, part);
      this.audio.currentTime = 0;
      this.audio.playbackRate = this.playbackRate;
      await this.audio.play();
      this.updateMediaSession(questionId, part.toUpperCase());
      this.notify();
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') return;
      console.warn(`Could not restart fragment ${part} for question #${questionId}:`, err);
      this.stop();
    }
  }

  /**
   * Toggles play/pause for the full sequence of a given question.
   * - If playing for this question: pauses without losing current progress.
   * - If paused for this question: resumes from the exact position.
   * - If idle or for a different question: starts the full sequence from the beginning.
   */
  public async togglePlayPause(questionId: number): Promise<void> {
    if (this.currentQuestionId === questionId && this.getState().isPlaying) {
      this.pause();
      return;
    }

    if (this.currentQuestionId === questionId && this.isPaused) {
      await this.resume();
      return;
    }

    await this.playFullSequence(questionId);
  }

  /**
   * Pauses playback at the current exact position without resetting.
   */
  public pause(): void {
    if (!this.currentQuestionId) return;

    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
      this.sequenceTimeout = null;
    }

    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }

    this.isPaused = true;
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    this.notify();
  }

  /**
   * Resumes playback from the paused position or continues the sequence.
   */
  public async resume(): Promise<void> {
    if (!this.isPaused || !this.currentQuestionId) return;

    this.isPaused = false;

    // If paused during the 350ms pause between sequence snippets, proceed to pending part
    if (this.pendingSequencePart && this.isSequencePlaying) {
      const next = this.pendingSequencePart;
      this.pendingSequencePart = null;
      await this.stepSequence(next);
      return;
    }

    if (this.audio) {
      try {
        await this.audio.play();
        if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
        this.notify();
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') return;
        console.warn('Error during voice resume:', err);
        this.stop();
      }
    }
  }

  /**
   * Starts or restarts the full question sequence from the beginning:
   * Question -> Option 1 -> Option 2 -> Option 3
   */
  public async playFullSequence(questionId: number): Promise<void> {
    this.clearSequence();
    this.isPaused = false;
    this.pendingSequencePart = null;
    this.currentQuestionId = questionId;
    this.effectiveVoice = this.resolveEffectiveVoice(this.voiceName);
    this.isSequencePlaying = true;
    await this.stepSequence('question');
  }

  /**
   * Restarts the full sequence from the very beginning while playing or paused.
   */
  public async restartFullSequence(questionId: number): Promise<void> {
    this.clearSequence();
    this.isPaused = false;
    this.pendingSequencePart = null;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.currentQuestionId = questionId;
    this.effectiveVoice = this.resolveEffectiveVoice(this.voiceName);
    this.isSequencePlaying = true;
    await this.stepSequence('question');
  }

  /**
   * Repeats the currently active fragment (question, or specific option).
   * If a sequence was playing, it restarts the active fragment and continues the rest
   * of the sequence upon completion.
   * If idle, stopped, or the sequence already finished (activePart is null),
   * it restarts the full sequence starting from the question.
   */
  public async restartCurrentOrSequence(questionId: number): Promise<void> {
    if (
      this.currentQuestionId === questionId &&
      this.activePart &&
      this.activePart !== 'intro'
    ) {
      await this.restartSinglePart(questionId, this.activePart);
    } else {
      await this.playFullSequence(questionId);
    }
  }

  private async stepSequence(part: AudioPart): Promise<void> {
    if (!this.isSequencePlaying || !this.audio || !this.currentQuestionId) return;

    this.activePart = part;
    try {
      this.audio.src = this.getAudioUrl(this.currentQuestionId, part);
      this.audio.playbackRate = this.playbackRate;
      await this.audio.play();
      this.updateMediaSession(this.currentQuestionId, part.toUpperCase());
      this.notify();
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') return;
      console.warn(`Error during voice sequence step ${part}:`, err);
      this.stop();
    }
  }

  private handleAudioEnded() {
    if (this.isDriveIntroPlaying) {
      this.stop();
      return;
    }

    if (!this.isSequencePlaying || !this.currentQuestionId) {
      this.stop();
      return;
    }

    const nextStep: Record<string, AudioPart | null> = {
      question: 'opt1',
      opt1: 'opt2',
      opt2: 'opt3',
      opt3: null // Sequence completes after option 3 without revealing the answer
    };

    const next = nextStep[this.activePart || ''];
    if (next) {
      this.pendingSequencePart = next;
      // 350ms natural pause between question and options
      this.sequenceTimeout = setTimeout(() => {
        this.sequenceTimeout = null;
        this.pendingSequencePart = null;
        this.stepSequence(next);
      }, 350);
    } else {
      this.stop();
    }
  }

  public async playDriveIntro(): Promise<void> {
    this.stop();
    this.isDriveIntroPlaying = true;
    this.activePart = 'intro';
    this.currentQuestionId = null;
    this.isPaused = false;
    this.effectiveVoice = this.resolveEffectiveVoice(this.voiceName);

    if (!this.audio) return;

    try {
      this.audio.src = this.getDriveIntroAudioUrl();
      this.audio.playbackRate = this.playbackRate;
      await this.audio.play();
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && typeof MediaMetadata !== 'undefined') {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Guida Vocale - Modalità Alla Guida',
          artist: 'VDS-VL Quiz Master',
          album: 'Guida Vocale'
        });
        navigator.mediaSession.playbackState = 'playing';
      }
      this.notify();
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') return;
      console.warn('Could not play drive intro audio file, checking speechSynthesis fallback:', err);
      this.playSpeechSynthesisFallback();
    }
  }

  public stopDriveIntro(): void {
    if (this.isDriveIntroPlaying) {
      this.stop();
    }
  }

  /**
   * Resolves the best available Italian voice from window.speechSynthesis.
   * Matches the active voice persona (Elsa vs Giuseppe) while strictly guaranteeing
   * an it-IT locale to prevent English phonetics on systems with non-Italian default voices.
   */
  public getItalianSpeechVoice(preferredVoice?: 'giuseppe' | 'elsa'): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return null;
    }
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      return null;
    }

    const target = preferredVoice || this.effectiveVoice || this.voiceName;

    // Filter all Italian voices (it-IT, it_IT, it)
    const itVoices = voices.filter(v => {
      const code = (v.lang || '').toLowerCase().replace('_', '-');
      return code.startsWith('it');
    });

    if (itVoices.length === 0) {
      return null;
    }

    // 1. If preferred voice is Elsa, find an Italian voice named Elsa (e.g. "Microsoft Elsa Desktop") or female
    if (target === 'elsa') {
      const elsaVoice = itVoices.find(v => v.name.toLowerCase().includes('elsa'));
      if (elsaVoice) return elsaVoice;

      const femaleVoice = itVoices.find(v =>
        /female|donna|alice|chiara|federica|elena|lucia/i.test(v.name)
      );
      if (femaleVoice) return femaleVoice;
    } else {
      // If preferred voice is Giuseppe, find male Italian voice (e.g. Cosimo, Diego, Giuseppe)
      const maleVoice = itVoices.find(v =>
        /male|uomo|cosimo|diego|giuseppe|giorgio/i.test(v.name)
      );
      if (maleVoice) return maleVoice;
    }

    // 2. Exact match for it-IT locale
    const exactIt = itVoices.find(v => {
      const code = (v.lang || '').toLowerCase().replace('_', '-');
      return code === 'it-it';
    });
    if (exactIt) return exactIt;

    return itVoices[0];
  }

  private playSpeechSynthesisFallback(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const text =
          "Benvenuto nella modalità alla guida. Lo schermo rimarrà sempre acceso sul tuo cruscotto. Le domande e le opzioni verranno lette automaticamente. Puoi rispondere toccando i tre grandi pulsanti sullo schermo, oppure usando i comandi vocali pronunciando Uno, Due o Tre. Puoi dire Ripeti per riascoltare, oppure Aiuto per l'elenco dei comandi. Tocca lo schermo per iniziare.";
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'it-IT';

        // Explicitly attach Italian voice matching active persona (Elsa or Giuseppe)
        const itVoice = this.getItalianSpeechVoice(this.effectiveVoice || this.voiceName);
        if (itVoice) {
          utterance.voice = itVoice;
        }

        utterance.rate = this.playbackRate;
        utterance.onend = () => {
          this.stop();
        };
        utterance.onerror = () => {
          this.stop();
        };
        window.speechSynthesis.speak(utterance);
        this.notify();
      } catch (err) {
        console.warn('Speech synthesis error:', err);
        this.stop();
      }
    } else {
      this.stop();
    }
  }

  private clearSequence() {
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
      this.sequenceTimeout = null;
    }
    this.pendingSequencePart = null;
  }

  public stop(): void {
    const isAlreadyIdle =
      this.currentQuestionId === null &&
      !this.isDriveIntroPlaying &&
      !this.isSequencePlaying &&
      !this.isPaused &&
      (!this.audio || this.audio.paused);

    if (isAlreadyIdle) {
      return;
    }

    this.clearSequence();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore synthesis cancel error
      }
    }
    this.isDriveIntroPlaying = false;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
    this.currentQuestionId = null;
    this.activePart = null;
    this.effectiveVoice = null;
    this.isSequencePlaying = false;
    this.isPaused = false;
    this.notify();
  }
}

export const voiceService = new VoiceService();
