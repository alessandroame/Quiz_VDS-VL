import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerHapticFeedback } from './haptics';

describe('Suite 18: haptics (Aviation Tactile Feedback Utility)', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true
    });
  });

  it('HAPTIC-01: triggers tap vibration with 20ms duration', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(globalThis, 'navigator', {
      value: { vibrate: vibrateMock },
      writable: true,
      configurable: true
    });

    const res = triggerHapticFeedback('tap');
    expect(res).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith(20);
  });

  it('HAPTIC-02: triggers success pattern [25, 60, 40]', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(globalThis, 'navigator', {
      value: { vibrate: vibrateMock },
      writable: true,
      configurable: true
    });

    const res = triggerHapticFeedback('success');
    expect(res).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith([25, 60, 40]);
  });

  it('HAPTIC-03: triggers error pattern [50, 80, 50, 80, 50]', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(globalThis, 'navigator', {
      value: { vibrate: vibrateMock },
      writable: true,
      configurable: true
    });

    const res = triggerHapticFeedback('error');
    expect(res).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith([50, 80, 50, 80, 50]);
  });

  it('HAPTIC-04: triggers warning pattern [35, 50, 35]', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(globalThis, 'navigator', {
      value: { vibrate: vibrateMock },
      writable: true,
      configurable: true
    });

    const res = triggerHapticFeedback('warning');
    expect(res).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith([35, 50, 35]);
  });

  it('HAPTIC-05: returns false gracefully when navigator.vibrate is undefined', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      writable: true,
      configurable: true
    });

    const res = triggerHapticFeedback('tap');
    expect(res).toBe(false);
  });

  it('HAPTIC-06: catches vibration exception safely and returns false', () => {
    const vibrateMock = vi.fn().mockImplementation(() => {
      throw new Error('NotAllowedError');
    });
    Object.defineProperty(globalThis, 'navigator', {
      value: { vibrate: vibrateMock },
      writable: true,
      configurable: true
    });

    const res = triggerHapticFeedback('tap');
    expect(res).toBe(false);
  });
});
