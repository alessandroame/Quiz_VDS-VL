// Tipi per il Motore Audio Neurale PWA

export type AudioPart = 'question' | 'opt1' | 'opt2' | 'opt3' | 'explanation' | 'intro';

export interface VoicePlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentQuestionId: number | null;
  activePart: AudioPart | null;
  isSequencePlaying: boolean;
  isDriveIntroPlaying?: boolean;
}

export type VoiceName = 'giuseppe' | 'elsa';

export interface VoiceManifestData {
  version: string;
  fileCount: number;
  totalBytes: number;
  files: Record<string, string>;
}

export interface AudioManifest {
  schemaVersion: number;
  bundleVersion: string;
  generatedAt: string;
  voices: Record<VoiceName, VoiceManifestData>;
}

export interface InstalledVoiceMetadata {
  voice: VoiceName;
  version: string;
  hashes: Record<string, string>;
  lastCheckedAt: number;
}

export interface VoiceUpdateDetail {
  hasUpdates: boolean;
  currentVersion: string;
  remoteVersion: string;
  staleFiles: string[];
  totalStaleBytes: number;
}

export interface AudioUpdateCheckResult {
  hasUpdates: boolean;
  manifest: AudioManifest | null;
  voiceUpdates: Record<VoiceName, VoiceUpdateDetail>;
  isOffline?: boolean;
  error?: string | null;
}

