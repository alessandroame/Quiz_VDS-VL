// Audio Download Manager for VDS-VL Quiz Master
// Manages non-blocking background downloads of neural TTS audio snippets into CacheStorage

import questionsData from '../data/questions.json';
import type {
  VoiceName,
  AudioManifest,
  VoiceUpdateDetail,
  AudioUpdateCheckResult,
  InstalledVoiceMetadata
} from '../types/audio';
import { db } from '../db';
import { telemetry } from './telemetry';

export type { VoiceName, AudioManifest, VoiceUpdateDetail, AudioUpdateCheckResult, InstalledVoiceMetadata };


export interface VoiceDownloadProgress {
  voice: VoiceName;
  downloadedCount: number;
  totalCount: number;
  percent: number;
  isDownloading: boolean;
  isComplete: boolean;
  error: string | null;
}

export type DownloadEventListener = (
  statuses: Record<VoiceName, VoiceDownloadProgress>
) => void;

const PARTS = ['q', '1', '2', '3', 'e'] as const;
const CONCURRENCY = 8;

export class AudioDownloadManager {
  private abortControllers: Partial<Record<VoiceName, AbortController>> = {};
  private activePromises: Partial<Record<VoiceName, Promise<void>>> = {};
  private listeners: Set<DownloadEventListener> = new Set();

  private statuses: Record<VoiceName, VoiceDownloadProgress> = {
    giuseppe: {
      voice: 'giuseppe',
      downloadedCount: 0,
      totalCount: 2520,
      percent: 0,
      isDownloading: false,
      isComplete: false,
      error: null
    },
    elsa: {
      voice: 'elsa',
      downloadedCount: 0,
      totalCount: 2520,
      percent: 0,
      isDownloading: false,
      isComplete: false,
      error: null
    }
  };

  constructor() {
    if (typeof window !== 'undefined' && 'caches' in window) {
      // Defer initial status check to not block startup
      setTimeout(() => {
        this.checkAllStatuses().catch(() => {});
      }, 500);
    }
  }

  public getCacheName(voice: VoiceName): string {
    return `vds-audio-${voice}`;
  }

  public getBaseUrl(): string {
    return (import.meta.env?.BASE_URL || '/').replace(/\/+$/, '');
  }

  /**
   * Generates the complete list of relative URLs for all 2,520 files of a given voice
   */
  public generateUrls(voice: VoiceName): string[] {
    const baseUrl = this.getBaseUrl();
    const urls: string[] = [];

    for (const q of questionsData) {
      for (const part of PARTS) {
        urls.push(`${baseUrl}/audio/${voice}/${q.id}_${part}.mp3`);
      }
    }

    return urls;
  }

  public getTotalSnippetCount(): number {
    return questionsData.length * PARTS.length; // 504 * 5 = 2520
  }

  public getStatus(voice: VoiceName): VoiceDownloadProgress {
    return { ...this.statuses[voice] };
  }

  public getAllStatuses(): Record<VoiceName, VoiceDownloadProgress> {
    return {
      giuseppe: { ...this.statuses.giuseppe },
      elsa: { ...this.statuses.elsa }
    };
  }

  public isAnyDownloading(): boolean {
    return Object.values(this.statuses).some(s => s.isDownloading);
  }

  public subscribe(listener: DownloadEventListener): () => void {
    this.listeners.add(listener);
    listener(this.getAllStatuses());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const current = this.getAllStatuses();
    this.listeners.forEach(fn => fn(current));
  }

  /**
   * Checks the actual number of files stored in CacheStorage for a specific voice
   */
  public async checkStatus(voice: VoiceName): Promise<VoiceDownloadProgress> {
    const totalCount = this.getTotalSnippetCount();

    if (typeof window === 'undefined' || !('caches' in window)) {
      return this.getStatus(voice);
    }

    try {
      const cacheName = this.getCacheName(voice);
      const hasCache = typeof window.caches.has === 'function' ? await window.caches.has(cacheName) : true;
      if (!hasCache) {
        this.statuses[voice] = {
          voice,
          downloadedCount: 0,
          totalCount,
          percent: 0,
          isDownloading: Boolean(this.abortControllers[voice]),
          isComplete: false,
          error: null
        };
        this.notify();
        return this.getStatus(voice);
      }

      const cache = await window.caches.open(cacheName);
      const keys = await cache.keys();
      const downloadedCount = keys.length;
      const isComplete = downloadedCount >= totalCount;
      const percent = Math.min(100, Math.round((downloadedCount / totalCount) * 100));

      this.statuses[voice] = {
        voice,
        downloadedCount,
        totalCount,
        percent,
        isDownloading: Boolean(this.abortControllers[voice]),
        isComplete,
        error: null
      };

      this.notify();
      return this.getStatus(voice);
    } catch (err: any) {
      console.warn(`Error checking cache status for voice ${voice}:`, err);
      return this.getStatus(voice);
    }
  }

