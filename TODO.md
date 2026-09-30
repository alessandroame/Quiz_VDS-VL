# 📋 VDS-VL Quiz Master - Avanzamento Lavori (TODO)

**Data Inizio**: 27/09/2026  
**Stato Generale**: 🟢 **Fasi 0-6 Completate (100%), Fase 7 (Collaudo Manuale E2E) Pronta, Fasi 8 e 9 Completate al 100%, Fase 10 (Armonizzazione UI/UX & Disambiguazione Controlli Audio) Pianificata per Esecuzione Immediata**

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
- [x] `.agents/skills/minimal-ui-ux` (Design system minimale per lo studio, microcopy essenziale, temi chiaro/scuro/auto)
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

---

## 🚀 Fase 8: Prossimi Obiettivi & Nuove Funzionalità (Backlog Attivo)

Questa sezione raccoglie le nuove funzionalità e i miglioramenti di interfaccia richiesti e pianificati per le prossime iterazioni:

### 1. Filtro Domande Esclusive Deltaplano (Discipline Tagging con Protezione Quesiti Condivisi)
- [x] **Audit e Categorizzazione dei 504 Quiz AeCI**:
  - [x] Analisi semantica dettagliata dell'intero database dei 504 quiz: identificati 30 quesiti esclusivi Deltaplano (barra di controllo/trapezio, pilotaggio pendolare per spostamento baricentro, trave di chiglia, cavi e tubi strutturali), 46 quesiti esclusivi Parapendio (freni, fascio funicolare, cassoni, centine, chiusure asimmetriche/frontali) e 428 quesiti Comuni Condivisi (aerodinamica generale, meteo completa, normativa D.P.R. 133/2010, primo soccorso, fisiopatologia, sicurezza comune e strumentazione).
- [x] **Vincolo Tassativo di Salvaguardia**:
  - [x] Preservati rigorosamente nei quesiti comuni tutti i principi trasversali (effetto suolo Q2147, precedenze reciproche Q1036, paracadute di soccorso Q8017-8020, velocità di efficienza e meteo). I 428 quesiti comuni non vengono mai esclusi né in modalità Parapendio né in modalità Deltaplano.
- [x] **Tipizzazione & Aggiornamento Schema Dati**:
  - [x] Estesi i tipi in `src/types/quiz.ts` (`Discipline = 'all' | 'hang_glider' | 'paraglider'`) e `src/types/database.ts` (`disciplinePreference` in `AppSettings`).
  - [x] Aggiornati `src/data/questions.json` e `public/data/questions.json` con campo `discipline` tipizzato su tutti i 504 quiz (30 `hang_glider`, 46 `paraglider`, 428 `all`).
  - [x] Creato modulo di utilità `src/utils/discipline.ts` con opzioni, funzioni di filtraggio e badge visivi.
- [x] **UI Controlli Filtro Disciplina**:
  - [x] Componente `src/components/DisciplineSelector.tsx` ergonomico a pillole avioniche con contatori dinamici.
  - [x] Integrato selettore disciplina nel launcher di **Esame** (`ExamScreen.tsx`), nelle **Materie** (`TopicsScreen.tsx`), nell'**Archivio** (`ArchiveScreen.tsx`) e nelle **Impostazioni** (`SettingsModal.tsx` in "Aspetto & Studio").
  - [x] Badge avionico discreto sulle card dei quiz (`QuestionCard.tsx` e `ArchiveItem`) per le domande esclusive.
  - [x] `QuizContext.tsx`: ricalcolo reattivo di `filteredQuestions`, `subjectsAnalytics`, `totalSeen` e `readinessScore` in base alla disciplina attiva.
- [x] **Suite di Test Dedicata (Vitest) & Collaudo Visivo CDP**:
  - [x] Test unitari `src/data/questions.test.ts` (distribuzione 428/30/46) e `src/utils/discipline.test.ts` (6 test su filtri, quote esame e badge). Totale suite 16/16 passate (140/140 unit test).
  - [x] Collaudo visivo headless CDP `scripts/test_discipline_filters.cjs` (`npm run test:visual:discipline`) su Mobile Portrait (390x844) e Desktop (1440x900) con 0 errori in console browser.

