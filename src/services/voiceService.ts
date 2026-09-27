// Servizio Audio Neurale Singleton per VDS-VL Quiz Master
// Gestisce la riproduzione atomica dei frammenti e la sequenza completa

import type { AudioPart, VoicePlaybackState } from '../types/audio';

type StateListener = (state: VoicePlaybackState) => void;

class VoiceService {
  private audio: HTMLAudioElement | null = null;
  private currentQuestionId: number | null = null;
  private activePart: AudioPart | null = null;
  private isSequencePlaying: boolean = false;
  private listeners: Set<StateListener> = new Set();
  private playbackRate: number = 1.0;
  private voiceName: 'giuseppe' | 'elsa' = 'giuseppe';
  private sequenceTimeout: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.preload = 'auto';

      this.audio.addEventListener('ended', () => {
        this.handleAudioEnded();
      });

      this.audio.addEventListener('error', (e) => {
        console.warn('File audio non disponibile o errore riproduzione:', e);
        this.stop();
      });

      // Configurazione MediaSession per ascolto a schermo spento
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('stop', () => this.stop());
        navigator.mediaSession.setActionHandler('pause', () => this.stop());
      }
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  public getState(): VoicePlaybackState {
    return {
      isPlaying: Boolean(this.audio && !this.audio.paused && this.audio.currentTime > 0),
      currentQuestionId: this.currentQuestionId,
      activePart: this.activePart,
      isSequencePlaying: this.isSequencePlaying
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
      // Se c'era audio in corso, fermiamo per evitare mismatch
      if (this.getState().isPlaying) {
        this.stop();
      }
    }
  }

  public getVoice(): 'giuseppe' | 'elsa' {
    return this.voiceName;
  }

  private getAudioUrl(questionId: number, part: AudioPart): string {
    const suffixMap: Record<AudioPart, string> = {
      question: 'q',
      opt1: '1',
      opt2: '2',
      opt3: '3',
      explanation: 'e'
    };
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
    return `${baseUrl}/audio/${this.voiceName}/${questionId}_${suffixMap[part]}.mp3`;
  }

  private updateMediaSession(questionId: number, titlePart: string) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Quiz #${questionId} - ${titlePart}`,
        artist: 'VDS-VL Quiz Master',
        album: 'Preparazione Esame AeCI'
      });
      navigator.mediaSession.playbackState = 'playing';
    }
  }

  /**
   * Riproduce un singolo frammento atomico (es. sola domanda o opzione 2)
   */
  public async playSinglePart(questionId: number, part: AudioPart): Promise<void> {
    this.clearSequence();

    // Se stiamo già riproducendo esattamente questo frammento, fermiamo
    if (this.currentQuestionId === questionId && this.activePart === part && this.getState().isPlaying) {
      this.stop();
      return;
    }

    this.currentQuestionId = questionId;
    this.activePart = part;
    this.isSequencePlaying = false;

    if (!this.audio) return;

    try {
      this.audio.src = this.getAudioUrl(questionId, part);
      this.audio.playbackRate = this.playbackRate;
      await this.audio.play();
      this.updateMediaSession(questionId, part.toUpperCase());
      this.notify();
    } catch (err) {
      console.warn(`Impossibile riprodurre frammento ${part} per quiz #${questionId}:`, err);
      this.stop();
    }
  }

  /**
   * Avvia l'ascolto della sequenza completa: Domanda -> Opzione 1 -> Opzione 2 -> Opzione 3
   */
  public async playFullSequence(questionId: number): Promise<void> {
    // Se la sequenza per questa domanda è già attiva, facciamo toggle (Stop)
    if (this.currentQuestionId === questionId && this.isSequencePlaying && this.getState().isPlaying) {
      this.stop();
      return;
    }

    this.clearSequence();
    this.currentQuestionId = questionId;
    this.isSequencePlaying = true;
    await this.stepSequence('question');
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
    } catch (err) {
      console.warn(`Errore sequenza al passaggio ${part}:`, err);
      this.stop();
    }
  }

  private handleAudioEnded() {
    if (!this.isSequencePlaying || !this.currentQuestionId) {
      this.stop();
      return;
    }

    const nextStep: Record<string, AudioPart | null> = {
      question: 'opt1',
      opt1: 'opt2',
      opt2: 'opt3',
      opt3: null // La sequenza termina dopo la 3a opzione (non rivela la risposta prima della selezione!)
    };

    const next = nextStep[this.activePart || ''];
    if (next) {
      // Breve pausa di 350ms tra le parti per naturalezza
      this.sequenceTimeout = setTimeout(() => {
        this.stepSequence(next);
      }, 350);
    } else {
      this.stop();
    }
  }

  private clearSequence() {
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
      this.sequenceTimeout = null;
    }
  }

  public stop(): void {
    this.clearSequence();
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
    this.currentQuestionId = null;
    this.activePart = null;
    this.isSequencePlaying = false;
    this.notify();
  }
}

export const voiceService = new VoiceService();
