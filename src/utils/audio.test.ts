import { describe, it, expect, vi, beforeEach } from 'vitest';
import { soundFX } from './audio';

describe('Suite 8: Audio Synthesis SoundFX (src/utils/audio.ts)', () => {
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
});
