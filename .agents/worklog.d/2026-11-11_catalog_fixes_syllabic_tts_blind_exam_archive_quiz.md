# ADR: Bonifica Formule/Testi 30 Quiz, Pronuncia Sillabica VDS-VL, Simulazione Esame Cieca e Quiz su Filtro Archivio (v1.14.0)

- **Data**: 2026-11-11
- **Versione**: `v1.14.0`
- **Tipo**: `fix(catalog,tts)` + `feat(exam,archive)`

## 1. Contesto e Obiettivi
Risoluzione organica delle 7 segnalazioni utente sull'archivio quiz (pedici/apici fuori posto, refusi OCR e imprecisioni nelle spiegazioni didattiche), estesa sistematicamente a tutti i quesiti fratelli del catalogo di 504 domande, unita a tre miglioramenti funzionali:
1. Spelling sillabico italiano naturale per `VDS-VL` e per tutte le sigle tecniche/formule nel motore TTS neurale (eliminando la lettura *"quinto ds"* di `DiegoNeural`).
2. Modalità **Simulazione Esame Cieca** per Esame Ufficiale (30 quiz) e Maratona (60 quiz), sia in interfaccia classica sia in Modalità Mani Libere, senza alcuna correzione immediata fino alla consegna finale.
3. Pulsante `Inizia Quiz (N)` in `ArchiveScreen` per eseguire una sessione interattiva sulle domande correntemente filtrate.

## 2. Interventi Effettuati
1. **Bonifica Catalogo (`src/data/questions.json` + script `scripts/enrich_*.cjs`) e Ricerca/Voce Normalizzata**:
   - Corretti 30 quesiti complessivi (le 7 segnalazioni dirette `#2047`, `#2060`, `#2108`, `#7051`, `#7039`, `#5054`, `#2118` più 23 quesiti affini con pedici/apici ASCII o underscore `C_p`, `C_r`, `V2`, `S2`, `m2`, `O2`, `b2`, `E_p`, `rotori`, `il proprio tasso di caduta`), preservando intatto il testo ministeriale AeCI delle domande e opzioni dove richiesto (`#7051`, `#7020`, `#7021`).
   - Introdotta la normalizzazione Unicode bidirezionale in `src/utils/archiveFilters.ts` (`normalizeSearchText`) e `src/utils/voiceCommandParser.ts` (`normalizeVoiceText`) per consentire ricerca da tastiera smartphone (`"Cr"`, `"Cp"`, `"V2"`, `"O2"`, `"ro"`) e selezione vocale naturale delle formule.
2. **Fonetica Sillabica Italiana & Rigenerazione Differenziale MP3 (`aviationPhonetics.ts`, `generate_audio_database.py`, `audioDownloadManager.ts`)**:
   - Allineati `src/utils/aviationPhonetics.ts` e `scripts/generate_audio_database.py`: `VDS/VL` e `VDS-VL` espansi in `"vu di esse, vu elle"`, `VDS` in `"vu di esse"`, `VL` in `"vu elle"`; sigle tecniche scandite con nomi italiani minuscoli privi di accenti gravi artificiali; formule aerodinamiche (`Cₚ`, `Cᵣ`, `Eₚ`, `V²`, `S²`, `b²`, `m²`, `kg/m²`, `O₂`, `ρ`, `1/2` e `V` isolata -> `"vu"`) espanse in dizione naturale.
   - Rigenerati i 178 segmenti audio impattati per ciascuna voce (`giuseppe` ed `elsa`, 356 file MP3 totali con trimming FFmpeg del silenzio di coda), rigenerato `public/audio/manifest.json` (`bundleVersion: "1.1.0"`) e innalzata la soglia di auto-sync differenziale in `src/services/audioDownloadManager.ts` da `25` a `350` file.
3. **Simulazione Esame Cieca (`ExamScreen.tsx`, `QuestionNavigator.tsx`, `DriveModeScreen.tsx`, `DriveActiveHUD.tsx`)**:
   - Disattivato ogni feedback cromatico, testuale, aptico e sonoro di correttezza durante `official` e `marathon` (`showFeedback={examMode === 'tutor'}`, bolle neutre `border-sky-500/70` in `QuestionNavigator`, selezione ambra neutra e card didattica nascosta in `DriveActiveHUD`, click neutro al posto di `playCorrect`/`playWrong`).
   - Consentita la modifica della risposta già data fino alla pressione di `Consegna`, con auto-avanzamento simmetrico attivo solo alla prima risposta sul quesito (`!wasAlreadyAnswered`) e registrazione `recordAnswer` differita interamente a `handleSubmitExam` (incluso il caso di ripresa post-pausa).
4. **Esecuzione Quiz sui Risultati Filtrati in Archivio (`ArchiveScreen.tsx`, `ArchiveQuizSessionView.tsx`, `ArchiveItemCard.tsx`)**:
   - Estratto `ArchiveItemCard.tsx` per mantenere ogni file UI sotto la soglia modulare (`< 850` righe) e creato `ArchiveQuizSessionView.tsx`.
   - Aggiunto `#btn-archive-start-quiz` (`Inizia Quiz (N)`, `min-h-[44px]`, `whitespace-nowrap`, contrasto WCAG AA `bg-amber-700`) collegato a `SessionConflictModal`, `SessionInterruptModal`, `QuizBottomBar`, switch `Mani Libere` e ripresa rapida `InProgressSession` (`type: 'archive'`) in `HomeScreen.tsx` e `App.tsx`.

## 3. Verifica e Qualità
- **Unit & Component Tests**: `60/60` suite verdi (`491/491` test passati), inclusi `DATA-11` anti-regressione catalogo, fonetica sillabica `aviationPhonetics.test.ts`, `QuestionNavigator.test.ts`, `DriveAnswerFeedback.test.ts`, `ExamScreenBlindMode.test.ts` e `ArchiveScreen.test.ts`.
- **Build & Multi-Viewport Browser Probe**: `npm run build` (`tsc && vite build`) completato con zero errori e verifica geometrica/interattiva CDP su `360x800` e `1280x800` con `0` errori console, `0` overflow orizzontali e `0` leak didattici in Esame Ufficiale.
