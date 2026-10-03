---
name: git-pro
description: >
  Standard professionale Git: gestione sessioni parallele con Git Worktree, commit atomici su singolo argomento, staging chirurgico, Conventional Commits (English only), log anti-conflitto worklog.d e integrazione sicura merge --no-ff.
  Attiva questa skill quando: crei commit, gestisci sessioni parallele, crei/rimuovi worktree, consolidi worklog o integri branch su main.
version: 2.0.0
language: it-IT
---

# Profilo Operativo: Git Pro Workflow (Multi-Session & Atomic Commits)

Questa skill definisce il protocollo rigoroso per operare con Git su **VDS-VL Quiz Master**, garantendo:
1. **Commit atomici su singolo argomento** (nessun commit promiscuo o mostro).
2. **Isolamento totale delle sessioni parallele** degli agenti tramite **Git Worktree**.
3. **Zero conflitti di merge sul diario di bordo** tramite frammenti in `.agents/worklog.d/`.
4. **Integrazione protetta e tracciabile su `main`** tramite `merge --no-ff`.

---

## 1. Regola dei Commit Atomici su Singolo Argomento (Single-Topic Only)

Ogni commit deve rappresentare **un'unica unità logica autosufficiente**:
- **Codice + Unit Test Insieme**: Il codice di una feature o correzione e i relativi test unitari (es. `src/components/TopicsScreen.tsx` e `src/components/TopicsScreen.test.ts`) DEVONO trovarsi nello **stesso commit**. Un commit atomico nasce compilabile e passante (`green build`).
- **Refactoring Propedeutico Separato**: Se l'implementazione richiede una riorganizzazione o un'astrazione preliminare, committarla prima in un commit distinto `refactor(...)`.
- **Documentazione Generale Separata**: Modifiche a `README.md`, guide o roadmap vanno in un commit `docs(...)` separato.

### 🚫 Divieto Categorico di Staging Indiscriminato
È severamente **VIETATO** utilizzare comandi che catturano l'intero working tree:
- ❌ `git add .`
- ❌ `git add -A`
- ❌ `git commit -a`
- ❌ `git commit -am "..."`

### ✅ Staging Chirurgico Obbligatorio
Aggiungere solo ed esclusivamente i singoli file che appartengono all'argomento del commit:
```bash
git add src/path/to/feature.ts src/path/to/feature.test.ts
```

### 🔍 Pre-Commit Audit (Verifica Obbligatoria Prima del Commit)
Prima di eseguire `git commit`, l'agente DEVE eseguire:
```bash
git diff --cached --stat
```
Verificare che:
1. Siano presenti **esclusivamente** i file pertinenti al singolo argomento.
2. Non siano presenti file temporanei, test screenshot imprevisti o modifiche lasciate da altre lavorazioni.

---

## 2. Standard dei Messaggi: Conventional Commits (English Only)

Tutti i commit DEVONO essere redatti **esclusivamente in lingua inglese** in modalità imperativa:
`<type>(<optional scope>): <imperative summary in English>`

**Divieto Assoluto**: Vietato scrivere messaggi di commit in italiano.

### Tipi Ammessi ed Esempi:
- `feat`: Nuova funzionalità (es. `feat(topics): add keyboard shortcuts 1, 2, 3`)
- `fix`: Risoluzione bug o correzione dati (es. `fix(audio): handle edge case in pronunciation fallback`)
- `docs`: Documentazione o aggiornamento roadmap (es. `docs(readme): update test commands and offline audio guide`)
- `style`: Formattazione, spazi o linting senza impatto logico (es. `style(cockpit): align hud status indicator padding`)
- `refactor`: Riorganizzazione codice senza alterare il comportamento esterno (es. `refactor(db): extract helper method for settings cache`)
- `chore`: Modifiche a tooling, build o dipendenze (es. `chore(git): add worktree ignore and consolidation script`)
- `test`: Aggiunta o modifica di test di validazione (es. `test(worklog): add unit test for fragment consolidator`)
- `merge`: Commit esplicito di integrazione branch (es. `merge: feat(topics-shortcuts) into main`)

