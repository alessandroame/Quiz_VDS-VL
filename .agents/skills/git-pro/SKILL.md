---
name: git-pro
description: >
  Standard e procedure professionali per il versionamento Git, commit atomici convenzionali, gestione amend pre-push e igiene del repository.
  Attiva questa skill quando: crei commit, gestisci amend pre-push, controlli lo stato di git o mantieni pulito il working tree.
version: 1.1.0
language: it-IT
---

# Profilo Operativo: Git Pro Workflow

Questa skill definisce le regole operative per una gestione di Git rigorosa, pulita e professionale all'interno del progetto.

## 1. Regola di Frequenza e Cadenza dei Commit
- **Commit al termine di ogni argomento/milestone**: Non accumulare modifiche disparate in un unico maxi-commit. Ogni funzionalità coerente, script, correzione o documentazione deve avere il proprio commit atomico.
- **Messe a punto e rifiniture pre-push (Amend)**:
  - Se si apportano rifiniture, fix di lint, correzioni di refusi o micro-tuning a modifiche non ancora inviate al remote (`push`), utilizzare:
    ```bash
    git add <file-modificati>
    git commit --amend --no-edit
    ```
    oppure aggiornare il messaggio se l'intervento modifica il perimetro:
    ```bash
    git commit --amend -m "tipo: messaggio aggiornato"
    ```
  - **Regola di sicurezza**: mai effettuare amend o riscrivere la storia su commit già pubblicati (`pushed`) su branch condivisi.

## 2. Standard dei Messaggi: Conventional Commits (English Only)
I messaggi di commit DEVONO essere redatti **esclusivamente in lingua inglese** in modalità imperativa e seguire la specifica Conventional Commits:
`<type>(<optional scope>): <imperative summary in English>`

**Regola Vincolante**: È fatto espresso divieto di scrivere commit message in lingua italiana. Tutto il testo del commit (tipo, scope, subject ed eventuale body/footer) deve essere redatto in inglese.

### Tipi Ammessi ed Esempi:
- `feat`: Nuova funzionalità (es. `feat(quiz): implement fair coverage randomizer algorithm`)
- `fix`: Risoluzione di un bug o correzione dati (es. `fix(extractor): handle question 7037 parsing edge case`)
- `docs`: Documentazione o aggiornamento roadmap (es. `docs(readme): update feature list and test commands`)
- `style`: Formattazione, spazi, linting senza alterazione logica (es. `style(theme): adjust cockpit dark contrast utility classes`)
- `refactor`: Riorganizzazione codice senza alterare il comportamento esterno (es. `refactor(audio): decouple TTS speech synthesis player`)
- `chore`: Modifiche a build, tooling, dipendenze o configurazioni (es. `chore(deps): update vite and dexie dependencies`)
- `test`: Aggiunta o modifica di test di validazione (es. `test(evaluator): add boundary value analysis tests for exam thresholds`)

## 3. Igiene Pre-Commit e Repository
1. **Verifica dello Stato**:
   - Eseguire sempre `git status` prima di aggiungere file.
   - Usare `git diff` o `git diff --cached` per verificare con esattezza le righe modificate.
2. **Nessun File Improprio**:
   - File temporanei, cache Python (`__pycache__`, `.pytest_cache`), cartelle build (`dist/`, `build/`) e `node_modules/` devono essere rigorosamente inclusi nel `.gitignore`.
3. **Stato della Working Tree**:
   - Al termine di ogni sessione, verificare che il working tree sia pulito (`nothing to commit, working tree clean`).