### 2. Blocco del Menu di Navigazione al Top (Sticky / Fixed Top Navigation Bar)
- [x] **Riorganizzazione Strutturale di Navbar & Header**:
  - [x] Modifica di `src/components/Navbar.tsx`: fissare la barra di navigazione principale in alto (permanently fixed top-0) integrando i 5 tab di navigazione (**Esame**, **Materie**, **Errori**, **Archivio**, **Stats**) all'header superiore anziché confinarli nella bottom bar.
  - [x] Rimozione della bottom navigation bar fissa inferiore (`fixed bottom-0`), liberando altezza utile dello schermo per i contenuti dei quiz, le risposte a tocco rapido, il debriefing e le liste di archivio.
  - [x] Rimozione del blocco preamble ridondante ("fuffa") in `src/components/ExamScreen.tsx`, portando le card di avvio esame subito in cima allo schermo.
- [x] **Ottimizzazione Layout Globale (`src/App.tsx`)**:
  - [x] Ricalibrazione dei padding globali dell'applicazione (`pt-[98px] sm:pt-[104px]` per clearance del fixed header e riduzione del `pb-20` a `pb-8`) per un flusso visivo pulito ed ergonomico a tutta altezza.
- [x] **Test Visivo & Ergonomia Mobile/Desktop**:
  - [x] Verifica tramite CDP headless a 390x844 (mobile) e 1440x900 (desktop) per garantire stabilità visiva durante lo scorrimento, zero salti di layout e nessuna sovrapposizione con i banner informativi o download audio.

### 3. Ristrutturazione Impostazioni con Accordion Compresso Singolo (Single-Open Accordion)
- [x] **Superamento del Pills/Segmented Menu Orizzontale**:
  - [x] Riprogettazione del componente `src/components/SettingsModal.tsx` (e alias `SettingsScreen`): sostituzione della barra orizzontale a schede/pillole (`tab-appearance`, `tab-voice`, `tab-drive`, `tab-cloud`, `tab-data`, `tab-about`) con un layout verticale compatto a pannelli ripiegabili.
- [x] **Implementazione Accordion Compresso a Sezione Singola (Mutually Exclusive)**:
  - [x] Layout verticale a pannelli compatti ad alta densità (`AccordionCard`) con icona tematica, titolo, anteprima live badge dinamico dello stato (`Auto • Feedback ON`, `Giuseppe • 1x • TTS Web`, `Radio ON • 5s`, `Manuale`, `504 Quiz • Dexie SSOT`, `v1.0.0 • AeCI`) e indicatore a freccia `ChevronDown` animato (180° rotation).
  - [x] Regola ferrea di mutua esclusione: l'apertura di un pannello espande la sezione desiderata e chiude automaticamente qualsiasi altra sezione precedentemente aperta, azzerando la dispersione visiva (`openSection: SettingsTab | null`).
  - [x] Possibilità di collassare completamente tutti i pannelli cliccando sulla sezione attiva o tramite pulsante rapido di toolbar (`Comprimi tutto` / `Espandi prima`).
- [x] **Transizioni Fluide & Rispetto Palette Cockpit**:
  - [x] Transizioni CSS fluide, zero layout shift e perfetta resa visiva sia in tema Carbon Cockpit Dark (Zero-Blue) che in Hangar Light.
  - [x] Piena retrocompatibilità per selettori ed eventi di tastiera (`Esc`, switch fullscreen, navigazione accessibile).
- [x] **Verifica Visiva Headless & Regression Test**:
  - [x] Creato script dedicato `scripts/test_settings_accordion.cjs` (verifica 6 schede, espansione iniziale, collasso totale, mutua esclusione, contenuti about, responsiveness desktop e 0 errori console).
  - [x] Aggiornati e verificati con successo gli script di collaudo visivo `scripts/test_settings_fullscreen.js`, `scripts/test_settings_about.js`, `scripts/test_drive_intro.js` e `scripts/test_offline_audio.js`.

