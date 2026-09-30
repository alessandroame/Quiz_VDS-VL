// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { networkStatus, type NetworkState } from '../services/networkStatus';
import { renderHook } from '../test/hookHarness';

describe('useOnlineStatus Hook', () => {
  it('should initialize with networkStatus state and update on network changes', () => {
    let subscriber: ((state: NetworkState) => void) | null = null;
    vi.spyOn(networkStatus, 'getState').mockReturnValue({
      isOnline: true,
      wasOffline: false,
      offlineSince: null
    });
    vi.spyOn(networkStatus, 'subscribe').mockImplementation((cb) => {
      subscriber = cb;
      return () => {
        subscriber = null;
      };
    });

    const { result, unmount } = renderHook(() => useOnlineStatus());

    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      subscriber?.({
        isOnline: false,
        wasOffline: false,
        offlineSince: Date.now()
      });
    });

    expect(result.current.isOnline).toBe(false);

    unmount();
    expect(subscriber).toBeNull();
  });
});
