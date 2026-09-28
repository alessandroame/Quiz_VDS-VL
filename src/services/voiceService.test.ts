import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VoiceService } from './voiceService';

// Mock HTMLAudioElement
class MockAudio {
  public src: string = '';
  public playbackRate: number = 1.0;
  public currentTime: number = 0;
  public paused: boolean = true;
  private listeners: Record<string, Function[]> = {};

  public addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  public removeEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== fn);
  }

  public async play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }

  public pause(): void {
    this.paused = true;
  }

  public triggerEnded(): void {
    this.paused = true;
    (this.listeners['ended'] || []).forEach(fn => fn());
  }

  public triggerError(e: any): void {
    (this.listeners['error'] || []).forEach(fn => fn(e));
  }
}

describe('VoiceService (src/services/voiceService.ts)', () => {
  let service: VoiceService;
  let mockAudio: MockAudio;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockAudio = new MockAudio();
    (globalThis as any).Audio = vi.fn().mockImplementation(function () {
      return mockAudio;
    });
    service = new VoiceService();
  });

  afterEach(() => {
    service.stop();
  });

  it('VOICE-01: initializes with idle state', () => {
    const state = service.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.currentQuestionId).toBeNull();
    expect(state.activePart).toBeNull();
    expect(state.isSequencePlaying).toBe(false);
  });

  it('VOICE-02: starts full sequence and updates state to playing', async () => {
    await service.playFullSequence(1001);

    const state = service.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.currentQuestionId).toBe(1001);
    expect(state.activePart).toBe('question');
    expect(state.isSequencePlaying).toBe(true);
    expect(mockAudio.src).toContain('/audio/giuseppe/1001_q.mp3');
  });

  it('VOICE-03: togglePlayPause pauses while playing, preserving position', async () => {
    await service.playFullSequence(1001);
    mockAudio.currentTime = 2.5;

    // Toggle while playing -> PAUSE
    await service.togglePlayPause(1001);

    let state = service.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.isPaused).toBe(true);
    expect(state.currentQuestionId).toBe(1001);
    expect(mockAudio.paused).toBe(true);
    expect(mockAudio.currentTime).toBe(2.5); // position preserved!
  });

  it('VOICE-04: togglePlayPause resumes while paused from current position', async () => {
    await service.playFullSequence(1001);
    mockAudio.currentTime = 3.2;
    await service.togglePlayPause(1001); // Pauses

    // Toggle while paused -> RESUME
    await service.togglePlayPause(1001);

    let state = service.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.currentQuestionId).toBe(1001);
    expect(mockAudio.paused).toBe(false);
  });

  it('VOICE-05: restartFullSequence rewinds to start of question while playing', async () => {
    await service.playFullSequence(1001);
    mockAudio.currentTime = 4.0;

    await service.restartFullSequence(1001);

    const state = service.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.activePart).toBe('question');
    expect(mockAudio.src).toContain('/audio/giuseppe/1001_q.mp3');
    expect(mockAudio.currentTime).toBe(0);
  });

  it('VOICE-06: restartFullSequence restarts and begins playing while paused', async () => {
    await service.playFullSequence(1001);
    service.pause();
    expect(service.getState().isPaused).toBe(true);

    await service.restartFullSequence(1001);

    const state = service.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.activePart).toBe('question');
    expect(mockAudio.currentTime).toBe(0);
  });

  it('VOICE-07: stop resets audio and state cleanly', async () => {
    await service.playFullSequence(1001);
    service.stop();

    const state = service.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.currentQuestionId).toBeNull();
    expect(state.activePart).toBeNull();
    expect(mockAudio.currentTime).toBe(0);
    expect(mockAudio.paused).toBe(true);
  });

  it('VOICE-08: progresses through sequence question -> opt1 -> opt2 -> opt3', async () => {
    vi.useFakeTimers();
    try {
      await service.playFullSequence(1001);
      expect(service.getState().activePart).toBe('question');

      // Question ends
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt1');

      // Option 1 ends
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt2');

      // Option 2 ends
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt3');

      // Option 3 ends -> sequence complete
      mockAudio.triggerEnded();
      expect(service.getState().isPlaying).toBe(false);
      expect(service.getState().currentQuestionId).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('VOICE-09: handles pause and resume during snippet transition gap', async () => {
    vi.useFakeTimers();
    try {
      await service.playFullSequence(1001);
      expect(service.getState().activePart).toBe('question');

      // Question ends -> starts 350ms delay before opt1
      mockAudio.triggerEnded();

      // Pause during the 350ms delay
      service.pause();
      expect(service.getState().isPaused).toBe(true);

      // Advance time beyond 350ms -> should NOT advance while paused
      vi.advanceTimersByTime(500);
      expect(service.getState().activePart).toBe('question');

      // Resume -> should now advance to opt1
      await service.resume();
      expect(service.getState().isPaused).toBe(false);
      expect(service.getState().activePart).toBe('opt1');
    } finally {
      vi.useRealTimers();
    }
  });

  it('VOICE-10: supports changing voice and updating playback rate', async () => {
    service.setPlaybackRate(1.25);
    service.setVoice('elsa');

    await service.playSinglePart(1005, 'opt2');
    expect(mockAudio.src).toContain('/audio/elsa/1005_2.mp3');
    expect(mockAudio.playbackRate).toBe(1.25);
  });
});
