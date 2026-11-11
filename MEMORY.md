# Project Memory: VDS-VL Quiz Master 🛩️

Questo file costituisce la **memoria tecnica permanente** del progetto. Raccoglie i vincoli architetturali consolidati, le regole normative AeCI, gli standard di testing e le convenzioni operative per prevenire allucinazioni, regressioni o spreco di token nelle sessioni di sviluppo.

> Per la visione complessiva, i requisiti utente e la matrice di stato, consultare **[DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md)**.  
> Per il diario cronologico delle lavorazioni e le decisioni architetturali (ADR), consultare **[WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md)**.

---

## 1. Regolamento & Quiz VDS-VL (AeCI)
- **Catalogo Completo**: 504 quiz totali (database ufficiale AeCI 2017).
- **Esame Ufficiale Volo Libero (`aeciRegulation.ts`)**: 30 quesiti a scelta multipla = **100 punti pesati** (`4 / 3 / 2` pt per materia). Esito a 3 fasce (`ExamOutcome`): **86–100 pt** = `IDONEO` (`'passed'`), **80–85 pt** = `IDONEO CON VERIFICA ORALE` (`'oral_check'`), **< 80 pt** = `NON IDONEO` (`'failed'`). Timer prova scritta: **30 min** ufficiale default (selettore `30 min / 45 min` in Impostazioni); in **Modalità Mani Libere** almeno **45 min** audio (`60 min` Maratona). Il punteggio `/100` vale solo sulle schede bilanciate a 9 materie (**Esame 30**, **Tutor Standard 30**, **Maratona 60** normalizzata da 200 a `/100`), mentre **Tutor Flash 10**, **Continuo**, **Materie** e **Quaderno Errori** restano a conteggio/accuratezza `%`; le sessioni storiche senza `scorePoints` mantengono l'esito legacy senza ricalcoli distruttivi.
- **Ripartizione e Pesi Materie Volo Libero (30 quiz = 100 pt)**:
  - 01 Normativa: 4 quiz × 3 pt = 12 pt
  - 02 Aerodinamica: 8 quiz × 3 pt = 24 pt
  - 03 Primo Soccorso: 1 quiz × 2 pt = 2 pt
  - 04 Fisiopatologia: 1 quiz × 2 pt = 2 pt
  - 05 Meteorologia: 6 quiz × 4 pt = 24 pt
  - 06 Strumenti: 1 quiz × 2 pt = 2 pt
  - 07 Tecnica Pilotaggio: 5 quiz × 4 pt = 20 pt
  - 08 Materiali: 1 quiz × 2 pt = 2 pt
  - 09 Sicurezza del Volo: 3 quiz × 4 pt = 12 pt
- **Spiegazioni Didattiche**: Devono limitarsi a `Regola` (principio fisico o norma) e `Tranello` (motivo tipico di errore), senza menzionare fonti terze o manuali non ufficiali. Formule fisiche e chimiche devono usare pedici/apici Unicode canonici (`Cₚ`, `Cᵣ`, `Eₚ`, `V²`, `S²`, `b²`, `m²`, `O₂`, `ρ` — guard `DATA-11` in `questions.test.ts`), normalizzati lato ricerca (`normalizeSearchText`) e comandi vocali (`normalizeVoiceText`).
- **Simulazione Esame Cieca vs Modalità Studio (`ExamScreen.tsx`, `DriveModeScreen.tsx`, `QuestionNavigator.tsx`)**:
  * *Insidia*: Mostrare colori verde/rosso, suoni esatto/errato, card `Regola/Tranello` o salvare subito `recordAnswer` durante **Esame Ufficiale (30 quiz)** o **Maratona (60 quiz)** rivela l'esito prima della consegna, altera il Quaderno Errori a metà prova e in caso di pausa/ripresa salta la registrazione delle risposte pre-pausa se `recordedQuestionIds` viene pre-popolato.
  * *Regola*: In `official` e `marathon` (sia UI classica sia Mani Libere) mantenere feedback neutro (`showFeedback={examMode === 'tutor'}`, bolle `border-sky-500/70`, click neutro, zero spiegazioni vocali/testuali), consentire la revisione della risposta prima di `Consegna` (auto-advance solo su `!wasAlreadyAnswered`) e differire `recordAnswer` interamente a `handleSubmitExam`.

---

