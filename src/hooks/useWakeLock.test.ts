// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { useWakeLock } from './useWakeLock';
import { renderHook } from '../test/hookHarness';

describe('useWakeLock Hook', () => {
  let originalWakeLock: any;

  beforeEach(() => {
    originalWakeLock = (navigator as any).wakeLock;
  });

  afterEach(() => {
    if (originalWakeLock) {
      Object.defineProperty(navigator, 'wakeLock', {
        value: originalWakeLock,
        configurable: true,
        writable: true
      });
    } else {
      delete (navigator as any).wakeLock;
    }
    vi.restoreAllMocks();
  });

  it('should report isSupported as false when wakeLock is absent from navigator', () => {
    delete (navigator as any).wakeLock;

    const { result, unmount } = renderHook(() => useWakeLock(true));

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isActive).toBe(false);
    expect(result.current.error).toBeNull();
    unmount();
  });

  it('should request screen wake lock and set isActive to true when enabled', async () => {
    const releaseListeners: Array<() => void> = [];
    const mockSentinel = {
      released: false,
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'release') releaseListeners.push(cb);
      }),
      removeEventListener: vi.fn(),
      release: vi.fn(async () => {
        mockSentinel.released = true;
      })
    };

    const mockRequest = vi.fn().mockResolvedValue(mockSentinel);

    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: mockRequest },
      configurable: true,
      writable: true
    });

    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useWakeLock(true));
      // Allow async requestLock promise to resolve
      await Promise.resolve();
    });

    expect(hookResult.result.current.isSupported).toBe(true);
    expect(mockRequest).toHaveBeenCalledWith('screen');
    expect(hookResult.result.current.isActive).toBe(true);
    expect(hookResult.result.current.error).toBeNull();

    // Release lock on unmount
    await act(async () => {
      hookResult.unmount();
      await Promise.resolve();
    });

    expect(mockSentinel.release).toHaveBeenCalled();
  });

  it('should handle rejection gracefully when wakeLock request fails', async () => {
    const mockRequest = vi.fn().mockRejectedValue(new Error('Permission denied'));

    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: mockRequest },
      configurable: true,
      writable: true
    });

    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useWakeLock(true));
      await Promise.resolve();
    });

    expect(hookResult.result.current.isSupported).toBe(true);
    expect(hookResult.result.current.isActive).toBe(false);
    expect(hookResult.result.current.error).toBe('Permission denied');

    hookResult.unmount();
  });

  it('should not request lock when enabled is false', async () => {
    const mockRequest = vi.fn();
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: mockRequest },
      configurable: true,
      writable: true
    });

    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useWakeLock(false));
      await Promise.resolve();
    });

    expect(mockRequest).not.toHaveBeenCalled();
    expect(hookResult.result.current.isActive).toBe(false);

    hookResult.unmount();
  });

  it('should re-request lock when visibilityState changes to visible', async () => {
    const mockSentinel = {
      released: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      release: vi.fn().mockResolvedValue(undefined)
    };

    const mockRequest = vi.fn().mockResolvedValue(mockSentinel);

    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: mockRequest },
      configurable: true,
      writable: true
    });

    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useWakeLock(true));
      await Promise.resolve();
    });

    expect(mockRequest).toHaveBeenCalledTimes(1);

    // Mock document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true
    });

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    expect(mockRequest).toHaveBeenCalledTimes(2);

    hookResult.unmount();
  });
});
