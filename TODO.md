# 📋 VDS-VL Quiz Master - Avanzamento Lavori (TODO)

**Data Inizio**: 27/09/2026  
**Stato Generale**: 🟡 **Fasi 0-6 Completate (100%), Fase 7 (Collaudo Manuale Completo E2E) Pronta per Esecuzione**

---

## 🗂️ Fasi di Sviluppo

### [x] Fase 0: Analisi & Allineamento Requisiti
- [x] Analisi struttura `quiz_VDS-VL_2017.pdf` (504 quiz, 9 materie, soluzioni pp. 50-51)
- [x] Verifica assenza elementi grafici/immagini nel PDF (quiz 100% testuali)
- [x] Verifica del manuale teorico di approfondimento anonimo (`Il Parapendio.pdf`)
- [x] Verifica e correzione della skill di regolamento AeCI (30 domande, 45 min, max 3 errori)
- [x] Redazione e approvazione del piano strategico `PROJECT_PLAN.md`

---

### [x] Fase 1: Creazione Custom Skills (.agents/skills)
- [x] `.agents/skills/vds-exam-examiner` (Regolamento ufficiale AeCI & D.P.R. 133/2010)
- [x] `.agents/skills/vds-quiz-extractor` (Pipeline estrazione PDF, normalizzazione, validazione)
- [x] `.agents/skills/pwa-quiz-engine` (Fair Coverage Randomizer, Dexie DB, Drive Backup, PWA)
- [x] `.agents/skills/aviation-ui-ux` (Design cockpit avionico, microcopy minimale, temi chiaro/scuro/auto)
- [x] `.agents/skills/git-pro` (Procedure professionali Git, commit atomici, gestione amend)

---

### [x] Fase 2: Estrazione Dati & Dataset 504 Quiz
- [x] Script Python `extract_quizzes.py` per parsing su 2 colonne e join con soluzioni
- [x] Gestione anomalia numerazione quiz 7037 (4, 5, 6 nel PDF originale)
- [x] Correzione cesure a capo, trattini e caratteri speciali UTF-8
- [x] Sintesi spiegazioni didattiche essenziali (Regola fisica/normativa + Tranello)
- [x] Validazione di integrità: 504 quiz estratti, 3 opzioni per quiz, risposte 1-3 valide
- [x] Generazione `src/data/questions.json`, `public/data/questions.json` e `src/types/quiz.ts`

---

### [x] Fase 3: Scaffolding PWA & Tooling
- [x] Inizializzazione Vite + React 19 + TypeScript
- [x] Configurazione Tailwind CSS con palette Cockpit Dark & Hangar Light
- [x] Installazione dipendenze: `dexie`, `dexie-react-hooks`, `lucide-react`, `canvas-confetti`, `vite-plugin-pwa`
- [x] Configurazione PWA: `manifest.webmanifest`, service worker offline (Workbox) e icone PNG/SVG

---

### [x] Fase 4: Database Layer, Fair Randomizer & Google Drive
- [x] Schema Dexie (statistiche domande, sessioni esame, quaderno errori, preferiti, impostazioni)
- [x] Modulo `FairCoverageRandomizer` (priorità mai viste > meno viste > tasso di errore)
- [x] Modulo Google Identity Services (GIS) & Google Drive Backup (`appDataFolder`)
- [x] Store reattivo con persistenza automatica di qualunque impostazione e tema

---

### [x] Fase 5: UI Cockpit & Sezioni Funzionali
- [x] Layout responsive con microcopy minimale (**Esame** | **Materie** | **Errori** | **Archivio** | **Stats**)
- [x] Switch rapido Temi: Chiaro (Hangar Light) / Scuro (Cockpit Dark) / Automatico (Sistema)
- [x] **Esame**: 30 quiz, countdown 45 min, griglia 30 bolle interattiva, bandierina ⚑ Rivedi, debriefing esito
- [x] **Materie**: Filtro per le 9 materie, feedback immediato e spiegazione sintetica (Regola + Tranello)
- [x] **Errori**: Quaderno con ripetizione spaziata Leitner (uscita con 2 successi consecutivi)
- [x] **Archivio**: Ricerca full-text e consultazione libera con preferiti e note personali
- [x] **Stats**: Indice prontezza, radar materie, grafico storico esami, top 10 errori
- [x] Modal Impostazioni a schede tematiche (Aspetto, Voce, Guida, Backup, Dati, About)

