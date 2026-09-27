---
name: headless-pwa-tester
description: >
  Collaudo visuale e interattivo headless a zero dipendenze per la PWA Quiz VDS-VL tramite Chrome DevTools Protocol (CDP).
  Genera screenshot pixel-perfect (mobile portrait 390x844, mobile landscape 844x390, desktop 1440x900) e asserisce
  l'assenza assoluta di errori in console JavaScript.
  Attiva questa skill quando: verifichi modifiche alla UI/UX, scatti screenshot di collaudo, testi la reattività dei layout,
  oppure quando l'utente dice 'controlla nel browser', 'test visivo', 'headless', 'screenshot', 'collauda' o 'verifica UI'.
version: 1.0.0
language: it-IT
---

# Headless PWA Tester (Zero-Dependency CDP Visual & Console Check)

Questa skill governa il collaudo autonomo della PWA VDS-VL prima della presentazione all'utente, sfruttando l'engine Chrome/Edge nativo del sistema senza dipendenze pesanti.

---

## 1. 🛡️ Principio Inviolabile: Zero User Delegation
L'agente agisce come primo collaudatore dell'applicazione.  
**È severamente vietato chiedere all'utente di verificare o guardare l'interfaccia nel browser se l'agente non ha prima:**
1. Eseguito il test headless via CDP.
2. Ispezionato lo screenshot generato tramite il tool nativo `view_file`.
3. Verificato l'assenza totale di errori o eccezioni runtime nei log di console.

---

## 2. Risoluzioni e Viewport Standard

| Target Viewport | Risoluzione | Device Profile | Scopo di Verifica |
| :--- | :--- | :--- | :--- |
| `mobile-portrait` | **390 x 844** (2x) | Smartphone Verticale | Layout da cockpit / campo di volo, touch target ≥ 48px, zero scroll orizzontale |
| `mobile-landscape`| **844 x 390** (2x) | Smartphone Orizzontale | Ottimizzazione barra quiz e griglia 30 bolle |
| `desktop`          | **1440 x 900** (1x) | Monitor Desktop | Ergonomia tastiera (1, 2, 3, F, Spazio), pannello laterale note/statistiche |
| `all`              | Multi-suite | Tutti i profili | Esecuzione sequenziale prima di un rilascio o commit |

---

## 3. Comandi Operativi

Assicurarsi che il server Vite locale sia attivo (`http://localhost:5173`), quindi eseguire:

### A. Controllo Rapido Smartphone (Portrait)
```powershell
node .agents/skills/headless-pwa-tester/scripts/visual_check.js mobile-portrait
```

### B. Controllo Desktop
```powershell
node .agents/skills/headless-pwa-tester/scripts/visual_check.js desktop
```

### C. Suite Completa Multi-Viewport
```powershell
node .agents/skills/headless-pwa-tester/scripts/visual_check.js all
```

### D. Interazione Click su Elementi UI
È possibile passare un selettore CSS come 3° parametro per simulare un'interazione prima dello scatto (es. bandierina flag o selezione risposta):
```powershell
node .agents/skills/headless-pwa-tester/scripts/visual_check.js mobile-portrait http://localhost:5173 "#btn-flag"
```

---

## 4. Regola di Ispezione
Dopo ogni esecuzione:
1. Aprire l'immagine generata in `$env:TEMP\quiz_vds_<viewport>_preview.png` con `view_file` per verificare visivamente il layout, i contrasti e l'assenza di sovrapposizioni.
2. Verificare che l'output da terminale riporti `0 errori`.
