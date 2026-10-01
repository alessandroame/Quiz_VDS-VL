// Servizio di integrazione Google Identity Services (GIS) & Google Drive API v3

declare global {
  interface Window {
    google?: any;
  }
}

const BACKUP_FILENAME = 'vds_quiz_master_backup.json';

export class GoogleDriveService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private tokenListeners: Set<(token: string) => void> = new Set();
  private pendingTokenRequests: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

  public isGisLoaded(): boolean {
    return typeof window !== 'undefined' && !!window.google?.accounts?.oauth2;
  }

  public addTokenListener(listener: (token: string) => void): () => void {
    this.tokenListeners.add(listener);
    return () => this.tokenListeners.delete(listener);
  }

  public initTokenClient(clientId?: string, onTokenReceived?: (token: string) => void): void {
    if (onTokenReceived) {
      this.addTokenListener(onTokenReceived);
    }
    const effectiveId = clientId || (import.meta.env?.VITE_GOOGLE_CLIENT_ID as string) || '182413802928-q7sphls58ob60s2mu3fspbbkk9kq2am9.apps.googleusercontent.com';
    if (!this.isGisLoaded() || !effectiveId) return;

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: effectiveId,
        scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file',
        callback: (resp: any) => {
          if (resp.error) {
            let errorMsg = resp.error;
            const errStr = String(resp.error).toLowerCase();
            const errDesc = String(resp.error_description || '').toLowerCase();
            if (
              errStr.includes('popup_blocked') ||
              errDesc.includes('popup') ||
              errStr.includes('blocked_by_browser') ||
              errStr.includes('popup_failed')
            ) {
              errorMsg = 'popup_blocked_by_browser';
            } else if (errStr.includes('popup_closed') || errStr.includes('closed_by_user')) {
              errorMsg = 'popup_closed_by_user';
            } else if (errStr.includes('access_denied')) {
              errorMsg = 'access_denied';
            }
            const pending = this.pendingTokenRequests;
            this.pendingTokenRequests = [];
            for (const req of pending) {
              req.reject(new Error(errorMsg));
            }
          } else if (resp.access_token) {
            this.accessToken = resp.access_token;
            this.tokenExpiry = Date.now() + (resp.expires_in || 3600) * 1000;
            const pending = this.pendingTokenRequests;
            this.pendingTokenRequests = [];
            for (const req of pending) {
              req.resolve(resp.access_token);
            }
            for (const listener of this.tokenListeners) {
              try {
                listener(resp.access_token);
              } catch (e) {
                console.error('[GoogleDrive] Error in token listener:', e);
              }
            }
          }
        },
      });
    } catch (err) {
      console.error('Errore inizializzazione GIS token client:', err);
    }
  }

  public hasValidToken(): boolean {
    return Boolean(this.accessToken && Date.now() < this.tokenExpiry - 60000);
  }

  public clearToken(): void {
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  public async getAccessToken(interactive = false): Promise<string> {
    if (this.hasValidToken() && this.accessToken) {
      return this.accessToken;
    }

    if (!this.tokenClient) {
      throw new Error('Client Google non inizializzato. Riprova tra pochi istanti.');
    }

    if (!interactive) {
      throw new Error('Accesso Google richiesto: apri le impostazioni o tocca l\'icona cloud per collegare Google Drive');
    }

    return new Promise((resolve, reject) => {
      this.pendingTokenRequests.push({ resolve, reject });
      try {
        this.tokenClient.requestAccessToken();
      } catch (err: any) {
        this.pendingTokenRequests = this.pendingTokenRequests.filter(r => r.resolve !== resolve);
        const errMsg = String(err?.message || err).toLowerCase();
        if (errMsg.includes('popup') || errMsg.includes('window.open') || errMsg.includes('blocked')) {
          reject(new Error('popup_blocked_by_browser'));
        } else {
          reject(err);
        }
      }
    });
  }

  private async handleApiError(res: Response, action: string): Promise<never> {
    let detail = '';
    try {
      const json = await res.json();
      detail = json?.error?.message || JSON.stringify(json);
    } catch {
      detail = await res.text().catch(() => '');
    }

    if (res.status === 403) {
      if (
        detail.includes('Google Drive API') ||
        detail.includes('disabled') ||
        detail.includes('SERVICE_DISABLED') ||
        detail.includes('has not been used')
      ) {
        throw new Error(
          'Google Drive API non abilitata nel progetto Google Cloud. Abilitala su Google Cloud Console (APIs & Services > Library > Google Drive API).'
        );
      }
      throw new Error(
        `Permesso negato (403): ${detail || 'Verifica che il tuo account Google sia autorizzato o che l\'app sia verificata/pubblicata.'}`
      );
    }

    throw new Error(`${action} fallito (${res.status}): ${detail}`);
  }

  public async uploadBackup(backupJson: string, interactive = false): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.getAccessToken(interactive);

      // Cerca se esiste già un backup precedente in appDataFolder
      const searchRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='" + BACKUP_FILENAME + "' and trashed=false",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!searchRes.ok) {
        await this.handleApiError(searchRes, 'Ricerca file esistente');
      }
      const searchData = await searchRes.json();
      const existingFile = searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const closeDelim = "\r\n--" + boundary + "--";

      const metadata = {
        name: BACKUP_FILENAME,
        mimeType: 'application/json',
        parents: existingFile ? undefined : ['appDataFolder']
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        backupJson +
        closeDelim;

      let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      let method = 'POST';

      if (existingFile) {
        uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
        method = 'PATCH';
      }

      const uploadRes = await fetch(uploadUrl, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      });

      if (!uploadRes.ok) {
        await this.handleApiError(uploadRes, 'Caricamento backup');
      }

      return { success: true, message: 'Backup salvato su Google Drive' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Errore backup Google Drive' };
    }
  }

  public async downloadBackup(interactive = false): Promise<{ success: boolean; data?: string; message: string }> {
    try {
      const token = await this.getAccessToken(interactive);

      const searchRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='" + BACKUP_FILENAME + "' and trashed=false",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!searchRes.ok) {
        await this.handleApiError(searchRes, 'Ricerca file di backup');
      }
      const searchData = await searchRes.json();
      if (!searchData.files || searchData.files.length === 0) {
        return { success: false, message: 'Nessun backup trovato su Google Drive' };
      }

      const fileId = searchData.files[0].id;
      const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!downloadRes.ok) {
        await this.handleApiError(downloadRes, 'Download backup');
      }

      const text = await downloadRes.text();
      return { success: true, data: text, message: 'Backup scaricato da Google Drive' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Errore ripristino Google Drive' };
    }
  }
}

export const googleDrive = new GoogleDriveService();
