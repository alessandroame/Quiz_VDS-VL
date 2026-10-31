### [2026-10-31] - Ricalibrazione Scala Velocità Voce Centrata su `1.25x` (`0.9x..1.6x`) (v1.11.2)

- **Cosa abbiamo fatto**:
  - **Scala Simmetrica a 5 Livelli con `1.25x` come Valore Medio e Predefinito ([src/types/audio.ts](file:///c:/github/Quiz_VDS-VL/src/types/audio.ts), [src/db/index.ts](file:///c:/github/Quiz_VDS-VL/src/db/index.ts), [src/services/voiceService.ts](file:///c:/github/Quiz_VDS-VL/src/services/voiceService.ts), [src/context/QuizContext.tsx](file:///c:/github/Quiz_VDS-VL/src/context/QuizContext.tsx))**:
    - Centralizzate in `src/types/audio.ts` le costanti `TTS_PLAYBACK_RATES = [0.9, 1.1, 1.25, 1.4, 1.6]` e `DEFAULT_TTS_PLAYBACK_RATE = 1.25`, portando l'ex massimo `1.25x` esattamente al centro della scala (mediana `1.25x`, punto medio `(0.9 + 1.6) / 2 = 1.25x`, media aritmetica `1.25x`) e come velocità predefinita.
  - **Allineamento UI Selettori Velocità ([src/components/SettingsModal.tsx](file:///c:/github/Quiz_VDS-VL/src/components/SettingsModal.tsx), [src/components/VoiceQuickMenu.tsx](file:///c:/github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx))**:
    - Aggiornate le griglie di selezione velocità a `grid-cols-5` con `whitespace-nowrap` e target touch ergonomici sia nelle Impostazioni generali sia nel menu rapido Voce della Modalità Mani Libere e delle viste Quiz.
    - Aggiunto test unitario sull'invariante di centratura e selezione velocità in [src/components/VoiceQuickMenu.test.ts](file:///c:/github/Quiz_VDS-VL/src/components/VoiceQuickMenu.test.ts).
- **Scelte architetturali & Rationale**:
  - Le tracce neurali Edge-TTS (`DiegoNeural`) sono registrate a cadenza leggermente distesa (`-4%`): centrare la scala su `1.25x` con due marce superiori (`1.4x` e `1.6x`, che preservano il timbro tramite `HTMLAudioElement.preservesPitch`) e due inferiori (`0.9x` e `1.1x`) offre un ritmo naturale di default e un ripasso rapido senza dover rigenerare i file MP3 offline.
- **Impatto sul Desiderata**:
  - Migliora l'ergonomia di studio vocale e il ritmo d'ascolto in Modalità Mani Libere (`v1.11.2`).
