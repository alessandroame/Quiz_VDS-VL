---
name: aviation-ui-ux
description: Design system avionico, linee guida microcopy minimale (cockpit style), temi chiaro/scuro/auto e usabilità mobile/desktop per la PWA VDS-VL.
version: 1.0.0
language: it-IT
---

# Profilo Operativo: Aviation UI/UX

Questa skill guida la progettazione visuale e l'ergonomia d'uso dell'applicazione, ispirata agli strumenti di bordo avionici.

## 1. Regole Ferree di Microcopy (Zero Parole Inutili)
- Nessuna frase introduttiva, nessun preambolo.
- Titoli e label di 1 o 2 parole:
  - **Esame** (anziché "Inizia una nuova simulazione d'esame")
  - **Materie** (anziché "Esercitati selezionando gli argomenti")
  - **Errori** (anziché "Quaderno degli errori e ripasso")
  - **Archivio** (anziché "Consulta l'elenco completo dei quiz")
  - **Stats** (anziché "Statistiche e telemetria di apprendimento")
  - **⚑ Rivedi** (anziché "Contrassegna come da rivedere")
  - **Esatta** / **Errata**
  - **IDONEO** / **NON IDONEO**
  - **Prontezza: 85%**

## 2. Palette Tematica (Cockpit Theme System)
Tre stati: `dark` | `light` | `system`:
- **Cockpit Dark** (Default):
  - Background: `bg-slate-950` / `bg-zinc-900`
  - Superfici/Card: `bg-slate-900` / `border-slate-800`
  - Accenti di stato:
    - Corretto/Idoneo: Smeraldo chiaro (`emerald-400`, `emerald-500/20`)
    - Errore/Non idoneo: Rosso avviso (`rose-500`, `rose-500/20`)
    - Flag revisione: Ambra aviazione (`amber-400`, `amber-500/20`)
    - Primario: Blu orizzonte artificiale (`sky-500`, `sky-600`)
- **Hangar Light** (Sole battente):
  - Background: `bg-slate-50`
  - Superfici/Card: `bg-white` / `border-slate-300`
  - Contrasto elevato WCAG AAA per visibilità all'aperto.
- **Sistema**: Risposta reattiva a `prefers-color-scheme`.

## 3. Ergonomia Mobile & Desktop
- Pulsanti touch ampi (minimo 48px altezza) con target per il pollice.
- Scorciatoie da tastiera (Desktop):
  - Tasti `1`, `2`, `3`: selezione opzioni
  - Tasto `F`: toggle bandierina ⚑ Rivedi
  - Frecce `←` / `→` o `Spazio`: Domanda precedente / successiva
  - `Invio`: Consegna esame (con conferma rapida)
- Griglia 30 bolle sempre accessibile a scomparsa o fissa in alto.