### 4. Visualizzazione Globale del Numero di Versione dell'Applicazione
- [x] **Integrazione del Numero di Versione nella UI**:
  - [x] Rendere il numero di versione dell'applicazione (es. `v1.0.0` o `v1.0.0 (build #...)`) visibile in modo discreto ma immediatamente accessibile all'utente.
  - [x] Collocazione integrata nell'header della **Navbar** (`#app-version-badge`) accanto al badge "2017" con tooltip contenente `__APP_BUILD_ID__`.
  - [x] Collocazione integrata nell'header fisso superiore della schermata **Impostazioni** (`SettingsModal`) e nella sezione **About**.
- [x] **Utilizzo della Costante di Build Globale (`__APP_VERSION__`)**:
  - [x] Collegata la visualizzazione direttamente alla costante `__APP_VERSION__` definita in `vite.config.ts` (derivata dinamicamente da `package.json`) e arricchita con `__APP_BUILD_ID__` / commit hash, azzerando le stringhe di versione cablate manualmente (hardcoded).

### 5. Barra di Navigazione Quiz Ancorata in Basso (Sticky / Fixed Bottom Action Bar)
- [x] **Ancoraggio Permanente dei Controlli "Precedente" e "Successiva"**:
  - [x] Rendere i controlli di navigazione tra i quesiti (`Precedente` e `Successiva`, oltre al pulsante di completamento scheda/conclusione ripasso e al tasto rapido tutor "Prossima Domanda") **costantemente visibili e ancorati in basso** al viewport durante l'esecuzione del quiz:
    - In modalità **Simulazione Esame** (sia Esame Ufficiale che Didattica Tutor in `src/components/ExamScreen.tsx`).
    - Nello **Studio per Materie** (`src/components/TopicsScreen.tsx`).
    - Nel ripasso del **Quaderno Errori** (`src/components/MistakesScreen.tsx`).
  - [x] Azzerare la necessità per l'allievo pilota di dover scorrere verso il fondo della schermata per avanzare o retrocedere quando il testo del quesito, le opzioni di risposta o le card didattiche espanse (Regola e Tranello) superano l'altezza visibile dello smartphone.
- [x] **Ergonomia Cockpit, Styling & Safe Area**:
  - [x] Creato il componente dedicato `src/components/QuizBottomBar.tsx` posizionato `fixed bottom-0 inset-x-0 z-30`, sfondo con effetto `backdrop-blur-md` e styling coerente con i temi avionici (`bg-zinc-950/95 border-t border-zinc-800` in Cockpit Dark; `bg-white/95 border-t border-slate-200` in Hangar Light).
  - [x] Pieno supporto ai margini di sicurezza inferiori per smartphone con gesture bar (`pb-[max(0.75rem,env(safe-area-inset-bottom))]`).
  - [x] Target tattili ampi e comodi secondo la legge di Fitts per il tocco immediato con il pollice a una sola mano, con stati disabilitati chiari (`disabled:opacity-30 disabled:cursor-not-allowed`) e pulsante bandierina `⚑ Rivedi` integrato a portata di pollice.
- [x] **Prevenzione Sovrapposizioni (Content Clearance)**:
  - [x] Calibrato il padding inferiore sui container dei quiz (`pb-28 sm:pb-32`) in `ExamScreen.tsx`, `TopicsScreen.tsx` e `MistakesScreen.tsx`, affinché l'ultima opzione di risposta, il feedback didattico o il link di abbandono simulazione non vengano mai nascosti o coperti dalla barra ancorata.
  - [x] Elevato il banner di avanzamento download voci (`AudioDownloadBanner.tsx`) a `bottom-16 sm:bottom-20` tramite prop `elevated` quando un quiz o esame è attivo per eliminare collisioni visive.
- [x] **Sinergia con il Menu di Navigazione al Top**:
  - [x] Piena sinergia con la Navbar al top: l'area inferiore del viewport è interamente e pulitamente dedicata ai comandi operativi del quiz attivo.