## 2. Architettura PWA & Motore Quiz
- **Fair Coverage Randomizer**: Priorità assoluta a `times_seen == 0` (Bucket 0), poi a domande con minimo `times_seen` (Bucket 1). Nessun coupon collector problem.
- **Single Source of Truth (SSOT)**: Persistenza affidata a Dexie (IndexedDB) per lo stato reattivo e dati quiz; non duplicare o disallineare lo stato su variabili globali effimere.
- **Offline First**: L'app deve funzionare al 100% offline via Service Worker; nessuna funzionalità core deve dipendere dalla connessione di rete (a eccezione del backup manuale Google Drive).
- **Porta Locale Obbligatoria (5173) & Persistenza Token OAuth2 Google Drive (`googleDrive.ts`, `syncEngine.ts`)**:
  * *Insidia*: Qualsiasi porta diversa da `5173` blocca OAuth Google per origin mismatch; inoltre tenere `accessToken` solo in RAM azzera il token a ogni reload della PWA, mandando i push automatici in `needs_auth` e aprendo il popup su `Sincronizza adesso`.
  * *Regola*: Usare sempre `http://localhost:5173` (`strictPort: true`), persistere il token in `localStorage` (`vds_google_oauth_token_v1`) fino a 60s prima della scadenza (con pulizia su HTTP `401`), usare `{ prompt: '' }` su `requestAccessToken`, avviare `fullSync(false)` in `SyncEngine.init()` se il token è valido e formattare data/ora locale con `formatSyncTimestamp`.

---

