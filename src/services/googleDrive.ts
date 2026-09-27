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

  public isGisLoaded(): boolean {
    return typeof window !== 'undefined' && !!window.google?.accounts?.oauth2;
  }

  public initTokenClient(clientId: string, onTokenReceived?: (token: string) => void): void {
    if (!this.isGisLoaded() || !clientId) return;

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file',
        callback: (resp: any) => {
          if (resp.access_token) {
            this.accessToken = resp.access_token;
            this.tokenExpiry = Date.now() + (resp.expires_in || 3600) * 1000;
            if (onTokenReceived) onTokenReceived(resp.access_token);
          }
        },
      });
    } catch (err) {
      console.error('Errore inizializzazione GIS token client:', err);
    }
  }

  public async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    if (!this.tokenClient) {
      throw new Error('Client Google non inizializzato. Inserisci il Google Client ID nelle impostazioni.');
    }

    return new Promise((resolve, reject) => {
      this.tokenClient.callback = (resp: any) => {
        if (resp.error) {
          reject(new Error(resp.error));
        } else if (resp.access_token) {
          this.accessToken = resp.access_token;
          this.tokenExpiry = Date.now() + (resp.expires_in || 3600) * 1000;
          resolve(resp.access_token);
        }
      };
      this.tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  public async uploadBackup(backupJson: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.getAccessToken();

      // Cerca se esiste già un backup precedente in appDataFolder
      const searchRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='" + BACKUP_FILENAME + "' and trashed=false",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
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
        const errText = await uploadRes.text();
        throw new Error(`Upload fallito: ${errText}`);
      }

      return { success: true, message: 'Backup salvato su Google Drive' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Errore backup Google Drive' };
    }
  }

  public async downloadBackup(): Promise<{ success: boolean; data?: string; message: string }> {
    try {
      const token = await this.getAccessToken();

      const searchRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='" + BACKUP_FILENAME + "' and trashed=false",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const searchData = await searchRes.json();
      if (!searchData.files || searchData.files.length === 0) {
        return { success: false, message: 'Nessun backup trovato su Google Drive' };
      }

      const fileId = searchData.files[0].id;
      const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!downloadRes.ok) {
        throw new Error('Impossibile scaricare il file da Drive');
      }

      const text = await downloadRes.text();
      return { success: true, data: text, message: 'Backup scaricato da Google Drive' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Errore ripristino Google Drive' };
    }
  }
}

export const googleDrive = new GoogleDriveService();
