import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VoiceService } from './voiceService';
import { audioDownloadManager } from './audioDownloadManager';

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

  public removeAttribute(attr: string): void {
    if (attr === 'src') this.src = '';
  }

  public load(): void {
    // Mock load
  }

  public triggerError(e: any): void {
    (this.listeners['error'] || []).forEach(fn => fn(e));
  }
}

const setNavigatorOnline = (online: boolean) => {
  if (typeof globalThis.navigator === 'undefined') {
    (globalThis as any).navigator = {};
  }
  Object.defineProperty(globalThis.navigator, 'onLine', {
    value: online,
    configurable: true,
    writable: true,
  });
};

describe('VoiceService (src/services/voiceService.ts)', () => {
  let service: VoiceService;
  let mockAudio: MockAudio;

  beforeEach(() => {
    vi.restoreAllMocks();
    setNavigatorOnline(true);
    mockAudio = new MockAudio();
    (globalThis as any).Audio = vi.fn().mockImplementation(function () {
      return mockAudio;
    });
    service = new VoiceService();
  });

  afterEach(() => {
    service.stop();
    setNavigatorOnline(true);
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

  it('VOICE-11: playSinglePart toggles play and pause on individual options', async () => {
    // Start option 2
    await service.playSinglePart(1001, 'opt2');
    expect(service.getState().isPlaying).toBe(true);
    expect(service.getState().isPaused).toBe(false);
    expect(service.getState().activePart).toBe('opt2');
    expect(mockAudio.src).toContain('/audio/giuseppe/1001_2.mp3');

    // Simulate playback progress
    mockAudio.currentTime = 1.8;

    // Toggle again while playing -> PAUSE
    await service.playSinglePart(1001, 'opt2');
    expect(service.getState().isPlaying).toBe(false);
    expect(service.getState().isPaused).toBe(true);
    expect(service.getState().activePart).toBe('opt2');
    expect(mockAudio.paused).toBe(true);
    expect(mockAudio.currentTime).toBe(1.8); // Exact position preserved

    // Toggle again while paused -> RESUME
    await service.playSinglePart(1001, 'opt2');
    expect(service.getState().isPlaying).toBe(true);
    expect(service.getState().isPaused).toBe(false);
    expect(service.getState().activePart).toBe('opt2');
    expect(mockAudio.paused).toBe(false);
  });

  it('VOICE-12: restartSinglePart rewinds active option to start', async () => {
    await service.playSinglePart(1001, 'opt1');
    mockAudio.currentTime = 2.5;

    await service.restartSinglePart(1001, 'opt1');
    expect(service.getState().isPlaying).toBe(true);
    expect(service.getState().isPaused).toBe(false);
    expect(service.getState().activePart).toBe('opt1');
    expect(mockAudio.currentTime).toBe(0);
  });

  it('VOICE-13: pausing an option during sequence preserves isSequencePlaying and resumes sequence seamlessly', async () => {
    vi.useFakeTimers();
    try {
      await service.playFullSequence(1001);
      // Question ends -> sequence proceeds to opt1
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt1');
      expect(service.getState().isSequencePlaying).toBe(true);

      mockAudio.currentTime = 1.2;

      // User pauses option 1
      await service.playSinglePart(1001, 'opt1');
      expect(service.getState().isPlaying).toBe(false);
      expect(service.getState().isPaused).toBe(true);
      expect(service.getState().isSequencePlaying).toBe(true); // sequence preserved!
      expect(mockAudio.currentTime).toBe(1.2);

      // User resumes option 1
      await service.playSinglePart(1001, 'opt1');
      expect(service.getState().isPlaying).toBe(true);
      expect(service.getState().isPaused).toBe(false);
      expect(service.getState().isSequencePlaying).toBe(true);

      // Option 1 ends -> sequence should seamlessly proceed to opt2
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt2');
    } finally {
      vi.useRealTimers();
    }
  });

  it('VOICE-14: restartSinglePart during sequence preserves sequence continuity', async () => {
    vi.useFakeTimers();
    try {
      await service.playFullSequence(1001);
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt1');

      mockAudio.currentTime = 2.0;

      // User clicks restart on option 1
      await service.restartSinglePart(1001, 'opt1');
      expect(mockAudio.currentTime).toBe(0);
      expect(service.getState().isPlaying).toBe(true);
      expect(service.getState().isSequencePlaying).toBe(true);

      // When restarted option 1 finishes, sequence advances to opt2
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt2');
    } finally {
      vi.useRealTimers();
    }
  });

  it('VOICE-15: resolveEffectiveVoice uses target voice when online', () => {
    setNavigatorOnline(true);
    expect(service.resolveEffectiveVoice('elsa')).toBe('elsa');
    expect(service.resolveEffectiveVoice('giuseppe')).toBe('giuseppe');
  });

  it('VOICE-16: resolveEffectiveVoice falls back to available voice when offline and target is not downloaded', () => {
    setNavigatorOnline(false);

    // Mock giuseppe as ready, elsa as not ready
    vi.spyOn(audioDownloadManager, 'isVoiceReady').mockImplementation(v => v === 'giuseppe');
    vi.spyOn(audioDownloadManager, 'getAvailableOfflineVoice').mockReturnValue('giuseppe');

    // If user wanted elsa, but elsa is not ready offline and giuseppe is available
    const resolved = service.resolveEffectiveVoice('elsa');
    expect(resolved).toBe('giuseppe');

    // If user wanted giuseppe, and giuseppe is ready offline -> stays giuseppe
    expect(service.resolveEffectiveVoice('giuseppe')).toBe('giuseppe');
  });

  it('VOICE-17: onFallback notifies registered listeners when voice falls back', () => {
    setNavigatorOnline(false);
    vi.spyOn(audioDownloadManager, 'isVoiceReady').mockImplementation(v => v === 'giuseppe');
    vi.spyOn(audioDownloadManager, 'getAvailableOfflineVoice').mockReturnValue('giuseppe');

    const fallbackListener = vi.fn();
    service.onFallback(fallbackListener);

    service.resolveEffectiveVoice('elsa');

    expect(fallbackListener).toHaveBeenCalledWith({
      from: 'elsa',
      to: 'giuseppe'
    });
  });

  it('VOICE-18: playSinglePart uses fallback voice URL when offline', async () => {
    setNavigatorOnline(false);
    vi.spyOn(audioDownloadManager, 'isVoiceReady').mockImplementation(v => v === 'giuseppe');
    vi.spyOn(audioDownloadManager, 'getAvailableOfflineVoice').mockReturnValue('giuseppe');

    service.setVoice('elsa');
    await service.playSinglePart(1001, 'question');

    // Should play giuseppe audio since elsa is not offline-ready
    expect(mockAudio.src).toContain('/audio/giuseppe/1001_q.mp3');
  });

  it('VOICE-19: playDriveIntro plays drive_intro.mp3 for selected voice and sets isDriveIntroPlaying', async () => {
    service.setVoice('giuseppe');
    await service.playDriveIntro();

    expect(mockAudio.src).toContain('/audio/giuseppe/drive_intro.mp3');
    expect(service.getState().isPlaying).toBe(true);
    expect(service.getState().isDriveIntroPlaying).toBe(true);
    expect(service.getState().activePart).toBe('intro');

    // Switching voice to elsa
    service.setVoice('elsa');
    await service.playDriveIntro();
    expect(mockAudio.src).toContain('/audio/elsa/drive_intro.mp3');
  });

  it('VOICE-20: stopDriveIntro and stop cleanly halt drive intro', async () => {
    await service.playDriveIntro();
    expect(service.getState().isDriveIntroPlaying).toBe(true);

    service.stopDriveIntro();
    expect(service.getState().isDriveIntroPlaying).toBe(false);
    expect(service.getState().isPlaying).toBe(false);
    expect(mockAudio.paused).toBe(true);
  });

  it('VOICE-21: audio ended on drive intro completes and resets state', async () => {
    await service.playDriveIntro();
    expect(service.getState().isDriveIntroPlaying).toBe(true);

    mockAudio.triggerEnded();
    expect(service.getState().isDriveIntroPlaying).toBe(false);
    expect(service.getState().isPlaying).toBe(false);
  });

  it('VOICE-22: restartCurrentOrSequence repeats active option and preserves sequence continuity', async () => {
    vi.useFakeTimers();
    try {
      await service.playFullSequence(1001);
      expect(service.getState().activePart).toBe('question');

      // Finish question -> advance to opt1
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt1');

      // Finish opt1 -> advance to opt2
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt2');
      mockAudio.currentTime = 1.8;

      // Repeat while reading opt2
      await service.restartCurrentOrSequence(1001);
      expect(service.getState().activePart).toBe('opt2');
      expect(mockAudio.src).toContain('/audio/giuseppe/1001_2.mp3');
      expect(mockAudio.currentTime).toBe(0);

      // When opt2 finishes, sequence should naturally continue to opt3
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt3');
    } finally {
      vi.useRealTimers();
    }
  });

  it('VOICE-23: restartCurrentOrSequence repeats question when reading question and advances to opt1', async () => {
    vi.useFakeTimers();
    try {
      await service.playFullSequence(1001);
      expect(service.getState().activePart).toBe('question');
      mockAudio.currentTime = 2.4;

      await service.restartCurrentOrSequence(1001);
      expect(service.getState().activePart).toBe('question');
      expect(mockAudio.currentTime).toBe(0);
      expect(mockAudio.src).toContain('/audio/giuseppe/1001_q.mp3');

      // When question finishes, advances to opt1
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt1');
    } finally {
      vi.useRealTimers();
    }
  });

  it('VOICE-24: after stop(), any restart always begins from the question', async () => {
    vi.useFakeTimers();
    try {
      await service.playFullSequence(1001);
      // Advance to opt2
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt2');

      // Explicit stop
      service.stop();
      expect(service.getState().isPlaying).toBe(false);
      expect(service.getState().currentQuestionId).toBeNull();
      expect(service.getState().activePart).toBeNull();

      // Restarting via restartCurrentOrSequence must start from question
      await service.restartCurrentOrSequence(1001);
      expect(service.getState().activePart).toBe('question');
      expect(mockAudio.src).toContain('/audio/giuseppe/1001_q.mp3');

      // Stop again
      service.stop();

      // Starting via togglePlayPause must also start from question
      await service.togglePlayPause(1001);
      expect(service.getState().activePart).toBe('question');
      expect(mockAudio.src).toContain('/audio/giuseppe/1001_q.mp3');
    } finally {
      vi.useRealTimers();
    }
  });

  it('VOICE-25: restartCurrentOrSequence while paused unpauses and rewinds current snippet', async () => {
    vi.useFakeTimers();
    try {
      await service.playFullSequence(1001);
      // Advance to opt1
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt1');

      // Pause while on opt1
      service.pause();
      expect(service.getState().isPaused).toBe(true);

      // Repeat current while paused
      await service.restartCurrentOrSequence(1001);
      expect(service.getState().isPaused).toBe(false);
      expect(service.getState().isPlaying).toBe(true);
      expect(service.getState().activePart).toBe('opt1');
      expect(mockAudio.currentTime).toBe(0);

      // Natural continuation to opt2
      mockAudio.triggerEnded();
      vi.advanceTimersByTime(350);
      expect(service.getState().activePart).toBe('opt2');
    } finally {
      vi.useRealTimers();
    }
  });

  it('VOICE-26: getItalianSpeechVoice returns it-IT voice when available', () => {
    const mockVoices = [
      { name: 'Microsoft David', lang: 'en-US' },
      { name: 'Microsoft Elsa Desktop', lang: 'it-IT' },
      { name: 'Google Italiano', lang: 'it_IT' }
    ] as any[];

    (globalThis as any).window = (globalThis as any).window || {};
    (globalThis as any).window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue(mockVoices)
    };

    const voice = service.getItalianSpeechVoice();
    expect(voice).toBeDefined();
    expect(voice?.lang).toBe('it-IT');
  });

  it('VOICE-27: getItalianSpeechVoice returns null when no Italian voice is present', () => {
    const mockVoices = [
      { name: 'Microsoft David', lang: 'en-US' },
      { name: 'Microsoft Zira', lang: 'en-US' }
    ] as any[];

    (globalThis as any).window = (globalThis as any).window || {};
    (globalThis as any).window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue(mockVoices)
    };

    const voice = service.getItalianSpeechVoice();
    expect(voice).toBeNull();
  });

  it('VOICE-28: getItalianSpeechVoice prioritizes Elsa voice when preferredVoice is elsa', () => {
    const mockVoices = [
      { name: 'Microsoft Cosimo Desktop', lang: 'it-IT' },
      { name: 'Microsoft Elsa Desktop', lang: 'it-IT' },
      { name: 'Google US English', lang: 'en-US' }
    ] as any[];

    (globalThis as any).window = (globalThis as any).window || {};
    (globalThis as any).window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue(mockVoices)
    };

    const elsaVoice = service.getItalianSpeechVoice('elsa');
    expect(elsaVoice).toBeDefined();
    expect(elsaVoice?.name).toBe('Microsoft Elsa Desktop');

    const giuseppeVoice = service.getItalianSpeechVoice('giuseppe');
    expect(giuseppeVoice).toBeDefined();
    expect(giuseppeVoice?.name).toBe('Microsoft Cosimo Desktop');
  });

  it('VOICE-29: stop() is a no-op when already idle', () => {
    const pauseSpy = vi.spyOn(mockAudio, 'pause');
    const listener = vi.fn();
    service.subscribe(listener);
    listener.mockClear();

    // Call stop while already idle
    service.stop();

    expect(pauseSpy).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });

  it('VOICE-30: AbortError on play() is silently handled without warnings or cascaded stop', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const abortErr = new Error('The play() request was interrupted by a call to pause().');
    abortErr.name = 'AbortError';

    vi.spyOn(mockAudio, 'play').mockRejectedValueOnce(abortErr);

    await expect(service.playSinglePart(10, 'question')).resolves.toBeUndefined();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('VOICE-31: subscriber listener receives asynchronous notification via microtask', async () => {
    const listener = vi.fn();
    service.subscribe(listener);
    listener.mockClear();

    await service.playSinglePart(1, 'question');
    // Wait for microtask tick
    await Promise.resolve();

    expect(listener).toHaveBeenCalled();
    const lastState = listener.mock.calls[listener.mock.calls.length - 1][0];
    expect(lastState.currentQuestionId).toBe(1);
    expect(lastState.activePart).toBe('question');
  });
});

