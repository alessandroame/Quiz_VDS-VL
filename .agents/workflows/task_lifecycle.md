---
description: Flusso operativo standard per il ciclo di vita dei task, governance dei comandi e gestione multi-agente
---

# Workflow: Task Lifecycle & Process Governance (Multi-Session & Atomic)

Questo workflow garantisce che ogni task si svolga in modo ordinato, verificabile, privo di processi orfani o regressioni, e perfettamente isolato in caso di lavorazioni multi-agente parallele.

---

## 1. Fase Preliminare (Pre-Flight)

1. **Verifica Stato e Isolamento Repository**:
   ```bash
   git status --porcelain
   ```
2. **Determinazione dell'Ambiente (Sessione Singola vs Parallela)**:
   - Se il task viene eseguito in concorrenza con altre sessioni o richiede isolamento, creare un Git Worktree dedicato (cfr. [git-pro](file:///d:/Github/Quiz_VDS-VL/.agents/skills/git-pro/SKILL.md)):
     ```bash
     git worktree add -b feat/<topic> .worktrees/<topic> main
     ```
   - Eseguire tutte le operazioni successive all'interno del percorso del worktree (`Cwd`).
3. **Consultazione Triade di Conoscenza (Desiderata, Memory, Worklog)**:
   - Consultare [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) per comprendere la visione funzionale e la matrice di stato attuale.
   - Consultare [MEMORY.md](file:///d:/Github/Quiz_VDS-VL/MEMORY.md) per verificare i vincoli tecnici stabili, le regole AeCI e gli standard operativi.
   - Consultare [WORKLOG.md](file:///d:/Github/Quiz_VDS-VL/WORKLOG.md) per verificare le decisioni architetturali recenti prima di toccare codice o proporre modifiche.

---

## 2. Esecuzione Comandi e Zero Dangling Tasks

1. **Massimizzare l'Esecuzione Sincrona**:
   - Per tutti i comandi di build, typecheck e test (`npx tsc --noEmit`, `npx vitest run`), impostare sempre `WaitMsBeforeAsync: 10000`.
2. **Chiusura Immediata dei Task Orfani**:
   - Se un comando finisce accidentalmente in background (eccetto i server web a lungo termine con `IsDaemon: true`), terminarlo tempestivamente invocando `manage_task(Action='kill', TaskId=...)`.
   - Non lasciare mai processi Node orfani attivi.

---

## 3. Verifica e Presentazione

1. **Test Mirati di Modulo**:
   ```bash
   npx vitest run src/path/to/module.test.ts
   ```
2. **Typecheck Globale**:
   ```bash
   npx tsc --noEmit
   ```
3. **Presentazione all'Utente**:
   - Mostrare cosa è stato realizzato, come collaudarlo nel browser o nei test, e attendere il feedback dell'utente prima di finalizzare.

---

## 4. Aggiornamento Registro di Bordo (WORKLOG & Desiderata) - Obbligatorio

A fronte di **OGNI lavorazione completata**, prima del commit:
1. **Tracciamento Anti-Conflitto**:
   - **In sessione parallela o su branch di feature**: creare il frammento isolato:
     `.agents/worklog.d/YYYY-MM-DD_<topic>.md`
     compilando le tre sezioni standard:
     * **Cosa abbiamo fatto**: elenco puntuale delle modifiche e file impattati.
     * **Scelte architetturali & Rationale**: motivazioni della soluzione tecnica adottata e trade-off considerati.
     * **Impatto sul Desiderata**: come la lavorazione fa avanzare il desiderata di progetto.
   - **In sessione singola su `main`**: aggiornare direttamente [WORKLOG.md](file:///d:/Github/Quiz_VDS-VL/WORKLOG.md) oppure creare il frammento ed eseguire `npm run worklog:consolidate`.
2. **Allineare la Matrice di Stato in [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md)** se sono state completate feature o definiti nuovi requisiti.

---

## 5. Consolidamento, Commit e Integrazione

1. **Staging Chirurgico Obbligatorio**:
   - 🚫 **Divieto assoluto** di `git add .`, `git add -A` o `git commit -a`.
   - Aggiungere singolarmente i soli file toccati appartenenti all'argomento:
     ```bash
     git add src/path/to/feature.ts src/path/to/feature.test.ts
     ```
2. **Pre-Commit Audit**:
   ```bash
   git diff --cached --stat
   ```
   Certificare che siano presenti SOLO i file del singolo argomento.
3. **Commit Atomico in Lingua Inglese**:
   - Rispettare rigorosamente la specifica Conventional Commits in lingua inglese (es. `feat(quiz): implement fair coverage randomizer`).
   - Codice sorgente e relativi unit test DEVONO essere inseriti nello stesso commit.
4. **Integrazione Protetta (se operato in Worktree / Feature Branch)**:
   - Tornare sul ramo principale: `git checkout main && git pull origin main`
   - Fondere con merge commit esplicito: `git merge --no-ff feat/<topic> -m "merge: feat(<topic>) into main"`
   - Consolidare il diario di bordo:
     ```bash
     npm run worklog:consolidate
     git add WORKLOG.md
     git commit -m "docs(worklog): consolidate worklog entries"
     ```
   - Pulizia: rimuovere il worktree con `git worktree remove .worktrees/<topic>` ed eliminare il branch locale `git branch -d feat/<topic>`.