## 3. UI/UX, Iconografia & Sistema Temi
- **Design per lo Studio Teorico (Minimal UI/UX)**: L'utente è un allievo che studia la teoria del volo per l'esame AeCI (non è in volo, non è in un cockpit). L'interfaccia è orientata all'apprendimento rapido, senza distrazioni o metafore forzate di pilotaggio.
- **Divieto Assoluto di Slogan e Buzzword Inutili**: Evitare categoricamente diciture come "Cockpit Avionics Design", "Zero-Blue Theme", "Cockpit Edition" o altri slogan di facciata. L'interfaccia deve essere sobria, pulita, diretta e incentrata unicamente su informazioni utili e pratiche per l'allievo pilota.
- **Stile Diretto ed Essenziale**: Zero preamboli, etichette essenziali (**Esame**, **Materie**, **Errori**, **Archivio**, **Stats**).
- **Feedback**: Secco e chiaro (`Esatta`, `Errata`, `⚑ Rivedi`, `IDONEO`, `NON IDONEO`).
- **Desktop Keyboard**: Tasti `1`, `2`, `3` per risposta, `F` per flag, frecce o `Spazio` per navigazione.
- **Iconografia Ufficiale PWA (Paraglider Question Mark)**:
  * **Concept**: Sintesi concettuale che unisce in un unico simbolo il Volo Libero e lo studio dei quiz: l'arco aerodinamico a celle cassonate del parapendio forma la testa del punto interrogativo (`?`), mentre il pilota imbracato con i comandi ne costituisce il punto inferiore.
  * **Asset**: Vettore SVG di precisione ([favicon.svg](file:///d:/Github/Quiz_VDS-VL/public/favicon.svg)), icone raster pixel-perfect [icon-192x192.png](file:///d:/Github/Quiz_VDS-VL/public/icons/icon-192x192.png), [icon-512x512.png](file:///d:/Github/Quiz_VDS-VL/public/icons/icon-512x512.png) e [apple-touch-icon.png](file:///d:/Github/Quiz_VDS-VL/public/apple-touch-icon.png) renderizzate via CDP.
- **Sistema Temi & Palette (Zero-Blue Minimal Dark / High-Contrast Light)**:
  * **Minimal Dark Mode**: Dominante blu categoricamente azzerata (0% cool hue). Sfondo `#09090b` (`zinc-950`), superfici `#18181b` (`zinc-900`), bordi `#27272a` (`zinc-800`), testo `#f4f4f5` (`zinc-100`) e accento primario ambra (`amber-500` / `amber-600`) per il massimo comfort visivo nello studio prolungato.
  * **High-Contrast Light Mode**: Registrata variante `light:` in `tailwind.config.js` (`addVariant('light', ':is(.light &)')`). Tutte le classi chiare sono confinate a `light:*` (`light:bg-white`, `light:border-slate-200`, `light:text-slate-900`).
  * In `index.html`, `<body>` include sia le classi scure che quelle chiare (`bg-zinc-950 text-zinc-100 light:bg-slate-50 light:text-slate-900`).
  * Il ciclo tema (`cycleTheme`) passa subito da tema scuro a tema chiaro al primo click.
  * In `ThemeContext.tsx`, l'idratazione iniziale verifica l'esistenza reale di una chiave salvata in Dexie prima di sovrascrivere `localStorage`.
- **Prevenzione Sticky Hover & Focus Mobile sulle Opzioni (`QuestionCard.tsx`, `DriveActiveHUD.tsx`, `tailwind.config.js`)**:
  * *Insidia*: Su browser mobile touch (Chrome Android / Safari iOS), pulsanti risposta con chiave statica (`key={optNum}`) riutilizzano lo stesso nodo DOM al cambio quesito, mantenendo `:hover` e `:focus` sulla casella toccata alla domanda precedente.
  * *Regola*: Mantenere attivo `future: { hoverOnlyWhenSupported: true }` in `tailwind.config.js` e usare sempre `key={`${question.id}-${optNum}`}` con `e.currentTarget.blur()` e `focus:outline-none` sui pulsanti opzione (cfr. `QuestionCard.test.ts`).

---

## 4. Tooling & Governance
- **Zero Dangling Background Tasks**: Comandi di build/test eseguiti con `WaitMsBeforeAsync: 10000` per favorire l'esecuzione sincrona. Terminare subito processi orfani.
- **Circuit Breaker**: Stop immediato se lo stesso errore di compilazione o test si ripete per 2 iterazioni consecutive senza progressi.
- **Continuità Cognitiva Inter-Agente**:
  * Consultare [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) e [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md) nel Pre-Flight.
  * Al termine di ogni lavorazione, registrare cosa è stato fatto e le scelte prese in [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md).
- **Sincronizzazione README.md**: A fronte di ogni nuova funzionalità introdotta o variazione comportamentale dell'app, aggiornare tempestivamente [README.md](file:///c:/github/Quiz_VDS-VL/README.md) per mantenere allineata la documentazione utente.
- **Divieto Assoluto di Git Push Autonomo**: L'agente NON DEVE MAI eseguire `git push` in autonomia o di propria iniziativa. Tutte le operazioni (staging chirurgico, commit, merge, bump di versione) si fermano rigorosamente nel repository locale. Il push su `origin` compete unicamente all'utente, oppure viene eseguito dall'agente SOLO su esplicito e diretto comando dell'utente.
- **Standard Linguistico Codice & Git (English Only)**: Tutti i sorgenti (`.ts`, `.tsx`, `.js`, `.py`, `.css`, test unitari, script di utility), inclusi commenti inline, blocchi di commento, TODO, annotazioni JSDoc/TSDoc, test assertions e messaggi di log/errore interni DEVONO essere scritti esclusivamente in lingua inglese. Tutti i messaggi di commit Git DEVONO essere redatti rigorosamente in inglese secondo la specifica Conventional Commits (es. `feat(quiz): implement fair coverage randomizer`). L'italiano è riservato unicamente al microcopy dell'interfaccia utente (destinata agli allievi piloti italiani) e al catalogo dei 504 quiz AeCI.

---

## 5. Testing & Architettura Suite (Vitest)
- **Moduli Puri Estratti (SRP & Isolamento Mock)**: Costanti e pesi normativi risiedono nel modulo foglia `src/utils/aeciRegulation.ts` (evitando rotture nei test che mockano parzialmente `fairRandomizer`), la valutazione esame in `src/services/examEvaluator.ts`, il timer in `src/utils/timer.ts`, e le metriche in `src/utils/analytics.ts`.
- **Zero Faux-Testing & BVA**: Soglie esame pesate verificate su `100`, `86` (Idoneo limite anche con 5 errori su materie da 2–3 pt), `85` e `80` (Idoneo con Verifica Orale), `79` (Non Idoneo), Maratona `200 -> 100` pt, Indice di Preparazione pesato (`0.5` su `oral_check`), e fallback legacy `resolveSessionOutcome`.
- **Quaderno Errori**: Ingresso con 1 errore (`timesWrong > 0`), promozione e uscita solo con `consecutiveCorrect >= 2`.
- **Isolamento In-Memory**: Test di persistenza Dexie eseguiti con `fake-indexeddb/auto` senza dipendere dal DOM o dal browser reale.
- **Comandi**: `npm run test:unit` per la suite rapida, `npm run test:coverage` per il report di copertura v8.

---

## 6. Motore Vocale Neurale (TTS Offline & Multi-Voce)
- **Voci Disponibili**:
  - `giuseppe`: Maschile, tono calmo ed equilibrato (`it-IT-DiegoNeural`, rate -4%, pitch -4Hz).
  - `elsa`: Femminile, dizione cristallina e brillante (`it-IT-ElsaNeural`, rate -2%, pitch +0Hz).
- **Archiviazione Segmenti Audio**:
  - `public/audio/{voice}/{qid}_{part}.mp3` dove `part` è `q` (domanda), `1`, `2`, `3` (opzioni) ed `e` (spiegazione didattica su errore).
  - 2.520 segmenti per ciascuna voce (504 quiz x 5 file), totale 5.040 segmenti audio.
- **Normalizzazione Fonetica Aeronautica & Accenti Tonici (`src/utils/aviationPhonetics.ts`)**:
  - Tutti i testi passano dal normalizzatore per espansione acronimi (`D.P.R. 133/2010`, `VDS/VL`, `AeCI`, `hPa`, `FL`, `km/h`, `kt`, `m/s`).
  - **Override Fonetici e Accenti Tonici (SSOT)**: dizionario di correzione per evitare pronunce errate dei modelli neurali italiani (Diego ed Elsa):
    * Verbi/Omografi: *decade* $\rightarrow$ *decàde*, *decadono* $\rightarrow$ *decàdono*, *subito* $\rightarrow$ *sùbito*, *circuito* $\rightarrow$ *circùito*, *reticolo* $\rightarrow$ *retìcolo*.
    * Dinamica del Volo: *verticale/i* $\rightarrow$ *verticàle/i*, *orizzontale/i* $\rightarrow$ *orizzontàle/i*, *rollio* $\rightarrow$ *rollìo*, *velivolo/i* $\rightarrow$ *velìvolo/i*, *aerodina/e* $\rightarrow$ *aerodìna/e*.
    * Strumentazione: *variometro* $\rightarrow$ *variòmetro*, *anemometro* $\rightarrow$ *anemòmetro*, *altimetro* $\rightarrow$ *altìmetro*, *barometro* $\rightarrow$ *baròmetro*, *igrometro* $\rightarrow$ *igròmetro*.
    * Meteorologia: *isobare/a* $\rightarrow$ *isòbare/a*, *cumulo/i* $\rightarrow$ *cùmulo/i*, *cumulonembo/i* $\rightarrow$ *cumulonèmbo/i*, *stratocumulo/altocumulo* $\rightarrow$ *stratocùmulo/altocùmulo*, *cirrostrato/altostrato* $\rightarrow$ *cirrostràto/altostràto*, *sottovento* $\rightarrow$ *sottovènto*, *sopravvento* $\rightarrow$ *sopravvènto*.
    * Acronimi scanditi a lettere (nomi italiani minuscoli senza accenti gravi artificiali): *VDS/VL* e *VDS-VL* -> *"vu di esse, vu elle"*, *VDS* -> *"vu di esse"*, *VL* -> *"vu elle"*, oltre a *VFR*, *IFR*, *VNE*, *VMC*, *IMC*, *SIV*, *UV*, *UR*, *RCT*, *CTR*, *TMA*, *ATZ*, *QNH*, *QFE*, *GPS*, *IAS*, *TAS*, *GS*, *ATC*, *PIO*, *MSL*, *AIP*, *ISA*, *AWY*, *PLS*, *WMO*, *AR*, *EN-A..D*; formule *Cₚ*, *Cᵣ*, *Eₚ*, *V²*, *S²*, *b²*, *m²*, *O₂*, *ρ*, *1/2* e *V* isolata -> *"vu"*.
  - Pronuncia domanda concisa (Zero Preamboli): le tracce audio delle domande (`_q.mp3`) contengono esclusivamente il testo della domanda normalizzato, omettendo tassativamente prefissi verbali come il numero (*"Domanda X"*) o il nome della materia/categoria per azzerare la latenza d'ascolto.
  - Pronuncia opzioni essenziale: *"Uno. [testo]"*, *"Due. [testo]"*, *"Tre. [testo]"*.
- **Persistenza & Switch**: Selezione della voce salvata in Dexie (`settings.ttsVoice: 'giuseppe' | 'elsa'`) e commutabile istantaneamente dalle impostazioni.
- **Gestione Offline & Fallback Intelligente (`src/services/audioDownloadManager.ts`)**:
  - Prompt non invasivo al primo avvio della Modalità Mani Libere (`AudioOfflinePromptModal`) con scelta a un tocco (voce attiva consigliata ~154 MB, entrambe ~302 MB, o skip "Non ora").
  - Download in background non bloccante via worker a pool concorrente (8 connessioni contemporanee) verso CacheStorage (`vds-audio-giuseppe` e `vds-audio-elsa`).
  - Banner di avanzamento download audio non invasivo agganciato in basso sopra la barra di navigazione (`AudioDownloadBanner`), con percentuale, conteggio file, barra di progresso e tasto annulla, prevenendo l'overflow orizzontale della UI su mobile.
  - Gestione granulare nelle Impostazioni (Voce): stato download, progress bar, storage size, pulsante scarica ed elimina per voce.
  - Fallback offline automatico in `voiceService`: se l'app è offline (`!navigator.onLine`) e la voce selezionata non è presente nella cache del dispositivo, il motore commuta in modo trasparente e immediato sull'altra voce scaricata con notifica discreta.
  - PWA Service Worker: regole Workbox dedicate con `rangeRequests: true` per garantire compatibilità con lo streaming audio su iOS Safari.
- **Spiegazione Vocale Modalità Mani Libere (`drive_intro.mp3`)**:
  - Traccia audio di briefing in `public/audio/{voice}/drive_intro.mp3` generata con Edge-TTS (Giuseppe/Elsa) con fallback a `window.speechSynthesis`.
  - Riproduzione automatica al primo accesso (nel Launcher o all'avvio del quiz), con banner discreto e tasto `[Salta]`.
  - Logica run-once: una volta riprodotta o saltata, salva `driveModeIntroPlayed: true` in Dexie settings e non si ripete più automaticamente.
  - Riascolto on-demand (Launcher `btn-replay-drive-intro`, modale comandi `VoiceCommandsModal`) e riattivazione all'avvio da `SettingsModal` (scheda Mani Libere).
- **Gestione Microfono Anti-Eco & Gating Audio (`src/utils/audio.ts`, `src/hooks/useDriveVoiceCommands.ts`)**:
  - In modalità `'speaker'` (default senza cuffie), il microfono viene sospeso con abort immediato (`rec.abort()`) durante la riproduzione del parlato (domanda, opzioni, spiegazione didattica o intro).
  - Il microfono si attiva esclusivamente a fine parlato (durante il countdown di attesa risposta) o mentre la riproduzione è in pausa (`isPaused: true`).
  - Cooldown acustico di sicurezza di 250ms post-parlato prima della riattivazione per assorbire il riverbero dell'altoparlante ed eliminare qualsiasi falso comando.
  - Modalità `'headphones'` (cuffie con microfono) opzionale per chi indossa auricolari e desidera l'ascolto continuo con interruzione vocale immediata (barge-in).
- **Trimming Silenzio di Coda & Cadenza Rapida (Zero Dead Air)**:
  - Tutti i file audio MP3 generati da Edge-TTS (`it-IT-DiegoNeural` ed `it-IT-ElsaNeural`) sono sottoposti a trimming del silenzio finale mediante filtro audio FFmpeg inverso (`areverse,silenceremove,areverse,apad=pad_dur=0.1`).
  - Il silenzio piatto appeso dal motore TTS (~920ms per Diego) viene rimosso, lasciando esattamente 100ms di decadimento naturale. Questo azzera i tempi morti tra domanda e opzioni (la pausa software di 350ms in `voiceService` resta pulita e naturale) e rende il microfono per i comandi vocali immediatamente reattivo (attivo a T+350ms dal termine del parlato anziché T+1,2s).
  - Pipeline automatizzata via [scripts/trim_audio_silence.py](file:///c:/github/Quiz_VDS-VL/scripts/trim_audio_silence.py) e integrata in [scripts/generate_audio_database.py](file:///c:/github/Quiz_VDS-VL/scripts/generate_audio_database.py).
- **Raffinamento Progressivo SpeechRecognition, Resilienza Mobile `no-match` & Lessico Adattivo (`src/hooks/useDriveVoiceCommands.ts`, `src/utils/voiceCommandParser.ts`)**:
  * *Insidia*: `SpeechRecognition` riavviato o riusato in-place su WebView mobile riparte da `resultIndex = 0`; inoltre su Chrome Android/iOS le parole monosillabiche (*"due"*) vengono emesse in lettere durante `interim` (`isFinal: false`) e spesso seguite entro `< 340ms` da un pacchetto `isFinal: true` vuoto (`transcript: ""`) o da `onerror('no-match' | 'aborted' | 'speech-timeout')`, cancellando il comando e mostrando falsi errori microfono.
  * *Regola*: Azzerare il cursore a ogni sessione o riuso in-place dello slot `0`, avanzare `lastHandledIndexRef` anche dopo rumori `interim` non riconosciuti (con fallback sul solo segmento di coda), preservare l'ultimo snapshot `interim` valido contro finalizzazioni vuote, eseguire il flush immediato del comando `interim` pendente su `no-match`/`aborted`/`speech-timeout` senza settare `voiceError`, e notificare i non riconosciuti esclusivamente tramite la callback `onUnrecognized`.

---

## 7. Modalità di Interazione (Executive Mode - Focus Diretto)
- **Executive Summary First (Max 3 bullet)**: Risposte chiare e ad alto livello: *Cosa ho fatto*, *Dove intervenire*, *Cosa decidere*. Nessun muro di testo.
- **Progressive Disclosure**: Dettagli implementativi e codice esteso confinati in file sorgente o Artifacts, non nella chat.
- **Decisioni Rapide (`ask_question`)**: Bivi architetturali e scelte operative presentati tramite modali a selezione rapida con opzione consigliata in cima.
- **Evidenziazione Chirurgica Allarmi**: Usare `> [!WARNING]` solo per rischi concreti (breaking change, perdita dati, regressioni).
- **Prove Tangibili**: Mostrare esiti di test (`npm run test:unit`, `tsc`) prima di rassicurazioni discorsive.
- **Interventi Atomici**: Micro-step focalizzati (1 problema alla volta) per diff leggibili in 15 secondi.

---

## 8. Versionamento e Tracciabilità Build (SemVer & PWA Mobile)
- **Doppio Livello di Avanzamento Versione**:
  * **Per-Commit (Automatico per Dev Locale)**: Ogni commit Git incrementa automaticamente il contatore `__APP_BUILD_NUMBER__` (`git rev-list --count HEAD`) e aggiorna lo short hash `__APP_COMMIT_HASH__` (`git rev-parse --short HEAD`) tramite `vite.config.ts`. Nessun bisogno di toccare `package.json` ad ogni commit atomico (evita merge conflict e inflazione artificiale dei tag).
  * **Per-Release / Traguardo (SemVer in `package.json`)**: Alla chiusura di una lavorazione e prima del rilascio (o prima che l'utente effettui il push su `main`), avanzare la versione semantica in `package.json` (`patch` per fix/refactoring, `minor` per feature/schermate) con commit dedicato `chore(release): bump version to X.Y.Z`. Mai eseguire `git push` in autonomia.
- **Verificabilità Mobile & PWA Cache-Busting**:
  * Il badge `#app-version-badge` è sempre visibile e cliccabile/tappabile anche su smartphone (non nascosto con `hidden sm:inline-flex`).
  * Il tocco apre `BuildInfoModal` con dettagli completi (Versione, Build #, Commit, Data compilazione) e pulsante "Forza Aggiornamento PWA" che ripulisce le cache dell'app shell (preservando i file audio pesanti `vds-audio-*`) e ricarica istantaneamente l'app.
- **GitHub Actions Full History**:
  * In `.github/workflows/deploy.yml`, il checkout usa `fetch-depth: 0` affinché `git rev-list --count HEAD` corrisponda esattamente alla cronologia reale locale anche in produzione su GitHub Pages.
- **Comunicazione Sistematica Numero di Build (Direttiva Utente)**:
  * Indicare SEMPRE all'utente in ogni risposta di avanzamento o completamento il numero di build corrente (`#<build_number>`), la versione (`v<version>`) e l'hash di commit (`<commit_hash>`), così che l'allievo/sviluppatore possa verificare immediatamente sul badge `#app-version-badge` della Navbar che il dispositivo (mobile o desktop) stia eseguendo esattamente la build desiderata.



