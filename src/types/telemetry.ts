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

export interface ExamStartedPayload {
  mode: ExamModeType;
  is_marathon?: boolean;
  total_questions: number;
  readiness_score?: number;
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
  readiness_score?: number;
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
  readiness_score?: number;
}

export interface PwaInstallPromptOutcomePayload {
  outcome: 'accepted' | 'dismissed';
}

export interface AppTimeSpentPayload {
  duration_seconds: number;
  active_seconds: number;
  total_session_seconds: number;
  screen: string;
  subject_id?: number;
  readiness_score?: number;
  is_standalone_pwa: boolean;
}

export interface AppSessionEndedPayload {
  total_active_seconds: number;
  total_wall_seconds: number;
  screens_visited: string[];
  primary_screen: string;
  readiness_score?: number;
  is_standalone_pwa: boolean;
}

export interface ScreenViewedPayload {
  screen: string;
  previous_screen?: string;
  duration_seconds?: number;
  readiness_score?: number;
}

export interface ReadinessScoreUpdatedPayload {
  readiness_score: number;
  previous_readiness_score: number;
  delta: number;
  coverage_pct: number;
  accuracy_pct: number;
  exam_pass_rate_pct: number;
  total_seen: number;
  total_catalog: number;
  total_mistakes?: number;
  trigger: 'exam_completed' | 'question_answered' | 'session_heartbeat' | 'session_start';
}

export interface TelemetryConfig {
  apiKey?: string;
  apiHost?: string;
  enabled?: boolean;
}