---

## 3. Protocollo per Sessioni Parallele Multi-Agente (Git Worktrees)

Quando due o più agenti lavorano in parallelo o su task indipendenti, **NON devono operare nella stessa cartella di lavoro**. Operare nella stessa cartella genera collisioni su `.git/index.lock`, sovrascritture di file e falsi fallimenti nei test Vitest.

### A. Creazione del Worktree Isolato
Per ogni task o sessione parallela, creare un worktree dedicato agganciato a un branch di feature:
```bash
# Esempio per il task "topics-shortcuts"
git worktree add -b feat/topics-shortcuts .worktrees/topics-shortcuts main
```
*Vantaggi*:
- Cartella di lavoro e file system completamente isolati.
- Nessun blocco `.git/index.lock`.
- Suite Vitest (`npm run test:unit`) e build (`npm run build`) eseguite in autonomia senza inquinamento incrociato.

### B. Esecuzione nel Worktree
L'agente esegue tutti i suoi comandi impostando come directory corrente (`Cwd`):
`d:\Github\Quiz_VDS-VL\.worktrees\topics-shortcuts`

Nel worktree l'agente:
1. Sviluppa la modifica e i relativi test.
2. Esegue i test mirati: `npx vitest run src/components/TopicsScreen.test.ts`.
3. Esegue lo staging chirurgico dei soli file toccati (`git add <file1> <file2>`).
4. Crea i commit atomici con messaggi in inglese.

---

## 4. Registro Lavorazioni Anti-Conflitto (Pattern `.agents/worklog.d/`)