---

### [x] Fase 6: Testing, Icone PWA & Rifinitura
- [x] Generazione set icone PWA (192x192, 512x512, maskable e favicon SVG)
- [x] Suddivisione manualChunks in Vite (`vendor`, `db`, `icons`)
- [x] Build di produzione completata con successo (`npm run build` -> exit 0)
- [x] Test simulazione Fair Coverage Randomizer (copertura del database garantita)
- [x] Suite Vitest a 129 test unitari e BVA su 15 suite completata al 100%

---

## 🧪 Fase 7: Protocollo di Collaudo Manuale Completo E2E (Checklist Operativa Pilota)

Questa checklist fornisce le istruzioni operative per il **collaudo manuale end-to-end** dell'applicazione su browser desktop e dispositivi mobili (smartphone Android / iOS con PWA installata o browser).

### 1. Avvio, Installazione PWA, Temi & Interfaccia Avionica
- [ ] **Splash Screen & Cold Start T=0ms**: Ricaricare l'app da zero (hard refresh `Ctrl+F5`). Verificare la comparsa istantanea a 0ms dello splash screen con logo SVG Paraglider Question Mark e barra sweep ambra, senza flash bianchi né salti di layout prima del mount di React.
- [ ] **Installabilità PWA**: Verificare la comparsa del prompt di installazione o l'icona "Installa app" nella barra degli indirizzi del browser. Installare su smartphone o desktop e verificare l'avvio in modalità standalone a tutto schermo con splash screen nativo.
- [ ] **Iconografia Ufficiale**: Verificare che l'icona della PWA (homescreen, splash screen, favicon della tab) mostri la cupola aerodinamica a celle cassonate e la sagoma del pilota nel bozzolo con comandi ad altissima definizione.
- [ ] **Switch Temi (Carbon Cockpit / Hangar Light / Auto)**: Dalla Navbar o dalle Impostazioni, commutare tra Scuro, Chiaro e Auto. Verificare l'assenza totale di tinte blu nel dark mode (nero carbonio `#09090b` + ambra avionica) e l'elevato contrasto antiriflesso nel tema chiaro.
- [ ] **Navigazione & Reattività Mobile (390x844)**: Testare la navigazione fluida tra le 5 sezioni (**Esame**, **Materie**, **Errori**, **Archivio**, **Stats**). Verificare che la barra di navigazione inferiore su mobile e superiore su desktop non copra i contenuti.
- [ ] **Scorciatoie da Tastiera Desktop**: Nella schermata quiz su desktop, verificare che i tasti `1`, `2`, `3` selezionino le rispettive opzioni, `F` attivi/disattivi la bandierina di revisione e `Spazio` avanzi alla domanda successiva.
- [ ] **Scheda About nelle Impostazioni**: Aprire le Impostazioni (icona ingranaggio) e selezionare la scheda **About**. Verificare la corretta visualizzazione di versione (`v1.0.0`), conformità normativa AeCI (D.P.R. 133/2010), 504 quiz, regola 30 quiz / 45 min / max 3 errori, architettura 100% offline-first e crediti.

### 2. Simulatore d'Esame Ufficiale AeCI (30 Quiz / 45 Minuti)
- [ ] **Composizione Ripartizione 9 Materie**: Avviare una nuova simulazione d'esame. Verificare che vengano estratti esattamente 30 quesiti con la ripartizione regolamentare: Aerodinamica (9), Meteorologia (8), Tecnica di Pilotaggio (5), Normativa (2), Sicurezza (2), Primo Soccorso (1), Fisiopatologia (1), Strumenti (1), Materiali (1).
- [ ] **Countdown 45 Minuti**: Verificare che il timer parta da `45:00` e scorra regolarmente con avvisi visivi d'allerta all'avvicinarsi dello scadere.
- [ ] **Griglia di Navigazione 30 Slot**: Verificare che cliccando sulle bolle della griglia si salti alla domanda corrispondente, che le domande risposte cambino colore e che la bandierina `⚑ Rivedi` mostri il contrassegno sulla bolla.
- [ ] **Consegna & Valutazione Limite AeCI (BVA)**:
  - Rispondere a tutte le domande con max 3 errori (es. 28 esatte, 2 errate): verificare debriefing `IDONEO` con punteggio in verde smeraldo.
  - Testare il limite esatto di 4 errori: verificare debriefing `NON IDONEO` con avviso in rosso/ambra.
