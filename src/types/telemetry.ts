import type { ExamModeType, FontSizePreference, ThemeMode } from './database';

export type StudyModeType = 'official_exam' | 'tutor_exam' | 'topics' | 'mistakes' | 'audio_mode' | 'archive';

export interface QuestionAnsweredPayload {
  question_id: number;
  subject_id: number;
  subject_name: string;
  is_correct: boolean;
  selected_option: 1 | 2 | 3;
  correct_option: 1 | 2 | 3;
  mode: StudyModeType;
  time_taken_seconds?: number;
}

export interface ExamCompletedPayload {
  mode: ExamModeType;
  is_passed: boolean;
  score: number;
  errors_count: number;
  duration_seconds: number;
  worst_subject_id?: number;
  worst_subject_name?: string;
  is_marathon?: boolean;
}

export interface StudyModeEnteredPayload {
  mode: 'topics' | 'mistakes' | 'audio_mode' | 'archive';
  subject_id?: number;
  subject_name?: string;
}

export interface AudioDownloadResultPayload {
  voice: 'giuseppe' | 'elsa';
  status: 'success' | 'failed' | 'aborted';
  duration_seconds: number;
  error_code?: string;
}

export interface AppSessionStartedPayload {
  version: string;
  build_number: string;
  is_standalone_pwa: boolean;
  theme: ThemeMode;
  font_scale?: FontSizePreference;
}

export interface PwaInstallPromptOutcomePayload {
  outcome: 'accepted' | 'dismissed';
}

export interface TelemetryConfig {
  apiKey?: string;
  apiHost?: string;
  enabled?: boolean;
}
