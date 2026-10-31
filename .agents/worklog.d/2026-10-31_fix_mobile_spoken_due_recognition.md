### [2026-10-31] - Fix Riconoscimento Vocale Mobile su Numeri in Lettere ("due"), Finalizzazioni Vuote ed Eventi `no-match` (v1.11.1)

- **Cosa abbiamo fatto**:
  - **Recupero Snapshot `interim` su Finalizzazione Vuota e Flush su `no-match` Mobile ([useDriveVoiceCommands.ts](file:///c:/github/Quiz_VDS-VL/src/hooks/useDriveVoiceCommands.ts))**:
    - Introdotto `lastValidInterimRef` per preservare l'ultima trascrizione `interim` valida (es. *"due"* scritto in lettere durante lo streaming) quando Chrome Android / WebView invia subito dopo un pacchetto `isFinal: true` con `transcript: ""` vuoto al fallimento della conversione numerica (ITN).
    - Gestiti gli stati transitori mobile `'no-match'`, `'aborted'` e `'speech-timeout'` in `rec.onerror` eseguendo il flush immediato di eventuale comando `interim` già riconosciuto (`pendingFlushRef`) senza impostare il banner rosso `Mic: no-match`.
    - Avanzato `lastHandledIndexRef` anche dopo segmenti `interim` non riconosciuti (respiri/rumori di fondo), aggiunto fallback sul solo segmento di coda (`tailAlternatives`) e rilevato il riuso in-place dello slot `results[0]` su mobile senza doppi invii.
    - Aggiunta la callback esplicita `onUnrecognized` invocata esclusivamente quando un enunciato stabilizzato termina con `resolved === null`, rimuovendo in [DriveModeScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx) il fragile `useEffect([voiceLastTranscript])` post-render.
  - **Estensione Grammatica Italiana Numeri in Lettere & Punteggiatura Unicode ([voiceCommandParser.ts](file:///c:/github/Quiz_VDS-VL/src/utils/voiceCommandParser.ts))**:
    - Estesa `normalizeVoiceText` alla rimozione di caratteri zero-width e punteggiatura Unicode (`/[^\p{L}\p{N}\s]/gu`).
    - Estesa `matchCoreVoiceGrammar` a tutte le forme naturali parlate con articoli maschili/elisi e brevi intercalari (*"due"*, *"il due"*, *"il 2"*, *"l'uno"*, *"il tre"*, *"è due"*, *"è la due"*, *"eh due"*, *"ok due"*, *"allora due"*, *"dico due"*, *"rispondo due"*, *"metto la due"*), evitando al contempo che testi d'opzione multi-parola che iniziano con *"Uno spazio..."* vengano intercettati come comando diretto `opt1`.
  - **Test di Regressione Unitari ed E2E**:
    - Aggiunti `VC-16` in [voiceCommandParser.test.ts](file:///c:/github/Quiz_VDS-VL/src/utils/voiceCommandParser.test.ts), 2 test sul ciclo mobile `interim -> empty final / no-match / slot-0 reuse` in [useDriveVoiceCommands.test.ts](file:///c:/github/Quiz_VDS-VL/src/hooks/useDriveVoiceCommands.test.ts) e `DRIVE-REFINE-E2E-03` in [DriveVoiceRefinement.test.ts](file:///c:/github/Quiz_VDS-VL/src/components/drive/DriveVoiceRefinement.test.ts).
- **Scelte architetturali & Rationale**:
  - Su smartphone lo streaming STT emette sempre *"due"* in lettere durante `isFinal: false` e lo converte in cifra *"2"* solo se la passata finale cloud ITN va a buon fine; intercettare sia il pacchetto `isFinal` vuoto sia l'evento `no-match` prima della cancellazione del timer garantisce che *"due"* in lettere selezioni la Risposta 2 con la stessa affidabilità di *"2"* in cifra.
- **Impatto sul Desiderata**:
  - Consolida l'affidabilità su smartphone reali della Modalità Mani Libere (`v1.11.1`).
