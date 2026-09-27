---
name: autonomous-loops
description: Cicli di iterazione autonomi con Circuit Breaker per sviluppo Vite, TypeScript e Vitest. Blocca loop infiniti, previene lo spreco di token e interrompe l'esecuzione in caso di stallo o regressione.
version: 1.0.0
language: it-IT
---

# Autonomous Iteration Loops & Circuit Breaker (Vite / TypeScript)

Questa skill governa i cicli autonomi di risoluzione errori di compilazione TypeScript, fallimento test Vitest e refactoring.  
**Obiettivo primario**: Massima efficienza, convergenza rapida e prevenzione assoluta dello spreco di token da retry ciechi o loop infiniti.

---

## 1. Principi Fondamentali (Token Economy)

1. **Iterazioni Limitate (Bounded Loops)**:
   - Tetto massimo predefinito: **3 iterazioni** per errori di build/typecheck.
   - Tetto massimo assoluto: **5 iterazioni** per test complessi di logica.
   - Nessun loop può proseguire oltre il tetto senza consultare l'utente.

2. **Rilevamento di Progresso Obbligatorio**:
   - Ogni iterazione DEVE produrre una riduzione misurabile del numero di errori o test falliti.
   - Se un fix produce lo **stesso identico errore o numero di errori**, lo stato diventa `STUCK`. Il ciclo si interrompe **immediatamente**.

3. **Circuit Breaker di Regressione**:
   - Se un tentativo di fix incrementa il numero di errori rispetto all'iterazione precedente, l'agente deve eseguire il `revert` immediato della modifica e cambiare strategia.

4. **Trasparenza ad ogni Passo**:
   - Riportare sinteticamente: `Iterazione X/N: risolti A errori, rimanenti B`.

---

## 2. Pattern Operativi

### A. Typecheck & Build-Fix Loop (`tsc` / `vite build`)

```
BUILD-FIX LOOP:
  max_iterations = 3
  previous_errors = []

  for iteration in 1..max_iterations:
    result = npx tsc --noEmit
    if result.exit_code == 0:
      report "BUILD PASS in {iteration} iterazione/i"
      return PASS

    errors = parse_errors(result.output)
    if errors == previous_errors:
      report "CIRCUIT BREAKER [STUCK] — Stesso errore non risolto. Stop per evitare spreco token."
      return STUCK

    if len(errors) > len(previous_errors) and iteration > 1:
      report "CIRCUIT BREAKER [REGRESSION] — Aumento errori ({len(errors)} > {len(previous_errors)}). Revert automatico."
      revert_last_change()
      return REGRESSION

    apply_surgical_fix(errors[0])
    previous_errors = errors

  report "MAX ITERATIONS RAGGIUNTO — Consultare l'utente per revisione architetturale."
  return FAIL
```

### B. Test-Fix Loop (Vitest)

1. Isolare il singolo file di test fallito: `npx vitest run src/path/to/test.ts`. Non rieseguire l'intera suite ad ogni micro-modifica.
2. Distinguere chiaramente se il bug risiede nel codice di produzione o nell'asserzione del test.
3. Se dopo 2 iterazioni il test non converge, attivare `trace_based_debugging` anziché tentare modifiche casuali al codice.

---

## 3. Anti-Pattern Vietati

- **Blind Retry**: Rilanciare lo stesso comando sperando in un risultato diverso senza aver modificato il codice.
- **Speculative File Rewriting**: Riscrivere l'intero file per un singolo errore di tipo TypeScript. Usare modifiche chirurgiche con `replace_file_content`.
- **Ignoring Compounding Errors**: Proseguire quando un fix introduce 4 nuovi errori a cascata. Fermarsi e ripristinare lo stato funzionante.
