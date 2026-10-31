---
name: pwa-quiz-engine
description: >-
  Motore per la PWA VDS-VL: Fair Coverage Randomizer, valutazione pesata 100 punti AeCI, store Dexie (IndexedDB), sync Google Drive e Service Worker.
  Utilizza questa skill quando modifichi l'estrazione quiz o lo store Dexie.
version: 1.2.0
language: it-IT
---

# Profilo Operativo: PWA Quiz Engine

Questa skill governa la logica applicativa del simulatore d'esame, del randomizer e della persistenza locale per la PWA VDS-VL.

## 1. Algoritmo Fair Coverage Randomizer & Pesi AeCI (`src/utils/aeciRegulation.ts`, `src/utils/fairRandomizer.ts`)
Risolve il *coupon collector's problem*, garantendo la copertura integrale del catalogo Parapendio (473 quiz) senza ripetizioni premature:
1. **Quote e Pesi Ufficiali Volo Libero AeCI (30 quiz = 100 punti)**:
   - `01` Normativa: **4 domande** (`3 pt` ciascuna = `12 pt`)
   - `02` Aerodinamica: **8 domande** (`3 pt` ciascuna = `24 pt`)
   - `03` Pronto Soccorso: **1 domanda** (`2 pt` = `2 pt`)
   - `04` Fisiopatologia: **1 domanda** (`2 pt` = `2 pt`)
   - `05` Meteorologia: **6 domande** (`4 pt` ciascuna = `24 pt`)
   - `06` Strumenti: **1 domanda** (`2 pt` = `2 pt`)
   - `07` Tecnica Pilotaggio: **5 domande** (`4 pt` ciascuna = `20 pt`)
   - `08` Materiali: **1 domanda** (`2 pt` = `2 pt`)
   - `09` Sicurezza del Volo: **3 domande** (`4 pt` ciascuna = `12 pt`)
   *(Maratona 60 quiz: quote raddoppiate = 200 punti grezzi normalizzati a `/100` pt)*
2. **Priorità di Prelievo**:
   - `Bucket 0`: domande mai risposte (`timesSeen === 0`).
   - `Bucket 1`: domande con il minimo `timesSeen` (in `generateFlashTutorQuestions`, a parità di errori attivi, spareggio secondario per peso materia `4 > 3 > 2`).
   - Fase 100% visto: ponderazione per tasso d'errore `(timesWrong + 1) / (timesSeen + 1)`.

## 2. Valutazione Pesata e Retrocompatibilità (`src/services/examEvaluator.ts`, `src/types/database.ts`)
- **Schede Pesate (`/100` pt)**: Esame Ufficiale (`30` quiz), Tutor Standard (`30` quiz) e Maratona (`60` quiz -> `Math.round((rawPoints / 200) * 100)`).
- **Esito a 3 Fasce (`ExamOutcome`)**:
  - `scorePoints >= 86` -> `'passed'` (`isPassed: true`, **IDONEO**)
  - `80 <= scorePoints <= 85` -> `'oral_check'` (`isPassed: true`, **IDONEO CON VERIFICA ORALE**)
  - `scorePoints < 80` -> `'failed'` (`isPassed: false`, **NON IDONEO**)
- **Retrocompatibilità Storico**: le sessioni salvate in Dexie o su Google Drive prima della `v1.12.0` (prive di `scorePoints` / `examOutcome`) vengono lette tramite `resolveSessionOutcome(session)` mantenendo la visualizzazione originale `XX/30 (Y err)` senza ricalcoli distruttivi.

## 3. Indice di Preparazione (`src/utils/analytics.ts`)
- `35%` Copertura catalogo (non pesata: `totalSeen / totalCatalogQuestions`).
- `35%` Accuratezza sui quiz visti pesata per punti materia (`4 / 3 / 2` pt sugli ID ufficiali `1001..9045`, fallback `1` su ID sintetici `< 1000`).
- `30%` Ultime 3 simulazioni (`'passed'` = `1.0`, `'oral_check'` = `0.5`, `'failed'` = `0.0`).

## 4. Google Identity Services, Drive Sync & Offline PWA
- Autenticazione OAuth 2.0 GIS (`vds_google_oauth_token_v1`) con backup JSON in `appDataFolder` e Smart Merge deterministico.
- Workbox Service Worker `CacheFirst` per asset statici e `CacheStorage` dedicato per i segmenti audio neurali.
