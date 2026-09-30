// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { useDriveVoiceCommands } from './useDriveVoiceCommands';
import { renderHook } from '../test/hookHarness';

class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;

  onstart: (() => void) | null = null;
  onaudiostart: (() => void) | null = null;
  onsoundstart: (() => void) | null = null;
  onspeechstart: (() => void) | null = null;
  onspeechend: (() => void) | null = null;
  onsoundend: (() => void) | null = null;
  onaudioend: (() => void) | null = null;
  onresult: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onend: (() => void) | null = null;

  start = vi.fn(() => {
    if (this.onstart) this.onstart();
  });

  stop = vi.fn(() => {
    if (this.onend) this.onend();
  });

  abort = vi.fn(() => {
    if (this.onend) this.onend();
  });
}

describe('useDriveVoiceCommands Hook', () => {
  let originalSpeechRecognition: any;

  beforeEach(() => {
    vi.useFakeTimers();
    originalSpeechRecognition = (window as any).SpeechRecognition;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    if (originalSpeechRecognition) {
      (window as any).SpeechRecognition = originalSpeechRecognition;
    } else {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
    }
    vi.restoreAllMocks();
  });

  it('should report isSupported as false when Web Speech API is absent', () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    const onCommand = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDriveVoiceCommands({ enabled: true, onCommand })
    );

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isListening).toBe(false);
    unmount();
  });

  it('should start listening after acoustic cooldown when enabled and supported', () => {
    (window as any).SpeechRecognition = MockSpeechRecognition;

    const onCommand = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDriveVoiceCommands({ enabled: true, onCommand })
    );

    expect(result.current.isSupported).toBe(true);
    expect(result.current.isListening).toBe(false);

    // Advance past the 250ms acoustic cooldown
    act(() => {
      vi.advanceTimersByTime(260);
    });

    expect(result.current.isListening).toBe(true);
    expect(result.current.isReceiving).toBe(false);

    unmount();
  });

  it('should detect speech activity and fire parsed voice commands on final result', () => {
    let instance: MockSpeechRecognition | null = null;
    class SpyingRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instance = this;
      }
    }
    (window as any).SpeechRecognition = SpyingRecognition;

    const onCommand = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDriveVoiceCommands({ enabled: true, onCommand })
    );

    act(() => {
      vi.advanceTimersByTime(260);
    });

    expect(instance).not.toBeNull();

    // Simulate sound/speech start
    act(() => {
      instance?.onspeechstart?.();
    });
    expect(result.current.isReceiving).toBe(true);

    // Simulate recognition result: user said "Due" (Option 2)
    act(() => {
      instance?.onresult?.({
        results: [
          Object.assign([{ transcript: 'due' }], { isFinal: true })
        ]
      });
    });

    expect(onCommand).toHaveBeenCalledWith('opt2');
    expect(result.current.lastTranscript).toBe('due');

    unmount();
  });

  it('should recognize interim commands early for snappy response', () => {
    let instance: MockSpeechRecognition | null = null;
    class SpyingRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instance = this;
      }
    }
    (window as any).SpeechRecognition = SpyingRecognition;

    const onCommand = vi.fn();
    const { unmount } = renderHook(() =>
      useDriveVoiceCommands({ enabled: true, onCommand })
    );

    act(() => {
      vi.advanceTimersByTime(260);
    });

    // Simulate interim result: "ripeti"
    act(() => {
      instance?.onresult?.({
        results: [
          Object.assign([{ transcript: 'ripeti' }], { isFinal: false })
        ]
      });
    });

    expect(onCommand).toHaveBeenCalledWith('repeat');

    unmount();
  });

  it('should immediately suspend and abort recognition when isSuspended is true', () => {
    let instance: any = null;
    class SpyingRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instance = this;
      }
    }
    (window as any).SpeechRecognition = SpyingRecognition;

    const onCommand = vi.fn();
    const { result, rerender, unmount } = renderHook(
      (props) => useDriveVoiceCommands(props!),
      { enabled: true, onCommand, isSuspended: false }
    );

    act(() => {
      vi.advanceTimersByTime(260);
    });

    expect(result.current.isListening).toBe(true);

    // Audio starts playing -> suspend recognition to eliminate speaker echo
    rerender({ enabled: true, onCommand, isSuspended: true });

    expect((instance as any)?.abort).toHaveBeenCalled();
    expect(result.current.isListening).toBe(false);
    expect(result.current.isSuspended).toBe(true);

    unmount();
  });

  it('should handle permission errors gracefully', () => {
    let instance: MockSpeechRecognition | null = null;
    class SpyingRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instance = this;
      }
    }
    (window as any).SpeechRecognition = SpyingRecognition;

    const onCommand = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDriveVoiceCommands({ enabled: true, onCommand })
    );

    act(() => {
      vi.advanceTimersByTime(260);
    });

    // Simulate microphone permission denied
    act(() => {
      instance?.onerror?.({ error: 'not-allowed' });
    });

    expect(result.current.error).toBe('not-allowed');
    expect(result.current.isListening).toBe(false);

    unmount();
  });

  it('should ignore non-fatal no-speech errors during silence', () => {
    let instance: MockSpeechRecognition | null = null;
    class SpyingRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instance = this;
      }
    }
    (window as any).SpeechRecognition = SpyingRecognition;

    const onCommand = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDriveVoiceCommands({ enabled: true, onCommand })
    );

    act(() => {
      vi.advanceTimersByTime(260);
    });

    // Simulate standard silence timeout
    act(() => {
      instance?.onerror?.({ error: 'no-speech' });
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isListening).toBe(true);

    unmount();
  });
});
