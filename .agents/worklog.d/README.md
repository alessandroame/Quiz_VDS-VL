# Worklog Fragments Directory (.agents/worklog.d/)

Questa cartella raccoglie i frammenti di diario di bordo generati da sessioni di lavoro parallele degli agenti AI (es. su branch tematici o Git Worktree).

## Convenzione di Nomenclatura
`YYYY-MM-DD_<topic>.md` (es. `2026-09-29_git-worktrees.md`)

## Struttura del Frammento
Ogni file deve contenere una singola voce di diario conforme al template ufficiale:

```markdown
### [YYYY-MM-DD] - <Titolo della Lavorazione>
- **Cosa abbiamo fatto**: <Sintesi puntuale delle modifiche e file toccati>
- **Scelte architetturali & Rationale**: <Motivazioni tecniche, trade-off e alternative scartate>
- **Impatto sul Desiderata**: <Allineamento con DESIDERATA.md e note per il prossimo agente>
```

## Consolidamento
Al momento del merge del branch su `main`, eseguire:
```bash
npm run worklog:consolidate
```
Questo comando concatena atomicamente tutti i frammenti in cima a `WORKLOG.md` e ripulisce la cartella, prevenendo al 100% i conflitti di merge Git.
