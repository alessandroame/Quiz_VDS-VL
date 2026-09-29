import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioDownloadManager } from './audioDownloadManager';
import { db } from '../db';

describe('AudioDownloadManager (src/services/audioDownloadManager.ts)', () => {
  let manager: AudioDownloadManager;

  beforeEach(async () => {
    vi.restoreAllMocks();
    await db.delete();
    await db.open();
    manager = new AudioDownloadManager();
  });

  afterEach(() => {
    manager.cancelDownload('giuseppe');
    manager.cancelDownload('elsa');
  });

  it('ADM-01: calculates total snippets and generates 2520 URLs per voice', () => {
    expect(manager.getTotalSnippetCount()).toBe(2520);

    const giuseppeUrls = manager.generateUrls('giuseppe');
    expect(giuseppeUrls).toHaveLength(2520);
    expect(giuseppeUrls[0]).toContain('/audio/giuseppe/1001_q.mp3');
    expect(giuseppeUrls[1]).toContain('/audio/giuseppe/1001_1.mp3');
    expect(giuseppeUrls[2]).toContain('/audio/giuseppe/1001_2.mp3');
    expect(giuseppeUrls[3]).toContain('/audio/giuseppe/1001_3.mp3');
    expect(giuseppeUrls[4]).toContain('/audio/giuseppe/1001_e.mp3');

    const elsaUrls = manager.generateUrls('elsa');
    expect(elsaUrls).toHaveLength(2520);
    expect(elsaUrls[0]).toContain('/audio/elsa/1001_q.mp3');
  });

  it('ADM-02: returns correct cache names', () => {
    expect(manager.getCacheName('giuseppe')).toBe('vds-audio-giuseppe');
    expect(manager.getCacheName('elsa')).toBe('vds-audio-elsa');
  });

  it('ADM-03: initializes with clean zero statuses', () => {
    const statuses = manager.getAllStatuses();
    expect(statuses.giuseppe.downloadedCount).toBe(0);
    expect(statuses.giuseppe.percent).toBe(0);
    expect(statuses.giuseppe.isDownloading).toBe(false);
    expect(statuses.giuseppe.isComplete).toBe(false);

    expect(statuses.elsa.downloadedCount).toBe(0);
    expect(statuses.elsa.percent).toBe(0);
  });

  it('ADM-04: subscriber receives status changes', () => {
    const listener = vi.fn();
    const unsubscribe = manager.subscribe(listener);

    expect(listener).toHaveBeenCalledWith(manager.getAllStatuses());

    unsubscribe();
  });

  it('ADM-05: isVoiceReady and getAvailableOfflineVoice evaluate correctly', () => {
    expect(manager.isVoiceReady('giuseppe')).toBe(false);
    expect(manager.getAvailableOfflineVoice()).toBeNull();

    // Mock statuses directly for threshold tests
    (manager as any).statuses.giuseppe.downloadedCount = 2100;
    expect(manager.isVoiceReady('giuseppe')).toBe(true);
    expect(manager.getAvailableOfflineVoice()).toBe('giuseppe');

    (manager as any).statuses.giuseppe.downloadedCount = 0;
    (manager as any).statuses.elsa.isComplete = true;
    expect(manager.isVoiceReady('elsa')).toBe(true);
    expect(manager.getAvailableOfflineVoice()).toBe('elsa');
  });

  it('ADM-06: deleteCache cleans up status and invokes caches.delete', async () => {
    const deleteSpy = vi.fn().mockResolvedValue(true);
    (globalThis as any).window = {
      caches: {
        has: vi.fn().mockResolvedValue(true),
        open: vi.fn().mockResolvedValue({
          keys: vi.fn().mockResolvedValue([]),
          put: vi.fn().mockResolvedValue(undefined)
        }),
        delete: deleteSpy
      }
    };

    (manager as any).statuses.giuseppe.downloadedCount = 1500;
    (manager as any).statuses.giuseppe.percent = 60;

    await manager.deleteCache('giuseppe');

    expect(deleteSpy).toHaveBeenCalledWith('vds-audio-giuseppe');
    const status = manager.getStatus('giuseppe');
    expect(status.downloadedCount).toBe(0);
    expect(status.percent).toBe(0);
    expect(status.isComplete).toBe(false);
  });

  it('ADM-07: cancelDownload stops active downloading state', () => {
    (manager as any).statuses.giuseppe.isDownloading = true;
    manager.cancelDownload('giuseppe');
    expect(manager.getStatus('giuseppe').isDownloading).toBe(false);
  });

  it('ADM-08: isAnyDownloading detects active downloads across voices', () => {
    expect(manager.isAnyDownloading()).toBe(false);

    (manager as any).statuses.elsa.isDownloading = true;
    expect(manager.isAnyDownloading()).toBe(true);

    (manager as any).statuses.elsa.isDownloading = false;
    (manager as any).statuses.giuseppe.isDownloading = true;
    expect(manager.isAnyDownloading()).toBe(true);

    (manager as any).statuses.giuseppe.isDownloading = false;
    expect(manager.isAnyDownloading()).toBe(false);
  });

  it('ADM-09: fetchRemoteManifest returns parsed json on 200 OK and null on HTTP error', async () => {
    const mockManifest = {
      version: '1.0.0',
      generatedAt: '2026-09-29T10:00:00Z',
      totalSnippetsPerVoice: 2520,
      voices: {
        giuseppe: { version: '1.0.0', files: { '1001_q.mp3': 'abc12345' } },
        elsa: { version: '1.0.0', files: { '1001_q.mp3': 'xyz12345' } }
      }
    };

    const fetchSpy = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockManifest
    });
    vi.stubGlobal('fetch', fetchSpy);

    const result = await manager.fetchRemoteManifest();
    expect(result).toEqual(mockManifest);
    expect(fetchSpy).toHaveBeenCalled();

    // Now test failure response
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 404 });
    const failResult = await manager.fetchRemoteManifest();
    expect(failResult).toBeNull();
  });

  it('ADM-10: getInstalledMetadata and saveInstalledMetadata persist in Dexie', async () => {
    const meta = {
      voice: 'giuseppe' as const,
      version: '1.0.2',
      hashes: { '1001_q.mp3': 'hash_test_1', '1001_1.mp3': 'hash_test_2' },
      lastCheckedAt: Date.now()
    };

    await manager.saveInstalledMetadata(meta);
    const retrieved = await manager.getInstalledMetadata('giuseppe');
    expect(retrieved).toBeDefined();
    expect(retrieved?.version).toBe('1.0.2');
    expect(retrieved?.hashes['1001_q.mp3']).toBe('hash_test_1');

    const empty = await manager.getInstalledMetadata('elsa');
    expect(empty).toBeNull();
  });

  it('ADM-11: checkAudioUpdates detects offline state when navigator.onLine is false', async () => {
    vi.stubGlobal('navigator', { onLine: false });

    const result = await manager.checkAudioUpdates();
    expect(result.isOffline).toBe(true);
    expect(result.hasUpdates).toBe(false);
  });

  it('ADM-12: checkAudioUpdates detects stale files when remote hash differs from local metadata', async () => {
    vi.stubGlobal('navigator', { onLine: true });

    // Mock checkStatus to simulate Giuseppe being already downloaded/complete
    vi.spyOn(manager, 'checkStatus').mockImplementation(async (voice) => {
      (manager as any).statuses[voice].isComplete = true;
      return manager.getStatus(voice);
    });

    // Save local installed metadata
    await manager.saveInstalledMetadata({
      voice: 'giuseppe',
      version: '1.0.0',
      hashes: {
        '1001_q.mp3': 'old_hash_q',
        '1001_1.mp3': 'same_hash_1'
      },
      lastCheckedAt: Date.now()
    });

    const mockManifest = {
      version: '1.0.1',
      generatedAt: '2026-09-29T11:00:00Z',
      totalSnippetsPerVoice: 2520,
      voices: {
        giuseppe: {
          version: '1.0.1',
          files: {
            '1001_q.mp3': 'new_hash_q',
            '1001_1.mp3': 'same_hash_1'
          }
        },
        elsa: {
          version: '1.0.0',
          files: {}
        }
      }
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockManifest
    }));

    const result = await manager.checkAudioUpdates('giuseppe');
    expect(result.hasUpdates).toBe(true);
    expect(result.voiceUpdates.giuseppe.hasUpdates).toBe(true);
    expect(result.voiceUpdates.giuseppe.staleFiles).toEqual(['1001_q.mp3']);
  });

  it('ADM-13: checkAudioUpdates returns hasUpdates false when all hashes match', async () => {
    vi.stubGlobal('navigator', { onLine: true });

    vi.spyOn(manager, 'checkStatus').mockImplementation(async (voice) => {
      (manager as any).statuses[voice].isComplete = true;
      return manager.getStatus(voice);
    });

    await manager.saveInstalledMetadata({
      voice: 'giuseppe',
      version: '1.0.0',
      hashes: {
        '1001_q.mp3': 'match_hash_q',
        '1001_1.mp3': 'match_hash_1'
      },
      lastCheckedAt: Date.now()
    });

    const mockManifest = {
      version: '1.0.0',
      generatedAt: '2026-09-29T11:00:00Z',
      totalSnippetsPerVoice: 2520,
      voices: {
        giuseppe: {
          version: '1.0.0',
          files: {
            '1001_q.mp3': 'match_hash_q',
            '1001_1.mp3': 'match_hash_1'
          }
        },
        elsa: { version: '1.0.0', files: {} }
      }
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockManifest
    }));

    const result = await manager.checkAudioUpdates('giuseppe');
    expect(result.hasUpdates).toBe(false);
    expect(result.voiceUpdates.giuseppe.hasUpdates).toBe(false);
    expect(result.voiceUpdates.giuseppe.staleFiles).toHaveLength(0);
  });

  it('ADM-14: applyAudioUpdates fetches stale files, stores in CacheStorage, and updates Dexie metadata', async () => {
    vi.stubGlobal('navigator', { onLine: true });

    vi.spyOn(manager, 'checkStatus').mockImplementation(async (voice) => {
      (manager as any).statuses[voice].isComplete = true;
      return manager.getStatus(voice);
    });

    await manager.saveInstalledMetadata({
      voice: 'giuseppe',
      version: '1.0.0',
      hashes: {
        '1001_q.mp3': 'old_hash'
      },
      lastCheckedAt: Date.now()
    });

    const mockManifest = {
      version: '1.0.1',
      generatedAt: '2026-09-29T11:00:00Z',
      totalSnippetsPerVoice: 2520,
      voices: {
        giuseppe: {
          version: '1.0.1',
          files: {
            '1001_q.mp3': 'updated_hash'
          }
        },
        elsa: { version: '1.0.0', files: {} }
      }
    };

    const mockCachePut = vi.fn().mockResolvedValue(undefined);
    const mockCache = {
      put: mockCachePut,
      keys: vi.fn().mockResolvedValue(['http://localhost:5173/audio/giuseppe/1001_q.mp3'])
    };

    (globalThis as any).window = {
      caches: {
        has: vi.fn().mockResolvedValue(true),
        open: vi.fn().mockResolvedValue(mockCache),
        delete: vi.fn().mockResolvedValue(true)
      }
    };

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('manifest.json')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockManifest
        });
      }
      return Promise.resolve({
        ok: true,
        blob: async () => new Blob(['fake_mp3_content'])
      });
    }));

    const progressSpy = vi.fn();
    const result = await manager.applyAudioUpdates('giuseppe', progressSpy);

    expect(result.updatedCount).toBe(1);
    expect(mockCachePut).toHaveBeenCalledTimes(1);
    expect(progressSpy).toHaveBeenCalledWith(100, 1, 1);

    // Verify Dexie metadata updated
    const updatedMeta = await manager.getInstalledMetadata('giuseppe');
    expect(updatedMeta?.hashes['1001_q.mp3']).toBe('updated_hash');
    expect(updatedMeta?.version).toBe('1.0.1');
  });

  it('ADM-15: autoCheckAndSyncOnStartup triggers update if stale files <= 25', async () => {
    vi.stubGlobal('navigator', { onLine: true });

    (manager as any).statuses.giuseppe.isComplete = true;

    const checkSpy = vi.spyOn(manager, 'checkAudioUpdates').mockResolvedValue({
      hasUpdates: true,
      manifest: null,
      voiceUpdates: {
        giuseppe: {
          hasUpdates: true,
          currentVersion: '1.0.0',
          remoteVersion: '1.0.1',
          staleFiles: ['1001_q.mp3'],
          totalStaleBytes: 60000
        },
        elsa: {
          hasUpdates: false,
          currentVersion: '1.0.0',
          remoteVersion: '1.0.0',
          staleFiles: [],
          totalStaleBytes: 0
        }
      }
    });

    const applySpy = vi.spyOn(manager, 'applyAudioUpdates').mockResolvedValue({
      updatedCount: 1,
      error: null
    });

    await manager.autoCheckAndSyncOnStartup();

    expect(checkSpy).toHaveBeenCalled();
    expect(applySpy).toHaveBeenCalledWith('giuseppe');
  });
});
