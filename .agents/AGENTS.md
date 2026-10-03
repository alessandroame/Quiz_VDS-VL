# Direttive di Progetto e Configurazione Agent (Quiz_VDS-VL) 🛩️

Questo documento rappresenta la guida operativa centrale per l'AI Agent che sviluppa, collauda e manutiene la PWA **VDS-VL Quiz Master**.

---

## 1. Mappa Strutturale di `.agents/`

L'alberatura delle configurazioni dell'agente è standardizzata, modulare e ordinata come segue:

```
.agents/
├── AGENTS.md                   # Questo documento di regia e direttive operative
├── rules/                      # Regole e vincoli architetturali vincolanti
│   ├── anti_sycophancy_integrity.md  # Rigore tecnico, circuit breaker anti-loop, zero test fittizi
│   ├── constraints.md                # Vincoli architetturali PWA (Vite, TS strict, Dexie SSOT)
│   ├── proactive_mentorship.md       # Mentorship critica, anti-sycophancy e prompt refactoring
│   └── trace_based_debugging.md      # Protocollo deterministico di debug a tracce numerate
├── skills/                     # Skill specializzate (ciascuna con SKILL.md conforme)
│   ├── test-architect-vitest/  # Piani di test, Unit & Integration test Vitest, mock Dexie e BVA
│   ├── autonomous-loops/       # Circuit breaker salva-token per cicli di build e test
│   ├── self-correction-loop/   # Cattura permanente delle correzioni su MEMORY.md
│   ├── headless-pwa-tester/    # Collaudo visivo CDP zero-dipendenze (mobile 390x844 e desktop)
│   ├── minimal-ui-ux/          # Design system minimale per lo studio, microcopy essenziale ed ergonomia zero-distrazioni
│   ├── pwa-quiz-engine/        # Fair Coverage Randomizer, persistenza Dexie e gestione offline
│   ├── vds-exam-examiner/      # Regolamento esame ufficiale AeCI (30 quiz, 45 min, max 3 errori)
│   ├── vds-quiz-extractor/     # Pipeline estrazione e normalizzazione dei 504 quiz dal PDF ufficiale
│   ├── ui-audit-inspector/     # Audit UI/UX, contrasti WCAG AA, anti-cluttering e report HTML con screenshot
│   └── git-pro/                # Standard Conventional Commits e igiene del repository
├── worklog.d/                  # Frammenti di diario per sessioni parallele (anti-merge conflict)
└── workflows/                  # Flussi procedurali standardizzati
    ├── task_lifecycle.md       # Pre-flight, gestione processi sincroni e pulizia task
    └── browser_testing.md      # Collaudo visivo PWA e verifica console browser
```

---

## 2. Direttive Comportamentali Cardine

1. **Token Economy & Circuit Breaker**:
   - Rispettare rigorosamente i limiti di iterazione della skill `autonomous-loops`.
   - Se lo stesso errore si ripete immutato per 2 iterazioni consecutive (`STUCK`), interrompere il ciclo e comunicarlo all'utente.
   - Vietato invocare per più di 2 volte consecutive lo stesso tool di ispezione sullo stesso file senza produrre avanzamento (`anti_sycophancy_integrity.md`).

2. **Zero Dangling Background Tasks**:
   - Eseguire i comandi di build e test con `WaitMsBeforeAsync: 10000` per favorire l'esecuzione sincrona.
   - Terminare immediatamente con `manage_task(Action='kill')` qualsiasi task di breve durata che scivola in background.

3. **Link Cliccabili Sempre Attivi**:
   - Rendere sempre cliccabili tutti i percorsi di file e URL nel markdown (es. `[MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md)`).

