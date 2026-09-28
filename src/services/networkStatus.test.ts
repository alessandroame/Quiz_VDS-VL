import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkStatus } from './networkStatus';

describe('NetworkStatus (src/services/networkStatus.ts)', () => {
  let instance: NetworkStatus;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (instance) {
      instance.stopListening();
    }
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('NET-01: initializes with correct online status from navigator', () => {
    instance = new NetworkStatus();
    expect(typeof instance.isOnline()).toBe('boolean');
    expect(instance.getState().wasOffline).toBe(false);
  });

  it('NET-02: updates to offline when handleOffline is called, setting offlineSince', () => {
    instance = new NetworkStatus();
    const now = 1700000000000;
    vi.setSystemTime(now);

    instance.handleOffline();

    const state = instance.getState();
    expect(state.isOnline).toBe(false);
    expect(state.offlineSince).toBe(now);
    expect(state.wasOffline).toBe(false);
    expect(instance.isOnline()).toBe(false);
  });

  it('NET-03: transitions to online with wasOffline=true and clears offlineSince', () => {
    instance = new NetworkStatus();
    instance.handleOffline();
    expect(instance.getState().isOnline).toBe(false);

    instance.handleOnline();

    const state = instance.getState();
    expect(state.isOnline).toBe(true);
    expect(state.offlineSince).toBeNull();
    expect(state.wasOffline).toBe(true);
    expect(instance.isOnline()).toBe(true);
  });

  it('NET-04: resets wasOffline to false after 3500ms timeout', () => {
    instance = new NetworkStatus();
    instance.handleOffline();
    instance.handleOnline();

    expect(instance.getState().wasOffline).toBe(true);

    vi.advanceTimersByTime(3499);
    expect(instance.getState().wasOffline).toBe(true);

    vi.advanceTimersByTime(1);
    expect(instance.getState().wasOffline).toBe(false);
  });

  it('NET-05: notifies subscribed listeners on status changes', () => {
    instance = new NetworkStatus();
    const listener = vi.fn();

    const unsubscribe = instance.subscribe(listener);

    // Initial notification upon subscription
    expect(listener).toHaveBeenCalledTimes(1);

    instance.handleOffline();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOnline: false
      })
    );

    instance.handleOnline();
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOnline: true,
        wasOffline: true
      })
    );

    unsubscribe();
  });

  it('NET-06: stops notifying after unsubscribe', () => {
    instance = new NetworkStatus();
    const listener = vi.fn();

    const unsubscribe = instance.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();

    instance.handleOffline();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('NET-07: cancels reconnect timer if going offline before 3500ms expires', () => {
    instance = new NetworkStatus();
    instance.handleOffline();
    instance.handleOnline();
    expect(instance.getState().wasOffline).toBe(true);

    // After 1000ms, connection drops again
    vi.advanceTimersByTime(1000);
    instance.handleOffline();

    expect(instance.getState().isOnline).toBe(false);
    expect(instance.getState().wasOffline).toBe(false);

    // Advancing past original 3500ms should not cause issues or revert state
    vi.advanceTimersByTime(3000);
    expect(instance.getState().isOnline).toBe(false);
    expect(instance.getState().wasOffline).toBe(false);
  });

  it('NET-08: supports multiple listeners simultaneously', () => {
    instance = new NetworkStatus();
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    const unsubA = instance.subscribe(listenerA);
    const unsubB = instance.subscribe(listenerB);

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);

    instance.handleOffline();
    expect(listenerA).toHaveBeenCalledTimes(2);
    expect(listenerB).toHaveBeenCalledTimes(2);

    unsubA();
    instance.handleOnline();
    expect(listenerA).toHaveBeenCalledTimes(2);
    expect(listenerB).toHaveBeenCalledTimes(3);

    unsubB();
  });
});
