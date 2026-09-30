# Piano di Progetto: Interattività e Ispezione Liste nelle Statistiche 🛩️

Data: 2026-09-30  
Stato: Approvato / Da Implementare (`TODO-07`)  
Target: [src/components/StatsScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/StatsScreen.tsx)

---

## 1. Obiettivo & Visione

Nella schermata **Statistiche** (`StatsScreen`), gli allievi piloti analizzano la propria preparazione complessiva per l'esame VDS-VL AeCI.  
Attualmente le liste visualizzate sono puramente statiche:
- La lista delle 9 materie con percentuale di precisione non reagisce al tocco.
- La "Top 10 Domande con Più Errori" mostra solo un'anteprima troncata senza consentire di leggere il quesito per intero o comprenderne la causa d'errore.
- Lo storico delle simulazioni non consente di visualizzare i quiz affrontati nella prova.

**Requisito utente**:
Rendere interattive le liste nelle statistiche in modo che cliccando su una materia venga mostrata la materia con i suoi quesiti, e cliccando su una domanda venga mostrata la scheda completa del quesito.

---

## 2. Architettura & Pattern UX

In conformità alle direttive di progetto ([minimal-ui-ux](file:///c:/github/Quiz_VDS-VL/.agents/skills/minimal-ui-ux/SKILL.md) e [backNavigation](file:///c:/github/Quiz_VDS-VL/src/utils/backNavigation.ts)):

```
┌─────────────────────────────────────────────────────────────┐
│                    StatsScreen (Progressi)                  │
│                                                             │
│  [02 Aerodinamica 65%] ──(Click)──┐                         │
│  [Top 10: Domanda #1042] ─(Click)─┼──────────────┐          │
└───────────────────────────────────┼──────────────┼──────────┘
                                    ▼              ▼
       ┌───────────────────────────────┐  ┌───────────────────────────────┐
       │   SubjectDetailModal          │  │    QuestionDetailModal        │
       │   (02 - Aerodinamica)         │  │    (#1042 - Meteorologia)     │
       │                               │  │                               │
       │ • Precisione & Viste/Totale   │  │ • Testo integrale domanda     │
       │ • Tasto [Allenati su Materia] │  │ • 3 Opzioni (Esatta in verde) │
       │ • Filtri: Tutte / Errori / Mai│  │ • Didattica: Regola & Tranello│
       │ • Elenco domande materia      │  │ • Telemetria (viste, errori)  │
       │    └─ [Domanda #1015] ──(Click)──► • Audio Play & Note personali │
       └───────────────────────────────┘  └───────────────────────────────┘
```

### A. Modale Dettaglio Domanda (`QuestionDetailModal`)
Un modale leggero, touch-friendly, con backdrop blur scuro e animazione fluida:
1. **Header**:
   - Badge materia (es. `05 Meteorologia`) + ID univoco `#1042`.
   - Badge di stato dell'allievo: `Nel Quaderno Errori` (rosso), `3 errori` o `Corretta` (smeraldo).
   - Tasto Segnalibro / Preferito (`Bookmark`) per salvare al volo nei preferiti.
   - Tasto Chiudi `[X]`.
2. **Corpo Principale**:
   - **Testo Domanda**: Testo integrale AeCI senza troncamenti, con contrasto elevato e font scalato secondo le preferenze (`fontSizePreference`).
   - **3 Opzioni Ufficiali**:
     - Risposta esatta evidenziata in verde smeraldo con bordo dedicato e icona `CheckCircle2`.
     - Le restanti 2 opzioni chiaramente leggibili e distinte.
   - **Spiegazione Didattica**:
     - Sezione con **Regola** (principio fisico, aerodinamico o norma di legge) e **Tranello** (bias cognitivo o trappola lessicale AeCI).
   - **Ascolto Vocale (se TTS abilitato)**:
     - Player compatto integrato tramite `useAviationVoice` per riprodurre domanda, opzioni e spiegazione neurale (Giuseppe/Elsa).
   - **Note Personali**:
     - Visualizzazione ed editor inline rapido per salvare annotazioni personali in Dexie.
3. **Footer Telemetrico**:
   - Volte vista (`timesSeen`), volte errata (`timesWrong`), risposte consecutive corrette (`consecutiveCorrect`).

### B. Modale Dettaglio Materia (`SubjectDetailModal`)
Un pannello a scorrimento che sviscera le statistiche della materia selezionata:
1. **Header & Cruscotto Materia**:
   - Codice e Nome Materia (es. `02 Aerodinamica`).
   - Percentuale precisione, barra di copertura grafica (viste su totali) e conteggio errori attivi.
   - **Pulsante Azione Rapida "Allenati su questa materia"**: scorciatoia diretta per passare a `TopicsScreen` su questa materia.
2. **Barra Filtri Rapidi a 1 Tocco**:
   - `Tutte (N)`
   - `Errori (X)` (quesiti della materia attualmente nel Quaderno Errori)
   - `Non viste (Y)`
   - `Corrette (Z)`
3. **Elenco Domande della Materia**:
   - Lista scorrevole ottimizzata per smartphone (min-h 48px touch target).
   - Ogni riga mostra:
     - `#ID` monospaziato.
     - Indicatore di stato cromatico (smeraldo = corretta, rosso = con errori, grigio = mai vista).
     - Anteprima sintetica del quesito.
     - Icona freccia/chevron `>` per indicare la cliccabilità.
   - **Interazione a cascata**: Cliccando su qualsiasi quesito della lista, si apre sopra il `QuestionDetailModal` della domanda specifica.

### C. Gestione Tasto Indietro Hardware & Popstate
- Integrazione completa con `backNavigation.registerSubModal`:
  - Se l'utente apre una materia e poi una domanda, premendo il tasto "Indietro" di Android o effettuando la gesture laterale iOS/Android, il sistema chiude in ordine prima la domanda e poi la materia, mantenendo l'utente nella schermata statistiche.
  - Chiusura gestita anche con tasto `Escape` e tocco sul backdrop esterno.

---

## 3. File Interessati dall'Implementazione

| File | Stato | Responsabilità |
| :--- | :---: | :--- |
| `src/components/QuestionDetailModal.tsx` | Nuovo | Scheda modale del singolo quesito (testo, opzioni, Regola/Tranello, audio, note, telemetria). |
| `src/components/SubjectDetailModal.tsx` | Nuovo | Scheda modale della materia (statistiche materia, filtri stato, lista quesiti cliccabili, tasto allenamento). |
| `src/components/StatsScreen.tsx` | Modifica | Gestione click su materie e Top 10 errori, stati di selezione, trigger modali e feedback visivo hover/touch. |
| `src/App.tsx` | Modifica | Passaggio callback di navigazione rapida a `StatsScreen` per avviare l'allenamento materia se richiesto. |
| `src/components/QuestionDetailModal.test.ts` | Nuovo | Test unitari Vitest per rendering isolato, interazioni e gestione submodali. |
| `DESIDERATA.md` | Modifica | Tracciamento requisito in TODO-07 e aggiornamento matrice di stato. |
| `WORKLOG.md` | Modifica | Registrazione decisioni architetturali (ADR) e log interventi. |

---

## 4. Piano di Test & Criteri di Accettazione

1. **Vitest Unit Test Suite (`npm run test:unit`)**:
   - Tutti i 220+ test unitari esistenti continuano a passare al 100%.
   - Nuovi test dedicati per `QuestionDetailModal` e `SubjectDetailModal` (apertura, filtri materia, chiusura).
2. **Typecheck & Build**:
   - `npx tsc --noEmit` senza errori di tipi (`strict: true`).
   - `npm run build` senza warning di rollup o aumento anomalo del bundle size.
3. **Collaudo Headless CDP (`headless-pwa-tester`)**:
   - Apertura di `StatsScreen` su mobile (390x844) e desktop (1440x900).
   - Click su materia ➔ apertura `SubjectDetailModal`.
   - Click su domanda dentro la materia ➔ apertura `QuestionDetailModal`.
   - Click su domanda nella Top 10 errori ➔ apertura `QuestionDetailModal`.
   - Chiusura corretta via tasto `[X]`, `Escape` e backdrop.
   - **0 errori** in console JavaScript.
