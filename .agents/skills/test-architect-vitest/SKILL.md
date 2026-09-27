---
name: test-architect-vitest
description: >
  Architettura dei piani di test (Test Plan), progettazione di Unit & Integration Test con Vitest,
  analisi dei casi limite (Boundary Values) e mocking specialistico per PWA (Dexie IndexedDB con fake-indexeddb,
  timer esame con vi.useFakeTimers).
  Attiva questa skill quando: progetti o scrivi test unitari, crei piani di test o test matrix, testi la logica
  di calcolo (Fair Coverage Randomizer, calcolo esame AeCI, Quaderno Errori), configuri Vitest,
  o quando l'utente dice 'piano di test', 'unit test', 'test vitest', 'testa la logica', 'coverage' o 'scrivi i test'.
version: 1.0.0
language: it-IT
---

# Test Architect & Vitest Engineering (PWA Quiz VDS-VL)

Questa skill governa la progettazione e l'implementazione della suite di test automatici a livello unitario e di integrazione logica per la PWA VDS-VL, garantendo convergenza matematica, assenza di test fittizi e copertura dei casi limite.

---

## 1. Principi Inviolabili di Testing

1. **Zero Faux-Testing (Bando ai Test Tautologici)**:
   - È severamente vietato scrivere asserzioni in cui l'output atteso è calcolato duplicando la stessa logica di produzione sotto test.
   - Ogni test deve asserire valori attesi indipendenti, deterministici o proprietà statistiche verificate (es. rispetto quote esatte per materia).

2. **Analisi dei Valori Limite (Boundary Value Analysis - BVA)**:
   - Testare sempre i confini esatti:
     - Errori esame: 2 errori (Idoneo), 3 errori (Idoneo - limite), 4 errori (Non Idoneo), 30 errori (Non Idoneo).
     - Timer: 45:00 (inizio), 00:01 (penultimo secondo), 00:00 (scaduto -> autoconsegna).
     - Quaderno Errori: 1 risposta corretta (rimane nel quaderno), 2 risposte corrette consecutive (esce dal quaderno).

3. **Pattern AAA Rigoroso (Arrange, Act, Assert)**:
   - Ogni test deve essere strutturato in 3 blocchi visivamente distinti e privi di complessità superflua.

---

## 2. Le 5 Suite di Test Fondamentali per Quiz_VDS-VL

### A. Fair Coverage Randomizer (`src/utils/randomizer.test.ts`)
- **Verifica Quota Materie**: Ciascuna sessione da 30 quiz deve rispettare esattamente:
  - Normativa: 2 | Aerodinamica: 9 | Pronto Soccorso: 1 | Fisiopatologia: 1
  - Meteo: 8 | Strumenti: 1 | Tecnica Pilotaggio: 5 | Materiali: 1 | Sicurezza: 2
- **Simulazione Monte Carlo / Copertura Totale**:
  - Eseguire un loop di 20 sessioni simulate a partire da storico vuoto (`timesSeen == 0`).
  - Asserire che al termine delle 20 sessioni il 100% dei 504 quiz sia stato visto almeno 1 volta (`min(timesSeen) >= 1`).
- **Nessun Duplicato**: Una sessione non deve MAI contenere lo stesso ID domanda due volte.

### B. Motore Valutazione Esame (`src/services/examEvaluator.test.ts`)
- Calcolo Idoneità standard (30 domande, max 3 errori).
- Calcolo Idoneità maratona (60 domande, max 6 errori).
- Domande non risposte / saltate conteggiate come errate in fase di consegna finale.
- Calcolo corretto del breakdown per singola materia.

### C. Persistenza Dexie / IndexedDB (`src/db/database.test.ts`)
- **Isolamento**: Usare `fake-indexeddb` per eseguire i test in memoria Node.js senza browser:
  ```typescript
  import 'fake-indexeddb/auto';
  import { db } from './database';

  beforeEach(async () => {
    await db.delete();
    await db.open();
  });
  ```
- **Transazioni e Crash Recovery**: Verifica persistenza immediata delle risposte a ogni singolo click per consentire la ripresa dell'esame interrotto dopo un refresh accidentale.

### D. Timer Cockpit & Auto-Consegna (`src/utils/timer.test.ts`)
- Utilizzare i fake timer di Vitest per evitare attese reali:
  ```typescript
  import { vi, describe, it, expect } from 'vitest';

  it('scade e innesca la consegna automatica dopo 45 minuti', () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    const timer = startExamTimer({ minutes: 45, onExpire });

    vi.advanceTimersByTime(45 * 60 * 1000);
    expect(onExpire).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  ```

### E. Integrità Dataset 504 Quiz (`src/data/questions.test.ts`)
- Verifica schema JSON su `src/data/questions.json`:
  - Esattamente 504 record.
  - ID univoci e sequenziali per blocco materia.
  - Per ogni record: `options.length === 3`, `correctAnswer` $\in \{1, 2, 3\}$, `explanation.rule` e `explanation.trap` non vuoti.

---

## 3. Template per Piano di Test (`test_plan.md`)

Quando si pianifica un nuovo modulo o refactoring, redigere un piano sintetico nel formato:

```markdown
# Piano di Test: [Nome Feature / Modulo]

## 1. Obiettivo & Perimetro
[Cosa viene testato e quali contratti devono essere garantiti]

## 2. Matrice dei Casi di Test
| ID | Scenario | Input / Stato | Output Atteso | Tipo |
| :--- | :--- | :--- | :--- | :--- |
| TC-01 | Superamento Esame | 27 corrette, 3 errate | `isPassed: true` | BVA |
| TC-02 | Respinto 4 Errori | 26 corrette, 4 errate | `isPassed: false` | BVA |
| TC-03 | Quota Meteo Esatta | 30 quiz generati | `materie[5] === 8` | Logica |

## 3. Strategia di Mocking
- Database: `fake-indexeddb` in-memory.
- Tempo: `vi.useFakeTimers()`.
```

---

## 4. Comandi di Esecuzione Rapida (Token & Time Saving)

- **Test Mirato di un Singolo File**:
  ```bash
  npx vitest run src/utils/randomizer.test.ts
  ```
- **Suite Completa Unit Test**:
  ```bash
  npm run test:unit
  ```
- **Modalità Watch (Solo durante sviluppo interattivo)**:
  ```bash
  npm run test:watch
  ```
