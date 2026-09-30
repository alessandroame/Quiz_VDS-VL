import { describe, it, expect, vi, beforeEach } from 'vitest';
import { soundFX, shouldSuspendVoiceMic } from './audio';

describe('Suite 8: Audio Synthesis SoundFX & Mic Gating (src/utils/audio.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('AUDIO-01: non lancia eccezioni in assenza di AudioContext nel browser', () => {
    // In ambiente Node window.AudioContext è assente
    expect(() => soundFX.playClick()).not.toThrow();
    expect(() => soundFX.playCorrect()).not.toThrow();
    expect(() => soundFX.playWrong()).not.toThrow();
  });

  it('AUDIO-02: crea oscillatori e gain nodes quando AudioContext è presente', () => {
    const mockOscillator = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };

    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      },
      connect: vi.fn()
    };

    const mockCtx = {
      state: 'running',
      currentTime: 10,
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGain),
      destination: {},
      resume: vi.fn()
    };

    // Iniettiamo mock AudioContext
    (soundFX as any).ctx = mockCtx;

    soundFX.playCorrect();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();

    soundFX.playWrong();
    expect(mockOscillator.type).toBe('triangle');

    soundFX.playClick();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('AUDIO-03: suspends microphone when in speaker mode and speech is actively playing', () => {
    // Reading question or option snippet
    expect(
      shouldSuspendVoiceMic('speaker', {
        isPlaying: true,
        isSequencePlaying: false,
        isDriveIntroPlaying: false,
        isPaused: false
      })
    ).toBe(true);

    // Reading full question/options sequence
    expect(
      shouldSuspendVoiceMic('speaker', {
        isPlaying: false,
        isSequencePlaying: true,
        isDriveIntroPlaying: false,
        isPaused: false
      })
    ).toBe(true);

    // Reading intro briefing
    expect(
      shouldSuspendVoiceMic('speaker', {
        isPlaying: false,
        isSequencePlaying: false,
        isDriveIntroPlaying: true,
        isPaused: false
      })
    ).toBe(true);
  });

  it('AUDIO-04: keeps microphone active when in speaker mode and speech is paused', () => {
    expect(
      shouldSuspendVoiceMic('speaker', {
        isPlaying: true,
        isSequencePlaying: true,
        isDriveIntroPlaying: false,
        isPaused: true
      })
    ).toBe(false);
  });

  it('AUDIO-05: keeps microphone active when in speaker mode and speech has ended', () => {
    // When sequence finishes and waiting countdown begins
    expect(
      shouldSuspendVoiceMic('speaker', {
        isPlaying: false,
        isSequencePlaying: false,
        isDriveIntroPlaying: false,
        isPaused: false
      })
    ).toBe(false);
  });

  it('AUDIO-06: never suspends microphone when in headphones mode (allows barge-in)', () => {
    expect(
      shouldSuspendVoiceMic('headphones', {
        isPlaying: true,
        isSequencePlaying: true,
        isDriveIntroPlaying: true,
        isPaused: false
      })
    ).toBe(false);

    expect(
      shouldSuspendVoiceMic('headphones', {
        isPlaying: false,
        isSequencePlaying: false,
        isDriveIntroPlaying: false,
        isPaused: false
      })
    ).toBe(false);
  });
});
