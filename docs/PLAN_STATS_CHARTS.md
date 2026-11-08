# Piano Esecutivo (TODO-12): Grafici Prontezza Esame, Trend `/100 pt` e Analisi Errori Leitner in `StatsScreen`

> **Stato**: 🔴 **PRIORITARIO (In Coda #1 per la prossima lavorazione)**  
> **Obiettivo**: Trasformare la schermata [StatsScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/StatsScreen.tsx) da semplice elenco di contatori statici a cruscotto diagnostico immediato su **Prontezza Esame** ed **Errori**, con `0` dipendenze esterne (solo SVG nativo + Tailwind CSS), conformità al Regolamento Ufficiale AeCI Volo Libero (`100 pt` pesati, soglie `86 pt` Idoneo e `80 pt` Verifica Orale) e pieno rispetto del design system **Minimal Dark (`zinc-950` Zero-Blue) / High-Contrast Light (`slate-50`)** su viewport mobile `390x844`.

---

## 1. Architettura Dati & Funzioni Pure (`src/utils/analytics.ts`)

Estendere [src/utils/analytics.ts](file:///c:/github/Quiz_VDS-VL/src/utils/analytics.ts) preservando al 100% la retrocompatibilità delle firme esistenti (`calculateReadinessScore`, `calculateMistakesCount`, `calculateSubjectAnalytics`).

### 1.1 Scomposizione Prontezza a 3 Pilastri (`calculateReadinessBreakdown`)
Esplicitare i 3 addendi che compongono l'indice `0..100%` (`35%` Copertura Catalogo + `35%` Accuratezza Pesata `4/3/2 pt` + `30%` Esito ultime 3 Simulazioni valide) e individuare la leva prioritaria con il maggior margine di guadagno:

```ts
export type ReadinessLever = 'coverage' | 'accuracy' | 'exam';

export interface ReadinessBreakdown {
  totalScore: number;               // 0..100 (intero arrotondato)
  coverageContribution: number;     // 0..35 (1 decimale, es. 21.5)
  accuracyContribution: number;     // 0..35 (1 decimale, es. 28.0)
  examFactorContribution: number;   // 0..30 (1 decimale, es. 15.0)
  maxCoverageContribution: 35;
  maxAccuracyContribution: 35;
  maxExamFactorContribution: 30;
  validSimulationsCount: number;    // 0..3
  topLever: ReadinessLever;         // Pilastro con maggior margine recuperabile
  potentialGainPoints: number;      // Margine massimo recuperabile sulla topLever (0..35)
  recommendationIt: string;         // Microcopy deterministico <= 8 parole
}
```

- **Regola di selezione `topLever` (Lodo Arbitrale Alpha/Beta)**:
  - Se `totalSeen === 0` $\rightarrow$ `topLever = 'coverage'` (`"Inizia dai quiz mai visti (+35% max)"`).
  - Altrimenti si confrontano i margini mancanti `gapCoverage = 35 - coverageContribution`, `gapAccuracy = 35 - accuracyContribution`, `gapExam = 30 - examFactorContribution` (in caso di parità: `'exam' > 'accuracy' > 'coverage'`).

### 1.2 Serie Storica Normalizzata `/100 pt` (`calculateExamTrend`)
Estrarre le ultime `limit = 10` sessioni con almeno 1 risposta (`hasSessionAnswers`) ordinate cronologicamente dalla meno recente (`#1`) alla più recente (`#N`):

```ts
export interface ExamTrendPoint {
  sessionId?: number;
  index: number;                    // 1..N (ordine cronologico crescente da sinistra a destra)
  date: number;                     // timestamp ms
  scoreOn100: number;               // 0..100 (1 decimale, normalizzato su 100 pt AeCI)
  outcome: ExamOutcome;             // 'passed' (>=86) | 'oral_check' (80..85.9) | 'failed' (<80)
  examMode: ExamModeType;           // 'official' | 'tutor' | 'marathon'
  isWeighted: boolean;              // true se scheda pesata 100/200 pt, false se fallback %
  totalQuestions: number;
  wrongAnswers: number;
}
```

- **Catena di normalizzazione**:
  1. `typeof s.scorePoints === 'number'` $\rightarrow$ `Math.round(s.scorePoints * 10) / 10` (copre Esame 30, Tutor Standard 30 e Maratona 60 già normalizzata `/200 -> /100` in `examEvaluator.ts#L166`).
  2. `typeof s.rawPoints === 'number' && s.rawMaxPoints > 0` $\rightarrow$ `Math.round((s.rawPoints / s.rawMaxPoints) * 1000) / 10`.
  3. Fallback sessioni storiche legacy $\rightarrow$ `Math.round((s.correctAnswers / s.totalQuestions) * 1000) / 10`.

### 1.3 Funnel Errori Leitner (`calculateMistakeLeitnerBuckets`) & Punti Esame a Rischio per Materia
1. **Stadi di recupero Leitner (`2` risposte corrette consecutive per uscire dal Quaderno Errori)**:
   ```ts
   export interface MistakeLeitnerBuckets {
     criticalCount: number;            // timesWrong > 0 && consecutiveCorrect === 0 (Stadio 0/2)
     recoveringCount: number;          // timesWrong > 0 && consecutiveCorrect === 1 (Stadio 1/2: a 1 risposta dallo sblocco)
     masteredAfterErrorCount: number;  // timesWrong > 0 && consecutiveCorrect >= 2 (Stadio 2/2: bonificati)
     activeMistakesTotal: number;      // criticalCount + recoveringCount (=== calculateMistakesCount)
     totalEverWrong: number;           // criticalCount + recoveringCount + masteredAfterErrorCount
   }
   ```
2. **Estensione `SubjectAnalytics` con Punti Esame a Rischio (su 100 pt ufficiali AeCI)**:
   - Ogni materia `id` (`1..9`) ha quota ufficiale `examQuota = OFFICIAL_EXAM_QUOTAS[id]` e peso `pointWeight = getSubjectPointWeight(id)` (`4`, `3` o `2` pt), con valore massimo all'esame `maxExamPoints = examQuota * pointWeight` (es. Aerodinamica `8×3 = 24 pt`, Meteorologia `6×4 = 24 pt`, Tecnica di Pilotaggio `5×4 = 20 pt`, Normativa `4×3 = 12 pt`, Sicurezza `3×4 = 12 pt`, altre 4 materie `1×2 = 2 pt`, totale `100 pt`).
   - `examPointsAtRisk`: quando `seen > 0`, `Math.round(maxExamPoints * (1 - correct / seen) * 10) / 10`; oltre a `activeMistakesCount` (conteggio domande della materia attualmente nel Quaderno Errori).

---

## 2. Architettura UI/UX & Componenti Grafici (`src/components/StatsScreen.tsx`)

### 2.1 Grafico 1 — Barra Scomposizione Prontezza a 3 Pilastri (`#readiness-pillars-breakdown`)
- **Posizione**: Dentro la card principale *"Preparazione Esame"* (`StatsScreen.tsx#L73-L131`), al posto della barra monolitica singola (`#L90-L101`).
- **Struttura**:
  - Griglia proporzionale a 3 segmenti `grid grid-cols-[35fr_35fr_30fr] gap-1 h-2.5 w-full` (`role="img"`, `aria-label` completo), dove ogni segmento si riempie da `0%` a `100%` rispetto al proprio massimale (`35`, `35`, `30`).
  - Sotto i 3 segmenti, micro-legenda allineata `Copertura {cov}/35%` · `Precisione {acc}/35%` · `Esami (3) {sim}/30%`.
  - **Callout Leva Prioritaria (`#readiness-priority-lever`)**: pillola compatta che indica su quale pilastro intervenire subito e quanti punti di prontezza sblocca (`+{potentialGainPoints}% max`).

### 2.2 Grafico 2 — Sparkline SVG Trend Punteggi (`/100 pt`) con Bande Soglia AeCI (`#exam-trend-chart`)
- **Posizione**: In testa alla card *"Storico Simulazioni d'Esame"* (`StatsScreen.tsx#L202-L272`), visibile non appena `answeredSessions.length >= 1`.
- **Geometria SVG (`viewBox="0 0 340 130"`, `h-[130px]`)**:
  - Dominio Y adattivo `yMin = Math.min(50, minScore - 5)` .. `yMax = 100` per massimizzare la leggibilità su smartphone nella fascia `60..100 pt`.
  - **Banda target verde smeraldo (`86..100 pt`)**: rettangolo semitrasparente `fill-emerald-500/10 light:fill-emerald-500/15` + linea tratteggiata `86 pt` (`IDONEO`).
  - **Soglia ambra (`80 pt`)**: linea tratteggiata `80 pt` (`VERIFICA ORALE`).
  - **Spezzata e Nodi**: `<polyline>` ambra che unisce fino agli ultimi 10 esami in ordine cronologico (da sinistra a destra), con `<circle>` colorati per esito (`emerald` $\ge 86$, `amber` $80..85$, `rose` $< 80$) ed etichette numeriche sul primo, minimo, massimo e ultimo punto.

### 2.3 Grafico 3 — Funnel Recupero Errori Leitner (`#leitner-recovery-card`) & Punti a Rischio per Materia
- **Card Funnel Leitner (`0/2 · 1/2 · 2/2`)**:
  - Posizionata sopra *"Risposte Esatte per Materia"*, mostra la barra tripartita dello stato di guarigione dei quesiti sbagliati:
    1. `Critici (0/2)` in `rose-500` (appena sbagliati o mai risposti correttamente dopo l'errore).
    2. `In uscita (1/2)` in `amber-500` (basta 1 sola risposta esatta per rimuoverli dal Quaderno Errori).
    3. `Recuperati (2/2)` in `emerald-500` (errori passati ormai consolidati con $\ge 2$ risposte corrette consecutive).
- **Badge "Punti a Rischio" nelle Materie + Drill-Down 1-Touch su `SubjectDetailModal.tsx`**:
  - Ogni riga materia espone il badge `-{examPointsAtRisk} pt a rischio` (quando `examPointsAtRisk >= 0.5`) e una barra a doppio segmento (verde/ambra per risposte corrette + coda rossa per quota errori attivi).
  - Estendere `SubjectDetailModalProps` (`[src/components/SubjectDetailModal.tsx](file:///c:/github/Quiz_VDS-VL/src/components/SubjectDetailModal.tsx#L17-L23)`) con `initialFilterMode?: SubjectFilterMode` così che toccando il badge errori di una materia il modale si apra già filtrato su `Solo Errori` (`'wrong'`).

---

## 3. Matrice di Verifica & Oracoli di Test (`Vitest` + `UI Audit`)

1. **`src/utils/analytics.test.ts`**:
   - BVA su `calculateReadinessBreakdown` (`0%` catalogo vuoto, saturazione `35 + 35 + 30 = 100%`, priorità `topLever`).
   - BVA su `calculateExamTrend` (esclusione sessioni a 0 risposte, normalizzazione Maratona `172/200 -> 86.0 pt`, soglie `86.0` / `85.5` / `80.0` / `79.5`, ordinamento cronologico crescente).
   - BVA su `calculateMistakeLeitnerBuckets` (`consecutiveCorrect` in `{0, 1, 2, 3}`) e `examPointsAtRisk` (`24 pt` Meteo/Aerodinamica vs `2 pt` Primo Soccorso).
2. **`src/components/StatsScreen.test.ts`**:
   - Verifica rendering e attributi di accessibilità (`role="img"`, `aria-label`) di `#readiness-pillars-breakdown`, `#exam-trend-chart` e `#leitner-recovery-card`.
   - Verifica apertura di `SubjectDetailModal` con filtro pre-impostato sugli errori.
3. **Gate Finale**: `npm run test:unit` + `node ~/.gemini/config/plugins/engineering-workflow/scripts/diff-triage.mjs`.
