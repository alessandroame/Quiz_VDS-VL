import { googleDrive } from './googleDrive';
import { exportDatabaseBackup, importDatabaseBackup, getSetting, setSetting } from '../db';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'needs_auth' | 'error';

export interface SyncEngineState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  errorDetail?: string;
  isAutoSyncEnabled: boolean;
  isPopupBlocked?: boolean;
}

type SyncStateListener = (state: SyncEngineState) => void;

const isDeviceOnline = (): boolean => {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true;
};

/**
 * Formats a synchronization epoch timestamp in local timezone.
 * Shows "Oggi, HH:MM" when synced on the same local calendar day,
 * or "DD/MM/YYYY, HH:MM" for previous days.
 */
export function formatSyncTimestamp(timestamp: number | null | undefined, nowMs: number = Date.now()): string {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return 'Mai salvato';
  }
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return 'Mai salvato';
  }
  const now = new Date(nowMs);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return `Oggi, ${timeStr}`;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}, ${timeStr}`;
}

export class SyncEngine {
  private status: SyncStatus = 'idle';
  private lastSyncedAt: number | null = null;
  private errorDetail: string | undefined = undefined;
  private isAutoSyncEnabled: boolean = false;
  private isPopupBlocked: boolean = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<SyncStateListener> = new Set();
  private isInitialized: boolean = false;

  public subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): SyncEngineState {
    return {
      status: this.status,
      lastSyncedAt: this.lastSyncedAt,
      errorDetail: this.errorDetail,
      isAutoSyncEnabled: this.isAutoSyncEnabled,
      isPopupBlocked: this.isPopupBlocked
    };
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in SyncEngine listener:', err);
      }
    }
  }

  private setStatus(status: SyncStatus, errorDetail?: string, isPopupBlocked?: boolean): void {
    this.status = status;
    this.errorDetail = errorDetail;
    if (isPopupBlocked !== undefined) {
      this.isPopupBlocked = isPopupBlocked;
    } else if (status === 'synced' || status === 'idle') {
      this.isPopupBlocked = false;
    }
    this.notify();
  }

  private checkIsPopupBlocked(message?: string): boolean {
    if (!message) return false;
    const lower = message.toLowerCase();
    return (
      lower.includes('popup_blocked') ||
      lower.includes('popup bloccato') ||
      lower.includes('blocked_by_browser') ||
      (lower.includes('popup') && lower.includes('block'))
    );
  }

  private checkIsAuthRequired(message?: string): boolean {
    if (!message) return false;
    const lower = message.toLowerCase();
    return (
      lower.includes('token') ||
      lower.includes('inizializzato') ||
      lower.includes('401') ||
      lower.includes('403') ||
      lower.includes('richiesto') ||
      lower.includes('scaduto') ||
      lower.includes('revocato')
    );
  }

  public async init(clientId?: string): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Load autoSyncDrive setting from Dexie
    this.isAutoSyncEnabled = await getSetting('autoSyncDrive', false);
    const lastSync = await getSetting<number | undefined>('lastDriveSyncAt', undefined);
    if (lastSync) {
      this.lastSyncedAt = lastSync;
    }

    if (typeof window !== 'undefined') {
      googleDrive.initTokenClient(clientId);
      if (!googleDrive.isGisLoaded()) {
        window.addEventListener(
          'load',
          () => {
            googleDrive.initTokenClient(clientId);
          },
          { once: true }
        );
      }

      googleDrive.addTokenListener(() => {
        // Token received: clear needs_auth/error and auto-sync if enabled
        this.isPopupBlocked = false;
        if (this.status === 'needs_auth' || this.status === 'error') {
          if (this.isAutoSyncEnabled && isDeviceOnline()) {
            this.fullSync().catch(console.error);
          } else {
            this.setStatus('synced', undefined, false);
          }
        }
      });

      // Network lifecycle listeners
      window.addEventListener('online', () => {
        if (!isDeviceOnline()) return;
        if (this.isAutoSyncEnabled) {
          this.fullSync();
        } else {
          this.setStatus('idle');
        }
      });

      window.addEventListener('offline', () => {
        this.setStatus('offline');
      });

      if (!isDeviceOnline()) {
        this.setStatus('offline');
      } else if (this.isAutoSyncEnabled && googleDrive.hasValidToken()) {
        this.fullSync(false).catch(err => {
          console.warn('SyncEngine startup background fullSync error:', err);
        });
      }
    }

    this.notify();
  }

  public setAutoSyncEnabled(enabled: boolean, triggerImmediateSync = true): void {
    this.isAutoSyncEnabled = enabled;
    setSetting('autoSyncDrive', enabled);
    if (!enabled && (this.status === 'error' || this.status === 'needs_auth')) {
      this.setStatus('idle');
    }
    this.notify();
    if (enabled && triggerImmediateSync && isDeviceOnline()) {
      this.fullSync(true).catch(err => {
        console.warn('SyncEngine background fullSync error:', err);
      });
    }
  }

  /**
   * Schedules a debounced sync after modifications.
   */
  public schedulePush(delayMs = 15000): void {
    if (!this.isAutoSyncEnabled) return;

    if (!isDeviceOnline()) {
      this.setStatus('offline');
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.pushNow();
    }, delayMs);
  }

  /**
   * Performs an immediate upload of the current database state to Google Drive.
   */
  public async pushNow(interactive = false): Promise<{ success: boolean; message: string }> {
    if (!isDeviceOnline()) {
      this.setStatus('offline');
      return { success: false, message: 'Dispositivo offline' };
    }

    this.setStatus('syncing');

    try {
      const jsonBackup = await exportDatabaseBackup();
      const res = await googleDrive.uploadBackup(jsonBackup, interactive);

      if (res.success) {
        const now = Date.now();
        this.lastSyncedAt = now;
        await setSetting('lastDriveSyncAt', now);
        this.setStatus('synced', undefined, false);
        return { success: true, message: 'Salvataggio completato' };
      } else {
        if (this.checkIsPopupBlocked(res.message)) {
          this.setStatus(
            'needs_auth',
            'Popup bloccato dal browser: abilita i popup per questo sito per collegare Google Drive',
            true
          );
          return {
            success: false,
            message: 'Popup bloccato dal browser: abilita i popup nella barra degli indirizzi e riprova'
          };
        } else if (this.checkIsAuthRequired(res.message)) {
          this.setStatus('needs_auth', res.message, false);
        } else {
          this.setStatus('error', res.message, false);
        }
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      const msg = err?.message || 'Errore sincronizzazione';
      if (this.checkIsPopupBlocked(msg)) {
        this.setStatus(
          'needs_auth',
          'Popup bloccato dal browser: abilita i popup per questo sito per collegare Google Drive',
          true
        );
        return {
          success: false,
          message: 'Popup bloccato dal browser: abilita i popup nella barra degli indirizzi e riprova'
        };
      } else if (this.checkIsAuthRequired(msg)) {
        this.setStatus('needs_auth', msg, false);
      } else {
        this.setStatus('error', msg, false);
      }
      return { success: false, message: msg };
    }
  }

  /**
   * Downloads latest backup from Google Drive and merges it into local Dexie database.
   */
  public async pullNow(interactive = false): Promise<{ success: boolean; message: string }> {
    if (!isDeviceOnline()) {
      this.setStatus('offline');
      return { success: false, message: 'Dispositivo offline' };
    }

    this.setStatus('syncing');

    try {
      const res = await googleDrive.downloadBackup(interactive);
      if (!res.success || !res.data) {
        if (res.message.includes('Nessun backup trovato')) {
          this.setStatus('synced', undefined, false);
          return { success: true, message: res.message };
        }
        if (this.checkIsPopupBlocked(res.message)) {
          this.setStatus(
            'needs_auth',
            'Popup bloccato dal browser: abilita i popup per questo sito per collegare Google Drive',
            true
          );
          return {
            success: false,
            message: 'Popup bloccato dal browser: abilita i popup nella barra degli indirizzi e riprova'
          };
        } else if (this.checkIsAuthRequired(res.message)) {
          this.setStatus('needs_auth', res.message, false);
        } else {
          this.setStatus('error', res.message, false);
        }
        return { success: false, message: res.message };
      }

      const importRes = await importDatabaseBackup(res.data);
      if (importRes.success) {
        const now = Date.now();
        this.lastSyncedAt = now;
        await setSetting('lastDriveSyncAt', now);
        this.setStatus('synced', undefined, false);
        return { success: true, message: importRes.message };
      } else {
        this.setStatus('error', importRes.message, false);
        return { success: false, message: importRes.message };
      }
    } catch (err: any) {
      const msg = err?.message || 'Errore ripristino cloud';
      if (this.checkIsPopupBlocked(msg)) {
        this.setStatus(
          'needs_auth',
          'Popup bloccato dal browser: abilita i popup per questo sito per collegare Google Drive',
          true
        );
        return {
          success: false,
          message: 'Popup bloccato dal browser: abilita i popup nella barra degli indirizzi e riprova'
        };
      } else if (this.checkIsAuthRequired(msg)) {
        this.setStatus('needs_auth', msg, false);
      } else {
        this.setStatus('error', msg, false);
      }
      return { success: false, message: msg };
    }
  }

  /**
   * Full bidirectional sync: pulls latest cloud changes, smart merges with local DB,
   * then pushes the unified result back to Google Drive so both are in complete parity.
   */
  public async fullSync(interactive = false): Promise<{ success: boolean; message: string }> {
    if (!isDeviceOnline()) {
      this.setStatus('offline');
      return { success: false, message: 'Dispositivo offline' };
    }

    this.setStatus('syncing');

    try {
      // 1. Pull & Merge
      const pullRes = await googleDrive.downloadBackup(interactive);
      if (pullRes.success && pullRes.data) {
        await importDatabaseBackup(pullRes.data);
      } else if (!pullRes.success && !pullRes.message.includes('Nessun backup trovato')) {
        if (this.checkIsPopupBlocked(pullRes.message)) {
          this.setStatus(
            'needs_auth',
            'Popup bloccato dal browser: abilita i popup per questo sito per collegare Google Drive',
            true
          );
          return {
            success: false,
            message: 'Popup bloccato dal browser: abilita i popup nella barra degli indirizzi e riprova'
          };
        } else if (this.checkIsAuthRequired(pullRes.message)) {
          this.setStatus('needs_auth', pullRes.message, false);
        } else {
          this.setStatus('error', pullRes.message, false);
        }
        return { success: false, message: pullRes.message };
      }

      // 2. Push merged state
      const mergedBackup = await exportDatabaseBackup();
      const pushRes = await googleDrive.uploadBackup(mergedBackup, interactive);

      if (pushRes.success) {
        const now = Date.now();
        this.lastSyncedAt = now;
        await setSetting('lastDriveSyncAt', now);
        this.setStatus('synced', undefined, false);
        return { success: true, message: 'Sincronizzazione completata con successo' };
      } else {
        if (this.checkIsPopupBlocked(pushRes.message)) {
          this.setStatus(
            'needs_auth',
            'Popup bloccato dal browser: abilita i popup per questo sito per collegare Google Drive',
            true
          );
          return {
            success: false,
            message: 'Popup bloccato dal browser: abilita i popup nella barra degli indirizzi e riprova'
          };
        } else if (this.checkIsAuthRequired(pushRes.message)) {
          this.setStatus('needs_auth', pushRes.message, false);
        } else {
          this.setStatus('error', pushRes.message, false);
        }
        return { success: false, message: pushRes.message };
      }
    } catch (err: any) {
      const msg = err?.message || 'Errore sincronizzazione completa';
      if (this.checkIsPopupBlocked(msg)) {
        this.setStatus(
          'needs_auth',
          'Popup bloccato dal browser: abilita i popup per questo sito per collegare Google Drive',
          true
        );
        return {
          success: false,
          message: 'Popup bloccato dal browser: abilita i popup nella barra degli indirizzi e riprova'
        };
      } else if (this.checkIsAuthRequired(msg)) {
        this.setStatus('needs_auth', msg, false);
      } else {
        this.setStatus('error', msg, false);
      }
      return { success: false, message: msg };
    }
  }
}

export const syncEngine = new SyncEngine();
