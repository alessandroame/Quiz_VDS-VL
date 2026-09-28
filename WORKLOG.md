# 📓 Diario di Bordo & Registro Lavorazioni (WORKLOG & ADR)

Questo documento registra in ordine cronologico tutte le lavorazioni svolte nel repository, le scelte architetturali/tecniche adottate (con relative motivazioni e trade-off) e l'impatto sul desiderata di progetto.  
**Ogni agente AI ha l'obbligo contrattuale di appendere una voce qui al termine di ciascuna sessione di lavoro prima di effettuare il commit.**

---

## Template per Nuove Voci

```markdown
### [YYYY-MM-DD] - <Titolo della Lavorazione>
- **Cosa abbiamo fatto**: <Sintesi oggettiva degli interventi effettuati, componenti creati o modificati>
- **Scelte architetturali & Rationale**: <Decisioni tecniche, librerie o pattern adottati, alternative scartate e motivazioni>
- **Impatto sul Desiderata**: <Come questo intervento contribuisce al desiderata (cfr. DESIDERATA.md) e indicazioni per il prossimo agente>
```

---

## Registro Cronologico

### [2026-09-28] - Identità Visiva PWA: Icona Ufficiale "Aero Shield" e Tema Dark "Carbon Cockpit" (Zero-Blue)
- **Cosa abbiamo fatto**:
  - **Ideazione e Creazione Icona PWA "Aero Shield"**:
    - Disegnato e realizzato l'asset vettoriale master [public/favicon.svg](file:///d:/Github/Quiz_VDS-VL/public/favicon.svg): squircle in carbonio/titanio `#09090b` con indicatori cardinali bussola avionica, profilo a celle cassonate del parapendio fuso con l'ala triangolare a 'V' del deltaplano (trave di chiglia e barra di controllo A-frame) con bagliore ambra avionico (`#fbbf24`, `#f59e0b`).
    - Creato lo script CDP [scripts/generate_icons.js](file:///d:/Github/Quiz_VDS-VL/scripts/generate_icons.js) con rendering pixel-perfect Chrome DevTools Protocol per generare [public/icons/icon-192x192.png](file:///d:/Github/Quiz_VDS-VL/public/icons/icon-192x192.png) e [public/icons/icon-512x512.png](file:///d:/Github/Quiz_VDS-VL/public/icons/icon-512x512.png).
  - **Eliminazione Totale Dominante Blu (Tema "Carbon Cockpit")**:
    - Aggiornati i token di configurazione in [tailwind.config.js](file:///d:/Github/Quiz_VDS-VL/tailwind.config.js), [index.html](file:///d:/Github/Quiz_VDS-VL/index.html), [vite.config.ts](file:///d:/Github/Quiz_VDS-VL/vite.config.ts), [src/context/ThemeContext.tsx](file:///d:/Github/Quiz_VDS-VL/src/context/ThemeContext.tsx) e [src/index.css](file:///d:/Github/Quiz_VDS-VL/src/index.css) con palette base carbonio neutro: sfondo `#09090b` (`zinc-950`), card `#18181b` (`zinc-900`), bordi `#27272a` (`zinc-800`), testo `#f4f4f5` (`zinc-100`) e accento primario caldo **Aviation Amber** (`amber-500` / `amber-600`).
    - Migrati integralmente tutti i componenti applicativi rimuovendo qualsiasi classe `slate-` o `sky-` dal tema scuro:
      - [src/App.tsx](file:///d:/Github/Quiz_VDS-VL/src/App.tsx)
      - [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx)
      - [src/components/QuestionCard.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/QuestionCard.tsx)
      - [src/components/ExamScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ExamScreen.tsx)
      - [src/components/TopicsScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/TopicsScreen.tsx)
      - [src/components/MistakesScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/MistakesScreen.tsx)
      - [src/components/ArchiveScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ArchiveScreen.tsx)
      - [src/components/StatsScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/StatsScreen.tsx)
      - [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx)
      - [src/components/VoiceQuickMenu.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx)
      - [src/components/VoiceCommandsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceCommandsModal.tsx)
      - [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx)
    - Preservato al 100% il tema diurno ad altissimo contrasto solare **Hangar Light** tramite le varianti dedicate `light:*`.
  - **Validazione & Collaudo E2E**:
    - **98/98 unit test Vitest** superati con successo in <550ms.
    - Build di produzione PWA (`tsc && vite build`) compilata a 0 errori.
    - Collaudo headless CDP multi-scenario eseguito con successo al 100% e **zero errori in console JavaScript**.
    - Aggiornati [MEMORY.md](file:///d:/Github/Quiz_VDS-VL/MEMORY.md), [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) e [README.md](file:///d:/Github/Quiz_VDS-VL/README.md).
- **Scelte architetturali & Rationale**:
  - *Zero-Blue Hue Rationale*: La palette standard di Tailwind `slate` presenta una temperatura colore fredda e azzurrata (`#020617`, `#0f172a`), affaticante in ambienti a bassa luminosità (cockpit, tenda, decollo crepuscolare) e incoerente con la richiesta di un tema autenticamente avionico e neutro. L'adozione di `zinc` (grigi perfettamente neutrali a base carbonio puro) combinata con l'ambra avionico (`amber-500` / `amber-600`) ricrea fedelmente la strumentazione notturna dei velivoli e garantisce un riposo visivo ottimale.
  - *Icona "Aero Shield" Rationale*: Rappresenta contemporaneamente l'ala flessibile del parapendio e l'ala rigida a freccia del deltaplano, racchiuse in un'armoniosa "V" di Volo Libero / VDS con un look moderno, riconoscibile anche su display piccoli (favicon 16x16 / 32x32) o come icona schermata home su smartphone.
- **Impatto sul Desiderata**:
  - Consolidamento dell'identità visiva e dell'estetica PWA in accordo con i desiderata di progetto (DESIDERATA.md sez. 2.9 e 4).

### [2026-09-28] - Chiarimento Microcopy: Da "Voce Guida" a "Lettura Vocale" e Allineamento Palette Cockpit
- **Cosa abbiamo fatto**:
  - Rinominata la voce *"Voce Guida"* in *"Lettura Vocale"* in [src/components/VoiceQuickMenu.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx) e in [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx).
  - Eliminata l'ambiguità tra la "Modalità Alla Guida" (guida dell'automobile a schermo intero con comandi vocali hands-free e Wake Lock) e la semplice sintesi vocale / lettura dei quesiti.
  - Rifiniti gli stili e le classi del tema avionico scuro in `SettingsModal.tsx` per piena coerenza con la palette Cockpit (`zinc-` e `amber-`).
  - Eseguiti e superati con successo:
    - **98/98 test Vitest** (`npm test`) in 555ms.
    - Build di produzione PWA (`npm run build`) a zero errori TypeScript.
- **Scelte architetturali & Rationale**:
  - *Disambiguazione Terminologica*: La polisemia del termine "guida" (guidare un veicolo vs voce che funge da guida/tutor) generava confusione percepita nell'utente. "Lettura Vocale" comunica immediatamente e senza fraintendimenti l'azione di Text-to-Speech dei quesiti.
- **Impatto sul Desiderata**:
  - Miglioramento immediato dell'ergonomia cognitiva dell'interfaccia sia su smartphone che su desktop.

### [2026-09-28] - Controlli Parlato Interattivi: Play, Pausa, Riprendi e Riavvio dall'Inizio (Da Capo)
- **Cosa abbiamo fatto**:
  - Esteso [src/types/audio.ts](file:///d:/Github/Quiz_VDS-VL/src/types/audio.ts) introducendo il campo `isPaused: boolean` nell'interfaccia `VoicePlaybackState`.
  - Riprogettato [src/services/voiceService.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.ts) per implementare:
    - `togglePlayPause(questionId)`: se in riproduzione, mette in pausa l'audio preservando il secondo esatto; se in pausa, riprende la riproduzione dallo stesso istante; se inattivo, avvia la sequenza completa.
    - `pause()` e `resume()`: gestione dello stato di pausa atomica dell'elemento HTMLAudioElement, supporto alla pausa durante l'intervallo naturale di 350ms tra domanda e opzioni (con memorizzazione della parte pendente `pendingSequencePart`), e allineamento di `navigator.mediaSession.playbackState` ('playing' / 'paused' / 'none').
    - `restartFullSequence(questionId)`: arresto immediato del frammento in corso, azzeramento a `currentTime = 0` e riavvio deterministico dall'inizio della domanda sia mentre l'audio sta parlando sia in stato di pausa.
  - Aggiornato [src/hooks/useAviationVoice.ts](file:///d:/Github/Quiz_VDS-VL/src/hooks/useAviationVoice.ts) esponendo `isPaused`, `isPartPaused`, `togglePlayPause`, `restartFullSequence`, `pause` e `resume`.
  - Evoluto il componente [src/components/QuestionCard.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/QuestionCard.tsx):
    - Trasformato il pulsante statico "Ascolta" in una pillola multimediale cockpit dinamica:
      - Quando inattivo: pulsante singolo essenziale `[🔊 Ascolta]`.
      - Quando attivo (in riproduzione o in pausa): gruppo controlli con:
        1. Pulsante **Play/Pausa** (`[⏸ Pausa]` con badge ciano pulsante / `[▶ Riprendi]` con badge ambra).
        2. Pulsante **Da capo** (`[↺ Da capo]`) per ricominciare istantaneamente dall'inizio della domanda mentre parla o in pausa.
        3. Pulsante **Stop** (`[⏹]`) per interrompere l'ascolto e ripristinare il pulsante singolo.
    - Introdotte scorciatoie da tastiera desktop dedicate:
      - Tasto `V`: toggle Play / Pausa.
      - Tasto `R` o `Shift + V`: ricomincia dall'inizio (Da capo).
      - Tasto `Esc`: interrompe e chiude i controlli audio.
  - Allineato il rendering dell'audio modulare anche in [src/components/ArchiveScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ArchiveScreen.tsx) e in [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx).
  - Creata la suite completa di unit test in [src/services/voiceService.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.test.ts) (10 test dedicati che coprono transizioni, pausa/ripresa, ricomincia, cambi voce e gestione gap temporali).
  - Creato ed eseguito il test di integrazione CDP reale [scripts/test_audio_play_pause.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_audio_play_pause.js) con browser headless a 0 errori.
  - Validati con successo:
    - **98/98 unit test Vitest** (`npm run test:unit`) superati al 100% in 531ms.
    - Bundle di produzione PWA compilato senza avvisi (`npm run build`).
  - Aggiornati [README.md](file:///d:/Github/Quiz_VDS-VL/README.md) e [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md).
- **Scelte architetturali & Rationale**:
  - *Evitare il reset forzato (Zero Frustrazione)*: In precedenza, un secondo clic sul pulsante audio fermava completamente la riproduzione azzerando il cursore a 0. Se l'allievo desiderava un attimo di pausa durante la lettura dell'opzione 2 o 3, al tocco successivo doveva riascoltare l'intera domanda e l'opzione 1 da capo. La differenziazione netta tra Pausa/Ripresa (freeze/unfreeze al millisecondo esatto) e Da capo (reset volontario a inizio quesito) risolve radicalmente il problema.
  - *Pillola Cockpit Contestuale (Zero Invasività)*: Mantenere un unico pulsante `[Ascolta]` quando l'audio non è in uso preserva la pulizia visiva e gli spazi limitati su mobile. Solo all'avvio della riproduzione il controllo si espande mostrando i tasti dedicati `[Pausa/Riprendi]`, `[Da capo]` e `[Stop]`, che tornano a scomparire automaticamente al termine delle opzioni.
  - *Doppio Accesso Keyboard (Tasto R e Shift+V)*: Per l'uso ergonomico da tastiera su desktop, sia `Shift+V` (variante naturale di `V`) che il tasto mnemonico `R` ("Restart / Ripeti") consentono di far ripartire la voce all'istante senza toccare il mouse.
- **Impatto sul Desiderata**:
  - Piena aderenza alla richiesta utente e ai principi di Cockpit Style & Audio Ergonomics (cfr. DESIDERATA.md sez. 2.6).

### [2026-09-28] - Rilascio: Guida Contestuale Comandi Vocali (Hands-Free HUD & Cheat Sheet Modale)
- **Cosa abbiamo fatto**:
  - Creato il nuovo componente [src/components/VoiceCommandsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceCommandsModal.tsx):
    - Cheat Sheet modale compatto in stile cockpit avionico ad alto contrasto.
    - Elenco completo e strutturato delle 6 categorie di comandi: Risposte ("Uno", "Due", "Tre"), Navigazione ("Avanti", "Indietro"), Ripasso Audio ("Ripeti"), Segnalibro ("Bandiera"), Pilota Automatico ("Pausa", "Continua"), Richiesta Assistenza ("Aiuto").
    - Sezione "Consigli Cockpit per la Guida" con indicazioni pratiche per l'uso con vivavoce auto, auricolari e caschi Bluetooth.
  - Esteso il parser deterministico in [src/utils/voiceCommandParser.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/voiceCommandParser.ts) e la relativa suite di unit test [src/utils/voiceCommandParser.test.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/voiceCommandParser.test.ts):
    - Introdotto il comando `'help'` attivabile pronunciando *"aiuto"*, *"guida"*, *"comandi"*, *"istruzioni"*, *"cosa posso dire"*, *"help"*.
  - Integrata la guida contestuale su 3 livelli in [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx):
    - **HUD Live Rotativo**: indicatore discreto animato sopra le macro-fasce di risposta che suggerisce i comandi a rotazione periodica ("Microfono ON: Dì 'Uno', 'Avanti' o 'Aiuto'").
    - **Pulsante Guida '?'**: presente sia nella schermata di lancio che nella barra comandi superiore durante lo svolgimento dei quiz.
    - **Trigger Vocale "Aiuto"**: pronunciando a voce *"Aiuto"*, l'assistente sospende ordinatamente l'audio e apre istantaneamente la guida su schermo.
  - Arricchita la scheda "Guida" di [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx) con box riassuntivo e pulsante diretto al Cheat Sheet.
  - Aggiunto link alla guida comandi vocali anche nel flyout rapido [src/components/VoiceQuickMenu.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx).
  - Corretto l'edge case del mock `Audio` in [src/services/voiceService.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.test.ts) per piena conformità ai costruttori Vitest v5.
  - Esteso lo script di collaudo headless [scripts/test_all_use_cases.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_all_use_cases.js) verificando l'apertura e chiusura del modale via CDP.
  - Verificato con successo:
    - **98/98 unit test Vitest** superati in 559ms.
    - Bundle PWA di produzione compilato con successo (`npm run build`).
    - Collaudo multi-contesto a zero errori in console browser.
  - Aggiornati [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) e [README.md](file:///d:/Github/Quiz_VDS-VL/README.md).
- **Scelte architetturali & Rationale**:
  - *Zero Cognitive Load in Guida*: Quando si guida o si usa l'app a mani libere, l'utente non deve mai dover ricordare a memoria una sintassi rigida. L'HUD live rotativo fornisce piccoli suggerimenti visivi senza distrarre, mentre la possibilità di dire *"Aiuto"* o premere `?` rende il sistema immediatamente trasparente e inclusivo.
  - *Componente Unificato Reutilizzabile*: `VoiceCommandsModal` è incapsulato e condiviso tra `DriveModeScreen`, `SettingsModal` e `VoiceQuickMenu`, garantendo una Single Source of Truth (SSOT) per la documentazione didattica dei comandi vocali.
- **Impatto sul Desiderata**:
  - Requisito pienamente implementato e registrato in [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md).

### [2026-09-28] - Rilascio: Auto-Sync Google Drive, Smart Merge Deterministico & Ripresa Sessione Cross-Device
- **Cosa abbiamo fatto**:
  - Progettato e risolto l'intero albero decisionale tramite sessione interattiva `/grill-me`, formalizzando il piano operativo nell'artifact [auto_sync_smart_merge_plan.md](file:///C:/Users/aless/.gemini/antigravity/brain/2988c1c6-7e5b-4739-9662-fdbaa695c8d8/auto_sync_smart_merge_plan.md).
  - Implementato il modulo di calcolo puro [src/services/smartMerge.ts](file:///d:/Github/Quiz_VDS-VL/src/services/smartMerge.ts) e la relativa suite di unit test [src/services/smartMerge.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/smartMerge.test.ts) (12 test):
    - Fusione deterministica per `QuestionStat` basata sul timestamp `lastAnsweredAt` per lo stato didattico (risultato e sequenza consecutiva corretta) e massimo monotono per i contatori cumulativi (`timesSeen`, `timesCorrect`, `timesWrong`).
    - Unione senza perdita di dati per `ExamSession` con deduplicazione basata sulla chiave di business (`date + durationSeconds + questionCounts`) e rimozione automatica degli ID auto-incrementali di conflitto.
    - Gestione e unione delle impostazioni applicative e della sessione attiva in corso con filtro di decadimento (max 48 ore).
  - Esteso lo store IndexedDB in [src/db/index.ts](file:///d:/Github/Quiz_VDS-VL/src/db/index.ts) e i tipi in [src/types/database.ts](file:///d:/Github/Quiz_VDS-VL/src/types/database.ts):
    - Introdotta la persistenza di `InProgressSession` (`saveActiveSession`, `getActiveSession`, `clearActiveSession`).
    - Aggiornato l'export di backup al formato `version: 2` includendo la sessione attiva.
    - Aggiornato `importDatabaseBackup` per eseguire transazionalmente lo Smart Merge con i dati locali preesistenti, preservando tutti gli esami passati sia per il ripristino cloud che per i file JSON locali.
    - Aggiunti test di persistenza e ripristino in [src/db/database.test.ts](file:///d:/Github/Quiz_VDS-VL/src/db/database.test.ts) (11 test).
  - Creato l'engine di sincronizzazione continua [src/services/syncEngine.ts](file:///d:/Github/Quiz_VDS-VL/src/services/syncEngine.ts) con relativa suite [src/services/syncEngine.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/syncEngine.test.ts) (7 test):
    - Gestione degli stati: `idle`, `syncing`, `synced`, `offline`, `needs_auth`, `error`.
    - Salvataggio automatico continuo in background con debounce (15-20s) e push istantaneo al termine delle simulazioni d'esame.
    - Rilevamento automatico dello stato offline con invio differito e sincronizzazione bidirezionale al rientro della connettività (`online` listener).
  - Integrata la sincronizzazione e la persistenza della sessione in [src/context/QuizContext.tsx](file:///d:/Github/Quiz_VDS-VL/src/context/QuizContext.tsx) con reattività Dexie (`useLiveQuery`).
  - Aggiornati i controller di studio [src/components/TopicsScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/TopicsScreen.tsx), [src/components/ExamScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ExamScreen.tsx) e [src/components/MistakesScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/MistakesScreen.tsx) per salvare continuamente la domanda corrente, le risposte e il timer, e per auto-riprendere la sessione attiva all'ingresso.
  - Implementato in [src/App.tsx](file:///d:/Github/Quiz_VDS-VL/src/App.tsx) il **Banner Avionico di Ripresa Rapida** per riprendere con un tocco la sessione lasciata su un'altra postazione (PC o telefono).
  - Inserito in [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx) l'indicatore discreto di stato cloud (nuvola verde/sincronizzato, animata/sync in corso, ambra/richiesta accesso, barrata/offline).
  - Aggiornato [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx) (scheda Cloud) con il toggle Auto-Sync, la barra di stato in tempo reale e il feedback didattico sullo Smart Merge.
  - Aggiornato [README.md](file:///d:/Github/Quiz_VDS-VL/README.md) documentando la sincronizzazione continua, lo Smart Merge e la ripresa sessione cross-device.
  - Superati al 100% tutti i test: **98/98 unit test Vitest** (`npm run test:unit`) in 523ms e build di produzione Vite (`npm run build`) verificata con successo (0 errori `tsc`).
- **Scelte architetturali & Rationale**:
  - *Smart Merge Deterministico vs Last-Write-Wins*: Sovrascrivere ciecamente il database locale al ripristino avrebbe cancellato esami o risposte fornite offline su un altro dispositivo. Lo Smart Merge adotta un'unione monotona sicura: tutti gli esami sostenuti su qualsiasi dispositivo vengono conservati e le domande adottano lo stato didattico dell'ultimo tentativo cronologico.
  - *Storage in Dexie Settings per activeSession*: Invece di creare una tabella aggiuntiva che avrebbe richiesto una migrazione di schema Dexie (version bump), `activeSession` risiede come chiave dedicata nella tabella `settings`. Questo garantisce massima compatibilità con i database già esistenti e zero rischio di corruzione.
  - *Disaccoppiamento SyncEngine & Test Isolati*: I test di `SyncEngine` isolano i timer reali e simulano le chiamate DB per evitare blocchi sulla coda delle transazioni di `fake-indexeddb`.
- **Impatto sul Desiderata**:
  - Soddisfatto pienamente il requisito di continuità di studio cross-device senza attrito: l'allievo pilota può iniziare un esame o studiare sul PC a casa e riprendere istantaneamente sullo smartphone al campo di volo senza perdere progressi.

### [2026-09-28] - Interfaccia Vocale Rapida (VoiceQuickMenu) e Refactoring Schede Impostazioni
- **Cosa abbiamo fatto**:
  - Creato il nuovo componente [src/components/VoiceQuickMenu.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx) per il controllo vocale rapido a 1 clic:
    - Master toggle Voce Guida ON/OFF con arresto vocale immediato su disattivazione.
    - Selezione istantanea a un tocco dell'istruttore: 👨‍✈️ Giuseppe (tono cockpit calmo) e 👩‍✈️ Elsa (dizione brillante).
    - Regolazione al volo della velocità: `0.9x`, `1.0x`, `1.15x`, `1.25x`.
    - Toggle rapidi per lettura automatica quesiti, spiegazione didattica automatica su errore ed effetti sonori cockpit.
    - Chiusura automatica al click esterno e tasto ESC.
  - Integrato il `VoiceQuickMenu` nella barra superiore di [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx) con badge dinamico (`1.0x` / `Muto`) sempre accessibile da qualsiasi schermata dell'app.
  - Eseguito il refactoring completo di [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx) a navigazione per schede tematiche (segmented control):
    - **🎨 Aspetto**: Tema visivo (Scuro, Chiaro, Auto) e feedback immediato nelle Materie.
    - **🎙️ Voce**: Impostazioni complete assistente vocale e suoni cockpit.
    - **🚗 Guida**: Opzioni Modalità Alla Guida (Radio Quiz, comandi vocali, tempo per pensare).
    - **☁️ Backup**: Salvataggio/Ripristino Google Drive e download/upload copie JSON offline.
    - **⚙️ Dati**: Riepilogo versione database AeCI e reset progressi con conferma di sicurezza.
    - Eliminato completamente lo scrolling verticale continuo: ogni scheda si adatta all'altezza viewport.
  - Aggiornato [scripts/test_all_use_cases.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_all_use_cases.js) collaudando il Quick Speech Menu e le 5 schede tematiche via CDP.
  - Eseguiti e validati con successo al 100%:
    - **67/67 unit test Vitest** (`npm run test:unit`) superati in 383ms.
    - Bundle di produzione PWA compilato senza avvisi (`npm run build`).
    - Collaudo multi-contesto headless a 0 errori in console JavaScript.
  - Aggiornati [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) e [README.md](file:///d:/Github/Quiz_VDS-VL/README.md).
- **Scelte architetturali & Rationale**:
  - *Zero-Friction Audio Cockpit*: In volo o durante lo studio intensivo, cambiare voce o mutare la lettura non deve mai richiedere l'apertura di schermate modali invasive né più di un singolo tap. Il popover leggero ancorato alla Navbar consente regolazioni a caldo senza perdere il focus sul quiz.
  - *Segmented Tabs Navigation per Impostazioni*: Suddividere le preferenze in 5 argomenti chiari e focalizzati ha ridotto l'altezza necessaria per schermata a meno di 300px, eliminando la frustrazione del dover scrollare liste lunghe sia su smartphone che su tablet e desktop.
- **Impatto sul Desiderata**:
  - Piena soddisfazione di entrambi i requisiti richiesti dall'utente. Matrice di stato in [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) aggiornata a 🟢 Completato.

### [2026-09-28] - Parlato Vocale Conciso: Rimozione Prefisso Domanda/Materia & Rigenerazione Audio Batch
- **Cosa abbiamo fatto**:
  - Aggiornato lo script batch di generazione audio [scripts/generate_audio_database.py](file:///d:/Github/Quiz_VDS-VL/scripts/generate_audio_database.py):
    - Rimosso il preambolo verboso `Domanda {qid}. {sub_name}.` da `build_segments(q)`, facendo pronunciare alle tracce `_q.mp3` unicamente il testo normalizzato della domanda.
    - Introdotti i parametri CLI `--part {all,q,options,explanation}` e `--force` per consentire la rigenerazione selettiva chirurgica delle sole domande senza riscaricare le 4.032 opzioni didattiche intatte.
  - Rigenerati con successo tutti i **1.008 segmenti audio delle domande** (`_q.mp3`) per entrambe le voci:
    - 504 segmenti in `public/audio/giuseppe/` (voce maschile cockpit).
    - 504 segmenti in `public/audio/elsa/` (voce femminile cristallina).
  - Allineato lo script di collaudo [scripts/test_discrete.py](file:///d:/Github/Quiz_VDS-VL/scripts/test_discrete.py).
  - Esteso il modulo [src/utils/aviationPhonetics.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/aviationPhonetics.ts) esportando la funzione `formatQuestionForSpeech(questionText: string): string` ed estendendo la suite Vitest [src/utils/aviationPhonetics.test.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/aviationPhonetics.test.ts) con test dedicati in lingua inglese.
  - Aggiornato [MEMORY.md](file:///d:/Github/Quiz_VDS-VL/MEMORY.md) (Sezione 6) e [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) (Sezione 2.6) documentando la direttiva del parlato conciso Cockpit Minimalist.
  - Verificato il superamento al 100% di tutti i **67 test unitari Vitest** (`npm run test:unit`) e compilato con successo il bundle di produzione PWA (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Cockpit Style Minimalist Audio (Zero Preamboli)*: Durante la simulazione d'esame o la modalità di guida a mani libere ("Pilota Automatico"), ascoltare "Domanda 1001. Normativa e Legislazione." prima di ciascun quesito aggiungeva tra i 3 e i 5 secondi di latenza a vuoto (pari a oltre 2 minuti di attesa cumulativa in un esame di 30 quesiti). Il numero domanda e la materia sono già visibili a colpo d'occhio nell'UI; il parlato deve concentrarsi puramente sull'enunciato del problema.
  - *Rigenerazione Selettiva (--part q --force)*: Filtrare unicamente i segmenti `_q.mp3` ha evitato 4.032 chiamate API ridondanti per opzioni e spiegazioni, riducendo dell'80% l'utilizzo di rete e i tempi di esecuzione.
- **Impatto sul Desiderata**:
  - Esperienza didattica e audio molto più fluida e immediata in [QuestionCard.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/QuestionCard.tsx) e [DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx). Risparmio tangibile di tempo e concentrazione per l'allievo pilota.

### [2026-09-28] - Piano Architetturale: Quick Speech Menu (1-Click) & Impostazioni a Schede (Zero-Scroll)
- **Cosa abbiamo fatto**:
  - Formulato il piano esecutivo e architetturale nell'artefatto `plan_speech_menu_and_categorized_settings.md` per l'introduzione di un menu del parlato rapido a 1 clic e la riorganizzazione a schede tematiche compatte delle impostazioni.
  - Aggiornato [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) introducendo:
    - Sezione 2.6: specifica del *Quick Speech Menu* accessibile dall'header per regolazione istantanea senza modali invasivi.
    - Sezione 2.8: specifica delle *Impostazioni Modulari per Argomenti* con eliminazione dello scrolling continuo.
    - Sezione 4 (Matrice di Stato): aggiunti i due moduli in stato 🟡 Pianificato con relative note tecniche.
  - Eseguita e convalidata la suite Vitest: 65/65 test superati con successo in 1.47s.
- **Scelte architetturali & Rationale**:
  - *Cockpit Quick-Control Popover vs Nested Modals*: Il controllo vocale deve essere immediato durante lo studio o l'esame; dover aprire un intero modale di impostazioni e scrollare genera attrito cognitivo. Un flyout/popover compatto ancorato alla barra superiore consente la regolazione istantanea (1 clic) di voce e velocità preservando il contesto di studio.
  - *Segmented Tabs Navigation per Impostazioni*: La suddivisione in 5 argomenti (Voce, Guida, Aspetto, Backup, Dati) azzera la necessità di scorrimento verticale, massimizzando l'ergonomia sia su smartphone che su tablet/desktop.
- **Impatto sul Desiderata**:
  - Pieno allineamento della roadmap di sviluppo con le preferenze di usabilità e comfort espresse dall'utente.

### [2026-09-28] - Vincolo Porta 5173 per Google Drive OAuth, Suite Vitest & Anteprima Locale
- **Cosa abbiamo fatto**:
  - Configurato `vite.config.ts` bloccando sia `server.port` che `preview.port` su **5173** con `strictPort: true`, impedendo l'uso accidentale della porta 4173 o porte casuali.
  - Riavviamo il server di anteprima PWA su [http://localhost:5173/](http://localhost:5173/) con esito HTTP 200 OK.
  - Sancito il vincolo operativo e architetturale in [MEMORY.md](file:///d:/Github/Quiz_VDS-VL/MEMORY.md) (Sezione 2) per evitare disallineamenti di origine OAuth.
  - Ripristinate le dipendenze di progetto tramite installazione deterministica `npm ci`.
  - Eseguita e validata l'intera suite di unit & integration test Vitest: **65/65 test superati** al 100% (10 test file).
  - Compilato il bundle PWA di produzione con `npm run build` (typecheck `tsc` superato con zero errori, bundle Vite e manifest PWA generati con successo).
- **Scelte architetturali & Rationale**:
  - *Google OAuth Authorized JavaScript Origin Strictness*: Il Client ID OAuth di Google autorizza specificamente `http://localhost:5173`. L'uso della porta di default di Vite preview (4173) provocava il blocco delle richieste verso le API di Google Drive per discrepanza di origine. Il vincolo `strictPort: true` a livello di configurazione Vite garantisce che l'anteprima locale funzioni sempre in modo trasparente e conforme per il backup cloud.
- **Impatto sul Desiderata**:
  - Funzionalità Google Drive Cloud Sync pienamente fruibile sia in ambiente `dev` che in `preview` su `http://localhost:5173/`.


### [2026-09-27] - Analisi Funzionale Approfondita & Collaudo Multi-Contesto d'Uso
- **Cosa abbiamo fatto**:
  - Modellati ed esaminati 5 contesti d'uso reali per la PWA:
    1. *Studio Desktop a Casa*: Schermo 1440x900, scorciatoie tastiera (`1`, `2`, `3`, `F`, frecce), navigatore a 30 slot, Navigation Guard su cambio tab durante simulazione e schermata finale di debriefing con esito AeCI.
    2. *Ripasso alla Guida / in Viaggio (Truck & Cockpit Drive Mode)*: Schermo mobile 390x844, layout zero-scroll `100dvh`, macro-pulsanti tattili Fitts's law, Pilota Automatico sequenziale (Radio Quiz) e comandi vocali.
    3. *Campo di Volo / Sole Diretto (Hangar Light)*: Contrasto elevato bivalente chiaro/scuro, studio per singola materia con spiegazioni didattiche istantanee Regola + Tranello.
    4. *Archivio & Privacy Dati*: Ricerca full-text istantanea per testo e keyword, gestione note personali persistenti, toggle preferiti ed export locale JSON offline-first.
    5. *Ripasso Intensivo Pre-Esame (Quaderno Errori)*: Verifica algoritmo Spaced Repetition Leitner (rimozione vincolata a 2 risposte corrette consecutive) e radar 9 materie.
  - Diagnosticato e risolto un difetto critico di sincronizzazione stato tra `DriveModeScreen` e le schermate chiamanti (`ExamScreen`, `TopicsScreen`, `MistakesScreen`):
    - Introdotto passaggio esplicito dell'identificativo quesito `qid` nei gestori `handleSelectAnswer(ans, qid)` e `handleToggleFlag(qid)` per prevenire race conditions e stale closure.
    - Prevenuta la doppia registrazione delle risposte (`recordAnswer`) e il doppio salvataggio delle sessioni d'esame (`saveExam`) delegando interamente la finalizzazione al context genitore quando presente.
    - Evitata la marcatura erronea di risposte non date durante simulazioni d'esame attive in Drive Mode.
  - Implementato lo script di collaudo headless automatico `scripts/test_all_use_cases.js` via Chrome DevTools Protocol (CDP), verificando con successo al 100% tutti i 5 contesti con zero errori in console browser.
  - Validata l'intera suite Vitest: 65 test unitari e di integrazione superati in 491ms, con compilazione bundle Vite (`npm run build`) senza avvisi o errori.
- **Scelte architetturali & Rationale**:
  - *Disaccoppiamento Closure vs Parametro Esplicito*: Affidare la risoluzione della domanda corrente allo stato locale del componente genitore durante l'apertura di un modal a schermo intero è soggetto a disallineamenti asincroni React. Il passaggio esplicito del `qid` come parametro primario rende la sincronizzazione deterministica, pura e a prova di race condition.
  - *Delega del Ciclo di Vita (Single Responsibility)*: Quando `DriveModeScreen` opera come interfaccia alternativa di un esame già avviato in `ExamScreen`, non deve duplicare la logica di valutazione o persistenza DB, ma delegare il completamento alla sessione chiamante.
- **Impatto sul Desiderata**:
  - Piena conformità funzionale a tutti i 7 requisiti core del [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md). Nessuna regressione rilevata nei test.

### [2026-09-27] - Adozione Standard Operativo "Cockpit Executive Mode"
- **Cosa abbiamo fatto**:
  - Formalizzato in [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md) (Sezione 7) lo standard operativo "Cockpit Executive Mode" per l'interazione agente-utente:
    - Risposte strutturate su sintesi estrema (max 3 bullet: cosa fatto, dove intervenire, cosa decidere).
    - Progressive disclosure: dettagli tecnici, codice esteso e diff confinati nei file di progetto o negli Artifacts.
    - Decisioni e bivi gestiti via modali rapidi `ask_question` con opzione raccomandata in cima per decisioni a 1 click.
    - Riserva esclusiva del tag `> [!WARNING]` per reali rischi di rottura, breaking change o perdita dati.
    - Dimostrazione tangibile tramite esiti test/typecheck prima delle spiegazioni discorsive.
    - Suddivisione del lavoro in task atomici (1 problema alla volta) con diff leggibili in 15 secondi.
- **Scelte architetturali & Rationale**:
  - *Mitigazione della Fatica Cognitiva*: Lo sviluppo guidato da LLM soffre frequentemente di "muri di testo" prolissi che portano l'utente a saltare la lettura critica e accettare modifiche alla cieca. L'adozione del paradigma Cockpit Executive protegge la concentrazione dell'utente, riduce i tempi decisionali e azzera il rischio di allucinazioni inosservate.
- **Impatto sul Desiderata**:
  - Incremento immediato della qualità delle revisioni umane e dell'efficienza nel ciclo di sviluppo di [Quiz_VDS-VL](file:///c:/github/Quiz_VDS-VL/). Nessun impatto runtime sull'applicazione.

### [2026-09-27] - Istituzione Vincolo Lingua Inglese per Sorgenti, Commenti e Commit Git
- **Cosa abbiamo fatto**:
  - Formalizzato il vincolo cogente di utilizzo esclusivo della lingua inglese per tutti gli artefatti di sviluppo:
    - `.agents/AGENTS.md`: introdotta la direttiva comportamentale cardine n. 7 che impone l'inglese per file sorgente, script, commenti inline, docstring, asserzioni di test e messaggi di commit Git.
    - `.agents/rules/constraints.md`: aggiornata la sezione 2 vietando esplicitamente commenti in italiano nel codice e prescrivendo Conventional Commits in inglese.
    - `.agents/skills/git-pro/SKILL.md`: revisionata la specifica dei commit message sostituendo gli esempi italiani con template rigorosamente in inglese (`feat(...)`, `fix(...)`, `refactor(...)`, etc.) e vietando testi di commit in italiano.
    - `.agents/workflows/task_lifecycle.md`: ribadito l'obbligo di Conventional Commits in inglese nel ciclo di vita dei task.
    - `MEMORY.md`: consolidata la convenzione nella memoria tecnica permanente del repository.
  - Circoscritta puntualmente l'unica eccezione ammessa per l'italiano: il microcopy visibile all'utente finale (l'allievo pilota che sostiene l'esame AeCI), il catalogo ufficiale dei 504 quiz (`questions.json`: quesiti, opzioni, spiegazioni didattiche) e la documentazione di alto livello / dialogo chat con l'utente.
- **Scelte architetturali & Rationale**:
  - *Separazione tra Livello Tecnico e Livello Utente*: Negli standard ingegneristici professionali moderni, il codice, i commenti tecnici, le suite di test e la cronologia Git devono essere scritti in inglese per garantire interoperabilità con strumenti di analisi statica, linter, modelli AI e sviluppatori internazionali. L'interfaccia utente finale rimane invece rigorosamente in italiano coerente con le normative dell'Aero Club d'Italia (AeCI).
- **Impatto sul Desiderata**:
  - Governance del codice ineccepibile e allineamento perfetto con le migliori pratiche di sviluppo open source professionale. Nessun impatto sulla funzionalità runtime dell'applicazione.

### [2026-09-27] - Umanizzazione UI/UX & Rimozione Configurazione Tecnica Client ID
- **Cosa abbiamo fatto**:
  - Rimossa dall'interfaccia utente qualsiasi menzione visibile del "Google Client ID", il campo di testo per l'inserimento manuale, il pulsante toggle per opzioni sviluppatore e la dicitura tecnica `(appDataFolder)`.
  - Il Client ID Google OAuth opera ora completamente sotto il cofano, garantendo l'accesso e la sincronizzazione cloud tramite due soli pulsanti immediati: **"Salva su Google"** e **"Ripristina da Google"**.
  - Revisionato e semplificato l'intero microcopy dell'applicazione per renderlo chiaro, naturale e accessibile a qualsiasi aspirante pilota (da chi non ha competenze informatiche agli esperti):
    - `SettingsModal.tsx`: testi semplici per sincronizzazione cloud, salvataggio su file ("Scarica copia" / "Carica copia") e azzeramento ("Cancella tutti i dati e ricomincia da zero"). Semplificate le descrizioni di voci, velocità e modalità alla guida.
    - `ExamScreen.tsx`: sostituito "Algoritmo Copertura Garantita: Priorità mai viste" con "Selezione domande: Priorità a quelle non ancora viste".
    - `StatsScreen.tsx`: sostituito "Statistiche & Telemetria" con "I tuoi Progressi", "Indice di Prontezza" con "Prontezza Esame", "Copertura" con "Quiz Visti" e "errori attivi" con "errori da rivedere".
    - `MistakesScreen.tsx`: sostituito il gergo didattico astratto con "Rispondi esattamente per 2 volte di fila per togliere una domanda dagli errori" e "Domande da Ripassare".
    - `ArchiveScreen.tsx`: sostituito "Ascolto Vocale Neurale" con "Ascolto Vocale" e testo del pulsante note.
    - `DriveModeScreen.tsx`: chiarito lo stato dello schermo sempre acceso e dei pulsanti giganti.
  - Esteso lo script headless CDP `visual_check.js` con il supporto per selettori di scorrimento `scroll:<selector>`.
  - Convalidato l'aggiornamento visivo tramite screenshot headless pixel-perfect in tema scuro e chiaro (0 errori in console) e superamento di tutti i 63 test unitari Vitest (`npm test`).
- **Scelte architetturali & Rationale**:
  - *Zero Gergo Tecnico (No Jargon Principle)*: In un'applicazione rivolta a studenti e allievi di volo libero di qualunque estrazione (dal camionista alla bidella all'ingegnere), la complessità tecnica (OAuth, Client ID, JSON, appDataFolder) deve essere interamente assorbita dall'architettura del software. L'interfaccia deve parlare la lingua dell'utente: "Salva su Google", "Salva su file", "Ricomincia da capo".
- **Impatto sul Desiderata**:
  - Esperienza utente estremamente fluida, rassicurante e accessibile. Tutti i requisiti del [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) restano pienamente operativi con 63/63 test verdi.

### [2026-09-27] - Integrazione Client ID Google OAuth & Configurazione .env
- **Cosa abbiamo fatto**:
  - Creato il file di configurazione locale `.env` contenente il Client ID Google OAuth fornito dall'utente (`182413802928-q7sphls58ob60s2mu3fspbbkk9kq2am9.apps.googleusercontent.com`).
  - Configurato il Client ID come fallback predefinito in `src/services/googleDrive.ts` e `src/components/SettingsModal.tsx` per garantire il funzionamento automatico a 1-click anche nelle build statiche distribuite su GitHub Pages.
  - Verificato con test headless CDP il rendering del badge verde **"Pronto"** nella sezione Backup Cloud di `SettingsModal.tsx`.
- **Scelte architetturali & Rationale**:
  - *Fallback duale .env + build*: Poiché `.env` è escluso dal controllo di versione per prassi, impostare il Client ID come fallback garantisce che il deploy su `https://alessandroame.github.io/Quiz_VDS-VL/` funzioni istantaneamente senza dipendere da configurazioni manuali di GitHub Actions secrets.
- **Impatto sul Desiderata**:
  - Sincronizzazione cloud 1-click pronta all'uso sia in locale sia online.

### [2026-09-27] - Redazione README Funzionale & Istituzione Vincolo di Allineamento Continuo
- **Cosa abbiamo fatto**:
  - Redatto e integrato nella root del progetto il file [README.md](file:///c:/github/Quiz_VDS-VL/README.md) completo ed esaustivo, documentando nel dettaglio tutte le 11 macro-funzionalità dell'app (Database 504 quiz AeCI con Regola e Tranello, Simulatore d'Esame con quote e timer 45 min, Studio per Materie, Quaderno Errori Leitner, Archivio full-text con Note Personali e Preferiti, Statistiche con radar 9 materie, Modalità Alla Guida con zero-scroll e Web Speech Recognition, Motore Vocale Neurale offline bivalente Giuseppe/Elsa e fonetica ICAO, Ergonomia cockpit con temi Dark/Light e scorciatoie tastiera, Fair Coverage Randomizer, PWA Offline-First e sincronizzazione dati locale/Drive).
  - Documentato lo stack tecnologico (React 19, Vite, TypeScript strict, Tailwind CSS, Dexie.js, Vitest, Web Audio/Speech API).
  - Aggiunte istruzioni dettagliate di avvio rapido, comandi di test unitari, coverage e collaudi visivi CDP headless.
  - Istituito il vincolo normativo permanente di allineamento continuo del [README.md](file:///c:/github/Quiz_VDS-VL/README.md) in [.agents/AGENTS.md](file:///c:/github/Quiz_VDS-VL/.agents/AGENTS.md), in [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md), in [.agents/rules/constraints.md](file:///c:/github/Quiz_VDS-VL/.agents/rules/constraints.md) e nel workflow di fine lavorazione di [.agents/skills/self-correction-loop/SKILL.md](file:///c:/github/Quiz_VDS-VL/.agents/skills/self-correction-loop/SKILL.md).
- **Scelte architetturali & Rationale**:
  - *Allineamento a Catena della Governance*: La richiesta utente di "tienile aggiornate anche in futuro quando faremo modifiche" è stata formalizzata sia a livello di direttive agent (`AGENTS.md`), sia nella memoria stabile di progetto (`MEMORY.md`), sia nei vincoli architetturali (`constraints.md`), sia nello schema procedurale della skill `self-correction-loop`. In questo modo qualsiasi sessione futura o subagente avrà il vincolo esplicito di aggiornare il `README.md` all'aggiunta o modifica di funzionalità.
- **Impatto sul Desiderata**:
  - Massima trasparenza per utenti, sviluppatori e allievi piloti che approcciano il repository GitHub. Documentazione completa, navigabile e integrata con la triade di conoscenza.

### [2026-09-27] - Integrazione Voce Neurale Femminile Elsa & Selettore Multi-Voce Istruttore
- **Cosa abbiamo fatto**:
  - Esteso lo script di generazione `scripts/generate_audio_database.py` con supporto al flag `--voice` (`giuseppe` ed `elsa`).
  - Generato l'intero catalogo dei 2.520 segmenti audio in italiano naturale con la voce femminile ad alta chiarezza **Elsa** (`it-IT-ElsaNeural`) archiviati in `public/audio/elsa/`.
  - Esteso il tipo `AppSettings` con `ttsVoice: 'giuseppe' | 'elsa'` e valorizzato il default in `src/db/index.ts`.
  - Aggiornato `src/services/voiceService.ts` per supportare il cambio dinamico della voce (`setVoice`, `getVoice`) e la risoluzione dei percorsi `public/audio/{voice}/`.
  - Sincronizzata la voce nel `QuizContext.tsx` con effetto immediato su ogni componente dell'applicazione.
  - Implementato in `src/components/SettingsModal.tsx` il selettore visivo card-based per la scelta tra la voce maschile (*👨‍✈️ Giuseppe - Tono calmo cockpit*) e femminile (*👩‍✈️ Elsa - Dizione cristallina*).
  - Verificato il superamento di tutti i 63 test Vitest (`npm test`) e la compilazione del bundle PWA di produzione (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Separazione Directory Audio per Voce*: Archiviando `public/audio/giuseppe/` e `public/audio/elsa/` separatamente, la selezione della voce a runtime è un'operazione O(1) priva di fetch a server esterni e compatibile al 100% con la natura offline PWA.
  - *Coerenza Fonetica*: Entrambe le voci condividono la stessa pipeline di normalizzazione fonetica aeronautica (`aviationPhonetics.ts`) e la cadenza cockpit (*"Uno."*, *"Due."*, *"Tre."*).
- **Impatto sul Desiderata**:
  - Completa libertà di scelta per il candidato pilota tra voce maschile e femminile ad altissima qualità, con persistenza locale e zero latenza.

### [2026-09-27] - Implementazione Modalità Alla Guida ("Truck & Drive Cockpit Mode")
- **Cosa abbiamo fatto**:
  - Redatto lo studio di fattibilità ed ergonomia tattile in [truck_cockpit_mode_plan.md](file:///C:/Users/aless/.gemini/antigravity/brain/4f1a0bad-73d5-4ee0-9d28-f4a2d17159c5/truck_cockpit_mode_plan.md).
  - Implementato `src/utils/voiceCommandParser.ts` per il parsing selettivo e deterministico dei comandi vocali italiani ("Uno", "Due", "Tre", "Avanti", "Indietro", "Ripeti", "Bandiera", "Pausa", "Riprendi") con suite di unit test (`src/utils/voiceCommandParser.test.ts`).
  - Implementato `src/hooks/useWakeLock.ts` per il mantenimento attivo del display su supporto cruscotto (Screen Wake Lock API) con gestione del ciclo di vita e riaggancio su `visibilitychange`.
  - Implementato `src/hooks/useDriveVoiceCommands.ts` per il controllo vocale hands-free continuo via Web Speech Recognition.
  - Realizzato il componente `src/components/DriveModeScreen.tsx`: layout a tutto schermo con viewport bloccato (`100dvh`) e zero-scroll, 3 macro-fasce tattili ingrandite (Fitts's Law estrema), pilota automatico sequenziale ("Radio Quiz") e supporto gesture swipe.
  - Integrato lo switch alla Modalità Alla Guida in `Navbar.tsx`, `ExamScreen.tsx`, `TopicsScreen.tsx`, `MistakesScreen.tsx` e `QuizContext.tsx` per supportare sia l'avvio autonomo che la prosecuzione istantanea di una sessione d'esame in corso.
  - Aggiunte impostazioni dedicate (Pilota Automatico, Comandi Vocali, Tempo di attesa) in `SettingsModal.tsx` e nel DB Dexie.
  - Collaudato con successo con Chrome CDP headless (`scripts/test_drive_mode.js`) su viewport mobile (390x844), validando l'interazione, la navigazione e registrando zero errori in console.
- **Scelte architetturali & Rationale**:
  - *Modalità Dedicata vs Compromesso Universale*: Forzare bottoni da 80-100px nella vista standard avrebbe compromesso la densità informativa dello studio a casa, costringendo a continuo scrolling verticale. La modalità dedicata a schermo intero (`100dvh`) consente zero scrolling e massima reattività tattile a distanza braccio.
  - *Pilota Automatico Passivo / Radio Quiz*: Essenziale in viaggio: permette l'ascolto continuo di domande e opzioni con auto-rivelazione della risposta e della regola dopo un tempo limite (3-8s), studiando senza dover toccare il dispositivo.
  - *Screen Wake Lock*: Impedisce lo spegnimento dello schermo ogni 30 secondi quando il telefono è agganciato al cruscotto.
- **Impatto sul Desiderata**:
  - Requisito 7 del [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) pienamente soddisfatto. La suite Vitest sale a 63 test unitari tutti verdi.

### [2026-09-27] - Integrazione Motore Vocale Neurale Integrale (TTS Giuseppe Calmo) & Generazione Catalogo 504 Quiz
- **Cosa abbiamo fatto**:
  1. **Valutazione Critica & Blind Test preliminare**:
     - Dimostrata l'inadeguatezza del `window.speechSynthesis` nativo del browser desktop Windows (voce robotica metallica `Microsoft Elsa Desktop SAPI5`).
     - Approvata la voce neurale da studio **Giuseppe Calmo** (`it-IT-GiuseppeMultilingualNeural`) calibrata con `rate: -5%` e `pitch: -5Hz` (timbro baritonale pacato, stile istruttore di volo, zero picchi acuti).
     - Corretta la pronuncia delle opzioni in puro stile cockpit italiano (*"Uno. [testo]"*, *"Due. [testo]"*, *"Tre. [testo]"*) eliminando collisioni fonetiche con l'inglese (*"Option 1"*).
  2. **Pipeline Batch di Generazione Completa (504 Quiz)**:
     - Creato lo script concorrente `scripts/generate_audio_database.py` per generare tutti i 5 segmenti discreti per ciascuna domanda: domanda (`_q.mp3`), tre opzioni (`_1.mp3`, `_2.mp3`, `_3.mp3`) e spiegazione didattica su errore (`_e.mp3`).
     - Generati con successo **tutti i 2.520 segmenti audio** per l'intero catalogo dei 504 quiz in `public/audio/` (~167 MB).
  3. **Normalizzatore Fonetico Aeronautico (`src/utils/aviationPhonetics.ts`)**:
     - Sostituzione di acronimi e unità di misura con pronuncia naturale: `D.P.R. 133/2010`, `VDS/VL`, `AeCI`, `RCT`, `QNH`, `QFE`, `hPa`, `FL`, `km/h`, `m/s`, `kt`, gradi e punteggiatura morbida per evitare intonazioni interrogative stridule.
     - Suite di 7 unit test dedicati con Vitest (`src/utils/aviationPhonetics.test.ts`), tutti superati.
  4. **Servizio Audio Centrale & MediaSession (`src/services/voiceService.ts` & `src/hooks/useAviationVoice.ts`)**:
     - Riproduzione atomica di singoli frammenti e sequenza continua con highlighting visivo sincronizzato.
     - Supporto `navigator.mediaSession` per riproduzione e metadati a schermo spento con auricolari Bluetooth.
  5. **Integrazione UI Cockpit in [QuestionCard.tsx](file:///c:/github/Quiz_VDS-VL/src/components/QuestionCard.tsx) & [ArchiveScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/ArchiveScreen.tsx)**:
     - Header: tasto sequenziale "Ascolta / Ascolto..." con animazione d'onda.
     - Domanda: micro-icona speaker per ascolto atomico del solo testo domanda (tasto `Q`).
     - Opzioni 1, 2, 3: micro-icona per ascolto della singola opzione (tasti `Alt+1`, `Alt+2`, `Alt+3`).
     - Feedback su errore: trigger vocale automatico della risposta corretta, della regola e del tranello.
     - Box spiegazione didattica: pulsante "Ascolta Spiegazione" per risentire la motivazione.
  6. **Impostazioni in [SettingsModal.tsx](file:///c:/github/Quiz_VDS-VL/src/components/SettingsModal.tsx)**:
     - Toggle Voce Istruttore (On/Off).
     - Toggle Spiegazione Vocale Automatica su Errore.
     - Toggle Lettura Automatica all'apertura del quiz.
     - Selettore velocità parlato (`0.9x`, `1.0x`, `1.15x`, `1.25x`).
- **Scelte architetturali & Rationale**:
  - *Segmentazione discreta vs Audio Sprites monolitici*: 5 file per quiz evitano problemi di buffer range seek sui browser mobile e consentono una gestione dello stato pulita e immediata.
  - *Normalizzazione fonetica a monte*: Garantisce che termini complessi come "QNH 1013 hPa" o "D.P.R. 133/2010" vengano pronunciati con perfetta dizione aeronautica.
- **Impatto sul Desiderata**:
  - PWA completamente accessibile e fruibile a mani libere, con supporto studio durante tragitti o passeggiate (cuffie Bluetooth e schermo spento).

### [2026-09-27] - Configurazione GitHub Pages & CI/CD Pipeline (.github/workflows/deploy.yml)
- **Cosa abbiamo fatto**:
  1. **Configurazione Base Path per GitHub Pages**:
     - In `vite.config.ts`, impostato `base: process.env.BASE_PATH || (process.env.GITHUB_ACTIONS ? '/Quiz_VDS-VL/' : '/')`. In questo modo in sviluppo locale il server risponde sempre su `/` (compatibilità con test CDP e porte standard), mentre nei runner di build GitHub Pages imposta il subpath del repository.
     - Nel manifest PWA (`vite.config.ts`), convertite le icone in percorsi relativi (`'icons/icon-192x192.png'`) per evitare che cerchino la cartella icons nella root del dominio host (`username.github.io/icons`).
  2. **Risoluzione Path Audio per Deployment Subpath**:
     - In `src/services/voiceService.ts`, aggiornato `getAudioUrl` con `import.meta.env.BASE_URL` dinamico, garantendo che gli stream audio ICAO vengano risolti correttamente sia in locale che su GitHub Pages.
  3. **Automazione CI/CD con GitHub Actions**:
     - Creato il workflow standard `.github/workflows/deploy.yml` con trigger su `push` al branch `main` e `workflow_dispatch`. Il job esegue `npm ci`, la suite di test Vitest (`npm test`), il build PWA (`npm run build` con `BASE_PATH: '/Quiz_VDS-VL/'`), il packaging dell'artifact `dist` e il deployment su GitHub Pages tramite le action ufficiali `actions/deploy-pages@v4`.
- **Scelte architetturali & Rationale**:
  - *GitHub Pages come Hosting Ideale*: L'app è una Single Page Application 100% client-side senza backend proprietario. GitHub Pages fornisce HTTPS nativo e permanente (prerequisito obbligatorio per Service Worker e Web App Install Banner), zero costi e zero manutenzione server.
  - *Automazione GitHub Actions vs Branch Orfano*: Adottato il deployment moderno nativo via artifact Actions (`actions/deploy-pages@v4`), evitando l'inquinamento del repository con branch sporchi come `gh-pages` o build committati manualmente nel repo.
- **Impatto sul Desiderata**:
  - Preparata la PWA per la distribuzione pubblica e l'installazione su dispositivi reali (smartphone Android, iOS, tablet e desktop) con Service Worker e cache offline operativi.

### [2026-09-27] - Risoluzione Difetti: Visibilità Note Personali & Protezione Esame Attivo (Navigation Guard)
- **Cosa abbiamo fatto**:
  1. **Visualizzazione, Modifica ed Eliminazione Note Personali**:
     - Risolto il difetto per cui le note personali non erano visibili in `Archivio`:
       * In `src/components/ArchiveScreen.tsx`, aggiunto nel riepilogo collassato di ogni quesito un badge/pill visibile con il testo della nota (`"{stat.userNote}"`).
       * Nella vista espansa dell'archivio, implementata una sezione dedicata ad alto contrasto "Nota Personale" con pulsanti di azione immediata ("Modifica", "Elimina") e pulsante per aggiungere note se assenti (`+ Aggiungi appunto personale sul quesito`).
       * In `src/components/QuestionCard.tsx`, ridisegnata la card della nota con intestazione chiara, contrasto pienamente conforme sia al tema Cockpit Dark che Hangar Light (`light:bg-sky-50 light:border-sky-200 light:text-sky-950`), pulsanti di Modifica ed Eliminazione rapida, e sincronizzazione automatica dello stato al cambio quesito (`useEffect`).
       * In `src/components/MistakesScreen.tsx`, aggiunto lo snippet della nota nel riepilogo dei quesiti da perfezionare.
       * In `src/db/index.ts`, aggiornata la funzione `saveQuestionNote` con trimming del testo ed eliminazione automatica del campo se la nota viene svuotata, con test di regressione dedicati in `database.test.ts`.
  2. **Protezione Simulazione Esame & Navigation Guard**:
     - Risolto il difetto per cui spostandosi di pagina durante una simulazione si perdevano i progressi:
       * Introdotto in `QuizContext.tsx` lo stato reattivo globale `isExamRunning` e `setIsExamRunning`.
       * In `src/components/ExamScreen.tsx`, sincronizzato lo stato dell'esame attivo (`running`), aggiunto pulsante esplicito "Abbandona" nella barra superiore con modal di conferma dedicato.
       * In `src/App.tsx`, implementato il Navigation Guard: se l'utente tenta di cambiare scheda (Materie, Errori, Archivio, Stats) mentre una simulazione è in corso, la navigazione viene intercettata e compare un modal di avviso avionico chiaro e non invasivo:
         - **"Rimani nell'Esame"** (opzione primaria sicura): annulla il cambio scheda e mantiene la simulazione intatta con timer e risposte preservati.
         - **"Abbandona ed Esci"** (opzione distruttiva): termina la simulazione e reindirizza alla scheda desiderata.
       * Aggiunto il listener nativo `beforeunload` sul browser per impedire ricaricamenti o chiusure accidentali della tab durante l'esame.
       * Nella `Navbar.tsx`, aggiunti indicatori visivi in tempo reale: badge pulsante "IN CORSO" nell'header e beacon luminoso sulla scheda "Esame".
  3. **Collaudo e Validazione Visiva**:
     - Verificato con test CDP headless sia su desktop (1440x900) che smartphone (390x844), in modalità sia Cockpit Dark che Hangar Light.
     - Eseguita la suite Vitest con 57 test passati al 100% e build Vite completata senza errori.
- **Scelte architetturali & Rationale**:
  - *Safety Guard contro Perdita Dati*: L'esame teorico AeCI dura 45 minuti e richiede concentrazione. Tasti o tap accidentali non devono mai provocare la perdita della sessione. Il blocco con conferma a doppio pulsante (con focus sulla continuazione dell'esame) protegge l'utente senza intrappolarlo.
  - *Accessibilità e Contrasto Bimodale*: Le note personali devono risaltare visivamente all'aperto sia in tema scuro che in tema chiaro, offrendo al contempo strumenti completi di CRUD (Create, Read, Update, Delete) direttamente nei punti focali di studio (Archivio, Scheda Quesito, Quaderno Errori).
- **Impatto sul Desiderata**:
  - Eliminati entrambi i punti di attrito UX segnalati dall'utente. La PWA offre ora un flusso didattico ergonomico, affidabile e protetto da errori accidentali.

### [2026-09-27] - Fix Service Worker GitHub Pages & Diagnostica Google Drive API 403
- **Cosa abbiamo fatto**:
  - Risolto errore 404 del Service Worker (`Failed to register a ServiceWorker for scope ('https://alessandroame.github.io/') with script ('https://alessandroame.github.io/sw.js')`): rimosso il blocco manuale ridondante in `src/main.tsx` che forzava `/sw.js` alla root del dominio anziché rispettare il base path `/Quiz_VDS-VL/`. La registrazione è ora interamente delegata al file `registerSW.js` generato e iniettato automaticamente da `vite-plugin-pwa`.
  - Risolto l'avviso correlato del browser `cross-world service worker resource mismatch` e `link preload not used`.
  - Diagnosticato e gestito l'errore `403 (Forbidden)` sulle chiamate `https://www.googleapis.com/drive/v3/files`: la Google Drive API deve essere abilitata nel progetto Google Cloud associato al Client ID.
  - Aggiornato `src/services/googleDrive.ts` con un metodo dedicato `handleApiError` che intercetta i codici 403 e fornisce messaggi diagnostici chiari in italiano anziché fallire silenziosamente o mostrare messaggi generici.
  - Aggiunti unit test dedicati `DRV-07` e `DRV-08` in `src/services/googleDrive.test.ts` (suite portata a 65 test, 100% passati).
- **Scelte architetturali & Rationale**:
  - *Single Registration Authority*: Evitare doppie registrazioni conflittuali del Service Worker; `vite-plugin-pwa` calcola a compile-time il base path corretto sia per sviluppo locale (`/`) che per produzione GitHub Pages (`/Quiz_VDS-VL/`).
  - *Fail-Fast & Feedback Diagnostico*: Quando un servizio esterno (come Google Drive API) restituisce 403 per API disabilitata nel progetto Cloud, l'applicazione deve guidare lo sviluppatore/utente verso l'esatta schermata di abilitazione nella Cloud Console.
- **Impatto sul Desiderata**:
  - Deploy GitHub Pages perfettamente conforme come PWA offline senza errori in console.
  - Robustezza e resilienza del connettore Google Drive Cloud Sync.

### [2026-09-27] - Semplificazione UX Backup Google Drive & Supporto .env
- **Cosa abbiamo fatto**:
  - Rimosso il campo di testo obbligatorio "Google OAuth Client ID" dalla vista primaria del pannello Impostazioni: ora l'utente vede direttamente i comodi pulsanti ad azione singola **"Salva su Drive"** e **"Ripristina da Drive"**.
  - Integrata in `src/services/googleDrive.ts` la lettura automatica della variabile d'ambiente `import.meta.env.VITE_GOOGLE_CLIENT_ID`.
  - Creato il file di documentazione [`.env.example`](file:///c:/github/Quiz_VDS-VL/.env.example) con le istruzioni per configurare il Client ID a livello di progetto.
  - Relegata la configurazione manuale del Client ID a un menu espandibile secondario ("Opzioni Avanzate"), evitando di disorientare gli utenti finali.
  - Valorizzato il "Backup File Locale (JSON)" come metodo predefinito zero-config, sicuro e 100% offline.
- **Scelte architetturali & Rationale**:
  - *Zero Technical Friction per l'Utente Finale*: Gli studenti/piloti non devono interagire con concetti da sviluppatore (OAuth Client ID). Il flusso di backup cloud deve avviarsi in 1 click aprendo il popup standard Google Account.
- **Impatto sul Desiderata**:
  - Esperienza utente nelle Impostazioni allineata ai più elevati standard moderni di usabilità e privacy.

### [2026-09-27] - Integrazione Audio Avionico & Sintesi Vocale Fonetica ICAO
- **Cosa abbiamo fatto**:
  - Sviluppato modulo di fonetica aeronautica ICAO (`src/utils/aviationPhonetics.ts`) con conversione numeri e abbreviazioni avioniche, coperto da suite di unit test (`src/utils/aviationPhonetics.test.ts`).
  - Implementato `voiceService.ts` e hook `useAviationVoice.ts` per la lettura automatica o manuale delle domande d'esame tramite Web Speech API con tuning per voce italiana.
  - Implementato sound generator sintetico avionico via Web Audio API (`src/utils/audio.ts`) per click, feedback risposta (ding/buzzer) e allarmi quota/tempo.
  - Aggiunti controlli audio dedicati in `SettingsModal.tsx` (volume, muto, toggle voce) e pulsante altoparlante in `QuestionCard.tsx`.
- **Scelte architetturali & Rationale**:
  - *Zero dipendenze esterne per l'audio*: Generazione suoni via oscillatori nativi Web Audio API e sintesi vocale via Web Speech API del browser, preservando l'architettura 100% offline-first senza scaricare pesanti file audio binari.
  - *Fonetica ICAO*: I numeri e i termini tecnici aeronautici vengono pronunciati secondo gli standard radiofonici ICAO per massima fedeltà al contesto didattico di volo.
- **Impatto sul Desiderata**:
  - Requisito di accessibilità e audio cockpit completato e collaudato con successo.

### [2026-09-27] - Fix Critico Sistema Temi (Cockpit Dark / Hangar Light) & Diagnosi Chrome

- **Cosa abbiamo fatto**:
  - Diagnosticato con CDP headless e risolto il motivo per cui il cambio tema non produceva effetti visivi nel browser:
    1. In `tailwind.config.js` mancava la registrazione della variante `light:`, impedendo la generazione nel CSS di oltre 150 regole `light:*` presenti nei componenti. Aggiunto il plugin con `addVariant('light', ':is(.light &)')`.
    2. La sequenza di toggle rapido in `Navbar.tsx` partiva da `system` (risolto scuro su OS dark) e passava a `dark` (ancora visivamente scuro), provocando un click a vuoto invisibile. Riprogettata la transizione per passare immediatamente a `light` se il tema attuale percepito è scuro.
    3. In `ThemeContext.tsx`, Dexie sovrascriveva il `localStorage` impostando `system` se non trovava record salvati. Corretta la query per verificare la presenza reale di `entry.value`.
    4. In `index.html`, il tag `<body>` conteneva la classe fissa `bg-slate-950 text-slate-100` senza la variante `light:bg-slate-50 light:text-slate-900`.
  - Collaudato con successo in Chrome CDP headless il passaggio esplicito tra tutti e 3 i temi (`light`, `dark`, `system`) sia da Navbar che dal pannello Impostazioni, con verifica dei computed styles e zero errori in console.
- **Scelte architetturali & Rationale**:
  - *Feedback Visivo Immediato*: Il toggle rapido nell'header deve sempre produrre una variazione visiva percepibile al primo click, invertendo la modalità corrente senza stati intermedi invisibili.
  - *Sincronizzazione coerente SSOT*: Il `localStorage` gestisce l'idratazione sincrona immediata pre-paint per evitare flash di stile scorretto (FOUC), mentre IndexedDB garantisce la persistenza del profilo.
- **Impatto sul Desiderata**:
  - Il sistema a doppio tema avionico (Cockpit Dark per uso notturno/standard e Hangar Light per visibilità sotto il sole) è ora 100% funzionante e reattivo in qualsiasi browser e dispositivo.

### [2026-09-27] - Governance: Separazione Desiderata, Worklog e Regole di Dominio
- **Cosa abbiamo fatto**:
  - Creato [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) nella root come bussola funzionale, matrice di stato e guida di onboarding per i nuovi agenti.
  - Creato [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md) come diario di bordo cronologico e registro ADR (Architectural Decision Records).
  - Ripulito e ottimizzato [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md) affinché rimanga un prontuario ultra-denso e compatto delle sole regole di dominio e vincoli tecnici stabili.
  - Aggiornato [.agents/AGENTS.md](file:///c:/github/Quiz_VDS-VL/.agents/AGENTS.md), il workflow [task_lifecycle.md](file:///c:/github/Quiz_VDS-VL/.agents/workflows/task_lifecycle.md), la skill [self-correction-loop](file:///c:/github/Quiz_VDS-VL/.agents/skills/self-correction-loop/SKILL.md) e la regola [constraints.md](file:///c:/github/Quiz_VDS-VL/.agents/rules/constraints.md) per sancire l'obbligo di aggiornare `WORKLOG.md` e consultare `DESIDERATA.md`.
- **Scelte architetturali & Rationale**:
  - *Separation of Concerns (SoC) nella documentazione di progetto*: Incorporare il diario di bordo all'interno di `MEMORY.md` lo avrebbe reso ingestibile, consumando token e diluendo le regole vincolanti lette ad ogni pre-flight. Separare **Desiderata** (cosa vogliamo fare), **Worklog** (cosa abbiamo fatto e perché) e **Memory** (vincoli e regole stabili) offre massima chiarezza e rapidità di consultazione sia ad agenti che a umani.
- **Impatto sul Desiderata**:
  - Architettura di governance e onboarding completata al 100%. Qualsiasi agente futuro può orientarsi in 30 secondi e sa dove registrare le scelte prese.

### [2026-09-27] - Architettura Suite Vitest & Refactoring SRP
- **Cosa abbiamo fatto**:
  - Estratto la logica pura di valutazione esame in `src/services/examEvaluator.ts`, il timer in `src/utils/timer.ts` e il calcolo analitico in `src/utils/analytics.ts`.
  - Implementata una suite di unit & integration test con Vitest (`tests/unit/examEvaluator.test.ts`, `tests/unit/timer.test.ts`, `tests/unit/analytics.test.ts`, `tests/unit/randomizer.test.ts`, `tests/integration/db.test.ts`).
  - Applicata Boundary Value Analysis (BVA) sulle soglie di idoneità (2, 3, 4 errori per esame standard; 6, 7 per maratona) e simulazione Monte Carlo su 100 estrazioni del randomizer.
  - Configurato l'ambiente in-memory per Dexie con `fake-indexeddb/auto`.
- **Scelte architetturali & Rationale**:
  - *Single Responsibility Principle (SRP)*: Disaccoppiare la logica matematica e di business dal ciclo di vita di React evita race conditions e rende i moduli puri, deterministici e testabili in millisecondi (<500ms) senza overhead di rendering DOM.
  - *Bando ai test fittizi (Zero Faux-Testing)*: Scrittura di test basati su specifiche regolamentari esterne e indipendenti per impedire logiche circolari o tautologiche.
- **Impatto sul Desiderata**:
  - Massima solidità e verificabilità della business logic. La suite conta 50 test unitari ed esegue in ~430ms.

### [2026-09-27] - Sviluppo Interfaccia Cockpit & 5 Sezioni Funzionali
- **Cosa abbiamo fatto**:
  - Implementato il layout cockpit responsive con navigazione primaria a 5 tab (**Esame**, **Materie**, **Errori**, **Archivio**, **Stats**).
  - Creata la schermata **Esame** con 30 quiz conformi alle quote ministeriali, countdown 45 min, griglia interattiva con flag `⚑ Rivedi` e schermata di debriefing finale.
  - Creata la sezione **Materie** con filtro per le 9 materie e visualizzazione didattica immediata.
  - Implementato il **Quaderno Errori** con ripetizione spaziata (uscita solo dopo 2 risposte corrette consecutive).
  - Implementato l'**Archivio** con ricerca full-text istantanea e gestione preferiti/note.
  - Creata la dashboard **Stats** con indice di prontezza esame, radar delle 9 materie e storico sessioni.
  - Aggiunte scorciatoie da tastiera desktop (`1`, `2`, `3`, `F`, `Spazio`/frecce).
- **Scelte architetturali & Rationale**:
  - *Design System Avionico ad alto contrasto*: Ottimizzato specificamente per la consultazione su campo di volo/decollo o in condizioni di forte illuminazione solare (palette Cockpit Dark & Hangar Light).
  - *Microcopy essenziale*: Nessun testo prolisso o verboso nei bottoni e nelle schermate; etichette brevi, asciutte e telegrafiche.
- **Impatto sul Desiderata**:
  - Tutte le funzionalità utente principali della PWA sono operative e navigabili nel browser.

### [2026-09-27] - Scaffolding PWA, Layer Database Dexie & Motore Fair Coverage
- **Cosa abbiamo fatto**:
  - Inizializzato stack Vite + React 19 + TypeScript + Tailwind CSS.
  - Configurato il database IndexedDB locale tramite Dexie (`src/db/index.ts`, `src/types/database.ts`).
  - Sviluppato l'algoritmo `FairCoverageRandomizer` (`src/services/randomizer.ts` e `src/utils/fairRandomizer.ts`) per l'estrazione bilanciata dei quiz.
  - Integrato il modulo Google Identity Services (GIS) per il backup su Google Drive (`appDataFolder`) e l'export/import JSON locale.
  - Configurato Workbox via `vite-plugin-pwa` per il caching offline totale e generato il set di icone PWA.
- **Scelte architetturali & Rationale**:
  - *Dexie.js anziché LocalStorage*: LocalStorage ha un limite di 5MB ed è sincrono/bloccante sul main thread. Dexie offre query asincrone indicizzate e reattività integrata tramite `dexie-react-hooks`.
  - *Fair Coverage a Bucket*: I generatori pseudocasuali puri provocano una dispersione eccessiva delle domande non viste. La priorità a bucket (`times_seen == 0` prima di tutto) azzera il coupon collector problem.
  - *Google Drive appDataFolder*: Permette la sincronizzazione cloud opzionale e privata dell'utente senza richiedere backend server remoti gestiti.
- **Impatto sul Desiderata**:
  - Requisito di PWA installabile, 100% offline-first e con persistenza locale robusta completato.

### [2026-09-27] - Estrazione Dataset 504 Quiz AeCI & Regolamento
- **Cosa abbiamo fatto**:
  - Analizzato il PDF ufficiale `quiz_VDS-VL_2017.pdf` (504 quesiti, 9 materie, griglia risposte pp. 50-51).
  - Sviluppata la pipeline di estrazione Python (`extract_quizzes.py`), risolvendo l'anomalia del quiz 7037 (numerato 4, 5, 6 nel PDF originale), normalizzando cesure e caratteri speciali.
  - Generate le sintesi didattiche (`Regola` + `Tranello`) per ogni quiz.
  - Validata l'integrità del dataset (504 quiz, 3 risposte a quesito, 1 sola esatta) e generati `src/data/questions.json`, `public/data/questions.json` e `src/types/quiz.ts`.
- **Scelte architetturali & Rationale**:
  - *Dataset statico JSON come SSOT immutabile*: Azzerare qualsiasi dipendenza da backend esterni o chiamate API di rete durante l'uso dell'applicazione, garantendo caricamento istantaneo e funzionamento offline deterministico.
  - *Spiegazioni telegrafiche (Regola + Tranello)*: Evitare di incorporare testi didattici prolissi da manuali non autorizzati; focalizzare l'attenzione del candidato solo sul principio normativo/fisico e sul tranello tipico della domanda.
- **Impatto sul Desiderata**:
  - Dataset completo e validato al 100%. Base dati solida e pronta per il motore quiz e l'interfaccia PWA.
