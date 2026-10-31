### [2026-10-31] - Pulizia Trascrizione Vocale Residua al Cambio Domanda e Apertura Microfono Silenziosa (v1.11.3)

- **Cosa abbiamo fatto**:
  - **Reset Immediato `lastTranscript` e Banner HUD al Cambio Domanda ([useDriveVoiceCommands.ts](file:///c:/github/Quiz_VDS-VL/src/hooks/useDriveVoiceCommands.ts), [DriveModeScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx), [DriveActiveHUD.tsx](file:///c:/github/Quiz_VDS-VL/src/components/drive/DriveActiveHUD.tsx))**:
    - Azzerato `lastTranscript` su `stop()`, su `rec.onstart()` e tramite `resetKey: currentQ?.id` al passaggio alla domanda successiva, insieme a `lastRecognizedLabel` e ai timer di feedback.
    - Rimossa l'attivazione di `isReceiving` su `rec.onaudiostart` / `rec.onsoundstart` (che scattano all'apertura hardware del microfono anche nel silenzio), attivandola esclusivamente su `rec.onspeechstart` e `rec.onresult`.
    - Rimosso il fallback a `voiceLastTranscript` dentro lo stato `In ricezione:` di `DriveActiveHUD.tsx` quando non è presente alcuna trascrizione `interim` corrente, evitando che la risposta della domanda precedente riappaia all'accensione del microfono.
    - Esteso il test E2E `DRIVE-REFINE-E2E-03` in [DriveVoiceRefinement.test.ts](file:///c:/github/Quiz_VDS-VL/src/components/drive/DriveVoiceRefinement.test.ts).
- **Scelte architetturali & Rationale**:
  - Separare l'apertura hardware del microfono (`onaudiostart`) dall'effettiva rilevazione del parlato (`onspeechstart`/`onresult`) e azzerare `resetKey` a ogni nuovo `question.id` garantisce che ogni domanda inizi con il banner vocale neutro sia in modalità Altoparlante sia in modalità Cuffie.
- **Impatto sul Desiderata**:
  - Elimina il residuo visivo della risposta precedente in Modalità Mani Libere (`v1.11.3`).
