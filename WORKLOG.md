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
