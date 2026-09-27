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
2. **Consultazione Vincoli**:
   - Leggere `MEMORY.md` per verificare eventuali regole preesistenti sull'argomento.

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

## 4. Consolidamento e Commit
- Rispettare rigorosamente la specifica Conventional Commits come definita nella skill `git-pro`.
- Se si apportano rifiniture prima del push, procedere con `git commit --amend --no-edit`.
