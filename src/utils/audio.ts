// Lightweight avionics sound generator based on Web Audio API (zero external assets)

class SoundFX {
  private ctx: AudioContext | null = null;

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    try {
      this.initCtx();
    } catch {
      // Silently ignore unlock errors
    }
  }

  /**
   * Plays a short, bright, unmistakably positive two-tone ascending chime (G5 -> C6).
   */
  public playCorrect() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const now = Math.max(ctx.currentTime, 0.001);

      // Ascending two-tone interval: G5 (783.99 Hz) for 60ms, then C6 (1046.50 Hz) for 160ms
      osc.frequency.setValueAtTime(783.99, now);
      osc.frequency.setValueAtTime(1046.50, now + 0.06);

      // Smooth attack to prevent pops, clean sustain, and gentle exponential decay
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.008);
      gain.gain.setValueAtTime(0.14, now + 0.055);
      gain.gain.exponentialRampToValueAtTime(0.20, now + 0.068);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Silently ignore audio errors
    }
  }

  /**
   * Plays a descending negative tone sequence for mistakes.
   */
  public playWrong() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const now = Math.max(ctx.currentTime, 0.001);

      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.exponentialRampToValueAtTime(164.81, now + 0.18); // E3

      gain.gain.setValueAtTime(0.10, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Silently ignore
    }
  }

  /**
   * Plays a crisp, subtle mechanical tap sound for neutral clicks and toggles.
   */
  public playClick() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const now = Math.max(ctx.currentTime, 0.001);

      osc.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Silently ignore
    }
  }
}

export const soundFX = new SoundFX();

// Auto-unlock AudioContext on first user interaction (mobile & desktop)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    soundFX.unlock();
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
}

/**
 * Determines whether voice recognition microphone should be suspended to avoid
 * picking up loudspeaker speech output (acoustic feedback prevention).
 */
export function shouldSuspendVoiceMic(
  audioOutputMode: 'speaker' | 'headphones',
  playback: {
    isPlaying: boolean;
    isSequencePlaying: boolean;
    isDriveIntroPlaying?: boolean;
    isPaused: boolean;
  }
): boolean {
  if (audioOutputMode === 'headphones') {
    return false;
  }
  const isSpeechActivelyPlaying =
    (Boolean(playback.isPlaying) || Boolean(playback.isSequencePlaying) || Boolean(playback.isDriveIntroPlaying)) &&
    !playback.isPaused;

  return isSpeechActivelyPlaying;
}