La Regola 5 impone di documentare ogni lavorazione. Se più agenti paralleli modificassero la riga 17 di [WORKLOG.md](file:///d:/Github/Quiz_VDS-VL/WORKLOG.md), il merge genererebbe inevitabilmente un conflitto.

### Regola Operativa per le Sessioni Parallele:
1. **Scrivere un Frammento Isolato**: Invece di modificare [WORKLOG.md](file:///d:/Github/Quiz_VDS-VL/WORKLOG.md), creare un file:
   `.agents/worklog.d/YYYY-MM-DD_<topic>.md`
   con la struttura ufficiale:
   ```markdown
   ### [YYYY-MM-DD] - <Titolo della Lavorazione>
   - **Cosa abbiamo fatto**: <Sintesi oggettiva degli interventi effettuati e file toccati>
   - **Scelte architetturali & Rationale**: <Decisioni tecniche adottate, motivazioni e trade-off>
   - **Impatto sul Desiderata**: <Allineamento con DESIDERATA.md e istruzioni per il prossimo agente>
   ```
2. **Commit del Frammento**: Committare il frammento nel proprio branch tematico (`git add .agents/worklog.d/YYYY-MM-DD_<topic>.md`).
3. **Consolidamento al Merge**: Al momento dell'unione su `main`, il comando automatico:
   ```bash
   npm run worklog:consolidate
   ```
   concatena tutti i frammenti in cima a [WORKLOG.md](file:///d:/Github/Quiz_VDS-VL/WORKLOG.md) e ripulisce i file sorgente, con **zero conflitti di merge**.

---

## 5. Integrazione Protetta su `main` (Merge `--no-ff`)

Per preservare l'integrità della storia senza rischiare problemi con `ff-only` o rebase distruttivi, l'integrazione di un branch di feature su `main` si esegue con **Merge Commit Esplicito (`--no-ff`)**:

### Sequenza di Integrazione Passo-Passo:
1. **Aggiornare `main` e posizionarsi sulla radice**:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Eseguire il Merge Non Fast-Forward**:
   ```bash
   git merge --no-ff feat/<topic> -m "merge: feat(<topic>) into main"
   ```
3. **Consolidare il Diario di Bordo**:
   ```bash
   npm run worklog:consolidate
   git add WORKLOG.md
   git commit -m "docs(worklog): consolidate worklog entries"
   ```
4. **Verifica Finale di Salute**:
   ```bash
   npm run test:unit
   npm run build
   ```
5. **Pulizia Worktree e Branch**:
   ```bash
   git worktree remove .worktrees/<topic>
   git branch -d feat/<topic>
   ```

### 🛡️ Rollback Rapido di Emergenza
Se un branch parallelo integrato introduce regressioni in produzione, con `--no-ff` è possibile annullare l'intera sessione con un unico comando pulito:
```bash
git revert -m 1 <merge-commit-hash>
```
senza alterare o corrompere i singoli commit storici.

---

## 6. Rifiniture Locali Pre-Push (Amend)

Se su un commit locale **non ancora pushato né mergiato** si devono applicare micro-fix di sintassi o linting:
```bash
git add <file-modificato>
git commit --amend --no-edit
```
**Regola di Sicurezza**: Mai fare amend o riscrivere la storia su commit già pubblicati (`pushed`) o su rami condivisi (`main`).

---

## 7. Protocollo Avanzamento Versione (SemVer & Release)

Per consentire sia lo sviluppo rapido in locale sia la verifica immediata su smartphone che l'ultima versione PWA sia stata recepita, si adotta un sistema a doppio livello:

### A. Livello Commit (Locale & CI - Automatico a Zero Modifiche File)
- Ad ogni singolo commit Git, il contatore sequenziale `commitCount` (`git rev-list --count HEAD`) e lo short hash `commitHash` (`git rev-parse --short HEAD`) vengono calcolati al volo da `vite.config.ts`.
- Non è necessario (ed è sconsigliato) modificare `package.json` su ogni micro-commit atomico: questo evita merge conflict su branch paralleli e mantiene pulita la cronologia.
- Quando si prova l'app in locale (`npm run dev` o smartphone connesso alla rete locale), il contatore e l'hash identificano con precisione matematica il commit esatto in esecuzione.

### B. Livello Release / Integrazione (SemVer Ufficiale)
- Alla conclusione di una lavorazione o traguardo (prima che l'utente effettui il push su `origin/main`):
  1. Avanzare la versione in `package.json`:
     - **`patch`** (es. `1.1.0` -> `1.1.1`): bug fix, rifiniture UI, correzioni dati quiz o audio, test.
     - **`minor`** (es. `1.1.0` -> `1.2.0`): nuove funzionalità, nuove schermate o flussi operativi completi.
     - **`major`** (es. `1.0.0` -> `2.0.0`): cambi architetturali radicali o rotture di compatibilità.
  2. Creare il commit dedicato:
     ```bash
     git add package.json package-lock.json
     git commit -m "chore(release): bump version to X.Y.Z"
     ```
  3. Eseguire la verifica di build (`npm run build`) e test (`npm run test:unit`).
  4. L'integrazione su GitHub Pages compilerà con `fetch-depth: 0`, allineando il contatore di build e garantendo che la PWA offra la nuova versione con possibilità di forzare il refresh direttamente dal badge touch della UI.

---

## 8. Divieto Categorico di Git Push in Autonomia (User-Controlled Push)

- **Controllo Utente Assoluto**: L'agente **NON DEVE MAI** eseguire `git push` di propria iniziativa o in autonomia al termine di un task, bugfix o release.
- **Ambito Locale Stretto**: Tutte le operazioni di staging chirurgico, commit atomici, risoluzione conflitti, merge locali e bump di versione si fermano rigorosamente nel repository locale.
- **Esecuzione su Richiesta Esplicita**: Il comando `git push` è riservato all'utente, oppure viene eseguito dall'agente **esclusivamente** quando l'utente impartisce un ordine esplicito e inequivocabile in chat (es. *"fai il push"*, *"pusha su main"*).

