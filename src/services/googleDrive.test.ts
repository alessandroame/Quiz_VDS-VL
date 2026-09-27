import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleDriveService } from './googleDrive';

describe('Suite 7: Google Drive Sync Service (src/services/googleDrive.ts)', () => {
  let service: GoogleDriveService;

  beforeEach(() => {
    service = new GoogleDriveService();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('DRV-01: isGisLoaded restituisce false quando window.google non è presente', () => {
    // In ambiente Node window.google non è definito
    expect(service.isGisLoaded()).toBe(false);
  });

  it('DRV-02: getAccessToken lancia un errore se il client GIS non è stato inizializzato', async () => {
    await expect(service.getAccessToken()).rejects.toThrow('Client Google non inizializzato');
  });

  it('DRV-03: uploadBackup esegue POST multipart se non esiste ancora un file di backup precedente', async () => {
    // Arrange: predisponiamo un access token valido via mock
    (service as any).accessToken = 'mock_valid_token';
    (service as any).tokenExpiry = Date.now() + 3600000;

    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    // Prima chiamata: ricerca file (restituisce nessun file)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: [] })
    });

    // Seconda chiamata: upload POST
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'OK'
    });

    // Act
    const res = await service.uploadBackup('{"version":1}');

    // Assert
    expect(res.success).toBe(true);
    expect(res.message).toContain('salvato su Google Drive');
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verifica che il metodo di upload sia POST
    const uploadCall = mockFetch.mock.calls[1];
    expect(uploadCall[1].method).toBe('POST');
    expect(uploadCall[1].headers.Authorization).toBe('Bearer mock_valid_token');
  });

  it('DRV-04: uploadBackup esegue PATCH se esiste già un file di backup in appDataFolder', async () => {
    // Arrange
    (service as any).accessToken = 'mock_valid_token';
    (service as any).tokenExpiry = Date.now() + 3600000;

    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    // Ricerca file: trova un file id='file_123'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: [{ id: 'file_123', name: 'vds_quiz_master_backup.json' }] })
    });

    // Upload PATCH
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'OK'
    });

    // Act
    const res = await service.uploadBackup('{"version":1}');

    // Assert
    expect(res.success).toBe(true);
    const uploadCall = mockFetch.mock.calls[1];
    expect(uploadCall[1].method).toBe('PATCH');
    expect(uploadCall[0]).toContain('file_123');
  });

  it('DRV-05: downloadBackup restituisce i dati JSON quando il backup esiste su Drive', async () => {
    // Arrange
    (service as any).accessToken = 'mock_valid_token';
    (service as any).tokenExpiry = Date.now() + 3600000;

    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    // Ricerca file
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: [{ id: 'file_999' }] })
    });

    // Download alt=media
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"version":1,"stats":[]}'
    });

    // Act
    const res = await service.downloadBackup();

    // Assert
    expect(res.success).toBe(true);
    expect(res.data).toBe('{"version":1,"stats":[]}');
  });

  it('DRV-06: downloadBackup restituisce errore se nessun backup è presente in Drive', async () => {
    // Arrange
    (service as any).accessToken = 'mock_valid_token';
    (service as any).tokenExpiry = Date.now() + 3600000;

    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    // Ricerca file vuota
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: [] })
    });

    // Act
    const res = await service.downloadBackup();

    // Assert
    expect(res.success).toBe(false);
    expect(res.message).toContain('Nessun backup trovato');
  });

  it('DRV-07: uploadBackup rileva errore 403 API disabilitata e restituisce messaggio diagnostico', async () => {
    // Arrange
    (service as any).accessToken = 'mock_valid_token';
    (service as any).tokenExpiry = Date.now() + 3600000;

    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    // Ricerca file fallisce con 403 SERVICE_DISABLED
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        error: {
          code: 403,
          message: 'Google Drive API has not been used in project 182413802928 before or it is disabled.'
        }
      })
    });

    // Act
    const res = await service.uploadBackup('{"test": true}');

    // Assert
    expect(res.success).toBe(false);
    expect(res.message).toContain('Google Drive API non abilitata nel progetto Google Cloud');
  });

  it('DRV-08: downloadBackup rileva errore 403 API disabilitata e restituisce messaggio diagnostico', async () => {
    // Arrange
    (service as any).accessToken = 'mock_valid_token';
    (service as any).tokenExpiry = Date.now() + 3600000;

    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    // Ricerca file fallisce con 403 SERVICE_DISABLED
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        error: {
          code: 403,
          message: 'Google Drive API has not been used in project 182413802928 before or it is disabled.'
        }
      })
    });

    // Act
    const res = await service.downloadBackup();

    // Assert
    expect(res.success).toBe(false);
    expect(res.message).toContain('Google Drive API non abilitata nel progetto Google Cloud');
  });
});
