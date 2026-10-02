---
name: minimal-ui-ux
description: >
  Design system minimale per lo studio, linee guida microcopy essenziale, ergonomia zero-distrazioni,
  temi chiaro/scuro/auto ad alto contrasto e usabilità mobile/desktop per la PWA VDS-VL.
  Attiva questa skill quando: crei o modifichi componenti UI, pulsanti, palette colori, layout responsive,
  microcopy essenziale, o scorciatoie da tastiera (1, 2, 3, F, Spazio).
version: 1.2.0
language: it-IT
---

# Profilo Operativo: Minimal UI/UX (Study Focus)

Questa skill guida la progettazione visuale e l'ergonomia d'uso dell'applicazione, orientata all'**apprendimento rapido e senza distrazioni**.
L'utente è un allievo pilota che sta **studiando la teoria** per superare l'esame ufficiale VDS-VL AeCI: l'interfaccia deve favorire massima concentrazione, leggibilità immediata e zero attrito cognitivo (nessuna metafora di pilotaggio in volo o cockpit).

## 1. Regole Ferree di Microcopy (Zero Parole Inutili)
- Nessuna frase introduttiva prolissa, nessun preambolo decorativo.
- Titoli e label di 1 o 2 parole:
  - **Tutor** (anziché "Tutor Didattico" o "Simulazione Didattica" — divieto di pleonasmi)
  - **Esame** (anziché "Inizia una nuova simulazione d'esame")
  - **Materie** (anziché "Esercitati selezionando gli argomenti")
  - **Errori** (anziché "Quaderno degli errori e ripasso")
  - **Archivio** (anziché "Consulta l'elenco completo dei quiz")
  - **Stats** (anziché "Statistiche e telemetria di apprendimento")
  - **⚑ Rivedi** (anziché "Contrassegna come da rivedere")
  - **Esatta** / **Errata**
  - **IDONEO** / **NON IDONEO**
  - **Prontezza: 85%**
- **Divieto di Chimere Terminologiche**: Non accoppiare nomi di modalità differenti (*"a mani libere"*) a impostazioni o comandi situati in viste diverse.

## 2. Palette Tematica (High-Contrast Clean Theme)
Tre stati: `dark` | `light` | `system`:
- **Dark Mode** (Studio serale e riposo visivo):
  - Background: `bg-zinc-950` / `bg-slate-950`
  - Superfici/Card: `bg-zinc-900` / `border-zinc-800`
  - Accenti funzionali:
    - Corretto/Idoneo: Smeraldo chiaro (`emerald-400`, `emerald-500/20`)
    - Errore/Non idoneo: Rosso avviso (`rose-500`, `rose-500/20`)
    - Flag revisione: Ambra segnalazione (`amber-400`, `amber-500/20`)
    - Selezione/Focus: Blu nitido (`sky-500`, `sky-600`)
- **Light Mode** (Alta luminosità / all'aperto):
  - Background: `bg-slate-50`
  - Superfici/Card: `bg-white` / `border-slate-300`
  - Contrasto elevato WCAG AAA per massima leggibilità sotto la luce diretta.
- **Sistema**: Risposta automatica a `prefers-color-scheme`.

## 3. Ergonomia Mobile & Desktop
- Pulsanti touch ampi (minimo 48px altezza) con target comodo per il pollice.
- Scorciatoie da tastiera (Desktop):
  - Tasti `1`, `2`, `3`: selezione opzioni
  - Tasto `F`: toggle bandierina ⚑ Rivedi
  - Frecce `←` / `→` o `Spazio`: Domanda precedente / successiva
  - `Invio`: Consegna esame (con conferma rapida)
- Griglia 30 bolle sempre accessibile per salto diretto tra le domande.