- [ ] **Debriefing & Analisi Errori**: Verificare che la schermata finale elenchi tutte le risposte errate con la soluzione esatta e la spiegazione didattica (Regola + Tranello), e che la sessione d'esame venga salvata nello storico.

### 3. Studio per Materie & Didattica Immediata
- [ ] **Filtro Materie**: Selezionare ciascuna delle 9 materie e verificare il conteggio dei quesiti e il caricamento istantaneo del catalogo filtrato.
- [ ] **Feedback Immediato (Toggle Impostazioni)**: Con l'opzione "Verifica Immediata nelle Materie" attiva nelle Impostazioni, selezionare una risposta: verificare la comparsa istantanea dell'esito verde/rosso e della card didattica con Regola e Tranello.
- [ ] **Disattivazione Feedback**: Disattivare l'opzione nelle Impostazioni e verificare che la risposta rimanga selezionata senza svelare subito l'esito prima del completamento del set.
- [ ] **Preferiti & Note Personali**: Cliccare sull'icona stella per aggiungere un quiz ai preferiti e scrivere una nota personale. Ricaricare la pagina e verificare la persistenza immediata in IndexedDB.

### 4. Quaderno Errori (Ripetizione Spaziata Leitner)
- [ ] **Ingresso Automatico Domande Errate**: Sbagliare un quiz in modalità Esame o Materie. Aprire la sezione **Errori** e verificare che il quiz compaia nell'elenco con contatore errori aggiornato.
- [ ] **Uscita Rigida a 2 Risposte Esatte Consecutive**:
  - Rispondere correttamente 1 volta: verificare che il contatore mostri `1/2 consecutivi` e il quiz rimanga nel quaderno.
  - Rispondere correttamente una seconda volta consecutiva: verificare la promozione e l'uscita definitiva del quiz dal quaderno errori.
  - Sbagliare nuovamente: verificare il reset del contatore a `0/2`.

### 5. Archivio Completo & Ricerca Full-Text
- [ ] **Ricerca Istantanea**: Digitare parole chiave (es. "stallo", "QNH", "nube", "133") nella barra di ricerca e verificare il filtraggio in tempo reale tra le 504 domande.
- [ ] **Filtro Preferiti & Note**: Attivare il filtro "Solo Preferiti" o "Con Note" e verificare la corretta visualizzazione isolata dei quiz contrassegnati.
- [ ] **Ascolto e Revisione da Archivio**: Verificare che tutti i pulsanti audio e i dettagli didattici (Regola e Tranello) siano accessibili direttamente dalle card dell'archivio.

### 6. Motore Audio Vocale Cockpit & Quick Speech Menu
- [ ] **Riproduzione Parlato Universale**:
  - Testare il parlato della domanda (pulsante audio domanda o tasto `Q`).
  - Testare il parlato delle singole opzioni 1, 2, 3 (pulsanti opzioni o `Alt+1`, `Alt+2`, `Alt+3`).
  - Testare il parlato della spiegazione didattica (pulsante spiegazione o tasto `E`).
- [ ] **Pausa & Ripresa Senza Perdita Posizione**: Mettere in pausa durante l'ascolto e riprendere; verificare che l'audio riprenda dallo stesso punto esatto senza ricominciare da capo.
- [ ] **Riavvio da Capo Istantaneo**: Cliccare sul pulsante `↺` (o tasto `R` / `Shift+Q` / `Shift+E`) mentre l'audio sta parlando o è in pausa; verificare il riavvio immediato dall'inizio.
- [ ] **Commutazione Voci (Giuseppe / Elsa)**: Selezionare voce maschile Giuseppe e poi voce femminile Elsa (da Quick Speech Menu in Navbar o da Impostazioni). Verificare il cambio immediato di timbro e dizione.
- [ ] **Quick Speech Menu a 1 Clic**: Cliccare sull'icona cuffie nella Navbar; verificare la regolazione al volo di voce, velocità di riproduzione, auto-play e muting senza entrare nelle impostazioni complete.

