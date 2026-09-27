---
description: Flusso operativo standard per il ciclo di vita dei task e governance dei comandi
---

# Workflow: Task Lifecycle & Process Governance

Questo workflow garantisce che ogni task si svolga in modo ordinato, verificabile e privo di processi orfani o regressioni.

---

## 1. Fase Preliminare (Pre-Flight)
1. **Verifica Stato Repository**:
   ```bash
   git status --porcelain
   ```
2. **Consultazione Triade di Conoscenza (Desiderata, Memory, Worklog)**:
   - Consultare [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) per comprendere la visione funzionale e la matrice di stato attuale.
   - Consultare [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md) per verificare i vincoli tecnici stabili, le regole AeCI e gli standard operativi.
   - Consultare [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md) per verificare le decisioni architetturali recenti prima di toccare codice o proporre modifiche.

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
1. **Aggiornare [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md)**:
   - Aggiungere una voce in cima al registro cronologico:
     - **Cosa abbiamo fatto**: elenco puntuale delle modifiche e file impattati.
     - **Scelte architetturali & Rationale**: motivazioni della soluzione tecnica adottata e trade-off considerati.
     - **Impatto sul Desiderata**: come la lavorazione fa avanzare il desiderata di progetto.
2. **Allineare la Matrice di Stato in [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md)** se sono state completate feature o definiti nuovi requisiti.


---

## 5. Consolidamento e Commit
- Rispettare rigorosamente la specifica Conventional Commits redatta **esclusivamente in lingua inglese** come definita nella skill `git-pro` (es. `feat(quiz): implement fair coverage randomizer`).
- Se si apportano rifiniture prima del push, procedere con `git commit --amend --no-edit`.