- [x] **Collaudo Visivo Headless & Multi-Viewport**:
  - [x] Verificato con suite automatizzata `scripts/test_quiz_bottom_bar.cjs` su CDP headless a 390x844 (mobile portrait), 844x390 (mobile landscape) e 1440x900 (desktop): bottom bar agganciata con precisione sub-pixel, 0 shift su scroll di 300px, avanzamento tutor fluido e 0 errori in console browser.

### 6. Modalità Tutor Didattica nella Modalità Alla Guida (Hands-Free Voice Tutor)
- [x] **Flusso Didattico Vocale Esteso**:
  - [x] In modalità standard, il Pilota Automatico legge domanda, opzioni e, dopo la risposta o lo scadere del timer, pronuncia la sola risposta corretta avanzando al quiz successivo.
  - [x] In **Modalità Guida Tutor**, il motore vocale neurale non si limita alla risposta corretta, ma **legge ad alta voce la spiegazione didattica essenziale completa**:
    - 📘 **Regola**: principio fisico, aerodinamico o norma di legge alla base del quesito.
    - ⚠️ **Tranello**: bias cognitivo o ambiguità lessicale da evitare.
- [x] **Sincronizzazione Intelligente del Pilota Automatico**:
  - [x] Nel ciclo automatico, il passaggio al quiz successivo attende tassativamente la **conclusione della lettura vocale della spiegazione didattica** (`onEnd`), lasciando una pausa di assimilazione calibrata (2.5 secondi con countdown live) prima di procedere.
  - [x] Nel ciclo manuale con comandi vocali, l'allievo può pronunciare *"Avanti"*, *"Prossima"* o toccare lo schermo per avanzare con i propri ritmi.
- [x] **Interfaccia HUD Cockpit a Zero-Scroll (Viewport 100dvh)**:
  - [x] Visualizzazione delle card didattiche compatte **Regola** e **Tranello** ad altissima leggibilità direttamente nell'area centrale dell'HUD (`#drive-didactic-card`) durante la fase di debriefing della domanda, senza generare barre di scorrimento e rispettando il vincolo rigido `100dvh` della Modalità Guida (opzioni compattate ergonomicamente a fascia sottile).
- [x] **Controlli Dedicati & Comandi Vocali**:
  - [x] Toggle rapido **[Tutor ON/OFF]** collocato:
    - Nel Launcher iniziale della Modalità Guida (`#btn-drive-toggle-tutor-launcher`);
    - Nell'HUD superiore a 1 tocco durante la guida attiva (`#btn-drive-tutor-toggle`);
    - Nel Quick Speech Menu della Navbar (`#quick-menu-toggle-tutor`) e nelle Impostazioni (scheda Guida: `#setting-drive-tutor-toggle`).
  - [x] Estensione del parser dei comandi vocali (`src/utils/voiceCommandParser.ts`):
    - Comando *"Spiega"*, *"Regola"*, *"Tranello"*, *"Perché"* per ascoltare la spiegazione on-demand anche con modalità tutor disattivata.
    - Comandi *"Attiva Tutor"* / *"Disattiva Tutor"* / *"Tutor"* per commutare al volo lo stato durante la guida.
    - Normalizzazione Unicode NFD per garantire che le vocali accentate italiane (`perché`, `modalità`) siano riconosciute con word boundary regex.
- [x] **Suite di Test & Collaudo Visivo Headless**:
  - [x] Unit test in Vitest per comandi vocali didattici e toggle tutor (`src/utils/voiceCommandParser.test.ts`: test cases `VC-08` e `VC-09`).
  - [x] Collaudo visivo headless CDP con script dedicato `scripts/test_drive_tutor.js` su viewport Mobile Portrait (390x844) che ha certificato: comparsa della scheda didattica `#drive-didactic-card`, pulsante Riascolta, zero-scroll garantito (`scrollHeight: 844, innerHeight: 844`) e 0 errori in console browser.

