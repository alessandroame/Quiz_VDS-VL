# Project Memory: VDS-VL Quiz Master 🛩️

Questo file costituisce la memoria permanente del progetto. Raccoglie decisioni architetturali consolidate, correzioni dell'utente e regole di dominio per evitare il ripetersi di errori o allucinazioni nelle sessioni di sviluppo.

---

## 1. Regolamento & Quiz VDS-VL (AeCI)
- **Catalogo Completo**: 504 quiz totali (database ufficiale AeCI 2017).
- **Esame Ufficiale**: 30 quesiti a scelta multipla, 45 minuti max, idoneità con max 3 errori (minimo 27/30). 4 o più errori = NON IDONEO.
- **Ripartizione Materie (30 quiz)**: Normativa (2), Aerodinamica (9), Primo Soccorso (1), Fisiopatologia (1), Meteo (8), Strumenti (1), Tecnica Pilotaggio (5), Materiali (1), Sicurezza (2).
- **Spiegazioni Didattiche**: Devono limitarsi a `Regola` (principio fisico o norma) e `Tranello` (motivo tipico di errore), senza menzionare fonti terze.

---

## 2. Architettura PWA & Motore Quiz
- **Fair Coverage Randomizer**: Priorità assoluta a `times_seen == 0` (Bucket 0), poi a domande con minimo `times_seen` (Bucket 1). Nessun coupon collector problem.
- **Single Source of Truth (SSOT)**: Persistenza affidata a Dexie (IndexedDB) per lo stato reattivo e dati quiz; non duplicare o disallineare lo stato su variabili globali effimere.
- **Offline First**: L'app deve funzionare al 100% offline via Service Worker; nessuna funzionalità core deve dipendere dalla connessione di rete (a eccezione del backup manuale Google Drive).

---

## 3. UI/UX Avionico & Microcopy
- **Cockpit Style**: Zero preamboli, etichette essenziali (Esame, Materie, Errori, Archivio, Stats).
- **Feedback**: Secco e chiaro (Esatta, Errata, ⚑ Rivedi, IDONEO, NON IDONEO).
- **Desktop Keyboard**: Tasti `1`, `2`, `3` per risposta, `F` per flag, frecce o `Spazio` per navigazione.

---

## 4. Tooling & Governance
- **Zero Dangling Background Tasks**: Comandi di build/test eseguiti con `WaitMsBeforeAsync: 10000` per evitare processi zombie.
- **Circuit Breaker**: Stop immediato se lo stesso errore di compilazione o test si ripete senza progressi.

---

## 5. Testing & Architettura Suite (Vitest)
- **Moduli Puri Estratti (SRP)**: La logica di valutazione esame risiede in `src/services/examEvaluator.ts`, il timer in `src/utils/timer.ts`, e le metriche in `src/utils/analytics.ts`.
- **Zero Faux-Testing & BVA**: Soglie esame verificate su 2, 3 (Idoneo limite), 4 (Respinto), 6 (Idoneo maratona), 7 (Respinto maratona).
- **Quaderno Errori**: Ingresso con 1 errore (`timesWrong > 0`), promozione e uscita solo con `consecutiveCorrect >= 2`.
- **Isolamento In-Memory**: Test di persistenza Dexie eseguiti con `fake-indexeddb/auto` senza dipendere dal DOM o dal browser reale.
- **Comandi**: `npm run test:unit` per la suite rapida, `npm run test:coverage` per il report di copertura v8.
