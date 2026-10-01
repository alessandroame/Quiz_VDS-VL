// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncEngine } from './syncEngine';
import { googleDrive } from './googleDrive';
import * as dbModule from '../db';

vi.mock('../db', () => ({
  exportDatabaseBackup: vi.fn(),
  importDatabaseBackup: vi.fn(),
  getSetting: vi.fn(),
  setSetting: vi.fn()
}));

const setNavigatorOnline = (online: boolean) => {
  if (typeof globalThis.navigator === 'undefined') {
    (globalThis as any).navigator = {};
  }
  Object.defineProperty(globalThis.navigator, 'onLine', {
    value: online,
    configurable: true,
    writable: true,
  });
};

describe('SyncEngine service', () => {
  let engine: SyncEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    setNavigatorOnline(true);
    vi.mocked(dbModule.getSetting).mockResolvedValue(false as any);
    vi.mocked(dbModule.setSetting).mockResolvedValue(undefined as any);
    vi.mocked(dbModule.exportDatabaseBackup).mockResolvedValue('{"version":2,"stats":[]}');
    vi.mocked(dbModule.importDatabaseBackup).mockResolvedValue({ success: true, message: 'OK' });
    vi.spyOn(googleDrive, 'downloadBackup').mockResolvedValue({ success: true, message: 'Nessun backup trovato' });
    vi.spyOn(googleDrive, 'uploadBackup').mockResolvedValue({ success: true, message: 'Saved' });
    engine = new SyncEngine();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state and allow subscriptions', () => {
    const state = engine.getState();
    expect(state.status).toBe('idle');
    expect(state.isAutoSyncEnabled).toBe(false);

    let receivedState: any = null;
    const unsubscribe = engine.subscribe(s => {
      receivedState = s;
    });

    expect(receivedState).toBeDefined();
    expect(receivedState.status).toBe('idle');

    unsubscribe();
  });

  it('should update autoSyncEnabled and notify listeners', () => {
    let callCount = 0;
    engine.subscribe(() => {
      callCount++;
    });

    engine.setAutoSyncEnabled(true, false);
    expect(engine.getState().isAutoSyncEnabled).toBe(true);
    expect(callCount).toBeGreaterThan(1);
  });

  it('should debounce push operations with real small delay', async () => {
    engine.setAutoSyncEnabled(true, false);
    const pushSpy = vi.spyOn(engine, 'pushNow').mockResolvedValue({ success: true, message: 'OK' });

    engine.schedulePush(20);
    engine.schedulePush(20);
    engine.schedulePush(20);

    expect(pushSpy).not.toHaveBeenCalled();

    await new Promise(r => setTimeout(r, 150));
    expect(pushSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle pushNow when offline', async () => {
    setNavigatorOnline(false);

    const result = await engine.pushNow();
    expect(result.success).toBe(false);
    expect(engine.getState().status).toBe('offline');

    setNavigatorOnline(true);
  });

  it('should perform pushNow successfully when online', async () => {
    setNavigatorOnline(true);

    const result = await engine.pushNow();
    expect(result.success).toBe(true);
    expect(engine.getState().status).toBe('synced');
    expect(engine.getState().lastSyncedAt).toBeDefined();
  });

  it('should perform pullNow and smart merge successfully', async () => {
    setNavigatorOnline(true);
    vi.spyOn(googleDrive, 'downloadBackup').mockResolvedValue({
      success: true,
      data: '{"version":2,"stats":[]}',
      message: 'OK'
    });

    const result = await engine.pullNow();
    expect(result.success).toBe(true);
    expect(dbModule.importDatabaseBackup).toHaveBeenCalledWith('{"version":2,"stats":[]}');
    expect(engine.getState().status).toBe('synced');
  });

  it('should perform fullSync seamlessly', async () => {
    setNavigatorOnline(true);
    vi.spyOn(googleDrive, 'downloadBackup').mockResolvedValue({
      success: true,
      data: '{"version":2,"stats":[]}',
      message: 'OK'
    });

    const result = await engine.fullSync();
    expect(result.success).toBe(true);
    expect(googleDrive.uploadBackup).toHaveBeenCalled();
    expect(engine.getState().status).toBe('synced');
  });

  it('should transition from error/needs_auth to synced when pushNow resolves successfully', async () => {
    // First simulate an error
    vi.spyOn(googleDrive, 'uploadBackup').mockResolvedValueOnce({
      success: false,
      message: 'Network error 500'
    });
    await engine.pushNow();
    expect(engine.getState().status).toBe('error');
    expect(engine.getState().errorDetail).toBe('Network error 500');

    // Next call succeeds (error resolved)
    vi.spyOn(googleDrive, 'uploadBackup').mockResolvedValueOnce({
      success: true,
      message: 'Backup saved'
    });
    const recoveryResult = await engine.pushNow();
    expect(recoveryResult.success).toBe(true);
    expect(engine.getState().status).toBe('synced');
    expect(engine.getState().errorDetail).toBeUndefined();
  });

  it('should transition from error to idle when autoSync is disabled', () => {
    (engine as any).status = 'error';
    (engine as any).errorDetail = 'Previous error';
    engine.setAutoSyncEnabled(false);
    expect(engine.getState().status).toBe('idle');
  });

  it('should auto-sync and become synced when valid token is received after needs_auth', async () => {
    vi.mocked(dbModule.getSetting).mockImplementation(async (key: any) => {
      if (key === 'autoSyncDrive') return true;
      return undefined;
    });

    vi.spyOn(googleDrive, 'downloadBackup').mockResolvedValue({
      success: true,
      data: '{"version":2,"stats":[]}',
      message: 'OK'
    });
    vi.spyOn(googleDrive, 'uploadBackup').mockResolvedValue({
      success: true,
      message: 'Saved'
    });

    await engine.init();
    (engine as any).status = 'needs_auth';

    // Trigger token listener directly
    (googleDrive as any).tokenListeners.forEach((fn: any) => fn('new_token_123'));
    await new Promise(r => setTimeout(r, 50));

    expect(engine.getState().status).toBe('synced');
  });

  it('should set isPopupBlocked to true and status to needs_auth when popup is blocked on pushNow', async () => {
    vi.spyOn(googleDrive, 'uploadBackup').mockResolvedValueOnce({
      success: false,
      message: 'popup_blocked_by_browser'
    });

    const res = await engine.pushNow(true);
    expect(res.success).toBe(false);
    expect(engine.getState().status).toBe('needs_auth');
    expect(engine.getState().isPopupBlocked).toBe(true);
    expect(engine.getState().errorDetail).toContain('Popup bloccato dal browser');
  });

  it('should clear isPopupBlocked when pushNow succeeds', async () => {
    (engine as any).isPopupBlocked = true;
    (engine as any).status = 'needs_auth';

    vi.spyOn(googleDrive, 'uploadBackup').mockResolvedValueOnce({
      success: true,
      message: 'Saved'
    });

    const res = await engine.pushNow(true);
    expect(res.success).toBe(true);
    expect(engine.getState().status).toBe('synced');
    expect(engine.getState().isPopupBlocked).toBe(false);
  });
});
