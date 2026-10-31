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

  it('should reset lastHandledIndex across recognizer restarts after speaker suspension so subsequent commands at index 0 fire reliably', () => {
    const instances: MockSpeechRecognition[] = [];
    class SpyingRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instances.push(this);
      }
    }
    (window as any).SpeechRecognition = SpyingRecognition;

    const onCommand = vi.fn();
    const { rerender, unmount } = renderHook(
      (props) => useDriveVoiceCommands(props!),
      { enabled: true, onCommand, isSuspended: false, settleMs: 340 }
    );

    act(() => {
      vi.advanceTimersByTime(260);
    });
    expect(instances).toHaveLength(1);

    // Question 1: user speaks "uno" at index 0
    act(() => {
      instances[0].onresult?.({
        results: [Object.assign([{ transcript: 'uno', confidence: 0.95 }], { isFinal: true })]
      });
    });
    expect(onCommand).toHaveBeenCalledTimes(1);
    expect(onCommand).toHaveBeenLastCalledWith('opt1');

    // Question 2 starts speaking -> mic suspends, then resumes
    rerender({ enabled: true, onCommand, isSuspended: true, settleMs: 340 });
    rerender({ enabled: true, onCommand, isSuspended: false, settleMs: 340 });
    act(() => {
      vi.advanceTimersByTime(260);
    });
    expect(instances).toHaveLength(2);

    // Question 2: new recognizer emits at index 0 again -> must NOT be dropped
    act(() => {
      instances[1].onresult?.({
        results: [Object.assign([{ transcript: 'tre', confidence: 0.94 }], { isFinal: true })]
      });
    });
    expect(onCommand).toHaveBeenCalledTimes(2);
    expect(onCommand).toHaveBeenLastCalledWith('opt3');

    unmount();
  });

  it('should progressively refine interim "ripeti..." into "ripeti la due" without premature firing when settleMs is active', () => {
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
      useDriveVoiceCommands({ enabled: true, onCommand, settleMs: 340 })
    );

    act(() => {
      vi.advanceTimersByTime(260);
    });

    // Frame 1 (interim): "ripeti"
    act(() => {
      instance?.onresult?.({
        results: [Object.assign([{ transcript: 'ripeti' }], { isFinal: false })]
      });
    });
    expect(onCommand).not.toHaveBeenCalled();
    expect(result.current.isRefining).toBe(true);
    expect(result.current.pendingCommand).toBe('repeat');

    // 180ms later (before 340ms settle expires), Frame 2 refines to "ripeti la due"
    act(() => {
      vi.advanceTimersByTime(180);
      instance?.onresult?.({
        results: [Object.assign([{ transcript: 'ripeti la due' }], { isFinal: false })]
      });
    });
    expect(onCommand).not.toHaveBeenCalled();
    expect(result.current.pendingCommand).toBe('repeat_opt2');

    // Speech settles after 340ms of stability -> fires only 'repeat_opt2'
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(onCommand).toHaveBeenCalledTimes(1);
    expect(onCommand).toHaveBeenCalledWith('repeat_opt2');
    expect(result.current.isRefining).toBe(false);

    unmount();
  });

  it('should allow mid-utterance self-correction ("uno... anzi due") before settle window expires', () => {
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
      useDriveVoiceCommands({ enabled: true, onCommand, settleMs: 340 })
    );

    act(() => {
      vi.advanceTimersByTime(260);
    });

    act(() => {
      instance?.onresult?.({
        results: [Object.assign([{ transcript: 'uno' }], { isFinal: false })]
      });
    });
    expect(onCommand).not.toHaveBeenCalled();
    expect(result.current.pendingCommand).toBe('opt1');

    act(() => {
      vi.advanceTimersByTime(150);
      instance?.onresult?.({
        results: [Object.assign([{ transcript: 'uno anzi due' }], { isFinal: true })]
      });
    });

    expect(onCommand).toHaveBeenCalledTimes(1);
    expect(onCommand).toHaveBeenCalledWith('opt2');

    unmount();
  });

  it('should fast-path emergency stop/pause commands immediately even when settleMs is active, and flush unsettled interim on natural onend', () => {
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
      useDriveVoiceCommands({ enabled: true, onCommand, settleMs: 340 })
    );

    act(() => {
      vi.advanceTimersByTime(260);
    });

    // Interim "stop" fires with 0ms delay
    act(() => {
      instance?.onresult?.({
        results: [Object.assign([{ transcript: 'stop' }], { isFinal: false })]
      });
    });
    expect(onCommand).toHaveBeenCalledTimes(1);
    expect(onCommand).toHaveBeenLastCalledWith('stop');

    // Next utterance at index 1 emits interim "seconda" and mobile WebView ends recognition before isFinal
    act(() => {
      instance?.onresult?.({
        results: [
          Object.assign([{ transcript: 'stop' }], { isFinal: true }),
          Object.assign([{ transcript: 'seconda' }], { isFinal: false })
        ]
      });
      instance?.onend?.();
    });
    expect(onCommand).toHaveBeenCalledTimes(2);
    expect(onCommand).toHaveBeenLastCalledWith('opt2');

    act(() => {
      vi.advanceTimersByTime(160);
    });


    expect(result.current.isListening).toBe(true);

    unmount();
  });

  it('should dispatch interim "due" in letters when mobile recognizer follows up with an empty final packet or transient no-match error', () => {
    let instance: MockSpeechRecognition | null = null;
    class SpyingRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instance = this;
      }
    }
    (window as any).SpeechRecognition = SpyingRecognition;

    const onCommand = vi.fn();
    const onUnrecognized = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDriveVoiceCommands({ enabled: true, onCommand, onUnrecognized, settleMs: 340 })
    );

    act(() => {
      vi.advanceTimersByTime(260);
    });

    // Scenario A: interim "due" in letters -> empty final packet 140ms later
    act(() => {
      instance?.onresult?.({
        results: [Object.assign([{ transcript: 'due' }], { isFinal: false })]
      });
    });
    expect(result.current.interimTranscript).toBe('due');
    expect(result.current.pendingCommand).toBe('opt2');

    act(() => {
      vi.advanceTimersByTime(140);
      instance?.onresult?.({
        results: [Object.assign([{ transcript: '' }], { isFinal: true })]
      });
    });
    expect(onCommand).toHaveBeenCalledTimes(1);
    expect(onCommand).toHaveBeenLastCalledWith('opt2');
    expect(onUnrecognized).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();

    // Scenario B: next utterance at index 1 streams interim "due" -> mobile fires onerror('no-match')
    act(() => {
      instance?.onresult?.({
        results: [
          Object.assign([{ transcript: '' }], { isFinal: true }),
          Object.assign([{ transcript: 'due' }], { isFinal: false })
        ]
      });
      vi.advanceTimersByTime(120);
      instance?.onerror?.({ error: 'no-match' });
    });

    expect(onCommand).toHaveBeenCalledTimes(2);
    expect(onCommand).toHaveBeenLastCalledWith('opt2');
    expect(onUnrecognized).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();

    unmount();
  });

  it('should isolate subsequent "due" from prior unsettled unrecognized noise and handle mobile in-place slot-0 reuse', () => {
    let instance: MockSpeechRecognition | null = null;
    class SpyingRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instance = this;
      }
    }
    (window as any).SpeechRecognition = SpyingRecognition;

    const onCommand = vi.fn();
    const onUnrecognized = vi.fn();
    const { unmount } = renderHook(() =>
      useDriveVoiceCommands({ enabled: true, onCommand, onUnrecognized, settleMs: 340 })
    );

    act(() => {
      vi.advanceTimersByTime(260);
    });

    // Unrecognized interim noise at index 0 settles after 340ms
    act(() => {
      instance?.onresult?.({
        results: [Object.assign([{ transcript: 'rumorefondo' }], { isFinal: false })]
      });
      vi.advanceTimersByTime(360);
    });
    expect(onCommand).not.toHaveBeenCalled();
    expect(onUnrecognized).toHaveBeenCalledWith('rumorefondo');

    // User speaks "due" at index 1 -> must NOT be poisoned by index 0 noise
    act(() => {
      instance?.onresult?.({
        results: [
          Object.assign([{ transcript: 'rumorefondo' }], { isFinal: false }),
          Object.assign([{ transcript: 'due' }], { isFinal: false })
        ]
      });
      vi.advanceTimersByTime(360);
    });
    expect(onCommand).toHaveBeenCalledTimes(1);
    expect(onCommand).toHaveBeenLastCalledWith('opt2');

    // Mobile WebView resets results array in-place back to index 0 without firing onend/onstart
    act(() => {
      instance?.onresult?.({
        results: [Object.assign([{ transcript: 'due' }], { isFinal: false })]
      });
      vi.advanceTimersByTime(360);
    });
    expect(onCommand).toHaveBeenCalledTimes(2);
    expect(onCommand).toHaveBeenLastCalledWith('opt2');

    unmount();
  });
});