### 7. Modalità Alla Guida (Truck & Cockpit Drive Mode)
- [ ] **Layout Zero-Scroll & Viewport 100dvh**: Avviare la Modalità Guida da smartphone e da desktop. Verificare che l'interfaccia occupi esattamente il 100% dell'altezza dello schermo senza barre di scorrimento e con 3 macro-pulsanti tattili ad altissima visibilità.
- [ ] **Screen Wake Lock**: Verificare l'indicatore `[WAKE LOCK ATTIVO]` e accertarsi che lo schermo del dispositivo non vada in standby o spegnimento automatico durante la sessione.
- [ ] **Spiegazione Vocale di Benvenuto (Run-Once)**: Al primo avvio della Guida, verificare la riproduzione automatica del briefing vocale iniziale e il funzionamento del tasto `[⏭ Salta]`. Riaprire la guida e verificare che il briefing non si ripeta automaticamente.
- [ ] **Riascolto On-Demand & Riarmo Briefing**: Testare il riascolto del briefing dal Launcher (`[🔊 Spiegazione Vocale]`), dalla modale comandi (`?`) e verificare il toggle di riattivazione all'avvio nella scheda Guida delle Impostazioni.
- [ ] **Pilota Automatico & Sequenza Continua**: Avviare il pilota automatico: verificare la lettura della domanda, la riproduzione delle opzioni 1, 2, 3, il countdown di risposta, l'indicazione della risposta esatta e l'avanzamento automatico al quiz successivo.
- [ ] **Comandi Vocali in Italiano**: Pronunciare "Uno", "Due", "Tre" per rispondere; "Avanti" per passare al prossimo; "Ripeti" o "Da capo" per riascoltare; "Pausa" e "Stop" per arrestare il pilota automatico; "Aiuto" per aprire il cheat sheet comandi.

### 8. Gestione Offline & Audio CacheStorage
- [ ] **Funzionamento Completo Offline**: Disattivare la connessione Wi-Fi/dati del dispositivo (o attivare modalità offline in DevTools). Ricaricare l'app e verificare che continui a funzionare al 100% con tutti i 504 quiz, storico ed esami.
- [ ] **Indicatore Stato Offline & HUD Rete**: In modalità offline, verificare la comparsa del badge ambra `[⚡ OFFLINE]` in Navbar e nell'HUD della Modalità Guida, del banner informativo e della modale Cockpit Briefing via portal.
- [ ] **Ripristino Connessione**: Riattivare la rete: verificare la comparsa del banner verde `[ONLINE]` temporizzato (3.5s) e la scomparsa automatica dei badge offline.
- [ ] **Download Archivio Audio Offline**: Dalle Impostazioni (scheda Voce) o dal prompt primo avvio Guida, avviare il download della voce Giuseppe (~154 MB) o Elsa (~148 MB). Verificare la barra di avanzamento e l'indicatore percentuale in Navbar.
- [ ] **Fallback Offline Intelligente**: Impostare l'app offline con solo 1 voce scaricata in cache; selezionare l'altra voce non scaricata e verificare che il motore vocale commuti automaticamente sulla voce scaricata notificando l'utente.
- [ ] **Gestione Cache Audio**: Nelle Impostazioni (scheda Voce), verificare la visualizzazione dello spazio occupato e testare l'eliminazione pulita della cache con reset dello stato.

### 9. Backup Cloud Google Drive & Esportazione File JSON
- [ ] **Esportazione Copia Locale (.json)**: Nelle Impostazioni (scheda Backup), cliccare "Scarica copia". Verificare il download del file JSON contenente lo snapshot completo di Dexie.
- [ ] **Importazione Copia Locale (.json)**: Testare il caricamento del file JSON tramite "Carica copia" e verificare il ripristino delle statistiche e delle note.
- [ ] **Google Drive Backup (GIS OAuth)**:
  - Cliccare su "Salva adesso": autenticarsi con il proprio account Google e verificare il salvataggio nella cartella privata `appDataFolder`.
  - Cliccare su "Unisci dati (Merge)": verificare il download e lo smart merge dei dati senza cancellazione o duplicazione dei progressi.
- [ ] **Reset Dati**: Nelle Impostazioni (scheda Dati), cliccare "Cancella tutti i dati e ricomincia da zero". Verificare il prompt di conferma e l'azzeramento pulito del database IndexedDB.

