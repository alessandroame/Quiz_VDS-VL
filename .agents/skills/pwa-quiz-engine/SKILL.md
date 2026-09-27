---
name: pwa-quiz-engine
description: Architettura dell'engine per la PWA VDS-VL, inclusi Fair Coverage Randomizer, persistenza Dexie (IndexedDB), sync Google Drive e gestione offline.
version: 1.0.0
language: it-IT
---

# Profilo Operativo: PWA Quiz Engine

Questa skill governa la logica applicativa del simulatore d'esame e della gestione dello studio per la PWA VDS-VL.

## 1. Algoritmo Fair Coverage Randomizer
Risolve il "coupon collector's problem", garantendo la copertura del 100% dei 504 quiz entro ~17 simulazioni:
1. **Quote Materie**:
   - 01 Normativa: 2 domande
   - 02 Aerodinamica: 9 domande
   - 03 Pronto Soccorso: 1 domanda
   - 04 Fisiopatologia: 1 domanda
   - 05 Meteorologia: 8 domande
   - 06 Strumenti: 1 domanda
   - 07 Tecnica Pilotaggio: 5 domande
   - 08 Materiali: 1 domanda
   - 09 Sicurezza: 2 domande
   *(Totale: 30 domande)*
2. **Priorità di Prelievo per Materia**:
   - `Bucket 0`: Domande mai risposte (`times_seen == 0`).
   - `Bucket 1`: Domande con il minimo valore di `times_seen`.
   - Se `Bucket 0` non ha abbastanza elementi per coprire la quota, attingere da `Bucket 1`.
   - Ordinamento casuale (Fisher-Yates) all'interno di ciascun bucket prima del prelievo.
3. **Fase di Perfezionamento (100% visto)**:
   - Ponderazione inversamente proporzionale all'accuratezza (`(error_count + 1) / (times_seen + 1)`).

## 2. Modello Dati Dexie (IndexedDB)
```typescript
interface QuestionStat {
  questionId: number;
  timesSeen: number;
  timesCorrect: number;
  timesWrong: number;
  lastAnsweredAt?: number;
  lastResult?: 'correct' | 'wrong';
  consecutiveCorrect: number; // Per uscita da Quaderno Errori (target: 2)
  isBookmarked: boolean;
  userNote?: string;
}

interface ExamSession {
  id?: number;
  date: number;
  durationSeconds: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  isPassed: boolean; // true se wrongAnswers <= 3
  subjectBreakdown: Record<number, { total: number; correct: number }>;
  questionSnapshots: {
    questionId: number;
    userAnswer: number;
    isCorrect: boolean;
    wasFlagged: boolean;
  }[];
}

interface AppSettings {
  key: string;
  value: any;
}
```

## 3. Google Identity Services & Drive Sync
- Autenticazione OAuth 2.0 tramite GIS (`google.accounts.oauth2.initTokenClient`).
- Backup esportato come JSON compresso nella cartella `appDataFolder` o file `vds_quiz_backup.json`.
- Ripristino con unione intelligente o sovrascrittura su richiesta dell'utente.

## 4. Requisiti PWA & Offline
- Workbox Service Worker con strategia `CacheFirst` per i file statici e `questions.json`.
- Event listener per intercettare l'evento `beforeinstallprompt` e mostrare il pulsante "Installa App".
- Piena reattività e navigabilità offline senza rete internet.
