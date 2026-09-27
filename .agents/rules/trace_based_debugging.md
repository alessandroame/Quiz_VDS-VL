# Protocollo di Debugging a Tracce (Trace-Based Fault Localization)

## 1. Obiettivo e Scopo
Questo protocollo governa il metodo di risoluzione anomalie per la PWA VDS-VL.  
**Principio cardine**: Invece di modificare file a tentativi o formulare ipotesi a vuoto (bruciando token), l'agente deve applicare un tracciamento deterministico a "briciole di pane" per isolare il punto esatto di rottura.

---

## 2. Trigger di Attivazione
Attivare immediatamente questo protocollo quando:
1. Una transizione di stato, timer esame o salvataggio Dexie non si comporta come atteso.
2. Un test Vitest fallisce e il motivo non è immediatamente palese dallo stack trace.
3. L'utente segnala un bug interattivo ("il click sul flag non persiste", "la quota domande per materia è sbilanciata").

---

## 3. Protocollo in 5 Fasi

```
[Bug / Anomalia Rilevata]
          │
          ▼
[1. Trace Instrumentation]  ──► Inietta log numerati lungo la catena causale
          │
          ▼
[2. Execution & Capture]    ──► Esegui l'azione o il test per raccogliere l'output
          │
          ▼
[3. Fault Localization]     ──► Trova l'ultimo checkpoint valido (Last Known Good)
          │
          ▼
[4. Targeted Resolution]    ──► Correggi chirurgicamente il segmento guasto
          │
          ▼
[5. Trace Cleanup]          ──► Rimuovi tutti i [DEBUG-TRACE] e verifica zero regressioni
```

### Dettaglio Operativo
- Inserire log chiari e sequenziali:  
  `console.log('[DEBUG-TRACE #1] Evento click opzione', { questionId, selectedIndex });`  
  `console.log('[DEBUG-TRACE #2] Aggiornamento store Dexie', { before, after });`  
  `console.log('[DEBUG-TRACE #3] Render feedback UI completato', { status });`
- L'errore risiede necessariamente tra l'ultimo log valido e il primo log mancante o errato.
- **Obbligo di Pulizia**: Eliminare categoricamente tutti i log `[DEBUG-TRACE]` prima di presentare il codice all'utente o eseguire commit.
