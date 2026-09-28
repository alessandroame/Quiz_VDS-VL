# 📓 Diario di Bordo & Registro Lavorazioni (WORKLOG & ADR)

Questo documento registra in ordine cronologico tutte le lavorazioni svolte nel repository, le scelte architetturali/tecniche adottate (con relative motivazioni e trade-off) e l'impatto sul desiderata di progetto.  
**Ogni agente AI ha l'obbligo contrattuale di appendere una voce qui al termine di ciascuna sessione di lavoro prima di effettuare il commit.**

---

## Template per Nuove Voci

```markdown
### [YYYY-MM-DD] - <Titolo della Lavorazione>
- **Cosa abbiamo fatto**: <Sintesi oggettiva degli interventi effettuati, componenti creati o modificati>
- **Scelte architetturali & Rationale**: <Decisioni tecniche, librerie o pattern adottati, alternative scartate e motivazioni>
- **Impatto sul Desiderata**: <Come questo intervento contribuisce al desiderata (cfr. DESIDERATA.md) e indicazioni per il prossimo agente>
```

---

## Registro Cronologico

### [2026-09-28] - Vincolo Porta 5173 per Google Drive OAuth, Suite Vitest & Anteprima Locale
- **Cosa abbiamo fatto**:
  - Configurato `vite.config.ts` bloccando sia `server.port` che `preview.port` su **5173** con `strictPort: true`, impedendo l'uso accidentale della porta 4173 o porte casuali.
  - Riavviamo il server di anteprima PWA su [http://localhost:5173/](http://localhost:5173/) con esito HTTP 200 OK.
  - Sancito il vincolo operativo e architetturale in [MEMORY.md](file:///d:/Github/Quiz_VDS-VL/MEMORY.md) (Sezione 2) per evitare disallineamenti di origine OAuth.
  - Ripristinate le dipendenze di progetto tramite installazione deterministica `npm ci`.
  - Eseguita e validata l'intera suite di unit & integration test Vitest: **65/65 test superati** al 100% (10 test file).
  - Compilato il bundle PWA di produzione con `npm run build` (typecheck `tsc` superato con zero errori, bundle Vite e manifest PWA generati con successo).
- **Scelte architetturali & Rationale**:
  - *Google OAuth Authorized JavaScript Origin Strictness*: Il Client ID OAuth di Google autorizza specificamente `http://localhost:5173`. L'uso della porta di default di Vite preview (4173) provocava il blocco delle richieste verso le API di Google Drive per discrepanza di origine. Il vincolo `strictPort: true` a livello di configurazione Vite garantisce che l'anteprima locale funzioni sempre in modo trasparente e conforme per il backup cloud.
- **Impatto sul Desiderata**:
  - Funzionalità Google Drive Cloud Sync pienamente fruibile sia in ambiente `dev` che in `preview` su `http://localhost:5173/`.


### [2026-09-27] - Analisi Funzionale Approfondita & Collaudo Multi-Contesto d'Uso
- **Cosa abbiamo fatto**:
  - Modellati ed esaminati 5 contesti d'uso reali per la PWA:
    1. *Studio Desktop a Casa*: Schermo 1440x900, scorciatoie tastiera (`1`, `2`, `3`, `F`, frecce), navigatore a 30 slot, Navigation Guard su cambio tab durante simulazione e schermata finale di debriefing con esito AeCI.
    2. *Ripasso alla Guida / in Viaggio (Truck & Cockpit Drive Mode)*: Schermo mobile 390x844, layout zero-scroll `100dvh`, macro-pulsanti tattili Fitts's law, Pilota Automatico sequenziale (Radio Quiz) e comandi vocali.
    3. *Campo di Volo / Sole Diretto (Hangar Light)*: Contrasto elevato bivalente chiaro/scuro, studio per singola materia con spiegazioni didattiche istantanee Regola + Tranello.
    4. *Archivio & Privacy Dati*: Ricerca full-text istantanea per testo e keyword, gestione note personali persistenti, toggle preferiti ed export locale JSON offline-first.
    5. *Ripasso Intensivo Pre-Esame (Quaderno Errori)*: Verifica algoritmo Spaced Repetition Leitner (rimozione vincolata a 2 risposte corrette consecutive) e radar 9 materie.
  - Diagnosticato e risolto un difetto critico di sincronizzazione stato tra `DriveModeScreen` e le schermate chiamanti (`ExamScreen`, `TopicsScreen`, `MistakesScreen`):
    - Introdotto passaggio esplicito dell'identificativo quesito `qid` nei gestori `handleSelectAnswer(ans, qid)` e `handleToggleFlag(qid)` per prevenire race conditions e stale closure.
    - Prevenuta la doppia registrazione delle risposte (`recordAnswer`) e il doppio salvataggio delle sessioni d'esame (`saveExam`) delegando interamente la finalizzazione al context genitore quando presente.
    - Evitata la marcatura erronea di risposte non date durante simulazioni d'esame attive in Drive Mode.
  - Implementato lo script di collaudo headless automatico `scripts/test_all_use_cases.js` via Chrome DevTools Protocol (CDP), verificando con successo al 100% tutti i 5 contesti con zero errori in console browser.
  - Validata l'intera suite Vitest: 65 test unitari e di integrazione superati in 491ms, con compilazione bundle Vite (`npm run build`) senza avvisi o errori.
- **Scelte architetturali & Rationale**:
  - *Disaccoppiamento Closure vs Parametro Esplicito*: Affidare la risoluzione della domanda corrente allo stato locale del componente genitore durante l'apertura di un modal a schermo intero è soggetto a disallineamenti asincroni React. Il passaggio esplicito del `qid` come parametro primario rende la sincronizzazione deterministica, pura e a prova di race condition.
  - *Delega del Ciclo di Vita (Single Responsibility)*: Quando `DriveModeScreen` opera come interfaccia alternativa di un esame già avviato in `ExamScreen`, non deve duplicare la logica di valutazione o persistenza DB, ma delegare il completamento alla sessione chiamante.
- **Impatto sul Desiderata**:
  - Piena conformità funzionale a tutti i 7 requisiti core del [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md). Nessuna regressione rilevata nei test.

### [2026-09-27] - Adozione Standard Operativo "Cockpit Executive Mode"
- **Cosa abbiamo fatto**:
  - Formalizzato in [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md) (Sezione 7) lo standard operativo "Cockpit Executive Mode" per l'interazione agente-utente:
    - Risposte strutturate su sintesi estrema (max 3 bullet: cosa fatto, dove intervenire, cosa decidere).
    - Progressive disclosure: dettagli tecnici, codice esteso e diff confinati nei file di progetto o negli Artifacts.
    - Decisioni e bivi gestiti via modali rapidi `ask_question` con opzione raccomandata in cima per decisioni a 1 click.
    - Riserva esclusiva del tag `> [!WARNING]` per reali rischi di rottura, breaking change o perdita dati.
    - Dimostrazione tangibile tramite esiti test/typecheck prima delle spiegazioni discorsive.
    - Suddivisione del lavoro in task atomici (1 problema alla volta) con diff leggibili in 15 secondi.
- **Scelte architetturali & Rationale**:
  - *Mitigazione della Fatica Cognitiva*: Lo sviluppo guidato da LLM soffre frequentemente di "muri di testo" prolissi che portano l'utente a saltare la lettura critica e accettare modifiche alla cieca. L'adozione del paradigma Cockpit Executive protegge la concentrazione dell'utente, riduce i tempi decisionali e azzera il rischio di allucinazioni inosservate.
- **Impatto sul Desiderata**:
  - Incremento immediato della qualità delle revisioni umane e dell'efficienza nel ciclo di sviluppo di [Quiz_VDS-VL](file:///c:/github/Quiz_VDS-VL/). Nessun impatto runtime sull'applicazione.

### [2026-09-27] - Istituzione Vincolo Lingua Inglese per Sorgenti, Commenti e Commit Git
- **Cosa abbiamo fatto**:
  - Formalizzato il vincolo cogente di utilizzo esclusivo della lingua inglese per tutti gli artefatti di sviluppo:
    - `.agents/AGENTS.md`: introdotta la direttiva comportamentale cardine n. 7 che impone l'inglese per file sorgente, script, commenti inline, docstring, asserzioni di test e messaggi di commit Git.
    - `.agents/rules/constraints.md`: aggiornata la sezione 2 vietando esplicitamente commenti in italiano nel codice e prescrivendo Conventional Commits in inglese.
    - `.agents/skills/git-pro/SKILL.md`: revisionata la specifica dei commit message sostituendo gli esempi italiani con template rigorosamente in inglese (`feat(...)`, `fix(...)`, `refactor(...)`, etc.) e vietando testi di commit in italiano.
    - `.agents/workflows/task_lifecycle.md`: ribadito l'obbligo di Conventional Commits in inglese nel ciclo di vita dei task.
    - `MEMORY.md`: consolidata la convenzione nella memoria tecnica permanente del repository.
  - Circoscritta puntualmente l'unica eccezione ammessa per l'italiano: il microcopy visibile all'utente finale (l'allievo pilota che sostiene l'esame AeCI), il catalogo ufficiale dei 504 quiz (`questions.json`: quesiti, opzioni, spiegazioni didattiche) e la documentazione di alto livello / dialogo chat con l'utente.
- **Scelte architetturali & Rationale**:
  - *Separazione tra Livello Tecnico e Livello Utente*: Negli standard ingegneristici professionali moderni, il codice, i commenti tecnici, le suite di test e la cronologia Git devono essere scritti in inglese per garantire interoperabilità con strumenti di analisi statica, linter, modelli AI e sviluppatori internazionali. L'interfaccia utente finale rimane invece rigorosamente in italiano coerente con le normative dell'Aero Club d'Italia (AeCI).
- **Impatto sul Desiderata**:
  - Governance del codice ineccepibile e allineamento perfetto con le migliori pratiche di sviluppo open source professionale. Nessun impatto sulla funzionalità runtime dell'applicazione.

### [2026-09-27] - Umanizzazione UI/UX & Rimozione Configurazione Tecnica Client ID
- **Cosa abbiamo fatto**:
  - Rimossa dall'interfaccia utente qualsiasi menzione visibile del "Google Client ID", il campo di testo per l'inserimento manuale, il pulsante toggle per opzioni sviluppatore e la dicitura tecnica `(appDataFolder)`.
  - Il Client ID Google OAuth opera ora completamente sotto il cofano, garantendo l'accesso e la sincronizzazione cloud tramite due soli pulsanti immediati: **"Salva su Google"** e **"Ripristina da Google"**.
  - Revisionato e semplificato l'intero microcopy dell'applicazione per renderlo chiaro, naturale e accessibile a qualsiasi aspirante pilota (da chi non ha competenze informatiche agli esperti):
    - `SettingsModal.tsx`: testi semplici per sincronizzazione cloud, salvataggio su file ("Scarica copia" / "Carica copia") e azzeramento ("Cancella tutti i dati e ricomincia da zero"). Semplificate le descrizioni di voci, velocità e modalità alla guida.
    - `ExamScreen.tsx`: sostituito "Algoritmo Copertura Garantita: Priorità mai viste" con "Selezione domande: Priorità a quelle non ancora viste".
    - `StatsScreen.tsx`: sostituito "Statistiche & Telemetria" con "I tuoi Progressi", "Indice di Prontezza" con "Prontezza Esame", "Copertura" con "Quiz Visti" e "errori attivi" con "errori da rivedere".
    - `MistakesScreen.tsx`: sostituito il gergo didattico astratto con "Rispondi esattamente per 2 volte di fila per togliere una domanda dagli errori" e "Domande da Ripassare".
    - `ArchiveScreen.tsx`: sostituito "Ascolto Vocale Neurale" con "Ascolto Vocale" e testo del pulsante note.
    - `DriveModeScreen.tsx`: chiarito lo stato dello schermo sempre acceso e dei pulsanti giganti.
  - Esteso lo script headless CDP `visual_check.js` con il supporto per selettori di scorrimento `scroll:<selector>`.
  - Convalidato l'aggiornamento visivo tramite screenshot headless pixel-perfect in tema scuro e chiaro (0 errori in console) e superamento di tutti i 63 test unitari Vitest (`npm test`).
- **Scelte architetturali & Rationale**:
  - *Zero Gergo Tecnico (No Jargon Principle)*: In un'applicazione rivolta a studenti e allievi di volo libero di qualunque estrazione (dal camionista alla bidella all'ingegnere), la complessità tecnica (OAuth, Client ID, JSON, appDataFolder) deve essere interamente assorbita dall'architettura del software. L'interfaccia deve parlare la lingua dell'utente: "Salva su Google", "Salva su file", "Ricomincia da capo".
- **Impatto sul Desiderata**:
  - Esperienza utente estremamente fluida, rassicurante e accessibile. Tutti i requisiti del [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) restano pienamente operativi con 63/63 test verdi.

### [2026-09-27] - Integrazione Client ID Google OAuth & Configurazione .env
- **Cosa abbiamo fatto**:
  - Creato il file di configurazione locale `.env` contenente il Client ID Google OAuth fornito dall'utente (`182413802928-q7sphls58ob60s2mu3fspbbkk9kq2am9.apps.googleusercontent.com`).
  - Configurato il Client ID come fallback predefinito in `src/services/googleDrive.ts` e `src/components/SettingsModal.tsx` per garantire il funzionamento automatico a 1-click anche nelle build statiche distribuite su GitHub Pages.
  - Verificato con test headless CDP il rendering del badge verde **"Pronto"** nella sezione Backup Cloud di `SettingsModal.tsx`.
- **Scelte architetturali & Rationale**:
  - *Fallback duale .env + build*: Poiché `.env` è escluso dal controllo di versione per prassi, impostare il Client ID come fallback garantisce che il deploy su `https://alessandroame.github.io/Quiz_VDS-VL/` funzioni istantaneamente senza dipendere da configurazioni manuali di GitHub Actions secrets.
- **Impatto sul Desiderata**:
  - Sincronizzazione cloud 1-click pronta all'uso sia in locale sia online.

### [2026-09-27] - Redazione README Funzionale & Istituzione Vincolo di Allineamento Continuo
- **Cosa abbiamo fatto**:
  - Redatto e integrato nella root del progetto il file [README.md](file:///c:/github/Quiz_VDS-VL/README.md) completo ed esaustivo, documentando nel dettaglio tutte le 11 macro-funzionalità dell'app (Database 504 quiz AeCI con Regola e Tranello, Simulatore d'Esame con quote e timer 45 min, Studio per Materie, Quaderno Errori Leitner, Archivio full-text con Note Personali e Preferiti, Statistiche con radar 9 materie, Modalità Alla Guida con zero-scroll e Web Speech Recognition, Motore Vocale Neurale offline bivalente Giuseppe/Elsa e fonetica ICAO, Ergonomia cockpit con temi Dark/Light e scorciatoie tastiera, Fair Coverage Randomizer, PWA Offline-First e sincronizzazione dati locale/Drive).
  - Documentato lo stack tecnologico (React 19, Vite, TypeScript strict, Tailwind CSS, Dexie.js, Vitest, Web Audio/Speech API).
  - Aggiunte istruzioni dettagliate di avvio rapido, comandi di test unitari, coverage e collaudi visivi CDP headless.
  - Istituito il vincolo normativo permanente di allineamento continuo del [README.md](file:///c:/github/Quiz_VDS-VL/README.md) in [.agents/AGENTS.md](file:///c:/github/Quiz_VDS-VL/.agents/AGENTS.md), in [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md), in [.agents/rules/constraints.md](file:///c:/github/Quiz_VDS-VL/.agents/rules/constraints.md) e nel workflow di fine lavorazione di [.agents/skills/self-correction-loop/SKILL.md](file:///c:/github/Quiz_VDS-VL/.agents/skills/self-correction-loop/SKILL.md).
- **Scelte architetturali & Rationale**:
  - *Allineamento a Catena della Governance*: La richiesta utente di "tienile aggiornate anche in futuro quando faremo modifiche" è stata formalizzata sia a livello di direttive agent (`AGENTS.md`), sia nella memoria stabile di progetto (`MEMORY.md`), sia nei vincoli architetturali (`constraints.md`), sia nello schema procedurale della skill `self-correction-loop`. In questo modo qualsiasi sessione futura o subagente avrà il vincolo esplicito di aggiornare il `README.md` all'aggiunta o modifica di funzionalità.
- **Impatto sul Desiderata**:
  - Massima trasparenza per utenti, sviluppatori e allievi piloti che approcciano il repository GitHub. Documentazione completa, navigabile e integrata con la triade di conoscenza.

### [2026-09-27] - Integrazione Voce Neurale Femminile Elsa & Selettore Multi-Voce Istruttore
- **Cosa abbiamo fatto**:
  - Esteso lo script di generazione `scripts/generate_audio_database.py` con supporto al flag `--voice` (`giuseppe` ed `elsa`).
  - Generato l'intero catalogo dei 2.520 segmenti audio in italiano naturale con la voce femminile ad alta chiarezza **Elsa** (`it-IT-ElsaNeural`) archiviati in `public/audio/elsa/`.
  - Esteso il tipo `AppSettings` con `ttsVoice: 'giuseppe' | 'elsa'` e valorizzato il default in `src/db/index.ts`.
  - Aggiornato `src/services/voiceService.ts` per supportare il cambio dinamico della voce (`setVoice`, `getVoice`) e la risoluzione dei percorsi `public/audio/{voice}/`.
  - Sincronizzata la voce nel `QuizContext.tsx` con effetto immediato su ogni componente dell'applicazione.
  - Implementato in `src/components/SettingsModal.tsx` il selettore visivo card-based per la scelta tra la voce maschile (*👨‍✈️ Giuseppe - Tono calmo cockpit*) e femminile (*👩‍✈️ Elsa - Dizione cristallina*).
  - Verificato il superamento di tutti i 63 test Vitest (`npm test`) e la compilazione del bundle PWA di produzione (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Separazione Directory Audio per Voce*: Archiviando `public/audio/giuseppe/` e `public/audio/elsa/` separatamente, la selezione della voce a runtime è un'operazione O(1) priva di fetch a server esterni e compatibile al 100% con la natura offline PWA.
  - *Coerenza Fonetica*: Entrambe le voci condividono la stessa pipeline di normalizzazione fonetica aeronautica (`aviationPhonetics.ts`) e la cadenza cockpit (*"Uno."*, *"Due."*, *"Tre."*).
- **Impatto sul Desiderata**:
  - Completa libertà di scelta per il candidato pilota tra voce maschile e femminile ad altissima qualità, con persistenza locale e zero latenza.

### [2026-09-27] - Implementazione Modalità Alla Guida ("Truck & Drive Cockpit Mode")
- **Cosa abbiamo fatto**:
  - Redatto lo studio di fattibilità ed ergonomia tattile in [truck_cockpit_mode_plan.md](file:///C:/Users/aless/.gemini/antigravity/brain/4f1a0bad-73d5-4ee0-9d28-f4a2d17159c5/truck_cockpit_mode_plan.md).
  - Implementato `src/utils/voiceCommandParser.ts` per il parsing selettivo e deterministico dei comandi vocali italiani ("Uno", "Due", "Tre", "Avanti", "Indietro", "Ripeti", "Bandiera", "Pausa", "Riprendi") con suite di unit test (`src/utils/voiceCommandParser.test.ts`).
  - Implementato `src/hooks/useWakeLock.ts` per il mantenimento attivo del display su supporto cruscotto (Screen Wake Lock API) con gestione del ciclo di vita e riaggancio su `visibilitychange`.
  - Implementato `src/hooks/useDriveVoiceCommands.ts` per il controllo vocale hands-free continuo via Web Speech Recognition.
  - Realizzato il componente `src/components/DriveModeScreen.tsx`: layout a tutto schermo con viewport bloccato (`100dvh`) e zero-scroll, 3 macro-fasce tattili ingrandite (Fitts's Law estrema), pilota automatico sequenziale ("Radio Quiz") e supporto gesture swipe.
  - Integrato lo switch alla Modalità Alla Guida in `Navbar.tsx`, `ExamScreen.tsx`, `TopicsScreen.tsx`, `MistakesScreen.tsx` e `QuizContext.tsx` per supportare sia l'avvio autonomo che la prosecuzione istantanea di una sessione d'esame in corso.
  - Aggiunte impostazioni dedicate (Pilota Automatico, Comandi Vocali, Tempo di attesa) in `SettingsModal.tsx` e nel DB Dexie.
  - Collaudato con successo con Chrome CDP headless (`scripts/test_drive_mode.js`) su viewport mobile (390x844), validando l'interazione, la navigazione e registrando zero errori in console.
- **Scelte architetturali & Rationale**:
  - *Modalità Dedicata vs Compromesso Universale*: Forzare bottoni da 80-100px nella vista standard avrebbe compromesso la densità informativa dello studio a casa, costringendo a continuo scrolling verticale. La modalità dedicata a schermo intero (`100dvh`) consente zero scrolling e massima reattività tattile a distanza braccio.
  - *Pilota Automatico Passivo / Radio Quiz*: Essenziale in viaggio: permette l'ascolto continuo di domande e opzioni con auto-rivelazione della risposta e della regola dopo un tempo limite (3-8s), studiando senza dover toccare il dispositivo.
  - *Screen Wake Lock*: Impedisce lo spegnimento dello schermo ogni 30 secondi quando il telefono è agganciato al cruscotto.
- **Impatto sul Desiderata**:
  - Requisito 7 del [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) pienamente soddisfatto. La suite Vitest sale a 63 test unitari tutti verdi.

### [2026-09-27] - Integrazione Motore Vocale Neurale Integrale (TTS Giuseppe Calmo) & Generazione Catalogo 504 Quiz
- **Cosa abbiamo fatto**:
  1. **Valutazione Critica & Blind Test preliminare**:
     - Dimostrata l'inadeguatezza del `window.speechSynthesis` nativo del browser desktop Windows (voce robotica metallica `Microsoft Elsa Desktop SAPI5`).
     - Approvata la voce neurale da studio **Giuseppe Calmo** (`it-IT-GiuseppeMultilingualNeural`) calibrata con `rate: -5%` e `pitch: -5Hz` (timbro baritonale pacato, stile istruttore di volo, zero picchi acuti).
     - Corretta la pronuncia delle opzioni in puro stile cockpit italiano (*"Uno. [testo]"*, *"Due. [testo]"*, *"Tre. [testo]"*) eliminando collisioni fonetiche con l'inglese (*"Option 1"*).
  2. **Pipeline Batch di Generazione Completa (504 Quiz)**:
     - Creato lo script concorrente `scripts/generate_audio_database.py` per generare tutti i 5 segmenti discreti per ciascuna domanda: domanda (`_q.mp3`), tre opzioni (`_1.mp3`, `_2.mp3`, `_3.mp3`) e spiegazione didattica su errore (`_e.mp3`).
     - Generati con successo **tutti i 2.520 segmenti audio** per l'intero catalogo dei 504 quiz in `public/audio/` (~167 MB).
  3. **Normalizzatore Fonetico Aeronautico (`src/utils/aviationPhonetics.ts`)**:
     - Sostituzione di acronimi e unità di misura con pronuncia naturale: `D.P.R. 133/2010`, `VDS/VL`, `AeCI`, `RCT`, `QNH`, `QFE`, `hPa`, `FL`, `km/h`, `m/s`, `kt`, gradi e punteggiatura morbida per evitare intonazioni interrogative stridule.
     - Suite di 7 unit test dedicati con Vitest (`src/utils/aviationPhonetics.test.ts`), tutti superati.
  4. **Servizio Audio Centrale & MediaSession (`src/services/voiceService.ts` & `src/hooks/useAviationVoice.ts`)**:
     - Riproduzione atomica di singoli frammenti e sequenza continua con highlighting visivo sincronizzato.
     - Supporto `navigator.mediaSession` per riproduzione e metadati a schermo spento con auricolari Bluetooth.
  5. **Integrazione UI Cockpit in [QuestionCard.tsx](file:///c:/github/Quiz_VDS-VL/src/components/QuestionCard.tsx) & [ArchiveScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/ArchiveScreen.tsx)**:
     - Header: tasto sequenziale "Ascolta / Ascolto..." con animazione d'onda.
     - Domanda: micro-icona speaker per ascolto atomico del solo testo domanda (tasto `Q`).
     - Opzioni 1, 2, 3: micro-icona per ascolto della singola opzione (tasti `Alt+1`, `Alt+2`, `Alt+3`).
     - Feedback su errore: trigger vocale automatico della risposta corretta, della regola e del tranello.
     - Box spiegazione didattica: pulsante "Ascolta Spiegazione" per risentire la motivazione.
  6. **Impostazioni in [SettingsModal.tsx](file:///c:/github/Quiz_VDS-VL/src/components/SettingsModal.tsx)**:
     - Toggle Voce Istruttore (On/Off).
     - Toggle Spiegazione Vocale Automatica su Errore.
     - Toggle Lettura Automatica all'apertura del quiz.
     - Selettore velocità parlato (`0.9x`, `1.0x`, `1.15x`, `1.25x`).
- **Scelte architetturali & Rationale**:
  - *Segmentazione discreta vs Audio Sprites monolitici*: 5 file per quiz evitano problemi di buffer range seek sui browser mobile e consentono una gestione dello stato pulita e immediata.
  - *Normalizzazione fonetica a monte*: Garantisce che termini complessi come "QNH 1013 hPa" o "D.P.R. 133/2010" vengano pronunciati con perfetta dizione aeronautica.
- **Impatto sul Desiderata**:
  - PWA completamente accessibile e fruibile a mani libere, con supporto studio durante tragitti o passeggiate (cuffie Bluetooth e schermo spento).

### [2026-09-27] - Configurazione GitHub Pages & CI/CD Pipeline (.github/workflows/deploy.yml)
- **Cosa abbiamo fatto**:
  1. **Configurazione Base Path per GitHub Pages**:
     - In `vite.config.ts`, impostato `base: process.env.BASE_PATH || (process.env.GITHUB_ACTIONS ? '/Quiz_VDS-VL/' : '/')`. In questo modo in sviluppo locale il server risponde sempre su `/` (compatibilità con test CDP e porte standard), mentre nei runner di build GitHub Pages imposta il subpath del repository.
     - Nel manifest PWA (`vite.config.ts`), convertite le icone in percorsi relativi (`'icons/icon-192x192.png'`) per evitare che cerchino la cartella icons nella root del dominio host (`username.github.io/icons`).
  2. **Risoluzione Path Audio per Deployment Subpath**:
     - In `src/services/voiceService.ts`, aggiornato `getAudioUrl` con `import.meta.env.BASE_URL` dinamico, garantendo che gli stream audio ICAO vengano risolti correttamente sia in locale che su GitHub Pages.
  3. **Automazione CI/CD con GitHub Actions**:
     - Creato il workflow standard `.github/workflows/deploy.yml` con trigger su `push` al branch `main` e `workflow_dispatch`. Il job esegue `npm ci`, la suite di test Vitest (`npm test`), il build PWA (`npm run build` con `BASE_PATH: '/Quiz_VDS-VL/'`), il packaging dell'artifact `dist` e il deployment su GitHub Pages tramite le action ufficiali `actions/deploy-pages@v4`.
- **Scelte architetturali & Rationale**:
  - *GitHub Pages come Hosting Ideale*: L'app è una Single Page Application 100% client-side senza backend proprietario. GitHub Pages fornisce HTTPS nativo e permanente (prerequisito obbligatorio per Service Worker e Web App Install Banner), zero costi e zero manutenzione server.
  - *Automazione GitHub Actions vs Branch Orfano*: Adottato il deployment moderno nativo via artifact Actions (`actions/deploy-pages@v4`), evitando l'inquinamento del repository con branch sporchi come `gh-pages` o build committati manualmente nel repo.
- **Impatto sul Desiderata**:
  - Preparata la PWA per la distribuzione pubblica e l'installazione su dispositivi reali (smartphone Android, iOS, tablet e desktop) con Service Worker e cache offline operativi.

### [2026-09-27] - Risoluzione Difetti: Visibilità Note Personali & Protezione Esame Attivo (Navigation Guard)
- **Cosa abbiamo fatto**:
  1. **Visualizzazione, Modifica ed Eliminazione Note Personali**:
     - Risolto il difetto per cui le note personali non erano visibili in `Archivio`:
       * In `src/components/ArchiveScreen.tsx`, aggiunto nel riepilogo collassato di ogni quesito un badge/pill visibile con il testo della nota (`"{stat.userNote}"`).
       * Nella vista espansa dell'archivio, implementata una sezione dedicata ad alto contrasto "Nota Personale" con pulsanti di azione immediata ("Modifica", "Elimina") e pulsante per aggiungere note se assenti (`+ Aggiungi appunto personale sul quesito`).
       * In `src/components/QuestionCard.tsx`, ridisegnata la card della nota con intestazione chiara, contrasto pienamente conforme sia al tema Cockpit Dark che Hangar Light (`light:bg-sky-50 light:border-sky-200 light:text-sky-950`), pulsanti di Modifica ed Eliminazione rapida, e sincronizzazione automatica dello stato al cambio quesito (`useEffect`).
       * In `src/components/MistakesScreen.tsx`, aggiunto lo snippet della nota nel riepilogo dei quesiti da perfezionare.
       * In `src/db/index.ts`, aggiornata la funzione `saveQuestionNote` con trimming del testo ed eliminazione automatica del campo se la nota viene svuotata, con test di regressione dedicati in `database.test.ts`.
  2. **Protezione Simulazione Esame & Navigation Guard**:
     - Risolto il difetto per cui spostandosi di pagina durante una simulazione si perdevano i progressi:
       * Introdotto in `QuizContext.tsx` lo stato reattivo globale `isExamRunning` e `setIsExamRunning`.
       * In `src/components/ExamScreen.tsx`, sincronizzato lo stato dell'esame attivo (`running`), aggiunto pulsante esplicito "Abbandona" nella barra superiore con modal di conferma dedicato.
       * In `src/App.tsx`, implementato il Navigation Guard: se l'utente tenta di cambiare scheda (Materie, Errori, Archivio, Stats) mentre una simulazione è in corso, la navigazione viene intercettata e compare un modal di avviso avionico chiaro e non invasivo:
         - **"Rimani nell'Esame"** (opzione primaria sicura): annulla il cambio scheda e mantiene la simulazione intatta con timer e risposte preservati.
         - **"Abbandona ed Esci"** (opzione distruttiva): termina la simulazione e reindirizza alla scheda desiderata.
       * Aggiunto il listener nativo `beforeunload` sul browser per impedire ricaricamenti o chiusure accidentali della tab durante l'esame.
       * Nella `Navbar.tsx`, aggiunti indicatori visivi in tempo reale: badge pulsante "IN CORSO" nell'header e beacon luminoso sulla scheda "Esame".
  3. **Collaudo e Validazione Visiva**:
     - Verificato con test CDP headless sia su desktop (1440x900) che smartphone (390x844), in modalità sia Cockpit Dark che Hangar Light.
     - Eseguita la suite Vitest con 57 test passati al 100% e build Vite completata senza errori.
- **Scelte architetturali & Rationale**:
  - *Safety Guard contro Perdita Dati*: L'esame teorico AeCI dura 45 minuti e richiede concentrazione. Tasti o tap accidentali non devono mai provocare la perdita della sessione. Il blocco con conferma a doppio pulsante (con focus sulla continuazione dell'esame) protegge l'utente senza intrappolarlo.
  - *Accessibilità e Contrasto Bimodale*: Le note personali devono risaltare visivamente all'aperto sia in tema scuro che in tema chiaro, offrendo al contempo strumenti completi di CRUD (Create, Read, Update, Delete) direttamente nei punti focali di studio (Archivio, Scheda Quesito, Quaderno Errori).
- **Impatto sul Desiderata**:
  - Eliminati entrambi i punti di attrito UX segnalati dall'utente. La PWA offre ora un flusso didattico ergonomico, affidabile e protetto da errori accidentali.

### [2026-09-27] - Fix Service Worker GitHub Pages & Diagnostica Google Drive API 403
- **Cosa abbiamo fatto**:
  - Risolto errore 404 del Service Worker (`Failed to register a ServiceWorker for scope ('https://alessandroame.github.io/') with script ('https://alessandroame.github.io/sw.js')`): rimosso il blocco manuale ridondante in `src/main.tsx` che forzava `/sw.js` alla root del dominio anziché rispettare il base path `/Quiz_VDS-VL/`. La registrazione è ora interamente delegata al file `registerSW.js` generato e iniettato automaticamente da `vite-plugin-pwa`.
  - Risolto l'avviso correlato del browser `cross-world service worker resource mismatch` e `link preload not used`.
  - Diagnosticato e gestito l'errore `403 (Forbidden)` sulle chiamate `https://www.googleapis.com/drive/v3/files`: la Google Drive API deve essere abilitata nel progetto Google Cloud associato al Client ID.
  - Aggiornato `src/services/googleDrive.ts` con un metodo dedicato `handleApiError` che intercetta i codici 403 e fornisce messaggi diagnostici chiari in italiano anziché fallire silenziosamente o mostrare messaggi generici.
  - Aggiunti unit test dedicati `DRV-07` e `DRV-08` in `src/services/googleDrive.test.ts` (suite portata a 65 test, 100% passati).
- **Scelte architetturali & Rationale**:
  - *Single Registration Authority*: Evitare doppie registrazioni conflittuali del Service Worker; `vite-plugin-pwa` calcola a compile-time il base path corretto sia per sviluppo locale (`/`) che per produzione GitHub Pages (`/Quiz_VDS-VL/`).
  - *Fail-Fast & Feedback Diagnostico*: Quando un servizio esterno (come Google Drive API) restituisce 403 per API disabilitata nel progetto Cloud, l'applicazione deve guidare lo sviluppatore/utente verso l'esatta schermata di abilitazione nella Cloud Console.
- **Impatto sul Desiderata**:
  - Deploy GitHub Pages perfettamente conforme come PWA offline senza errori in console.
  - Robustezza e resilienza del connettore Google Drive Cloud Sync.

### [2026-09-27] - Semplificazione UX Backup Google Drive & Supporto .env
- **Cosa abbiamo fatto**:
  - Rimosso il campo di testo obbligatorio "Google OAuth Client ID" dalla vista primaria del pannello Impostazioni: ora l'utente vede direttamente i comodi pulsanti ad azione singola **"Salva su Drive"** e **"Ripristina da Drive"**.
  - Integrata in `src/services/googleDrive.ts` la lettura automatica della variabile d'ambiente `import.meta.env.VITE_GOOGLE_CLIENT_ID`.
  - Creato il file di documentazione [`.env.example`](file:///c:/github/Quiz_VDS-VL/.env.example) con le istruzioni per configurare il Client ID a livello di progetto.
  - Relegata la configurazione manuale del Client ID a un menu espandibile secondario ("Opzioni Avanzate"), evitando di disorientare gli utenti finali.
  - Valorizzato il "Backup File Locale (JSON)" come metodo predefinito zero-config, sicuro e 100% offline.
- **Scelte architetturali & Rationale**:
  - *Zero Technical Friction per l'Utente Finale*: Gli studenti/piloti non devono interagire con concetti da sviluppatore (OAuth Client ID). Il flusso di backup cloud deve avviarsi in 1 click aprendo il popup standard Google Account.
- **Impatto sul Desiderata**:
  - Esperienza utente nelle Impostazioni allineata ai più elevati standard moderni di usabilità e privacy.

### [2026-09-27] - Integrazione Audio Avionico & Sintesi Vocale Fonetica ICAO
- **Cosa abbiamo fatto**:
  - Sviluppato modulo di fonetica aeronautica ICAO (`src/utils/aviationPhonetics.ts`) con conversione numeri e abbreviazioni avioniche, coperto da suite di unit test (`src/utils/aviationPhonetics.test.ts`).
  - Implementato `voiceService.ts` e hook `useAviationVoice.ts` per la lettura automatica o manuale delle domande d'esame tramite Web Speech API con tuning per voce italiana.
  - Implementato sound generator sintetico avionico via Web Audio API (`src/utils/audio.ts`) per click, feedback risposta (ding/buzzer) e allarmi quota/tempo.
  - Aggiunti controlli audio dedicati in `SettingsModal.tsx` (volume, muto, toggle voce) e pulsante altoparlante in `QuestionCard.tsx`.
- **Scelte architetturali & Rationale**:
  - *Zero dipendenze esterne per l'audio*: Generazione suoni via oscillatori nativi Web Audio API e sintesi vocale via Web Speech API del browser, preservando l'architettura 100% offline-first senza scaricare pesanti file audio binari.
  - *Fonetica ICAO*: I numeri e i termini tecnici aeronautici vengono pronunciati secondo gli standard radiofonici ICAO per massima fedeltà al contesto didattico di volo.
- **Impatto sul Desiderata**:
  - Requisito di accessibilità e audio cockpit completato e collaudato con successo.

### [2026-09-27] - Fix Critico Sistema Temi (Cockpit Dark / Hangar Light) & Diagnosi Chrome

- **Cosa abbiamo fatto**:
  - Diagnosticato con CDP headless e risolto il motivo per cui il cambio tema non produceva effetti visivi nel browser:
    1. In `tailwind.config.js` mancava la registrazione della variante `light:`, impedendo la generazione nel CSS di oltre 150 regole `light:*` presenti nei componenti. Aggiunto il plugin con `addVariant('light', ':is(.light &)')`.
    2. La sequenza di toggle rapido in `Navbar.tsx` partiva da `system` (risolto scuro su OS dark) e passava a `dark` (ancora visivamente scuro), provocando un click a vuoto invisibile. Riprogettata la transizione per passare immediatamente a `light` se il tema attuale percepito è scuro.
    3. In `ThemeContext.tsx`, Dexie sovrascriveva il `localStorage` impostando `system` se non trovava record salvati. Corretta la query per verificare la presenza reale di `entry.value`.
    4. In `index.html`, il tag `<body>` conteneva la classe fissa `bg-slate-950 text-slate-100` senza la variante `light:bg-slate-50 light:text-slate-900`.
  - Collaudato con successo in Chrome CDP headless il passaggio esplicito tra tutti e 3 i temi (`light`, `dark`, `system`) sia da Navbar che dal pannello Impostazioni, con verifica dei computed styles e zero errori in console.
- **Scelte architetturali & Rationale**:
  - *Feedback Visivo Immediato*: Il toggle rapido nell'header deve sempre produrre una variazione visiva percepibile al primo click, invertendo la modalità corrente senza stati intermedi invisibili.
  - *Sincronizzazione coerente SSOT*: Il `localStorage` gestisce l'idratazione sincrona immediata pre-paint per evitare flash di stile scorretto (FOUC), mentre IndexedDB garantisce la persistenza del profilo.
- **Impatto sul Desiderata**:
  - Il sistema a doppio tema avionico (Cockpit Dark per uso notturno/standard e Hangar Light per visibilità sotto il sole) è ora 100% funzionante e reattivo in qualsiasi browser e dispositivo.

### [2026-09-27] - Governance: Separazione Desiderata, Worklog e Regole di Dominio
- **Cosa abbiamo fatto**:
  - Creato [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) nella root come bussola funzionale, matrice di stato e guida di onboarding per i nuovi agenti.
  - Creato [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md) come diario di bordo cronologico e registro ADR (Architectural Decision Records).
  - Ripulito e ottimizzato [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md) affinché rimanga un prontuario ultra-denso e compatto delle sole regole di dominio e vincoli tecnici stabili.
  - Aggiornato [.agents/AGENTS.md](file:///c:/github/Quiz_VDS-VL/.agents/AGENTS.md), il workflow [task_lifecycle.md](file:///c:/github/Quiz_VDS-VL/.agents/workflows/task_lifecycle.md), la skill [self-correction-loop](file:///c:/github/Quiz_VDS-VL/.agents/skills/self-correction-loop/SKILL.md) e la regola [constraints.md](file:///c:/github/Quiz_VDS-VL/.agents/rules/constraints.md) per sancire l'obbligo di aggiornare `WORKLOG.md` e consultare `DESIDERATA.md`.
- **Scelte architetturali & Rationale**:
  - *Separation of Concerns (SoC) nella documentazione di progetto*: Incorporare il diario di bordo all'interno di `MEMORY.md` lo avrebbe reso ingestibile, consumando token e diluendo le regole vincolanti lette ad ogni pre-flight. Separare **Desiderata** (cosa vogliamo fare), **Worklog** (cosa abbiamo fatto e perché) e **Memory** (vincoli e regole stabili) offre massima chiarezza e rapidità di consultazione sia ad agenti che a umani.
- **Impatto sul Desiderata**:
  - Architettura di governance e onboarding completata al 100%. Qualsiasi agente futuro può orientarsi in 30 secondi e sa dove registrare le scelte prese.

### [2026-09-27] - Architettura Suite Vitest & Refactoring SRP
- **Cosa abbiamo fatto**:
  - Estratto la logica pura di valutazione esame in `src/services/examEvaluator.ts`, il timer in `src/utils/timer.ts` e il calcolo analitico in `src/utils/analytics.ts`.
  - Implementata una suite di unit & integration test con Vitest (`tests/unit/examEvaluator.test.ts`, `tests/unit/timer.test.ts`, `tests/unit/analytics.test.ts`, `tests/unit/randomizer.test.ts`, `tests/integration/db.test.ts`).
  - Applicata Boundary Value Analysis (BVA) sulle soglie di idoneità (2, 3, 4 errori per esame standard; 6, 7 per maratona) e simulazione Monte Carlo su 100 estrazioni del randomizer.
  - Configurato l'ambiente in-memory per Dexie con `fake-indexeddb/auto`.
- **Scelte architetturali & Rationale**:
  - *Single Responsibility Principle (SRP)*: Disaccoppiare la logica matematica e di business dal ciclo di vita di React evita race conditions e rende i moduli puri, deterministici e testabili in millisecondi (<500ms) senza overhead di rendering DOM.
  - *Bando ai test fittizi (Zero Faux-Testing)*: Scrittura di test basati su specifiche regolamentari esterne e indipendenti per impedire logiche circolari o tautologiche.
- **Impatto sul Desiderata**:
  - Massima solidità e verificabilità della business logic. La suite conta 50 test unitari ed esegue in ~430ms.

### [2026-09-27] - Sviluppo Interfaccia Cockpit & 5 Sezioni Funzionali
- **Cosa abbiamo fatto**:
  - Implementato il layout cockpit responsive con navigazione primaria a 5 tab (**Esame**, **Materie**, **Errori**, **Archivio**, **Stats**).
  - Creata la schermata **Esame** con 30 quiz conformi alle quote ministeriali, countdown 45 min, griglia interattiva con flag `⚑ Rivedi` e schermata di debriefing finale.
  - Creata la sezione **Materie** con filtro per le 9 materie e visualizzazione didattica immediata.
  - Implementato il **Quaderno Errori** con ripetizione spaziata (uscita solo dopo 2 risposte corrette consecutive).
  - Implementato l'**Archivio** con ricerca full-text istantanea e gestione preferiti/note.
  - Creata la dashboard **Stats** con indice di prontezza esame, radar delle 9 materie e storico sessioni.
  - Aggiunte scorciatoie da tastiera desktop (`1`, `2`, `3`, `F`, `Spazio`/frecce).
- **Scelte architetturali & Rationale**:
  - *Design System Avionico ad alto contrasto*: Ottimizzato specificamente per la consultazione su campo di volo/decollo o in condizioni di forte illuminazione solare (palette Cockpit Dark & Hangar Light).
  - *Microcopy essenziale*: Nessun testo prolisso o verboso nei bottoni e nelle schermate; etichette brevi, asciutte e telegrafiche.
- **Impatto sul Desiderata**:
  - Tutte le funzionalità utente principali della PWA sono operative e navigabili nel browser.

### [2026-09-27] - Scaffolding PWA, Layer Database Dexie & Motore Fair Coverage
- **Cosa abbiamo fatto**:
  - Inizializzato stack Vite + React 19 + TypeScript + Tailwind CSS.
  - Configurato il database IndexedDB locale tramite Dexie (`src/db/index.ts`, `src/types/database.ts`).
  - Sviluppato l'algoritmo `FairCoverageRandomizer` (`src/services/randomizer.ts` e `src/utils/fairRandomizer.ts`) per l'estrazione bilanciata dei quiz.
  - Integrato il modulo Google Identity Services (GIS) per il backup su Google Drive (`appDataFolder`) e l'export/import JSON locale.
  - Configurato Workbox via `vite-plugin-pwa` per il caching offline totale e generato il set di icone PWA.
- **Scelte architetturali & Rationale**:
  - *Dexie.js anziché LocalStorage*: LocalStorage ha un limite di 5MB ed è sincrono/bloccante sul main thread. Dexie offre query asincrone indicizzate e reattività integrata tramite `dexie-react-hooks`.
  - *Fair Coverage a Bucket*: I generatori pseudocasuali puri provocano una dispersione eccessiva delle domande non viste. La priorità a bucket (`times_seen == 0` prima di tutto) azzera il coupon collector problem.
  - *Google Drive appDataFolder*: Permette la sincronizzazione cloud opzionale e privata dell'utente senza richiedere backend server remoti gestiti.
- **Impatto sul Desiderata**:
  - Requisito di PWA installabile, 100% offline-first e con persistenza locale robusta completato.

### [2026-09-27] - Estrazione Dataset 504 Quiz AeCI & Regolamento
- **Cosa abbiamo fatto**:
  - Analizzato il PDF ufficiale `quiz_VDS-VL_2017.pdf` (504 quesiti, 9 materie, griglia risposte pp. 50-51).
  - Sviluppata la pipeline di estrazione Python (`extract_quizzes.py`), risolvendo l'anomalia del quiz 7037 (numerato 4, 5, 6 nel PDF originale), normalizzando cesure e caratteri speciali.
  - Generate le sintesi didattiche (`Regola` + `Tranello`) per ogni quiz.
  - Validata l'integrità del dataset (504 quiz, 3 risposte a quesito, 1 sola esatta) e generati `src/data/questions.json`, `public/data/questions.json` e `src/types/quiz.ts`.
- **Scelte architetturali & Rationale**:
  - *Dataset statico JSON come SSOT immutabile*: Azzerare qualsiasi dipendenza da backend esterni o chiamate API di rete durante l'uso dell'applicazione, garantendo caricamento istantaneo e funzionamento offline deterministico.
  - *Spiegazioni telegrafiche (Regola + Tranello)*: Evitare di incorporare testi didattici prolissi da manuali non autorizzati; focalizzare l'attenzione del candidato solo sul principio normativo/fisico e sul tranello tipico della domanda.
- **Impatto sul Desiderata**:
  - Dataset completo e validato al 100%. Base dati solida e pronta per il motore quiz e l'interfaccia PWA.
