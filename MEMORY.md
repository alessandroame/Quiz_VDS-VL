# Project Memory: VDS-VL Quiz Master 🛩️

Questo file costituisce la **memoria tecnica permanente** del progetto. Raccoglie i vincoli architetturali consolidati, le regole normative AeCI, gli standard di testing e le convenzioni operative per prevenire allucinazioni, regressioni o spreco di token nelle sessioni di sviluppo.

> Per la visione complessiva, i requisiti utente e la matrice di stato, consultare **[DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md)**.  
> Per il diario cronologico delle lavorazioni e le decisioni architetturali (ADR), consultare **[WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md)**.

---

## 1. Regolamento & Quiz VDS-VL (AeCI)
- **Catalogo Completo**: 504 quiz totali (database ufficiale AeCI 2017).
- **Esame Ufficiale**: 30 quesiti a scelta multipla, 45 minuti max, idoneità con max 3 errori (minimo 27/30). 4 o più errori = NON IDONEO.
- **Ripartizione Materie (30 quiz)**:
  - Normativa (2)
  - Aerodinamica (9)
  - Primo Soccorso (1)
  - Fisiopatologia (1)
  - Meteo (8)
  - Strumenti (1)
  - Tecnica Pilotaggio (5)
  - Materiali (1)
  - Sicurezza (2)
- **Spiegazioni Didattiche**: Devono limitarsi a `Regola` (principio fisico o norma) e `Tranello` (motivo tipico di errore), senza menzionare fonti terze o manuali non ufficiali.

---

## 2. Architettura PWA & Motore Quiz
- **Fair Coverage Randomizer**: Priorità assoluta a `times_seen == 0` (Bucket 0), poi a domande con minimo `times_seen` (Bucket 1). Nessun coupon collector problem.
- **Single Source of Truth (SSOT)**: Persistenza affidata a Dexie (IndexedDB) per lo stato reattivo e dati quiz; non duplicare o disallineare lo stato su variabili globali effimere.
- **Offline First**: L'app deve funzionare al 100% offline via Service Worker; nessuna funzionalità core deve dipendere dalla connessione di rete (a eccezione del backup manuale Google Drive).
- **Porta Locale Obbligatoria (5173)**: Utilizzare sempre ed esclusivamente `http://localhost:5173` sia per `npm run dev` che per `npm run preview`. In `vite.config.ts` è impostato `strictPort: true` per entrambi. Il Client ID OAuth di Google autorizza specificamente l'origine `http://localhost:5173`; qualsiasi altra porta (es. 4173) impedisce il funzionamento del backup cloud Google Drive per errore di mismatch dell'origine autorizzata.

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

---

## 4. Tooling & Governance
- **Zero Dangling Background Tasks**: Comandi di build/test eseguiti con `WaitMsBeforeAsync: 10000` per favorire l'esecuzione sincrona. Terminare subito processi orfani.
- **Circuit Breaker**: Stop immediato se lo stesso errore di compilazione o test si ripete per 2 iterazioni consecutive senza progressi.
- **Continuità Cognitiva Inter-Agente**:
  * Consultare [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) e [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md) nel Pre-Flight.
  * Al termine di ogni lavorazione, registrare cosa è stato fatto e le scelte prese in [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md).
- **Sincronizzazione README.md**: A fronte di ogni nuova funzionalità introdotta o variazione comportamentale dell'app, aggiornare tempestivamente [README.md](file:///c:/github/Quiz_VDS-VL/README.md) per mantenere allineata la documentazione utente.
- **Standard Linguistico Codice & Git (English Only)**: Tutti i sorgenti (`.ts`, `.tsx`, `.js`, `.py`, `.css`, test unitari, script di utility), inclusi commenti inline, blocchi di commento, TODO, annotazioni JSDoc/TSDoc, test assertions e messaggi di log/errore interni DEVONO essere scritti esclusivamente in lingua inglese. Tutti i messaggi di commit Git DEVONO essere redatti rigorosamente in inglese secondo la specifica Conventional Commits (es. `feat(quiz): implement fair coverage randomizer`). L'italiano è riservato unicamente al microcopy dell'interfaccia utente (destinata agli allievi piloti italiani) e al catalogo dei 504 quiz AeCI.

---

