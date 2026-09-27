# Vincoli Architetturali e Standard di Codice (Quiz_VDS-VL)

## 1. Vincoli Strutturali e Stack Tecnologico
- **Stack**: Vite + TypeScript + Tailwind CSS (nessun framework monolitico pesante superfluo).
- **Persistenza**: Dexie.js (IndexedDB) è l'unica sorgente di verità (**Single Source of Truth**) per lo storico esami, le statistiche dei quiz, i bookmark e le note.
- **PWA & Offline First**: Funzionamento garantito al 100% offline via Service Worker; la sincronizzazione Google Drive è rigorosamente on-demand e opzionale.
- **Microcopy**: Rispettare categoricamente il Cockpit Style definito in `aviation-ui-ux` (nessun testo superfluo o verboso).

## 2. Standard di Codice e Naming
- **Linguaggio di Programmazione**: Tutti i nomi di variabili, funzioni, interfacce, tipi, file e classi devono essere in lingua inglese (es. `FairCoverageRandomizer`, `QuestionStat`, `evaluateExamSession`).
- **Single Responsibility Principle (SRP)**:
  - Separare rigorosamente la logica di calcolo puro (algoritmo randomizer, calcolo punteggio, elaborazione quote) dalla manipolazione del DOM o dalla persistenza IndexedDB.
  - Evitare funzioni monolitiche; comporre moduli testabili singolarmente con Vitest.
- **Tipizzazione Rigorosa**:
  - Modalità `strict: true` in TypeScript. Evitare l'uso di `any`; definire interfacce puntuali per ogni entità dei quiz e delle sessioni.

## 3. Politica Anti-Accrocchio (Zero Quick-Fix)
- Vietato l'uso di `setTimeout` per attendere scritture sul database o per forzare l'allineamento della UI.
- Vietato duplicare lo stato dell'esame o delle risposte in variabili globali o attributi DOM `data-*`.
