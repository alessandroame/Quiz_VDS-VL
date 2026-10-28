import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleDriveService, GOOGLE_TOKEN_STORAGE_KEY } from './googleDrive';

describe('Suite 7: Google Drive Sync Service (src/services/googleDrive.ts)', () => {
  let service: GoogleDriveService;

  beforeEach(() => {
    if (typeof globalThis.localStorage !== 'undefined') {
      globalThis.localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY);
    }
    service = new GoogleDriveService();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (typeof globalThis.localStorage !== 'undefined') {
      globalThis.localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY);
    }
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

  it('DRV-09: getAccessToken(false) rejects immediately without opening popup when token is missing', async () => {
    // Arrange: tokenClient exists but no valid token
    const mockRequestAccessToken = vi.fn();
    (service as any).tokenClient = { requestAccessToken: mockRequestAccessToken };

    // Act & Assert
    await expect(service.getAccessToken(false)).rejects.toThrow('Accesso Google richiesto');
    expect(mockRequestAccessToken).not.toHaveBeenCalled();
  });

  it('DRV-10: callback maps popup_blocked_by_browser error code properly', async () => {
    let capturedCallback: any = null;
    (globalThis as any).window = {
      google: {
        accounts: {
          oauth2: {
            initTokenClient: vi.fn((config: any) => {
              capturedCallback = config.callback;
              return { requestAccessToken: vi.fn() };
            })
          }
        }
      }
    };

    service.initTokenClient('test_client_id');
    expect(capturedCallback).toBeDefined();

    const tokenPromise = service.getAccessToken(true);
    capturedCallback({ error: 'popup_blocked_by_browser' });

    await expect(tokenPromise).rejects.toThrow('popup_blocked_by_browser');
  });

  it('DRV-11: persists OAuth token across service reloads and reuses it without opening popup', async () => {
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k)
    };

    let capturedCallback: any = null;
    const mockRequestAccessToken = vi.fn();
    (globalThis as any).window = {
      google: {
        accounts: {
          oauth2: {
            initTokenClient: vi.fn((config: any) => {
              capturedCallback = config.callback;
              return { requestAccessToken: mockRequestAccessToken };
            })
          }
        }
      }
    };

    service.initTokenClient('test_client_id');
    const tokenPromise = service.getAccessToken(true);
    expect(mockRequestAccessToken).toHaveBeenCalledWith({ prompt: '' });
    capturedCallback({ access_token: 'persisted_token_xyz', expires_in: 3600 });

    const firstToken = await tokenPromise;
    expect(firstToken).toBe('persisted_token_xyz');
    expect(store.has(GOOGLE_TOKEN_STORAGE_KEY)).toBe(true);

    // Simulate page reload by instantiating a fresh GoogleDriveService
    mockRequestAccessToken.mockClear();
    const reloadedService = new GoogleDriveService();
    expect(reloadedService.hasValidToken()).toBe(true);

    // Both background (interactive=false) and manual (interactive=true) must reuse cached token without popup
    await expect(reloadedService.getAccessToken(false)).resolves.toBe('persisted_token_xyz');
    await expect(reloadedService.getAccessToken(true)).resolves.toBe('persisted_token_xyz');
    expect(mockRequestAccessToken).not.toHaveBeenCalled();

    // Clearing token removes it from storage
    reloadedService.clearToken();
    expect(reloadedService.hasValidToken()).toBe(false);
    expect(store.has(GOOGLE_TOKEN_STORAGE_KEY)).toBe(false);
  });

  it('DRV-12: invalidates persisted token when API responds with HTTP 401', async () => {
    (service as any).accessToken = 'expired_remote_token';
    (service as any).tokenExpiry = Date.now() + 3600000;

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 401, message: 'Invalid Credentials' } })
    });

    const res = await service.uploadBackup('{"version":2}');
    expect(res.success).toBe(false);
    expect(res.message).toContain('401');
    expect(service.hasValidToken()).toBe(false);
  });
});