## 5. Testing & Architettura Suite (Vitest)
- **Moduli Puri Estratti (SRP)**: La logica di valutazione esame risiede in `src/services/examEvaluator.ts`, il timer in `src/utils/timer.ts`, e le metriche in `src/utils/analytics.ts`.
- **Zero Faux-Testing & BVA**: Soglie esame verificate su 2, 3 (Idoneo limite), 4 (Respinto), 6 (Idoneo maratona), 7 (Respinto maratona).
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
- **Normalizzazione Fonetica Aeronautica (`src/utils/aviationPhonetics.ts`)**:
  - Tutti i testi passano dal normalizzatore per espansione acronimi (`D.P.R. 133/2010`, `VDS/VL`, `AeCI`, `hPa`, `FL`, `km/h`, `kt`, `m/s`).
  - Pronuncia domanda concisa (Zero Preamboli): le tracce audio delle domande (`_q.mp3`) contengono esclusivamente il testo della domanda normalizzato, omettendo tassativamente prefissi verbali come il numero (*"Domanda X"*) o il nome della materia/categoria per azzerare la latenza d'ascolto.
  - Pronuncia opzioni essenziale: *"Uno. [testo]"*, *"Due. [testo]"*, *"Tre. [testo]"*.
- **Persistenza & Switch**: Selezione della voce salvata in Dexie (`settings.ttsVoice: 'giuseppe' | 'elsa'`) e commutabile istantaneamente dalle impostazioni.
- **Gestione Offline & Fallback Intelligente (`src/services/audioDownloadManager.ts`)**:
  - Prompt non invasivo al primo avvio della Modalità alla Guida (`AudioOfflinePromptModal`) con scelta a un tocco (voce attiva consigliata ~154 MB, entrambe ~302 MB, o skip "Non ora").
  - Download in background non bloccante via worker a pool concorrente (8 connessioni contemporanee) verso CacheStorage (`vds-audio-giuseppe` e `vds-audio-elsa`).
  - Banner di avanzamento download audio non invasivo agganciato in basso sopra la barra di navigazione (`AudioDownloadBanner`), con percentuale, conteggio file, barra di progresso e tasto annulla, prevenendo l'overflow orizzontale della UI su mobile.
  - Gestione granulare nelle Impostazioni (Voce): stato download, progress bar, storage size, pulsante scarica ed elimina per voce.
  - Fallback offline automatico in `voiceService`: se l'app è offline (`!navigator.onLine`) e la voce selezionata non è presente nella cache del dispositivo, il motore commuta in modo trasparente e immediato sull'altra voce scaricata con notifica discreta.
  - PWA Service Worker: regole Workbox dedicate con `rangeRequests: true` per garantire compatibilità con lo streaming audio su iOS Safari.
- **Spiegazione Vocale Modalità Guida (`drive_intro.mp3`)**:
  - Traccia audio di briefing in `public/audio/{voice}/drive_intro.mp3` generata con Edge-TTS (Giuseppe/Elsa) con fallback a `window.speechSynthesis`.
  - Riproduzione automatica al primo accesso (nel Launcher o all'avvio del quiz), con banner discreto e tasto `[Salta]`.
  - Logica run-once: una volta riprodotta o saltata, salva `driveModeIntroPlayed: true` in Dexie settings e non si ripete più automaticamente.
  - Riascolto on-demand (Launcher `btn-replay-drive-intro`, modale comandi `VoiceCommandsModal`) e riattivazione all'avvio da `SettingsModal` (scheda Guida).
- **Gestione Microfono Anti-Eco & Gating Audio (`src/utils/audio.ts`, `src/hooks/useDriveVoiceCommands.ts`)**:
  - In modalità `'speaker'` (default senza cuffie), il microfono viene sospeso con abort immediato (`rec.abort()`) durante la riproduzione del parlato (domanda, opzioni, spiegazione didattica o intro).
  - Il microfono si attiva esclusivamente a fine parlato (durante il countdown di attesa risposta) o mentre la riproduzione è in pausa (`isPaused: true`).
  - Cooldown acustico di sicurezza di 250ms post-parlato prima della riattivazione per assorbire il riverbero dell'altoparlante ed eliminare qualsiasi falso comando.
  - Modalità `'headphones'` (cuffie con microfono) opzionale per chi indossa auricolari e desidera l'ascolto continuo con interruzione vocale immediata (barge-in).

---

## 7. Modalità di Interazione (Executive Mode - Focus Diretto)
- **Executive Summary First (Max 3 bullet)**: Risposte chiare e ad alto livello: *Cosa ho fatto*, *Dove intervenire*, *Cosa decidere*. Nessun muro di testo.
- **Progressive Disclosure**: Dettagli implementativi e codice esteso confinati in file sorgente o Artifacts, non nella chat.
- **Decisioni Rapide (`ask_question`)**: Bivi architetturali e scelte operative presentati tramite modali a selezione rapida con opzione consigliata in cima.
- **Evidenziazione Chirurgica Allarmi**: Usare `> [!WARNING]` solo per rischi concreti (breaking change, perdita dati, regressioni).
- **Prove Tangibili**: Mostrare esiti di test (`npm run test:unit`, `tsc`) prima di rassicurazioni discorsive.
- **Interventi Atomici**: Micro-step focalizzati (1 problema alla volta) per diff leggibili in 15 secondi.

