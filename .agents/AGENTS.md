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
│   ├── aviation-ui-ux/         # Design system avionico, microcopy minimale e palette cockpit
│   ├── pwa-quiz-engine/        # Fair Coverage Randomizer, persistenza Dexie e gestione offline
│   ├── vds-exam-examiner/      # Regolamento esame ufficiale AeCI (30 quiz, 45 min, max 3 errori)
│   ├── vds-quiz-extractor/     # Pipeline estrazione e normalizzazione dei 504 quiz dal PDF ufficiale
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
