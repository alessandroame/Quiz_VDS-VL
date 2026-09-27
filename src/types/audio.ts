// Tipi per il Motore Audio Neurale PWA

export type AudioPart = 'question' | 'opt1' | 'opt2' | 'opt3' | 'explanation';

export interface VoicePlaybackState {
  isPlaying: boolean;
  currentQuestionId: number | null;
  activePart: AudioPart | null;
  isSequencePlaying: boolean;
}
