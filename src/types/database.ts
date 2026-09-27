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
  ttsAutoExplainOnMistake: boolean;
  ttsAutoPlayQuestion: boolean;
  ttsPlaybackRate: number;
  driveModeAutopilot: boolean;
  driveModeAutoAdvanceSeconds: number;
  driveModeVoiceCommands: boolean;
}