### 7. Analisi & Risoluzione Interruzione Spiegazione Vocale su Risposta Errata
- [x] **Indagine Root Cause e Diagnosi Tecnica**:
  - [x] **Causa Primaria Identificata in Modalità Alla Guida (`src/components/DriveModeScreen.tsx`)**:
    * Quando l'allievo selezionava una risposta errata o scadeva il countdown di risposta, veniva invocato `playExplanation()` per avviare il file audio `{qid}_e.mp3` che recita: *"Risposta errata. La risposta esatta è [la due: ...]. Regola: [...]. Tranello: [...]"* (durata audio: 12-25 secondi).
    * Contemporaneamente, il timer rigido cablato a 3.5s (`setTimeout(..., 3500)`) scattava prematuramente troncando la voce proprio all'inizio di Regola e Tranello.
- [x] **Piano di Risoluzione Architetturale**:
  - [x] **Avanzamento Event-Driven del Pilota Automatico (`onEnd`)**:
    * Sostituito il timer rigido: implementato listener reattivo su `isExplanationPlaying` / `isPartPlaying('explanation')` che rileva la conclusione effettiva dell'audio.
    * Integrata una pausa di assimilazione temporizzata a 2.5 secondi con countdown visivo `Prossima in Xs` nell'HUD, e safety guard a 4.5s in caso di assenza file audio.
  - [x] **Controllo Interruzione Manuale Utente**:
    * Preservata la facoltà per l'allievo di saltare la spiegazione anticipatamente con comando vocale (*"Avanti"*) o tocco del pulsante Successiva senza bloccare l'interfaccia.
- [x] **Suite di Test & Collaudo Visivo**:
  - [x] Test unitari 15/15 suite passate (133/133 test).
  - [x] Collaudo E2E headless confermato tramite `npm run test:visual:tutor` con zero errori di console e perfetto debriefing didattico.

