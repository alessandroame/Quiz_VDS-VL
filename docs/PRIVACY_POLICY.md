# Informativa sulla Privacy (Privacy Policy) — Quiz VDS-VL

**Data di entrata in vigore:** 19 Ottobre 2026  
**Ultimo aggiornamento:** 19 Ottobre 2026  
**URL Pubblico Privacy Policy:** [https://alessandroame.github.io/Quiz_VDS-VL/privacy-policy.html](https://alessandroame.github.io/Quiz_VDS-VL/privacy-policy.html)  
**Applicazione:** Quiz VDS-VL (*VDS-VL Quiz Master*) — [https://alessandroame.github.io/Quiz_VDS-VL/](https://alessandroame.github.io/Quiz_VDS-VL/)

---

## 1. Principi Generali e Architettura "Privacy-First"

**Quiz VDS-VL** è una Progressive Web App (PWA) didattica gratuita progettata secondo il principio *Offline-First* e *Privacy-by-Design*.  
L'applicazione **non dispone di un server backend proprietario**, non richiede la registrazione di alcun account utente obbligatorio e non raccoglie nomi, indirizzi email, numeri di telefono o dati di geolocalizzazione.

Tutti i dati generati durante lo studio rimangono sotto il controllo diretto ed esclusivo dell'utente sul proprio dispositivo.

---

## 2. Dati Memorizzati Localmente sul Dispositivo

Durante il normale utilizzo dell'applicazione, i seguenti dati vengono salvati esclusivamente nella memoria locale del browser dell'utente tramite `IndexedDB` (database locale `VDSQuizDB`) e `localStorage`:

- **Statistiche di Studio**: conteggio delle risposte esatte, errate e consecutive per ciascun quesito del catalogo ufficiale AeCI.
- **Storico Simulazioni**: data, durata, punteggio ed esito delle prove d'esame o sessioni di studio svolte.
- **Quaderno Errori, Preferiti e Note Personali**: quesiti contrassegnati come preferiti e annotazioni testuali inserite dall'allievo.
- **Preferenze Tecniche**: tema visivo (Scuro/Chiaro/Auto), dimensione dei caratteri, voce selezionata per la sintesi vocale e impostazioni di studio.
- **Cache Audio Offline (`CacheStorage`)**: file audio MP3 delle voci di lettura scaricati volontariamente dall'utente per l'utilizzo senza connessione Internet.

L'utente può cancellare integralmente e in qualsiasi momento tutti i dati locali utilizzando il pulsante **"Azzera tutti i dati di studio"** presente in *Impostazioni -> Gestione Dati*, oppure cancellando i dati del sito dalle impostazioni del proprio browser.

---

## 3. Integrazione con Google Drive e Dati Utente Google (OAuth 2.0)

L'applicazione offre una funzionalità **interamente facoltativa** di backup e sincronizzazione cloud tramite **Google Drive**, pensata per consentire all'utente di conservare i propri progressi e sincronizzarli tra più dispositivi personali.

### 3.1 Ambiti di Autorizzazione Richiesti (OAuth Scopes)
Quando l'utente sceglie volontariamente di collegare il proprio account Google cliccando su *"Collega Google Drive"*, l'applicazione richiede tramite **Google Identity Services (GIS)** l'autorizzazione per i seguenti ambiti ristretti e non sensibili (*non-sensitive scopes*):

- `https://www.googleapis.com/auth/drive.appdata`: consente all'applicazione di leggere e scrivere esclusivamente all'interno della cartella nascosta dei dati applicativi (`appDataFolder`) dedicata a Quiz VDS-VL sul Google Drive dell'utente.
- `https://www.googleapis.com/auth/drive.file`: consente l'accesso esclusivamente ai singoli file creati o aperti direttamente tramite l'applicazione (`vds_quiz_master_backup.json`).

### 3.2 Come Vengono Utilizzati, Archiviati e Protetti i Dati Google
1. **Accesso Limitato al Solo File di Backup**: L'applicazione legge e aggiorna unicamente il file JSON `vds_quiz_master_backup.json` contenente le statistiche dei quiz, lo storico esami, le note di studio e le preferenze dell'app. **Quiz VDS-VL non può leggere, elencare, modificare o eliminare nessun altro file, cartella, documento o foto presente sul Google Drive dell'utente.**
2. **Trasferimento Diretto Client-to-Google (Zero Intermediari)**: La comunicazione avviene direttamente tra il browser dell'utente e le API ufficiali di Google (`https://www.googleapis.com/drive/v3` e `https://www.googleapis.com/upload/drive/v3`) tramite connessione cifrata HTTPS/TLS.
3. **Gestione del Token OAuth**: Il token di accesso temporaneo OAuth 2.0 viene gestito in memoria nel browser dell'utente e non viene mai inviato né salvato su server esterni.
4. **Nessuna Condivisione o Vendita**: Nessun dato proveniente dalle API di Google viene mai trasferito a terze parti, venduto, utilizzato per fini pubblicitari o impiegato per l'addestramento di modelli di intelligenza artificiale.

### 3.3 Conformità alla Google API Services User Data Policy (Limited Use Disclosure)
**Dichiarazione di Utilizzo Limitato (Italiano):**  
L'utilizzo e il trasferimento da parte di **Quiz VDS-VL** a qualsiasi altra applicazione delle informazioni ricevute dalle API di Google rispetteranno rigorosamente la [Normativa sui dati utente dei servizi API di Google (Google API Services User Data Policy)](https://developers.google.com/terms/api-services-user-data-policy), inclusi i requisiti di **Utilizzo Limitato (Limited Use)**.

**Google Limited Use Disclosure (English for OAuth Verification):**  
*Quiz VDS-VL's use and transfer to any other app of information received from Google APIs will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements. Specifically, Google user data accessed via `drive.appdata` and `drive.file` scopes is used exclusively within the user's browser to store and synchronize the user's own study progress backup file (`vds_quiz_master_backup.json`) on their personal Google Drive, and is never stored on external servers, shared with third parties, or used for advertising.*

### 3.4 Revoca del Consenso ed Eliminazione del Backup Cloud
L'utente può interrompere la sincronizzazione in qualsiasi momento dalle *Impostazioni* dell'app e può revocare l'autorizzazione concessa a Quiz VDS-VL visitando la pagina ufficiale [Gestione accessi di terze parti dell'Account Google](https://myaccount.google.com/permissions). Dalla medesima sezione di Google Drive (*Impostazioni -> Gestisci applicazioni*) l'utente può eliminare i dati nascosti dell'applicazione.

---

## 4. Permessi del Microfono e Comandi Vocali

Nella **Modalità Mani Libere**, l'utente può facoltativamente attivare i comandi vocali per rispondere ai quiz a voce (*"Uno"*, *"Due"*, *"Tre"*, *"Avanti"*, *"Ripeti"*).  
Questa funzione utilizza le API di riconoscimento vocale integrate nel browser (`Web Speech API`). L'applicazione non registra, non salva su disco e non trasmette mai tracce audio o conversazioni vocali a server dello sviluppatore.

---

## 5. Statistiche Tecniche Anonime (Telemetria Opt-Out)

Allo scopo esclusivo di migliorare l'efficacia didattica dell'applicazione (ad esempio identificare i quesiti ministeriali statisticamente più difficili e monitorare il corretto funzionamento della PWA), l'applicazione può inviare eventi statistici aggregati e anonimi tramite la piattaforma europea **PostHog EU** (`https://eu.i.posthog.com`, ospitata nell'Unione Europea in conformità al GDPR).

- **Garanzie Tecniche di Anonimizzazione**:
  - La registrazione dello schermo (*session recording*) e la cattura automatica dei clic DOM (*autocapture*) sono disattivate a livello di codice.
  - Un filtro automatico (`sanitizePayload`) blocca preventivamente qualsiasi campo contenente note personali, token, email, segreti o trascrizioni.
  - Vengono trasmessi unicamente indicatori numerici anonimi (es. ID numerico del quesito AeCI da 1001 a 9045, esito corretto/errato, punteggio esame e versione dell'app).
- **Disattivazione Immediata (Opt-Out a 1 Tocco)**:
  - L'utente può disattivare completamente l'invio delle statistiche anonime in qualsiasi momento spostando su **OFF** l'interruttore **"Statistiche d'Uso Anonime"** in *Impostazioni -> Gestione Dati*.
  - L'applicazione rispetta inoltre automaticamente l'impostazione *Do Not Track (DNT)* del browser.

---

## 6. Diritti dell'Utente (GDPR — Regolamento UE 2016/679)

Poiché tutti i dati di studio risiedono localmente nel browser dell'utente (ed eventualmente nel suo Google Drive personale), l'utente esercita direttamente e in totale autonomia i diritti di:
- **Accesso e Portabilità**: esportando in qualsiasi momento l'intero archivio di studio in formato standard `.json` tramite *Impostazioni -> Backup -> Esporta su File*.
- **Rettifica e Cancellazione (Diritto all'Oblio)**: modificando o eliminando le proprie note o azzerando l'intero database locale con un clic da *Impostazioni -> Gestione Dati -> Azzera tutti i dati di studio*.
- **Opposizione e Revoca**: disattivando le statistiche anonime o scollegando Google Drive in qualsiasi istante.

---

## 7. Contatti e Segnalazioni

Per qualsiasi domanda, richiesta di chiarimento sulla presente Informativa sulla Privacy o segnalazione tecnica, è possibile contattare il mantenitore del progetto tramite la sezione [Issues del Repository GitHub Ufficiale](https://github.com/alessandroame/Quiz_VDS-VL/issues).
