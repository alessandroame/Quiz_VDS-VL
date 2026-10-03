# Vincoli Architetturali e Standard di Codice (Quiz_VDS-VL)

## 1. Vincoli Strutturali e Stack Tecnologico
- **Stack**: Vite + TypeScript + Tailwind CSS (nessun framework monolitico pesante superfluo).
- **Persistenza**: Dexie.js (IndexedDB) è l'unica sorgente di verità (**Single Source of Truth**) per lo storico esami, le statistiche dei quiz, i bookmark e le note.
- **PWA & Offline First**: Funzionamento garantito al 100% offline via Service Worker; la sincronizzazione Google Drive è rigorosamente on-demand e opzionale.
- **Microcopy**: Rispettare categoricamente lo stile minimale definito in `minimal-ui-ux` (nessun testo superfluo o verboso, focus sullo studio).

## 2. Standard di Codice, Commenti e Lingua Inglese (Strict English in Source Code & Git)
- **Lingua Esclusiva nei Sorgenti (Code & Comments)**:
  - Tutti i nomi di variabili, funzioni, interfacce, tipi, file e classi devono essere in lingua inglese (es. `FairCoverageRandomizer`, `QuestionStat`, `evaluateExamSession`).
  - **TUTTI i commenti di codice** (inline `//`, a blocchi `/* */`, Python `#`, TODO, FIXME) e le annotazioni JSDoc/TSDoc DEVONO essere scritti **esclusivamente in lingua inglese**.
  - **Suite di Test**: I titoli dei blocchi `describe`, `it`, `test` e le relative asserzioni devono essere espressi in lingua inglese (es. `it('should promote question after two consecutive correct answers')`).
  - **Log e Messaggi Interni**: `console.log`, `console.warn`, messaggi di eccezione interna (`throw new Error(...)`) devono essere in inglese.
  - *Eccezione*: Solo le stringhe dell'interfaccia utente (microcopy visibile all'allievo pilota) e i contenuti del database dei quiz ufficiali AeCI (`questions.json`: quesiti, opzioni, regola/tranello) rimangono in italiano in conformità all'esame ufficiale.
- **Messaggi di Commit Git**: Tutti i messaggi di commit Git devono essere redatti rigorosamente in lingua inglese seguendo la convenzione Conventional Commits (cfr. `git-pro`).
- **Single Responsibility Principle (SRP)**:
  - Separare rigorosamente la logica di calcolo puro (algoritmo randomizer, calcolo punteggio, elaborazione quote) dalla manipolazione del DOM o dalla persistenza IndexedDB.
  - Evitare funzioni monolitiche; comporre moduli testabili singolarmente con Vitest.
- **Tipizzazione Rigorosa**:
  - Modalità `strict: true` in TypeScript. Evitare l'uso di `any`; definire interfacce puntuali per ogni entità dei quiz e delle sessioni.

## 3. Politica Anti-Accrocchio (Zero Quick-Fix)
- Vietato l'uso di `setTimeout` per attendere scritture sul database o per forzare l'allineamento della UI.
- Vietato duplicare lo stato dell'esame o delle risposte in variabili globali o attributi DOM `data-*`.

## 4. Continuità Cognitiva e Passaggio di Consegne Inter-Agente
- **Aggiornamento Obbligatorio del Registro di Bordo**: Al termine di ogni sessione o lavorazione, l'agente deve registrare cosa è stato fatto e le scelte tecniche/architetturali prese con le relative motivazioni:
  - In sessioni parallele o su branch tematici: scrivere il frammento in `.agents/worklog.d/YYYY-MM-DD_<topic>.md` e consolidare con `npm run worklog:consolidate` al momento del merge.
  - In sessione singola su `main`: registrare direttamente in [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md).
  - Allineare sempre lo stato in [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md).
- **Staging Chirurgico Obbligatorio & Divieto `git add .`**: È fatto espresso divieto di usare `git add .`, `git add -A` o `git commit -a`. Aggiungere esclusivamente i file correlati al singolo argomento ed eseguire `git diff --cached --stat` prima del commit.
- **Divieto Assoluto di Git Push Autonomo**: L'agente NON DEVE MAI eseguire `git push` in autonomia. Tutto lo sviluppo e i commit avvengono in locale. Il push su remote (`origin`) è sotto il controllo esclusivo dell'utente, oppure viene lanciato dall'agente solo su richiesta esplicita.
- **Isolamento Sessioni Parallele**: In caso di task concorrenti, operare sempre in un Git Worktree dedicato (`.worktrees/<topic>`) per azzerare collisioni di file, lock Git e falsi fallimenti nei test.
- **Allineamento Continuo del README.md**: Ogni volta che vengono introdotte nuove funzionalità o modificate quelle esistenti, aggiornare tempestivamente il [README.md](file:///c:/github/Quiz_VDS-VL/README.md) per mantenere la documentazione utente allineata allo stato del software.
- **Divieto di Amnesia e Inizio al Buio**: Nessun agente può avviare modifiche senza consultare prima la triade di conoscenza ([DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md), [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md), [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md)), né può chiudere un task senza aver documentato il lavoro svolto per chi subentrerà.

## 5. Versionamento e Tracciabilità di Build (SemVer & Mobile Verifiability)
- **Doppio Canale Build vs Release**:
  - **Locale & Commit**: Ad ogni commit, Git (`git rev-list --count HEAD` e `git rev-parse --short HEAD`) fornisce identificazione univoca automatica e progressiva (`__APP_BUILD_NUMBER__`, `__APP_COMMIT_HASH__`). Non modificare `package.json` nei micro-commit atomici.
  - **Release & Milestone**: Prima della release o completamento di milestone, avanzare la versione semantica in `package.json` (`patch` o `minor`) e generare il commit convenzionale `chore(release): bump version to X.Y.Z`. Non eseguire push autonomo.
- **Accessibilità Mobile Obbligatoria**:
  - Il badge `#app-version-badge` deve restare visibile (`inline-flex`) anche su smartphone a 390px.
  - Il badge deve essere interattivo (apertura del modal diagnostico `BuildInfoModal` con dettagli build e tasto per forzare l'aggiornamento e la pulizia cache della PWA).
- **Integrità CI / GitHub Pages**:
  - `.github/workflows/deploy.yml` deve utilizzare sempre `fetch-depth: 0` per garantire che il contatore delle build non venga appiattito a 1 su GitHub Pages.




