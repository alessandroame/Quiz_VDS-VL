import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { telemetry } from './telemetry';

// Mock posthog-js
const mockPosthog = {
  init: vi.fn(),
  capture: vi.fn(),
  opt_out_capturing: vi.fn(),
  opt_in_capturing: vi.fn(),
};

vi.mock('posthog-js', () => ({
  default: mockPosthog,
}));

describe('TelemetryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    telemetry.reset();
  });

  afterEach(() => {
    telemetry.reset();
  });

  it('runs as a silent no-op when no API key is configured', async () => {
    await telemetry.init({ apiKey: '' });
    telemetry.trackQuestionAnswered({
      question_id: 101,
      subject_id: 2,
      subject_name: 'Meteorologia',
      is_correct: true,
      selected_option: 1,
      correct_option: 1,
      mode: 'official_exam',
    });

    expect(mockPosthog.init).not.toHaveBeenCalled();
    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });

  it('initializes PostHog with privacy-compliant settings when API key is provided', async () => {
    await telemetry.init({
      apiKey: 'phc_test_key_123',
      apiHost: 'https://eu.i.posthog.com',
      enabled: true,
    });

    expect(mockPosthog.init).toHaveBeenCalledWith(
      'phc_test_key_123',
      expect.objectContaining({
        api_host: 'https://eu.i.posthog.com',
        autocapture: false,
        capture_pageview: false,
        disable_session_recording: true,
        request_batching: true,
        respect_dnt: true,
      })
    );
  });

  it('tracks question_answered with complete payload for macro analysis', async () => {
    await telemetry.init({ apiKey: 'phc_test_key', enabled: true });

    telemetry.trackQuestionAnswered({
      question_id: 42,
      subject_id: 1,
      subject_name: 'Aerodinamica',
      is_correct: false,
      selected_option: 2,
      correct_option: 1,
      mode: 'tutor_exam',
      time_taken_seconds: 14,
    });

    expect(mockPosthog.capture).toHaveBeenCalledWith('question_answered', {
      question_id: 42,
      subject_id: 1,
      subject_name: 'Aerodinamica',
      is_correct: false,
      selected_option: 2,
      correct_option: 1,
      mode: 'tutor_exam',
      time_taken_seconds: 14,
    });
  });

  it('tracks exam_completed with performance metrics and worst subject breakdown', async () => {
    await telemetry.init({ apiKey: 'phc_test_key', enabled: true });

    telemetry.trackExamCompleted({
      mode: 'official',
      is_passed: true,
      score: 28,
      errors_count: 2,
      duration_seconds: 1240,
      worst_subject_id: 2,
      worst_subject_name: 'Meteorologia',
      is_marathon: false,
    });

    expect(mockPosthog.capture).toHaveBeenCalledWith('exam_completed', {
      mode: 'official',
      is_passed: true,
      score: 28,
      errors_count: 2,
      duration_seconds: 1240,
      worst_subject_id: 2,
      worst_subject_name: 'Meteorologia',
      is_marathon: false,
    });
  });

  it('tracks study_mode_entered, audio downloads and PWA installation outcomes', async () => {
    await telemetry.init({ apiKey: 'phc_test_key', enabled: true });

    telemetry.trackStudyModeEntered({ mode: 'topics', subject_id: 3 });
    expect(mockPosthog.capture).toHaveBeenCalledWith('study_mode_entered', {
      mode: 'topics',
      subject_id: 3,
    });

    telemetry.trackAudioDownloadResult({
      voice: 'giuseppe',
      status: 'success',
      duration_seconds: 45,
    });
    expect(mockPosthog.capture).toHaveBeenCalledWith('audio_download_result', {
      voice: 'giuseppe',
      status: 'success',
      duration_seconds: 45,
    });

    telemetry.trackPwaInstallPrompt({ outcome: 'accepted' });
    expect(mockPosthog.capture).toHaveBeenCalledWith('pwa_install_prompt_outcome', {
      outcome: 'accepted',
    });
  });

  it('respects opt-out preference and stops event capture immediately', async () => {
    await telemetry.init({ apiKey: 'phc_test_key', enabled: true });

    telemetry.setOptOut(true);
    expect(telemetry.isOptedOut()).toBe(true);
    expect(mockPosthog.opt_out_capturing).toHaveBeenCalled();

    telemetry.trackQuestionAnswered({
      question_id: 10,
      subject_id: 1,
      subject_name: 'Aerodinamica',
      is_correct: true,
      selected_option: 3,
      correct_option: 3,
      mode: 'topics',
    });

    // Capture must not be called when opted out
    expect(mockPosthog.capture).not.toHaveBeenCalled();

    telemetry.setOptOut(false);
    expect(telemetry.isOptedOut()).toBe(false);
    expect(mockPosthog.opt_in_capturing).toHaveBeenCalled();
  });

  it('sanitizes payloads by stripping sensitive fields like user notes or tokens', async () => {
    await telemetry.init({ apiKey: 'phc_test_key', enabled: true });

    // Directly test capture with rogue sensitive fields
    (telemetry as any).capture('custom_event', {
      safe_metric: 100,
      userNote: 'Private personal annotation',
      authToken: 'secret_token_123',
      userEmail: 'pilot@example.com',
    });

    expect(mockPosthog.capture).toHaveBeenCalledWith('custom_event', {
      safe_metric: 100,
    });
  });

  it('preserves PostHog internal system properties like token and $-prefixed keys during sanitization', async () => {
    await telemetry.init({ apiKey: 'phc_test_key', enabled: true });

    const initCall = mockPosthog.init.mock.calls[0];
    const options = initCall[1];
    expect(options.sanitize_properties).toBeDefined();

    const sanitized = options.sanitize_properties({
      token: 'phc_test_key',
      distinct_id: 'anon_123',
      $lib: 'web',
      $browser: 'Chrome',
      safe_metric: 42,
      userNote: 'Secret note',
      authToken: 'oauth_token_abc',
    });

    expect(sanitized).toEqual({
      token: 'phc_test_key',
      distinct_id: 'anon_123',
      $lib: 'web',
      $browser: 'Chrome',
      safe_metric: 42,
    });
  });

  it('handles client errors gracefully without throwing exceptions to UI', async () => {
    mockPosthog.capture.mockImplementationOnce(() => {
      throw new Error('Network error or ad-blocker blocked request');
    });

    await telemetry.init({ apiKey: 'phc_test_key', enabled: true });

    expect(() => {
      telemetry.trackQuestionAnswered({
        question_id: 1,
        subject_id: 1,
        subject_name: 'Aerodinamica',
        is_correct: true,
        selected_option: 1,
        correct_option: 1,
        mode: 'official_exam',
      });
    }).not.toThrow();
  });
});
