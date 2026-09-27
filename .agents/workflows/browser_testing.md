---
description: Protocollo di collaudo visivo e verifica console browser per la PWA Quiz VDS-VL
---

# Workflow: Browser Testing & PWA Verification

Questo workflow guida l'agente nella verifica empirica e autonoma dell'interfaccia utente prima di sottoporre il lavoro all'utente.

---

## 1. Obiettivi di Verifica
1. **Zero Errori Console**: Nessun errore o warning non gestito nei DevTools del browser.
2. **Adattabilità Viewport**:
   - **Mobile Portrait** (390 x 844 px): Verifica prioritaria per utilizzo da cockpit/campo di volo. Pulsanti comodi per il pollice (h ≥ 48px), nessun overflow orizzontale.
   - **Desktop** (1440 x 900 px): Disposizione bilanciata, tastiera attiva (1, 2, 3, F, Spazio).
3. **Cockpit Theme Check**:
   - Tema Scuro (Cockpit Dark): contrasti nitidi, sfondo ardesia profondo, zero abbagliamento.
   - Tema Chiaro (Hangar Light): contrasto elevato leggibile sotto il sole.

---

## 2. Sequenza Operativa
1. **Avvio Server Locale** (se non attivo):
   - `npm run dev` oppure server statico dedicato con `IsDaemon: true`.
2. **Navigazione & Verifica Console**:
   - Accedere alla pagina ed eseguire le interazioni chiave (selezione risposta, toggle flag, passaggio domanda successiva).
   - Accertarsi dell'assenza di eccezioni JavaScript non intercettate.
3. **Ispezione Visiva**:
   - Se vengono generati screenshot di test, ispezionarli accuratamente con `view_file` prima di considerarli validi.