  public async checkAllStatuses(): Promise<Record<VoiceName, VoiceDownloadProgress>> {
    await Promise.all([this.checkStatus('giuseppe'), this.checkStatus('elsa')]);
    return this.getAllStatuses();
  }

  /**
   * Starts non-blocking background download of all snippets for the specified voice.
   * If already running, returns the existing active promise.
   */
  public async startDownload(voice: VoiceName): Promise<void> {
    if (this.activePromises[voice]) {
      return this.activePromises[voice];
    }

    if (typeof window === 'undefined' || !('caches' in window)) {
      this.statuses[voice].error = 'CacheStorage API not supported in this browser';
      this.notify();
      return;
    }

    const abortController = new AbortController();
    this.abortControllers[voice] = abortController;
    const { signal } = abortController;

    const promise = (async () => {
      const startTime = Date.now();
      try {
        const cacheName = this.getCacheName(voice);
        const cache = await window.caches.open(cacheName);
        const allUrls = this.generateUrls(voice);
        const totalCount = allUrls.length;

        // Inspect existing cache keys to resume without re-downloading
        const existingKeys = await cache.keys();
        const existingPathnames = new Set(
          existingKeys.map(k => {
            try {
              return new URL(k.url, window.location.origin).pathname;
            } catch {
              return k.url;
            }
          })
        );

        let downloadedCount = existingPathnames.size;
        const remainingUrls = allUrls.filter(u => {
          try {
            return !existingPathnames.has(new URL(u, window.location.origin).pathname);
          } catch {
            return !existingPathnames.has(u);
          }
        });

        this.statuses[voice] = {
          voice,
          downloadedCount,
          totalCount,
          percent: Math.min(100, Math.round((downloadedCount / totalCount) * 100)),
          isDownloading: true,
          isComplete: downloadedCount >= totalCount,
          error: null
        };
        this.notify();

        if (remainingUrls.length === 0) {
          this.statuses[voice].isDownloading = false;
          this.statuses[voice].isComplete = true;
          this.notify();
          return;
        }

        // Process queue in concurrent batches with yields to event loop
        let cursor = 0;
        let lastNotifyTime = Date.now();

        const processUrl = async (url: string): Promise<void> => {
          if (signal.aborted) return;
          try {
            const resp = await fetch(url, { signal });
            if (resp.ok) {
              await cache.put(url, resp);
              downloadedCount++;
            }
          } catch (fetchErr: any) {
            if (signal.aborted) return;
            console.warn(`Failed downloading snippet ${url}:`, fetchErr);
          }
        };

        while (cursor < remainingUrls.length) {
          if (signal.aborted) break;

          const batch = remainingUrls.slice(cursor, cursor + CONCURRENCY);
          cursor += CONCURRENCY;

          await Promise.all(batch.map(url => processUrl(url)));

          // Periodic notification & main-thread yield to keep UI silky smooth
          const now = Date.now();
          if (now - lastNotifyTime > 150 || cursor >= remainingUrls.length) {
            lastNotifyTime = now;
            this.statuses[voice].downloadedCount = downloadedCount;
            this.statuses[voice].percent = Math.min(
              100,
              Math.round((downloadedCount / totalCount) * 100)
            );
            this.notify();
          }

          // Non-blocking yield to browser event loop
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        if (signal.aborted) {
          this.statuses[voice].isDownloading = false;
          this.notify();
          return;
        }

        // Final completion verification
        const finalKeys = await cache.keys();
        const finalCount = finalKeys.length;
        const isComplete = finalCount >= totalCount;

        if (isComplete) {
          // Record installed metadata from remote manifest in background
          this.fetchRemoteManifest().then(manifest => {
            if (manifest && manifest.voices[voice]) {
              this.saveInstalledMetadata({
                voice,
                version: manifest.voices[voice].version,
                hashes: { ...manifest.voices[voice].files },
                lastCheckedAt: Date.now()
              });
            }
          }).catch(() => {});
        }

        this.statuses[voice] = {
          voice,
          downloadedCount: finalCount,
          totalCount,
          percent: Math.min(100, Math.round((finalCount / totalCount) * 100)),
          isDownloading: false,
          isComplete,
          error: null
        };
        this.notify();

        telemetry.trackAudioDownloadResult({
          voice,
          status: isComplete ? 'success' : 'failed',
          duration_seconds: Math.round((Date.now() - startTime) / 1000),
        });
      } catch (err: any) {
        if (signal.aborted) {
          this.statuses[voice].isDownloading = false;
          this.notify();
          telemetry.trackAudioDownloadResult({
            voice,
            status: 'aborted',
            duration_seconds: Math.round((Date.now() - startTime) / 1000),
          });
          return;
        }
        console.error(`Error in audio download for ${voice}:`, err);
        this.statuses[voice].isDownloading = false;
        this.statuses[voice].error = err?.message || 'Download error';
        this.notify();
        telemetry.trackAudioDownloadResult({
          voice,
          status: 'failed',
          duration_seconds: Math.round((Date.now() - startTime) / 1000),
          error_code: err?.message,
        });
      } finally {
        delete this.abortControllers[voice];
        delete this.activePromises[voice];
      }
    })();

    this.activePromises[voice] = promise;
    return promise;
  }

  /**
   * Cancels any active download for the specified voice.
   */
  public cancelDownload(voice: VoiceName): void {
    const controller = this.abortControllers[voice];
    if (controller) {
      controller.abort();
      delete this.abortControllers[voice];
      delete this.activePromises[voice];
    }
    this.statuses[voice].isDownloading = false;
    this.notify();
  }

  /**
   * Deletes all cached audio snippets for the specified voice.
   */
  public async deleteCache(voice: VoiceName): Promise<void> {
    this.cancelDownload(voice);

    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheName = this.getCacheName(voice);
        await window.caches.delete(cacheName);
      } catch (err) {
        console.warn(`Error deleting cache ${voice}:`, err);
      }
    }