### 8. Meccanismo di Invalidazione & Aggiornamento Differenziale Audio Offline (PWA Cache Invalidation)
- [x] **Manifest Audio Indicizzato con Hash (Opzione A - Differential Update)**:
  - [x] Creato lo script Python [scripts/generate_audio_manifest.py](file:///c:/github/Quiz_VDS-VL/scripts/generate_audio_manifest.py) per generare in fase di build [public/audio/manifest.json](file:///c:/github/Quiz_VDS-VL/public/audio/manifest.json) contenente versione semantica, data di compilazione, conteggio frammenti e mappa `filename -> MD5 hash (8 caratteri)` per tutte le 2.520 tracce di Giuseppe ed Elsa (~118 KB complessivi).
  - [x] Aggiunto lo script di automazione `"build:audio:manifest": "python scripts/generate_audio_manifest.py"` in [package.json](file:///c:/github/Quiz_VDS-VL/package.json).
- [x] **Configurazione Workbox Service Worker**:
  - [x] Configurato in [vite.config.ts](file:///c:/github/Quiz_VDS-VL/vite.config.ts) il routing dedicato con strategia `NetworkFirst` (`networkTimeoutSeconds: 3`) per `/audio/manifest.json`, assicurando che la PWA riceva sempre la versione più recente del manifest quando connessa a internet.
- [x] **Estensione del Modello Dati e Motore Audio (`AudioDownloadManager`)**:
  - [x] Tipizzazione estesa in [src/types/audio.ts](file:///c:/github/Quiz_VDS-VL/src/types/audio.ts) (`AudioManifest`, `InstalledVoiceMetadata`, `VoiceUpdateDetail`, `AudioUpdateCheckResult`).
  - [x] Aggiunte le impostazioni `audioAutoUpdateOnline: boolean` e `lastAudioCheckAt?: number` in [src/types/database.ts](file:///c:/github/Quiz_VDS-VL/src/types/database.ts) e [src/db/index.ts](file:///c:/github/Quiz_VDS-VL/src/db/index.ts).
  - [x] Implementate in [src/services/audioDownloadManager.ts](file:///c:/github/Quiz_VDS-VL/src/services/audioDownloadManager.ts):
    * `checkAudioUpdates(targetVoice?)`: confronta gli hash del manifest remoto con i metadati memorizzati su Dexie, identificando i soli file obsoleti o modificati (`staleFiles`).
    * `applyAudioUpdates(voice, onProgress)`: scarica selettivamente i soli frammenti obsoleti con cache-busting `?v=${hash}&_t=${Date.now()}` e li scrive direttamente nella cache locale `vds-audio-${voice}` di `window.caches`, aggiornando i metadati Dexie.
    * `autoCheckAndSyncOnStartup()`: controllo silenzioso non bloccante all'avvio dell'app (se online e autorizzato dall'impostazione) che sincronizza in background modifiche puntuali (fino a 25 file).
- [x] **Soppressione Prompt Download Ridondante in Modalità Guida**:
  - [x] In [src/components/DriveModeScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx): verificato asincronamente lo stato reale in `CacheStorage` all'avvio tramite `audioDownloadManager.checkAllStatuses()`. Se la voce attiva o un'altra voce è già scaricata (`downloadedCount > 2000` o `isComplete`), la modale `AudioOfflinePromptModal` non compare e il prompt viene contrassegnato automaticamente come dispensato.
- [x] **Interfaccia Utente nelle Impostazioni (`SettingsModal.tsx`)**:
  - [x] Integrati badge ambra animati (`X file modificati`) su Giuseppe ed Elsa in caso di aggiornamenti disponibili.
  - [x] Pulsante dedicato `[Aggiorna (N)]` per voce con barra di avanzamento e percentuale live.
  - [x] Pannello di controllo con pulsante `[Verifica ora]` (`#btn-check-audio-updates`), timestamp dell'ultima verifica e switch per attivare/disattivare l'aggiornamento automatico online.
- [x] **Test Unitari Vitest & Build di Produzione**:
  - [x] Aggiunti 7 unit test in [src/services/audioDownloadManager.test.ts](file:///c:/github/Quiz_VDS-VL/src/services/audioDownloadManager.test.ts) (`ADM-09` a `ADM-15`), portando la suite totale a 150/150 test superati al 100%.
  - [x] Build di produzione verificata con successo (`npm run build`).

---

## 🛠️ Fase 9: Hardening Tecnico, Resilienza Reattività & Code-Splitting (Post-Audit)

Questo piano raccoglie e prioritizza gli interventi strutturali emersi dall'audit tecnico approfondito del 29/09/2026, finalizzati a massimizzare le performance su dispositivi mobili, blindare la reattività degli hook vocali e abbattere la dimensione del bundle.

### 1. [x] [P1] Stabilizzazione Autoplay & Disaccoppiamento Reattività (`src/components/QuestionCard.tsx`)
- [x] **Rimozione Trigger Ricorsivo nell'Effetto Autoplay**:
  - [x] Eliminare `isThisQuestionActive` dall'array delle dipendenze dell'`useEffect` di autoplay (riga 62 di `QuestionCard.tsx`).
  - [x] Mantenere come soli trigger stabili `[question.id, settings.ttsEnabled, settings.ttsAutoPlayQuestion, playFullSequence, stop]`.
  - [x] Utilizzare un `useRef` sincronizzato (`isThisQuestionActiveRef`) per consentire alla funzione di pulizia (`cleanup`) di invocare `stop()` solo se la scheda che si sta smontando è effettivamente quella in riproduzione, azzerando le doppie chiamate a `playFullSequence()` e gli errori browser `AbortError: The play() request was interrupted by a new load request`.
  - [x] Validare con test unitario dedicato e suite visual review a 0 errori console.

### 2. [x] [P1] Consolidamento Suite Collaudi Headless Interattivi E2E
- [x] **Standardizzazione Script di Collaudo E2E Interattivo**:
  - [x] Aggiungere lo script npm `"test:visual:review": "node scripts/test_review_navigation_and_voice.cjs"` in `package.json` per certificare prima di ogni commit il ciclo completo di completamento esame, navigazione debriefing e rientro home a 0 errori console.
  - [x] Creare lo script speculare `scripts/test_drive_flow_interactive.cjs` (`npm run test:visual:drive:flow`) per simulare in CDP headless: apertura Modalità Guida -> avvio quiz -> simulazione risposta vocale/touch -> debriefing -> chiusura, con asserzione automatica su `consoleErrors.length === 0`.

### 3. [x] [P2] Ottimizzazione Prestazioni & De-sottoscrizione Vocale (`src/components/ArchiveScreen.tsx`)
- [x] **Eliminazione Over-Subscription su 474+ Elementi**:
  - [x] Attualmente ciascuno dei 474/504 `<ArchiveItem>` invocava `useAviationVoice(q.id)`, registrando 474 listener contemporanei in `voiceService`.
  - [x] Rifattorizzata l'architettura dei componenti per sottoscrivere l'hook vocale **esclusivamente all'interno della scheda espansa** (`isExpanded === true`), tramite `<ArchiveItemExpandedContent>`.
  - [x] Azzerati i 474 re-render concorrenti ad ogni cambio di stato audio (Play/Pausa/Stop) su dispositivi mobili.
- [x] **Paginazione Progressiva o Virtualizzazione del Catalogo**:
  - [x] Implementato rendering incrementale (chunk iniziale da 50 quesiti con pulsante "Mostra altri" e auto-inclusione attiva per salto #ID) per ridurre il footprint DOM e accelerare il mount iniziale della schermata.

### 4. [x] [P2] Code-Splitting Dinamico con `React.lazy()` & Riduzione Bundle Size (`src/App.tsx`, `vite.config.ts`)
- [x] **Caricamento On-Demand delle Schermate Pesanti**:
  - [x] Convertite in `React.lazy()` con fallback `Suspense` minimale le viste secondarie in `App.tsx`:
    - `DriveModeScreen` (~58 kB chunk)
    - `SettingsModal` (~51 kB chunk)
    - `ArchiveScreen` (~25 kB chunk)
    - `StatsScreen` (~7 kB chunk)
    - `TopicsScreen` (~6 kB chunk)
    - `MistakesScreen` (~7 kB chunk)
- [x] **Ottimizzazione Configurazione Rollup / Chunks**:
  - [x] Ricalibrato `manualChunks` in `vite.config.ts` per isolare `quiz-dataset` (~393 kB) e `vendor` (~334 kB).
  - [x] Portato il bundle principale `dist/assets/index.js` da **~931 kB** a **163 kB** (abbattimento dell'82.5%), azzerando qualsiasi warning Vite (`chunkSizeWarningLimit`).

### 5. [x] [P3] Decomposizione Modulare di `DriveModeScreen.tsx`
- [x] **Scomposizione del Monolite da 1.941 Righe**:
  - [x] Suddividere `DriveModeScreen.tsx` in tre sotto-componenti dedicati a responsabilità singola nella directory `src/components/drive/`:
    - `DriveLauncher.tsx`: schermata iniziale di selezione modalità, impostazioni rapide, test microfono e briefing di benvenuto.
    - `DriveActiveHUD.tsx`: visualizzazione quiz a tutto schermo `100dvh` zero-scroll, macro-fasce touch Fitts's law, scheda didattica tutor Regola/Tranello e visualizzatore microfono radar.
    - `DriveDebriefing.tsx`: riepilogo finale della sessione di guida con statistiche di idoneità ed elenco errori.
  - [x] Riduzione del componente genitore `DriveModeScreen.tsx` da 1.941 righe a 1.070 righe (-871 righe), conservando il puro ruolo di orchestrazione reattiva dello stato.
  - [x] Certificato con test interattivo E2E `npm run test:visual:drive:flow` a 0 errori console.

### 6. [x] [P3] De-duplicazione Dati `questions.json` & PWA Precache
- [x] **Audit Architettura Distribuzione Dataset & Implementazione Opzione B**:
  - [x] Audit completato: confermata assenza totale di chiamate `fetch` a runtime verso `public/data/questions.json`. L'intera applicazione importa tipitamente `src/data/questions.json` isolato da Rollup nel chunk `quiz-dataset.js` (393 kB, gzip: 94.78 kB).
  - [x] Rimosso `data/questions.json` da `includeAssets` in `vite.config.ts`.
  - [x] Rimosso `public/data/questions.json` come duplicato ridondante, stabilendo `src/data/questions.json` come Single Source of Truth (SSOT).
  - [x] Aggiornato `scripts/extract_quizzes.py` per scrivere unicamente su `src/data/questions.json`.
  - [x] Ridotto il payload di precache Service Worker da **5.246 KiB a 4.804 KiB** (-441.77 KiB) e le voci precache da 49 a 47, azzerando il doppio consumo di memoria nella CacheStorage del browser.

---

## 🎨 Fase 10: Armonizzazione UI/UX & Disambiguazione Stati Top Bar (Zero-Confusion Audio & Controls)

Piano dettagliato approvato: [docs/plans/2026-09-30_ui_audio_controls_disambiguation.md](file:///c:/github/Quiz_VDS-VL/docs/plans/2026-09-30_ui_audio_controls_disambiguation.md) (`TODO-08`).

### 1. [ ] Top Bar & Header (`src/components/Navbar.tsx` & `src/components/VoiceQuickMenu.tsx`)
- [ ] **Disambiguazione Pulsante Modalità Audio (`#btn-drive-mode` e `#btn-mini-audio`)**:
  - Rimuovere il background ambra permanente (`bg-amber-500/10 border-amber-500/30 text-amber-400`).
  - Convertire in pulsante pillola neutro (`border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white light:bg-slate-100 light:border-slate-200 light:text-slate-700`).
  - Icona `Headphones` neutra con accento al solo passaggio hover.
- [ ] **Disambiguazione Menu Rapido Voce (`#btn-voice-quick-menu`)**:
  - Rimuovere la pillola ambra permanente legata a `settings.ttsEnabled`.
  - Applicare stile neutro coordinato agli altri controlli di testata.
  - Rappresentare lo stato abilitato/muto esclusivamente con l'icona interna (`Volume2` + `1.0x` bianco/zinco quando attivo, `VolumeX` + `Muto` grigio/spento quando muto).
- [ ] **Igiene Visiva Elementi Statici / Secondari**:
  - Normalizzare la freccia `ChevronLeft` in `#btn-nav-back-home` (da `text-amber-400` a `text-zinc-400`).
  - Normalizzare il badge statico "2017" accanto al logo a pillola neutra `zinc-800` coerente con il badge di build.

### 2. [ ] Allineamento Pulsanti Audio nelle Schermate Interne
- [ ] `src/components/HomeScreen.tsx`: convertire `#btn-home-audio-quick` nel box telemetria da pillola gialla a pulsante secondario neutro.
- [ ] `src/components/ExamScreen.tsx`: convertire `#btn-exam-drive-mode` nella toolbar secondaria in pulsante di controllo neutro.
- [ ] `src/components/TopicsScreen.tsx`: convertire `#btn-topics-drive-mode` nella barra materia in pulsante neutro.
- [ ] `src/components/MistakesScreen.tsx`: convertire `#btn-mistakes-drive-mode` nella barra ripasso errori in pulsante neutro.

### 3. [ ] Pulizia HUD Modalità Guida (`src/components/drive/DriveActiveHUD.tsx`)
- [ ] Verificare che il menu rapido voce neutro faccia risaltare nitidamente solo i veri toggle attivi (Pilota Automatico, Tutor Didattico, Microfono).

### 4. [ ] Collaudo Visivo & Regression Testing
- [ ] Esecuzione screenshot CDP su mobile portrait (390x844) e desktop (1440x900) sia in tema Dark che Light.
- [ ] Suite Vitest a 220+ test passanti al 100% (`npm run test:unit`).
- [ ] Typecheck pulito a 0 errori (`tsc --noEmit`).
- [ ] Aggiornamento registro di bordo `WORKLOG.md` e linee guida `minimal-ui-ux`.








