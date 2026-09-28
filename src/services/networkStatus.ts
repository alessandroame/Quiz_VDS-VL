export interface NetworkState {
  /**
   * Whether the browser is currently connected to the network.
   */
  isOnline: boolean;
  /**
   * Temporary flag set to true for 3.5 seconds after transitioning from offline to online.
   */
  wasOffline: boolean;
  /**
   * Timestamp in milliseconds when the device went offline, or null if currently online.
   */
  offlineSince: number | null;
}

export type NetworkStateListener = (state: NetworkState) => void;

/**
 * Service to monitor and broadcast network connectivity status (online/offline).
 * Follows Single Responsibility Principle (SRP) and cockpit design rules.
 */
export class NetworkStatus {
  private online: boolean;
  private wasRecentlyOffline: boolean = false;
  private offlineTimestamp: number | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<NetworkStateListener> = new Set();
  private isListening: boolean = false;

  constructor() {
    this.online =
      typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
        ? navigator.onLine
        : true;
    if (!this.online) {
      this.offlineTimestamp = Date.now();
    }
    if (typeof window !== 'undefined') {
      this.startListening();
    }
  }

  public getState(): NetworkState {
    return {
      isOnline: this.online,
      wasOffline: this.wasRecentlyOffline,
      offlineSince: this.offlineTimestamp
    };
  }

  public isOnline(): boolean {
    return this.online;
  }

  public startListening(): void {
    if (this.isListening || typeof window === 'undefined') return;
    this.isListening = true;

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  public stopListening(): void {
    if (!this.isListening || typeof window === 'undefined') return;
    this.isListening = false;

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public subscribe(listener: NetworkStateListener): () => void {
    this.listeners.add(listener);
    this.startListening();
    listener(this.getState());

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopListening();
      }
    };
  }

  public handleOnline = (): void => {
    this.online = true;
    this.offlineTimestamp = null;
    this.wasRecentlyOffline = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = setTimeout(() => {
      this.wasRecentlyOffline = false;
      this.reconnectTimer = null;
      this.notify();
    }, 3500);

    this.notify();
  };

  public handleOffline = (): void => {
    this.online = false;
    this.offlineTimestamp = Date.now();
    this.wasRecentlyOffline = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.notify();
  };

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in NetworkStatus listener:', err);
      }
    }
  }
}

export const networkStatus = new NetworkStatus();
