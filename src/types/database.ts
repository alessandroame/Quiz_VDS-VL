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

export interface ExamSession {
  id?: number;
  date: number; // timestamp
  durationSeconds: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  isPassed: boolean; // wrongAnswers <= 3 (o <= 6 per maratona 60)
  isMarathon: boolean;
  subjectBreakdown: Record<number, { total: number; correct: number; wrong: number }>;
  snapshots: ExamQuestionSnapshot[];
}

export type ThemeMode = 'dark' | 'light' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  examTimerMinutes: number; // 45 standard
  immediateFeedbackInTopics: boolean;
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
  driveModeAutoAdvanceSeconds: number;
  driveModeVoiceCommands: boolean;
  driveModeIntroPlayed?: boolean;
  audioOfflinePromptDismissed?: boolean;
}

export interface InProgressSession {
  type: 'exam' | 'topic' | 'mistakes';
  subjectId?: number;
  subjectName?: string;
  mode?: 'all' | 'unseen' | 'wrong';
  questionIds: number[];
  currentIndex: number;
  answers: Record<number, 1 | 2 | 3>;
  flags?: Record<number, boolean>;
  secondsRemaining?: number;
  startTime?: number;
  isMarathon?: boolean;
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
