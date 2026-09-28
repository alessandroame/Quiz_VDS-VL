import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioDownloadManager } from './audioDownloadManager';

describe('AudioDownloadManager (src/services/audioDownloadManager.ts)', () => {
  let manager: AudioDownloadManager;

  beforeEach(() => {
    vi.restoreAllMocks();
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
});
