import type { Discipline } from './quiz';

export interface QuestionStat {
  questionId: number;
  timesSeen: number;
  timesCorrect: number;
  timesWrong: number;
  lastAnsweredAt?: number;
  lastResult?: 'correct' | 'wrong';
  consecutiveCorrect: number; // Incrementa con risposte corrette, reset a 0 con errore. >2 esce da Quaderno Errori
  isBookmarked: boolean;
  userNote?: string;
}

export interface ExamQuestionSnapshot {
  questionId: number;
  userAnswer?: 1 | 2 | 3;
  correctAnswer: 1 | 2 | 3;
  isCorrect: boolean;
  wasFlagged: boolean;
}

export type ExamModeType = 'official' | 'tutor' | 'marathon';
export type TutorFormat = 'flash' | 'standard' | 'endless';
export type ExamOutcome = 'passed' | 'oral_check' | 'failed';

export interface SubjectBreakdownEntry {
  total: number;
  correct: number;
  wrong: number;
  pointWeight?: number;
  pointsEarned?: number;
  maxPoints?: number;
  pointsLost?: number;
}

export interface ExamSession {
  id?: number;
  date: number; // timestamp
  durationSeconds: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  isPassed: boolean; // Direct pass (>= 86/100 on weighted AeCI sheets, or legacy error threshold)
  examOutcome?: ExamOutcome;
  scorePoints?: number;
  maxPoints?: number;
  rawPoints?: number;
  rawMaxPoints?: number;
  isMarathon: boolean;
  examMode?: ExamModeType;
  tutorFormat?: TutorFormat;
  subjectBreakdown: Record<number, SubjectBreakdownEntry>;
  snapshots: ExamQuestionSnapshot[];
}

export type ThemeMode = 'dark' | 'light' | 'system';

export type FontSizePreference = 'compact' | 'normal' | 'large';

export interface AdaptiveVoiceAliasEntry {
  phrase: string;
  command: string;
  occurrences: number;
  updatedAt: number;
}

export interface AppSettings {
  theme: ThemeMode;
  fontSizePreference?: FontSizePreference;
  examTimerMinutes: number; // 30 official written default (45 extended; Hands-Free audio uses 45)
  immediateFeedbackInTopics: boolean;
  autoAdvanceOnCorrect?: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  googleClientId?: string;
  autoSyncDrive: boolean;
  lastDriveSyncAt?: number;
  ttsEnabled: boolean;
  ttsVoice: 'giuseppe' | 'elsa';
  ttsAutoExplainOnMistake: boolean;
  ttsAutoPlayQuestion: boolean;
  ttsPlaybackRate: number;
  driveModeAutopilot: boolean;
  /** @deprecated Removed in favor of untimed learning; preserved for backward compatibility */
  driveModeAutoAdvanceSeconds?: number;
  driveModeVoiceCommands: boolean;
  driveModeAudioOutput?: 'speaker' | 'headphones';
  voiceAdaptiveAliases?: Record<string, AdaptiveVoiceAliasEntry>;
  driveModeIntroPlayed?: boolean;
  audioOfflinePromptDismissed?: boolean;
  driveModeTutor?: boolean;
  disciplinePreference?: Discipline;
  disciplineOnboardingDone?: boolean;
  audioAutoUpdateOnline?: boolean;
  lastAudioCheckAt?: number;
  telemetryEnabled?: boolean;
}

export interface InProgressSession {
  type: 'exam' | 'topic' | 'mistakes' | 'archive';
  subjectId?: number;
  subjectName?: string;
  mode?: 'all' | 'unseen' | 'wrong';
  questionIds: number[];
  currentIndex: number;
  answers: Record<number, 1 | 2 | 3>;
  flags?: Record<number, boolean>;
  secondsRemaining?: number;
  elapsedSeconds?: number;
  startTime?: number;
  isMarathon?: boolean;
  examMode?: ExamModeType;
  tutorFormat?: TutorFormat;
  isPaused?: boolean;
  pausedAt?: number;
  updatedAt: number;
}

export interface BackupDataPayload {
  version: number;
  exportedAt: number;
  stats: QuestionStat[];
  sessions: ExamSession[];
  settings: Array<{ key: string; value: any }>;
  activeSession?: InProgressSession | null;
}
