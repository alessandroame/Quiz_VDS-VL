import { telemetry } from './telemetry';

export interface TimeTrackerConfig {
  getScreen: () => string;
  getReadinessScore?: () => number;
  isStandalonePwa?: () => boolean;
  isAudioActive?: () => boolean;
  heartbeatIntervalSeconds?: number;
  idleTimeoutSeconds?: number;
}

export interface TimeTrackerMetrics {
  totalActiveSeconds: number;
  intervalActiveSeconds: number;
  totalWallSeconds: number;
  currentScreen: string;
  screensVisited: string[];
}

export class AppTimeTracker {
  private config: TimeTrackerConfig | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private sessionStartTime: number = 0;
  private totalActiveSeconds: number = 0;
  private intervalActiveSeconds: number = 0;
  private lastInteractionTime: number = 0;
  private currentScreen: string = 'home';
  private screenStartTime: number = 0;
  private screensVisited: Set<string> = new Set();
  private screenTimeMap: Record<string, number> = {};
  private isRunning: boolean = false;
  private lastActivityThrottle: number = 0;
  private sessionEndedEmitted: boolean = false;

  private handleActivity = this.onActivity.bind(this);
  private handleVisibilityChange = this.onVisibilityChange.bind(this);
  private handlePageHide = this.onPageHide.bind(this);
  private handleBeforeUnload = this.onBeforeUnload.bind(this);

  /**
   * Starts tracking active session time and user interaction.
   */
  start(config: TimeTrackerConfig): void {
    if (this.isRunning) {
      this.stop();
    }

    this.config = config;
    const now = Date.now();
    this.sessionStartTime = now;
    this.totalActiveSeconds = 0;
    this.intervalActiveSeconds = 0;
    this.lastInteractionTime = now;
    this.currentScreen = config.getScreen() || 'home';
    this.screenStartTime = now;
    this.screensVisited = new Set([this.currentScreen]);
    this.screenTimeMap = { [this.currentScreen]: 0 };
    this.sessionEndedEmitted = false;
    this.isRunning = true;

    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', this.handleActivity, { passive: true });
      window.addEventListener('keydown', this.handleActivity, { passive: true });
      window.addEventListener('touchstart', this.handleActivity, { passive: true });
      window.addEventListener('scroll', this.handleActivity, { passive: true });
      window.addEventListener('pagehide', this.handlePageHide);
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    this.timerId = setInterval(() => this.tick(), 1000);
  }

  /**
   * Throttled activity listener to update last interaction timestamp.
   */
  private onActivity(): void {
    const now = Date.now();
    if (now - this.lastActivityThrottle > 1000) {
      this.lastInteractionTime = now;
      this.lastActivityThrottle = now;
    }
  }

  /**
   * Periodic 1-second accounting tick.
   */
  tick(): void {
    if (!this.isRunning) return;

    // Do not count time if tab is hidden/minimized
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    // Check idle threshold: pause active timer if no input for N seconds,
    // UNLESS audio is actively speaking (e.g. hands-free voice mode or question reading)
    const idleThresholdMs = (this.config?.idleTimeoutSeconds ?? 120) * 1000;
    const isAudioSpeaking = Boolean(this.config?.isAudioActive && this.config.isAudioActive());
    const isUserActive = Date.now() - this.lastInteractionTime <= idleThresholdMs || isAudioSpeaking;

    if (!isUserActive) {
      return;
    }

    this.totalActiveSeconds += 1;
    this.intervalActiveSeconds += 1;
    this.screenTimeMap[this.currentScreen] = (this.screenTimeMap[this.currentScreen] || 0) + 1;

    // Heartbeat check (default: every 60s)
    const heartbeatLimit = this.config?.heartbeatIntervalSeconds ?? 60;
    if (this.intervalActiveSeconds >= heartbeatLimit) {
      this.flushHeartbeat();
    }
  }

  /**
   * Flushes accumulated active seconds as a heartbeat event.
   */
  flushHeartbeat(): void {
    if (this.intervalActiveSeconds <= 0) return;

    const readinessScore = this.config?.getReadinessScore ? this.config.getReadinessScore() : undefined;
    const isStandalone = this.config?.isStandalonePwa ? this.config.isStandalonePwa() : false;

    telemetry.trackAppTimeSpent({
      duration_seconds: this.intervalActiveSeconds,
      active_seconds: this.intervalActiveSeconds,
      total_session_seconds: this.totalActiveSeconds,
      screen: this.currentScreen,
      readiness_score: readinessScore,
      is_standalone_pwa: isStandalone,
    });

    this.intervalActiveSeconds = 0;
  }