    try {
      await db.settings.delete(`audio_metadata_${voice}`);
    } catch {
      // Ignore settings cleanup error
    }

    this.statuses[voice] = {
      voice,
      downloadedCount: 0,
      totalCount: this.getTotalSnippetCount(),
      percent: 0,
      isDownloading: false,
      isComplete: false,
      error: null
    };

    this.notify();
  }

  /**
   * Fast check if a voice is considered ready for offline playback
   */
  public isVoiceReady(voice: VoiceName): boolean {
    return this.statuses[voice].isComplete || this.statuses[voice].downloadedCount > 2000;
  }

  /**
   * Checks if ANY voice has been downloaded for offline fallback
   */
  public getAvailableOfflineVoice(): VoiceName | null {
    if (this.isVoiceReady('giuseppe')) return 'giuseppe';
    if (this.isVoiceReady('elsa')) return 'elsa';
    if (this.statuses.giuseppe.downloadedCount > 500) return 'giuseppe';
    if (this.statuses.elsa.downloadedCount > 500) return 'elsa';
    return null;
  }

  public getManifestUrl(): string {
    return `${this.getBaseUrl()}/audio/manifest.json`;
  }

  public async fetchRemoteManifest(): Promise<AudioManifest | null> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return null;
    try {
      const resp = await fetch(`${this.getManifestUrl()}?_t=${Date.now()}`, { cache: 'no-cache' });
      if (!resp.ok) return null;
      return (await resp.json()) as AudioManifest;
    } catch (err) {
      console.warn('Failed to fetch audio manifest:', err);
      return null;
    }
  }

  public async getInstalledMetadata(voice: VoiceName): Promise<InstalledVoiceMetadata | null> {
    try {
      const entry = await db.settings.get(`audio_metadata_${voice}`);
      return entry ? (entry.value as InstalledVoiceMetadata) : null;
    } catch {
      return null;
    }
  }

  public async saveInstalledMetadata(metadata: InstalledVoiceMetadata): Promise<void> {
    try {
      await db.settings.put({
        key: `audio_metadata_${metadata.voice}`,
        value: metadata
      });
    } catch (err) {
      console.warn(`Failed to save audio metadata for ${metadata.voice}:`, err);
    }
  }

  /**
   * Checks if any files in CacheStorage need updating compared to the remote manifest.
   */
  public async checkAudioUpdates(targetVoice?: VoiceName): Promise<AudioUpdateCheckResult> {
    const emptyResult: AudioUpdateCheckResult = {
      hasUpdates: false,
      manifest: null,
      voiceUpdates: {
        giuseppe: { hasUpdates: false, currentVersion: 'unknown', remoteVersion: 'unknown', staleFiles: [], totalStaleBytes: 0 },
        elsa: { hasUpdates: false, currentVersion: 'unknown', remoteVersion: 'unknown', staleFiles: [], totalStaleBytes: 0 }
      }
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      emptyResult.isOffline = true;
      return emptyResult;
    }

    const manifest = await this.fetchRemoteManifest();
    if (!manifest) {
      emptyResult.error = 'Manifest non disponibile';
      return emptyResult;
    }
    emptyResult.manifest = manifest;

    const voicesToCheck: VoiceName[] = targetVoice ? [targetVoice] : ['giuseppe', 'elsa'];
    let overallHasUpdates = false;

    for (const v of voicesToCheck) {
      const remoteVoice = manifest.voices[v];
      if (!remoteVoice) continue;

      await this.checkStatus(v);
      const isDownloaded = this.isVoiceReady(v);
      if (!isDownloaded) {
        emptyResult.voiceUpdates[v] = {
          hasUpdates: false,
          currentVersion: 'not_installed',
          remoteVersion: remoteVoice.version,
          staleFiles: [],
          totalStaleBytes: 0
        };
        continue;
      }

      let installed = await this.getInstalledMetadata(v);
      if (!installed) {
        installed = {
          voice: v,
          version: remoteVoice.version,
          hashes: { ...remoteVoice.files },
          lastCheckedAt: Date.now()
        };
        await this.saveInstalledMetadata(installed);
      }

      const staleFiles: string[] = [];
      let totalStaleBytes = 0;

      for (const [filename, remoteHash] of Object.entries(remoteVoice.files)) {
        const localHash = installed.hashes[filename];
        if (localHash !== remoteHash) {
          staleFiles.push(filename);
          totalStaleBytes += 60000;
        }
      }

      const hasVoiceUpdates = staleFiles.length > 0;
      if (hasVoiceUpdates) overallHasUpdates = true;

      emptyResult.voiceUpdates[v] = {
        hasUpdates: hasVoiceUpdates,
        currentVersion: installed.version,
        remoteVersion: remoteVoice.version,
        staleFiles,
        totalStaleBytes
      };
    }

    emptyResult.hasUpdates = overallHasUpdates;
    return emptyResult;
  }

  /**
   * Performs differential updating: downloads ONLY stale/modified snippets into CacheStorage.
   */
  public async applyAudioUpdates(
    voice: VoiceName,
    onProgress?: (percent: number, current: number, total: number) => void
  ): Promise<{ updatedCount: number; error: string | null }> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return { updatedCount: 0, error: 'CacheStorage non supportato' };
    }

    const check = await this.checkAudioUpdates(voice);
    const detail = check.voiceUpdates[voice];
    if (!detail || !detail.hasUpdates || detail.staleFiles.length === 0) {
      return { updatedCount: 0, error: null };
    }

    const manifest = check.manifest;
    const remoteVoice = manifest?.voices[voice];
    if (!remoteVoice) {
      return { updatedCount: 0, error: 'Manifest vocale mancante' };
    }

    try {
      const cacheName = this.getCacheName(voice);
      const cache = await window.caches.open(cacheName);
      const baseUrl = this.getBaseUrl();
      const total = detail.staleFiles.length;
      let updated = 0;

      const installed = (await this.getInstalledMetadata(voice)) || {
        voice,
        version: remoteVoice.version,
        hashes: {},
        lastCheckedAt: Date.now()
      };

      for (const filename of detail.staleFiles) {
        const canonicalUrl = `${baseUrl}/audio/${voice}/${filename}`;
        const newHash = remoteVoice.files[filename] || '';
        const fetchUrl = `${canonicalUrl}?v=${newHash}&_t=${Date.now()}`;

        try {
          const resp = await fetch(fetchUrl, { cache: 'reload' });
          if (resp.ok) {
            await cache.put(canonicalUrl, resp);
            installed.hashes[filename] = newHash;
            updated++;
          }
        } catch (fetchErr) {
          console.warn(`Errore aggiornamento file ${filename}:`, fetchErr);
        }

        if (onProgress) {
          const pct = Math.round((updated / total) * 100);
          onProgress(pct, updated, total);
        }
      }

      installed.version = remoteVoice.version;
      installed.lastCheckedAt = Date.now();
      await this.saveInstalledMetadata(installed);

      await this.checkStatus(voice);
      return { updatedCount: updated, error: null };
    } catch (err: any) {
      return { updatedCount: 0, error: err?.message || 'Errore aggiornamento' };
    }
  }

  /**
   * Automated silent sync on app startup (if online and auto-sync enabled).
   */
  public async autoCheckAndSyncOnStartup(): Promise<void> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.onLine) {
      return;
    }

    try {
      const check = await this.checkAudioUpdates();
      if (!check.hasUpdates) return;

      for (const voice of ['giuseppe', 'elsa'] as VoiceName[]) {
        const detail = check.voiceUpdates[voice];
        if (detail.hasUpdates && detail.staleFiles.length > 0 && detail.staleFiles.length <= 25) {
          await this.applyAudioUpdates(voice);
        }
      }
    } catch (err) {
      console.warn('[AudioDownloadManager] Auto-sync check failed:', err);
    }
  }
}

export const audioDownloadManager = new AudioDownloadManager();
