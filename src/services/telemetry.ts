import type {
  AppSessionStartedPayload,
  AudioDownloadResultPayload,
  ExamCompletedPayload,
  QuestionAnsweredPayload,
  StudyModeEnteredPayload,
  PwaInstallPromptOutcomePayload,
  TelemetryConfig,
} from '../types/telemetry';

type PostHogInstance = typeof import('posthog-js').default;

const SENSITIVE_KEY_PATTERNS = [/note/i, /token/i, /secret/i, /email/i, /password/i, /transcript/i];

class TelemetryService {
  private client: PostHogInstance | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private isOptedOutState = false;
  private apiKey: string = '';
  private apiHost: string = 'https://eu.i.posthog.com';

  constructor() {
    this.apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_POSTHOG_KEY) || '';
    this.apiHost =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_POSTHOG_HOST) || 'https://eu.i.posthog.com';
  }

  /**
   * Initializes PostHog client asynchronously using dynamic import.
   * If apiKey is not provided or empty, the service runs in silent no-op mode.
   */
  async init(customConfig?: TelemetryConfig): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;

    if (customConfig?.apiKey !== undefined) this.apiKey = customConfig.apiKey;
    if (customConfig?.apiHost !== undefined) this.apiHost = customConfig.apiHost;
    if (customConfig?.enabled !== undefined) this.isOptedOutState = !customConfig.enabled;

    if (!this.apiKey) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.info('[Telemetry] VITE_POSTHOG_KEY is not defined. Running in silent no-op mode.');
      }
      return;
    }

    if (this.isOptedOutState) {
      return;
    }

    this.isInitializing = true;

    try {
      const posthogModule = await import('posthog-js');
      const posthog = posthogModule.default;

      posthog.init(this.apiKey, {
        api_host: this.apiHost,
        autocapture: false,
        capture_pageview: false,
        disable_session_recording: true,
        request_batching: true,
        respect_dnt: true,
        persistence: 'localStorage+cookie',
        advanced_disable_decide: true,
        sanitize_properties: (properties) => {
          return this.sanitizePayload(properties);
        },
      });

      this.client = posthog;
      this.isInitialized = true;
    } catch (error) {
      // Graceful silent degradation on network block or ad-blocker
      console.warn('[Telemetry] Failed to initialize PostHog (possibly offline or blocked):', error);
      this.client = null;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Toggles opt-out status. When true, prevents any telemetry transmission.
   */
  setOptOut(optOut: boolean): void {
    this.isOptedOutState = optOut;
    if (this.client) {
      try {
        if (optOut) {
          this.client.opt_out_capturing();
        } else {
          this.client.opt_in_capturing();
        }
      } catch (err) {
        console.warn('[Telemetry] Error toggling opt-out:', err);
      }
    }
  }

  isOptedOut(): boolean {
    return this.isOptedOutState;
  }

  /**
   * Tracks an answered question for macro accuracy and trick analysis.
   */
  trackQuestionAnswered(payload: QuestionAnsweredPayload): void {
    this.capture('question_answered', {
      question_id: payload.question_id,
      subject_id: payload.subject_id,
      subject_name: payload.subject_name,
      is_correct: payload.is_correct,
      selected_option: payload.selected_option,
      correct_option: payload.correct_option,
      mode: payload.mode,
      time_taken_seconds: payload.time_taken_seconds,
    });
  }

  /**
   * Tracks completed exam simulations.
   */
  trackExamCompleted(payload: ExamCompletedPayload): void {
    this.capture('exam_completed', {
      mode: payload.mode,
      is_passed: payload.is_passed,
      score: payload.score,
      errors_count: payload.errors_count,
      duration_seconds: payload.duration_seconds,
      worst_subject_id: payload.worst_subject_id,
      worst_subject_name: payload.worst_subject_name,
      is_marathon: payload.is_marathon ?? false,
    });
  }

  /**
   * Tracks entry into study modes.
   */
  trackStudyModeEntered(payload: StudyModeEnteredPayload): void {
    this.capture('study_mode_entered', {
      mode: payload.mode,
      subject_id: payload.subject_id,
      subject_name: payload.subject_name,
    });
  }

  /**
   * Tracks audio download status for offline voices.
   */
  trackAudioDownloadResult(payload: AudioDownloadResultPayload): void {
    this.capture('audio_download_result', {
      voice: payload.voice,
      status: payload.status,
      duration_seconds: payload.duration_seconds,
      error_code: payload.error_code,
    });
  }

  /**
   * Tracks initial app launch session metrics.
   */
  trackAppSessionStarted(payload: AppSessionStartedPayload): void {
    this.capture('app_session_started', {
      app_version: payload.version,
      build_number: payload.build_number,
      is_standalone_pwa: payload.is_standalone_pwa,
      theme: payload.theme,
      font_scale: payload.font_scale,
    });
  }

  /**
   * Tracks user interaction with PWA install banner.
   */
  trackPwaInstallPrompt(payload: PwaInstallPromptOutcomePayload): void {
    this.capture('pwa_install_prompt_outcome', {
      outcome: payload.outcome,
    });
  }

  /**
   * Generic capture method with safety guards and sanitization.
   */
  private capture(eventName: string, properties: Record<string, any>): void {
    if (this.isOptedOutState) return;
    if (!this.client || !this.isInitialized) return;

    try {
      const sanitized = this.sanitizePayload(properties);
      this.client.capture(eventName, sanitized);
    } catch (err) {
      // Never crash the application on analytics failure
      console.warn(`[Telemetry] Failed to capture ${eventName}:`, err);
    }
  }

  /**
   * Sanitizes payload properties by stripping any potential personal or sensitive keys.
   */
  private sanitizePayload(props: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(props)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (!isSensitive && value !== undefined) {
        clean[key] = value;
      }
    }
    return clean;
  }

  /**
   * Resets internal client state (primarily for testing purposes).
   */
  reset(): void {
    this.client = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.isOptedOutState = false;
  }
}

export const telemetry = new TelemetryService();