  /**
   * Handles user switching screens or tabs.
   */
  setScreen(newScreen: string): void {
    if (!this.isRunning || !newScreen) return;
    if (newScreen === this.currentScreen) return;

    const now = Date.now();
    const durationOnPrevScreen = Math.max(0, Math.round((now - this.screenStartTime) / 1000));
    const readinessScore = this.config?.getReadinessScore ? this.config.getReadinessScore() : undefined;

    telemetry.trackScreenViewed({
      screen: newScreen,
      previous_screen: this.currentScreen,
      duration_seconds: durationOnPrevScreen,
      readiness_score: readinessScore,
    });

    this.currentScreen = newScreen;
    this.screenStartTime = now;
    this.screensVisited.add(newScreen);
    if (this.screenTimeMap[newScreen] === undefined) {
      this.screenTimeMap[newScreen] = 0;
    }
  }

  /**
   * Handles visibility changes (e.g. app switching or browser tab switching).
   */
  private onVisibilityChange(): void {
    if (typeof document === 'undefined') return;

    if (document.visibilityState === 'hidden') {
      this.flushHeartbeat();
    } else if (document.visibilityState === 'visible') {
      this.lastInteractionTime = Date.now();
    }
  }

  private onPageHide(): void {
    this.flushHeartbeat();
    this.flushSessionEnded();
  }

  private onBeforeUnload(): void {
    this.flushHeartbeat();
    this.flushSessionEnded();
  }

  /**
   * Emits summary metrics when session concludes.
   */
  private flushSessionEnded(): void {
    if (this.sessionEndedEmitted) return;
    this.sessionEndedEmitted = true;

    let primaryScreen = this.currentScreen;
    let maxSec = -1;
    for (const [scr, sec] of Object.entries(this.screenTimeMap)) {
      if (sec > maxSec) {
        maxSec = sec;
        primaryScreen = scr;
      }
    }

    const totalWallSeconds = Math.max(0, Math.round((Date.now() - this.sessionStartTime) / 1000));
    const readinessScore = this.config?.getReadinessScore ? this.config.getReadinessScore() : undefined;
    const isStandalone = this.config?.isStandalonePwa ? this.config.isStandalonePwa() : false;

    telemetry.trackAppSessionEnded({
      total_active_seconds: this.totalActiveSeconds,
      total_wall_seconds: totalWallSeconds,
      screens_visited: Array.from(this.screensVisited),
      primary_screen: primaryScreen,
      readiness_score: readinessScore,
      is_standalone_pwa: isStandalone,
    });
  }

  /**
   * Stops tracking and cleans up event listeners and intervals.
   */
  stop(): void {
    if (!this.isRunning) return;

    this.flushHeartbeat();
    this.flushSessionEnded();

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerdown', this.handleActivity);
      window.removeEventListener('keydown', this.handleActivity);
      window.removeEventListener('touchstart', this.handleActivity);
      window.removeEventListener('scroll', this.handleActivity);
      window.removeEventListener('pagehide', this.handlePageHide);
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    this.isRunning = false;
  }

  /**
   * Retrieves active metrics for inspection and unit testing.
   */
  getMetrics(): TimeTrackerMetrics {
    const totalWallSeconds = this.sessionStartTime > 0
      ? Math.max(0, Math.round((Date.now() - this.sessionStartTime) / 1000))
      : 0;

    return {
      totalActiveSeconds: this.totalActiveSeconds,
      intervalActiveSeconds: this.intervalActiveSeconds,
      totalWallSeconds,
      currentScreen: this.currentScreen,
      screensVisited: Array.from(this.screensVisited),
    };
  }

  /**
   * Resets internal state for unit testing isolation.
   */
  reset(): void {
    this.stop();
    this.config = null;
    this.sessionStartTime = 0;
    this.totalActiveSeconds = 0;
    this.intervalActiveSeconds = 0;
    this.lastInteractionTime = 0;
    this.currentScreen = 'home';
    this.screenStartTime = 0;
    this.screensVisited.clear();
    this.screenTimeMap = {};
    this.sessionEndedEmitted = false;
  }
}

export const appTimeTracker = new AppTimeTracker();
