---
name: self-correction-loop
description: >
  Sistema di cattura e memorizzazione permanente delle correzioni in MEMORY.md. Evita il ripetersi di errori tra sessioni diverse,
  riducendo l'attrito e il consumo di token.
  Attiva questa skill quando: l'utente corregge un comportamento o un dato, dice 'ricordati questo', 'non farlo più',
  'memorizza', 'aggiorna memoria', 'regola di progetto', o all'inizio di una sessione per consultare le regole esistenti.
version: 1.1.0
language: it-IT
---

# Self-Correction Loop & Memory Retention

Questa skill consente all'agente di capitalizzare ogni correzione fornita dall'utente, errore concettuale sui quiz o aggiustamento architetturale, trasformandola in una regola permanente in `MEMORY.md`.

---

## 1. Principi Fondamentali

1. **Ogni correzione è un investimento di token**:  
   Spendere 10 secondi per catturare una regola permanente evita di sprecare migliaia di token e ripetere la stessa discussione nelle chat future.
2. **Generalizzare prima di memorizzare**:  
   Non memorizzare correzioni iper-specifiche ("riga 24 errata"), ma estrarre il principio architetturale o normativo sottostante (es. "Le risposte ai quiz su precedenze in termica non ammettono eccezioni basate su quota").
3. **Consultazione preventiva a inizio task**:  
   Prima di implementare modifiche strutturali o nuove feature, consultare `MEMORY.md` per non violare decisioni già consolidate.

---

## 2. Flusso di Cattura (Step-by-Step)

```
1. DETECT      -> L'utente corregge un comportamento, un dato dei quiz o un approccio UI/UX.
2. ACKNOWLEDGE -> Riconoscere l'errore in modo sintetico e diretto (senza scuse prolisse o compiacimento).
3. GENERALIZE  -> Astrarre la causa radice in una regola di progetto riutilizzabile.
4. STORE       -> Aggiornare MEMORY.md nella sezione pertinente.
5. CONFIRM     -> Notificare all'utente l'avvenuta memorizzazione della regola.
```

---

## 3. Categorie in `MEMORY.md`

- **Regolamento & Quiz VDS-VL**: Dati normativi AeCI, formulazione domande, gestione eccezioni.
- **Architettura PWA & Motore Quiz**: Algoritmo fair coverage, gestione Dexie/IndexedDB, Workbox offline.
- **UI/UX Avionico & Ergonomia**: Temi, contrasti, scorciatoie da tastiera, microcopy cockpit.
- **Tooling & Build**: TypeScript, Vite, Vitest, Git.
