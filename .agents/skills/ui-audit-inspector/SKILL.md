---
name: ui-audit-inspector
description: >
  Audit automatizzato e interattivo di interfaccia grafica, viewport multi-dispositivo (mobile portrait 390x844,
  tablet portrait 768x1024, tablet landscape 1024x768, desktop 1440x900), contrasto cromatico WCAG 2.1 AA,
  anti-cluttering e microcopy essenziale (zero cosplay aeronautico, vocabolario univoco a 1 parola).
  Genera report HTML completi e autosufficienti con timestamp (audit_report_YYYY-MM-DD_HH-mm-ss.html),
  screenshot di evidenza integrati e ID univoci (es. [CONTRAST-01], [COPY-02]) per feedback e risoluzioni mirate.
  Attiva questa skill quando: esegui audit UI, verifichi il contrasto chiaro/scuro, controlli layout e safe-area
  su mobile/tablet/desktop, bonifichi il testo da gergo di vendita o cosplay, oppure quando l'utente dice
  'audit ui', 'fai l'audit', 'verifica responsive', 'controlla contrasti' o 'genera report ui'.
version: 1.0.0
language: it-IT
---

# UI Audit Inspector (Viewport, WCAG Contrast, Anti-Clutter & Microcopy)

Questa skill governa il protocollo rigoroso di ispezione automatizzata della UI/UX per la PWA VDS-VL, combinando verifiche biometrico-geometriche nel browser (via Chrome DevTools Protocol) e analisi redazionale anti-marketing.

---

## 1. 🎯 Matrice di Collaudo Viewport

Ogni audit esamina deterministicamente l'applicazione sui seguenti target:

| ID Viewport | Risoluzione | Orientamento | Profilo e Vincoli Ergonomici |
| :--- | :--- | :--- | :--- |
| `mobile-portrait` | **390 x 844 px** (2x) | **Solo Portrait** | Uso a una mano; le 6 macro-azioni della Home devono respirare senza sparire sotto la piega; touch target $\ge 44\text{px}$; safe-area-inset rispettate. |
| `tablet-portrait` | **768 x 1024 px** (2x) | Portrait | Griglia a 2 colonne bilanciata; modali e drawer centrati con `max-w-md`. |
| `tablet-landscape`| **1024 x 768 px** (2x) | Landscape | Griglia a 3 colonne; navigazione orizzontale priva di scroll orizzontale. |
| `desktop`          | **1440 x 900 px** (1x) | Landscape | Vista da postazione studio; ergonomia tastiera (1, 2, 3, F, Spazio, Invio). |

Entrambi i temi cromatici (**Dark Mode** e **Light Mode**) vengono scansionati integralmente ad ogni ciclo.

---

## 2. 🛡️ Le 4 Dimensioni di Controllo

### A. Geometria & Anti-Overflow (`[OVERFLOW-XX]`)
- **Zero Scroll Orizzontale**: `document.documentElement.scrollWidth === window.innerWidth` su ogni schermata.
- **Contenimento Totale**: Per ogni elemento renderizzato, `rect.right <= innerWidth` e `rect.left >= 0` (a meno di clipping intenzionale con `overflow-x-hidden`).
- **Modal & Dialog**:
  - Mai eccedere l'altezza del viewport (`max-h-[85vh]` o `max-h-[90vh]`).
  - Scroll interno dedicato se il testo è lungo.
  - Tasti azione (*"Conferma"*, *"Annulla"*, *"Pausa"*) sempre visibili e mai spinti fuori schermo.

### B. Contrasto Cromatico WCAG 2.1 AA (`[CONTRAST-XX]`)
Formula matematica basata sulla luminanza relativa $L = 0.2126 R + 0.7152 G + 0.0722 B$:
- **Testo normale (< 18pt / 24px non bold)**: Rapporto $\ge 4.5:1$ contro lo sfondo effettivo.
- **Testo grande ($\ge 18\text{pt}$ o $\ge 14\text{pt}$ bold)**: Rapporto $\ge 3.0:1$.
- **Focus speciale Light Mode**: Verificare che badge e accenti ambra/arancione (es. `#f59e0b`, `#d97706`) su sfondo bianco usino varianti scurite (`text-amber-800` o `text-amber-900`) per non risultare invisibili sotto la luce solare diretta.

### C. Anti-Cluttering & Ergonomia Visiva (`[CLUTTER-XX]`)
- **No Icon Clutter**: Evitare di moltiplicare la stessa icona più volte nel medesimo componente (es. divieto di 5 icone altoparlante su ogni riga di domanda e opzione contemporaneamente).
- **Densità Verticale Mobile**: Massimo 1 riga di filtri orizzontali per volta (vietato accatastare 3 righe di pill-filter sopra i contenuti).
- **Home Fold**: La schermata iniziale su mobile 390x844 deve mostrare i percorsi di studio principali senza richiedere un lungo scroll esplorativo.

### D. Microcopy Essenziale & Vocabolario Univoco (`[COPY-XX]`)
- **Regola Anti-Cosplay**: Bandito il gergo da finto pilota o "flavor text" gratuito (*"cruscotto"*, *"cockpit"*, *"plancia"*, *"in volo verso..."*, *"officina"*). Home è **Home**, statistiche sono **Statistiche**, esame è **Esame**.
- **No Marketing / No Paternalismo**: Eliminare slogan autocelebrativi (*"fantastico"*, *"il miglior modo"*) o lodi superflue (*"Ottimo lavoro!"*, *"Mettiti alla prova"*).
- **Vocabolario Univoco (1 Concetto = 1 Sola Parola)**:
  - Inizio azione: **`Inizia`** (banditi *"Avvia"*, *"Comincia"*, *"Parti"*).
  - Fine/Abbandono: **`Termina`** o **`Elimina prova`** (se c'è perdita di dati).
  - Sospensione: **`Pausa`** (non *"Metti in pausa (riprendi più tardi)"*).
  - Conferma: **`Conferma`**.
  - Rifiuto/Chiusura: **`Annulla`** o **`Chiudi`**.
  - Non uscita: **`Continua`** (non *"Rimani nel quiz"*).
  - Nuovo tentativo: **`Riprova`**.

---

## 3. 🚀 Comandi Operativi e Generazione Report

### Esecuzione dell'Audit
Per eseguire la suite completa e generare il report HTML con timestamp:
```powershell
npm run audit:ui
```
oppure:
```powershell
node .agents/skills/ui-audit-inspector/scripts/run_audit.cjs
```

### Struttura del Report HTML Generato
Il file viene salvato automaticamente in:
`audit_reports/audit_report_YYYY-MM-DD_HH-mm-ss.html`

Caratteristiche del report HTML:
1. **Identificativo Immediato**: Ogni riscontro ha un badge/codice univoco (es. `[CONTRAST-01]`, `[COPY-04]`) cliccabile o copiabile con un clic per facilitare le comunicazioni e le correzioni mirate.
2. **Screenshot Contestuali**: Visualizzazione affiancata o integrata dello screenshot catturato a evidenza del problema.
3. **Tabella Before ➔ After**: Proposta testuale precisa con calcolo della riduzione caratteri e motivazione tecnica.
4. **Filtro Rapido**: Tasti in cima al report per visualizzare solo *Contrasti*, *Microcopy*, *Cluttering* o *Overflow*.