4. **Proattività Critica e Prompt Refactoring**:
   - Applicare [proactive_mentorship.md](file:///c:/github/Quiz_VDS-VL/.agents/rules/proactive_mentorship.md) per individuare rischi tecnici, trade-off negativi o ottimizzazioni del prompt prima di avviare interventi massicci.

5. **Desiderata di Progetto, Memoria Tecnica e Registro Lavorazioni (WORKLOG)**:
   - **Pre-Flight Obbligatorio**: Prima di modificare codice, consultare tassativamente:
     * [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) per comprendere la visione del prodotto, i requisiti core e la matrice di stato.
     * [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md) per i vincoli tecnici stabili, le regole AeCI e i criteri di testing.
     * [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md) per conoscere le ultime decisioni architetturali (ADR) e lo storico recente.
   - **Post-Task Obbligatorio**: A fronte di **OGNI lavorazione**, aggiornare obbligatoriamente il registro di bordo:
     * **In sessioni parallele o su branch tematici**: scrivere il frammento isolato in `.agents/worklog.d/YYYY-MM-DD_<topic>.md` per azzerare i conflitti di merge, e consolidarlo con `npm run worklog:consolidate` al momento dell'integrazione su `main`.
     * **In sessione singola su `main`**: aggiornare direttamente [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md) oppure creare il frammento ed eseguire `npm run worklog:consolidate`.
     * Riportare sempre:
       - **Cosa abbiamo fatto**: sintesi puntuale e verificabile degli interventi effettuati e dei file toccati.
       - **Scelte architetturali & Rationale**: decisioni tecniche adottate, motivazioni e alternative scartate.
       - **Impatto sul Desiderata**: allineamento con [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) e istruzioni per il prossimo agente.
   - Nessun task può considerarsi concluso senza questo aggiornamento di bordo.

6. **Mantenimento Continuo della Documentazione Funzionale (README.md)**:
   - A fronte di qualsiasi nuova funzionalità introdotta, estensione di moduli o modifica al comportamento dell'applicazione, aggiornare tempestivamente il [README.md](file:///c:/github/Quiz_VDS-VL/README.md) mantenendolo allineato alle capacità correnti del software.

7. **Lingua Inglese Esclusiva nei Sorgenti e nei Commit (English Only for Code & Git)**:
   - **File Sorgente & Script**: Tutto il codice (`.ts`, `.tsx`, `.js`, `.py`, `.css`), inclusi nomi di variabili/funzioni/tipi, commenti (inline `//`, blocchi `/* */`, `#`), docstring (JSDoc, TSDoc, Python docstrings), suite di test (`describe`, `it`, `test`) e log interni (`console.log`, errori) DEVONO essere scritti esclusivamente in lingua inglese.
   - **Messaggi di Commit**: Tutti i messaggi di commit Git DEVONO seguire la specifica Conventional Commits rigorosamente in lingua inglese (es. `feat(exam): add countdown timer warning`, `fix(randomizer): handle empty pool edge case`).
   - **Eccezione Circoscritta**: L'italiano è riservato tassativamente solo ai testi mostrati all'utente finale (microcopy UI dell'app per gli allievi piloti italiani), ai dati ufficiali dei 504 quiz AeCI (`questions.json`: domande, opzioni, spiegazioni didattiche Regola/Tranello) e alla documentazione di progetto / conversazione con l'utente.

8. **Staging Chirurgico e Sessioni Parallele via Git Worktree**:
   - **Staging Chirurgico Obbligatorio**: È fatto espresso divieto di usare `git add .`, `git add -A` o `git commit -a`. Aggiungere esclusivamente i singoli file pertinenti all'argomento del commit ed eseguire `git diff --cached --stat` prima di confermare.
   - **Isolamento Fisico con Git Worktree**: Per ogni lavorazione concorrente, operare sempre in un worktree dedicato (`.worktrees/<topic>`) agganciato al proprio branch tematico (`feat/...`), integrando su `main` tramite `git merge --no-ff` (cfr. `git-pro`).

9. **Protocollo di Avanzamento Versione e Verificabilità Mobile (SemVer & Build Tracking)**:
   - **Doppio Livello di Tracciamento**:
     * **Per-Commit (Automatico & Zero-Overhead per Dev Locale)**: Il contatore sequenziale di build (`__APP_BUILD_NUMBER__` via `git rev-list --count HEAD`) e il commit hash (`__APP_COMMIT_HASH__` via `git rev-parse --short HEAD`) vengono calcolati e iniettati dinamicamente da `vite.config.ts` ad ogni build o riavvio dev senza toccare alcun file sorgente. Questo consente a ogni commit locale di avere un'identità univoca (es. `#125 · a1b2c3d`) senza inquinare la cronologia né generare conflitti Git.
     * **Per-Push / Traguardo Funzionale (SemVer Ufficiale)**: Alla conclusione di ogni lavorazione/feature e prima del `git push` su `main` (o release), l'agente DEVE obbligatoriamente avanzare la versione semantica in [package.json](file:///d:/Github/Quiz_VDS-VL/package.json) seguendo SemVer (`patch` per bug fix/refactoring/dati, `minor` per nuove funzionalità o schermate), registrando il commit convenzionale `chore(release): bump version to X.Y.Z`.
   - **Verificabilità Mobile Garantita**: Il badge di versione in Navbar (`#app-version-badge`) DEVE rimanere sempre visibile e cliccabile/tappabile anche su viewport mobile stretti (390px). Toccando il badge o la voce nelle Impostazioni deve aprirsi il modal di diagnostica con versione, numero build, hash commit e il tasto "Forza Aggiornamento PWA" per ripulire la cache e ricaricare all'istante l'ultima versione sul telefono dell'allievo.
   - **CI Full Clone Obbligatorio**: Il workflow GitHub Actions [deploy.yml](file:///d:/Github/Quiz_VDS-VL/.github/workflows/deploy.yml) deve sempre avere `with: fetch-depth: 0` sullo step di checkout per garantire che il contatore delle build corrisponda esattamente a quello locale.
   - **Comunicazione Sistematica Numero di Build (Direttiva Vincolante)**: L'agente DEVE indicare SEMPRE all'utente in OGNI risposta di avanzamento, release o completamento task il numero progressivo di build (`#<build_number>`), la versione (`v<version>`) e l'hash di commit corto (`<commit_hash>`), così che l'utente possa verificare all'istante la corrispondenza con il badge `#app-version-badge` sulla Navbar del dispositivo.

