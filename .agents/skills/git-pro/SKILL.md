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

## 2. Standard dei Messaggi: Conventional Commits
I messaggi di commit devono seguire la specifica Conventional Commits:
`<tipo>(<ambito opzionale>): <descrizione sintetica e chiara>`

### Tipi Ammessi:
- `feat`: Nuova funzionalità (es. `feat(quiz): implementa fair coverage randomizer`)
- `fix`: Risoluzione di un bug o correzione dati (es. `fix(extractor): gestisci eccezione domanda 7037`)
- `docs`: Documentazione o aggiornamento roadmap (es. `docs(plan): aggiorna TODO e piano di progetto`)
- `style`: Formattazione, spazi, linting senza alterazione logica
- `refactor`: Riorganizzazione codice senza aggiungere feature o fix
- `chore`: Modifiche alla build, dipendenze, configurazioni (.gitignore, skills)
- `test`: Aggiunta o modifica di test di validazione

## 3. Igiene Pre-Commit e Repository
1. **Verifica dello Stato**:
   - Eseguire sempre `git status` prima di aggiungere file.
   - Usare `git diff` o `git diff --cached` per verificare con esattezza le righe modificate.
2. **Nessun File Improprio**:
   - File temporanei, cache Python (`__pycache__`, `.pytest_cache`), cartelle build (`dist/`, `build/`) e `node_modules/` devono essere rigorosamente inclusi nel `.gitignore`.
3. **Stato della Working Tree**:
   - Al termine di ogni sessione, verificare che il working tree sia pulito (`nothing to commit, working tree clean`).
