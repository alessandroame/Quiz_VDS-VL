// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appTimeTracker } from './appTimeTracker';
import { telemetry } from './telemetry';

vi.mock('./telemetry', () => ({
  telemetry: {
    trackAppTimeSpent: vi.fn(),
    trackAppSessionEnded: vi.fn(),
    trackScreenViewed: vi.fn(),
  },
}));

describe('AppTimeTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    appTimeTracker.reset();
  });

  afterEach(() => {
    appTimeTracker.reset();
    vi.useRealTimers();
  });

  it('initializes session with starting screen and zero active seconds', () => {
    appTimeTracker.start({
      getScreen: () => 'home',
      getReadinessScore: () => 80,
      isStandalonePwa: () => true,
    });

    const metrics = appTimeTracker.getMetrics();
    expect(metrics.currentScreen).toBe('home');
    expect(metrics.totalActiveSeconds).toBe(0);
    expect(metrics.intervalActiveSeconds).toBe(0);
    expect(metrics.screensVisited).toEqual(['home']);
  });

  it('accumulates active seconds on 1s ticks when tab is visible and active', () => {
    appTimeTracker.start({
      getScreen: () => 'exam',
      getReadinessScore: () => 75,
      heartbeatIntervalSeconds: 60,
    });

    // Advance 10 seconds
    vi.advanceTimersByTime(10000);

    const metrics = appTimeTracker.getMetrics();
    expect(metrics.totalActiveSeconds).toBe(10);
    expect(metrics.intervalActiveSeconds).toBe(10);
    expect(telemetry.trackAppTimeSpent).not.toHaveBeenCalled();
  });

  it('emits app_time_spent heartbeat after heartbeat interval is reached', () => {
    appTimeTracker.start({
      getScreen: () => 'topics',
      getReadinessScore: () => 85,
      isStandalonePwa: () => true,
      heartbeatIntervalSeconds: 60,
    });

    // Advance 60 seconds
    vi.advanceTimersByTime(60000);

    expect(telemetry.trackAppTimeSpent).toHaveBeenCalledTimes(1);
    expect(telemetry.trackAppTimeSpent).toHaveBeenCalledWith({
      duration_seconds: 60,
      active_seconds: 60,
      total_session_seconds: 60,
      screen: 'topics',
      readiness_score: 85,
      is_standalone_pwa: true,
    });

    expect(appTimeTracker.getMetrics().intervalActiveSeconds).toBe(0);
    expect(appTimeTracker.getMetrics().totalActiveSeconds).toBe(60);
  });

  it('does not accumulate active seconds when document is hidden', () => {
    appTimeTracker.start({
      getScreen: () => 'home',
      heartbeatIntervalSeconds: 60,
    });

    // 5 seconds visible
    vi.advanceTimersByTime(5000);
    expect(appTimeTracker.getMetrics().totalActiveSeconds).toBe(5);

    // Mock document.visibilityState = 'hidden'
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });

    // Advance 10 seconds while hidden
    vi.advanceTimersByTime(10000);
    expect(appTimeTracker.getMetrics().totalActiveSeconds).toBe(5);

    // Restore visible
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });

    // Advance 3 more seconds
    vi.advanceTimersByTime(3000);
    expect(appTimeTracker.getMetrics().totalActiveSeconds).toBe(8);
  });

  it('pauses accumulation when user is idle beyond idleTimeoutSeconds', () => {
    appTimeTracker.start({
      getScreen: () => 'home',
      idleTimeoutSeconds: 10,
    });

    // 5 seconds active
    vi.advanceTimersByTime(5000);
    expect(appTimeTracker.getMetrics().totalActiveSeconds).toBe(5);

    // Pass idle timeout (another 6 seconds => 11s without interaction)
    vi.advanceTimersByTime(6000);
    expect(appTimeTracker.getMetrics().totalActiveSeconds).toBe(10);

    // Further 10s idle
    vi.advanceTimersByTime(10000);
    expect(appTimeTracker.getMetrics().totalActiveSeconds).toBe(10);

    // Simulate user interaction via window event
    window.dispatchEvent(new Event('pointerdown'));

    // Resumes accumulating
    vi.advanceTimersByTime(2000);
    expect(appTimeTracker.getMetrics().totalActiveSeconds).toBe(12);
  });

  it('keeps accumulating active time during idle if audio is actively speaking', () => {
    let isSpeaking = false;

    appTimeTracker.start({
      getScreen: () => 'drive_mode',
      idleTimeoutSeconds: 5,
      isAudioActive: () => isSpeaking,
    });

    // 5s initial
    vi.advanceTimersByTime(5000);
    expect(appTimeTracker.getMetrics().totalActiveSeconds).toBe(5);

    // Now turn audio speaking ON while no user touches the screen
    isSpeaking = true;
    vi.advanceTimersByTime(15000);

    // Must have accumulated all 15s because audio was playing!
    expect(appTimeTracker.getMetrics().totalActiveSeconds).toBe(20);
  });

  it('tracks screen transitions with duration spent on previous screen', () => {
    appTimeTracker.start({
      getScreen: () => 'home',
      getReadinessScore: () => 70,
    });

    // Stay on home for 12 seconds
    vi.advanceTimersByTime(12000);

    // Switch screen to exam
    appTimeTracker.setScreen('exam');

    expect(telemetry.trackScreenViewed).toHaveBeenCalledWith({
      screen: 'exam',
      previous_screen: 'home',
      duration_seconds: 12,
      readiness_score: 70,
    });

    const metrics = appTimeTracker.getMetrics();
    expect(metrics.currentScreen).toBe('exam');
    expect(metrics.screensVisited).toEqual(['home', 'exam']);
  });

  it('flushes interval active time on visibility change to hidden', () => {
    appTimeTracker.start({
      getScreen: () => 'mistakes',
      getReadinessScore: () => 88,
      heartbeatIntervalSeconds: 60,
    });

    // 25 seconds active
    vi.advanceTimersByTime(25000);

    // Trigger visibilitychange to hidden
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(telemetry.trackAppTimeSpent).toHaveBeenCalledWith(
      expect.objectContaining({
        duration_seconds: 25,
        active_seconds: 25,
        total_session_seconds: 25,
        screen: 'mistakes',
        readiness_score: 88,
      })
    );

    expect(appTimeTracker.getMetrics().intervalActiveSeconds).toBe(0);

    // Reset visibilityState to visible
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
  });

  it('emits app_session_ended with primary screen and total active/wall seconds upon stop', () => {
    appTimeTracker.start({
      getScreen: () => 'home',
      getReadinessScore: () => 92,
      isStandalonePwa: () => true,
    });

    // 10s on home
    vi.advanceTimersByTime(10000);

    // Switch to exam and spend 40s
    appTimeTracker.setScreen('exam');
    vi.advanceTimersByTime(40000);

    // Stop session
    appTimeTracker.stop();

    expect(telemetry.trackAppSessionEnded).toHaveBeenCalledWith({
      total_active_seconds: 50,
      total_wall_seconds: 50,
      screens_visited: ['home', 'exam'],
      primary_screen: 'exam',
      readiness_score: 92,
      is_standalone_pwa: true,
    });
  });
});
