# [2026-10-31] - Allineamento al Regolamento Ufficiale AeCI Volo Libero (100 Punti Pesati, Quote, Verifica Orale 80–85 e Timer Differenziato Scritto/Audio) (v1.12.0)

- **Cosa abbiamo fatto**:
  - **Modulo SSOT Normativo (`src/utils/aeciRegulation.ts`)**:
    - Codificate le costanti ufficiali del *Regolamento Tecnico-Operativo-Didattico Volo Libero (VDS/VL)* dell'Aero Club d'Italia:
      - Pesi per materia (`SUBJECT_POINT_WEIGHTS`): `4 pt` (Meteorologia `05`, Tecnica di Pilotaggio `07`, Sicurezza del Volo `09`), `3 pt` (Normativa `01`, Aerodinamica `02`), `2 pt` (Pronto Soccorso `03`, Fisiopatologia `04`, Strumenti `06`, Materiali `08`).
      - Quote scheda d'esame ufficiale da 30 quesiti (`OFFICIAL_EXAM_QUOTAS`): Normativa `4` (12 pt), Aerodinamica `8` (24 pt), Pronto Soccorso `1` (2 pt), Fisiopatologia `1` (2 pt), Meteorologia `6` (24 pt), Strumenti `1` (2 pt), Tecnica `5` (20 pt), Materiali `1` (2 pt), Sicurezza `3` (12 pt) = **30 quiz / 100 punti esatti** (Maratona 60 quiz = quote raddoppiate per **200 punti grezzi**).
      - Soglie a 3 fasce: `PASSING_SCORE_POINTS = 86` (`86–100` Idoneo), `ORAL_CHECK_MIN_POINTS = 80` (`80–85` Idoneo con Verifica Orale), `< 80` Non Idoneo.
      - Durate timer: `OFFICIAL_WRITTEN_TIMER_MINUTES = 30` (default prova scritta), `EXTENDED_EXAM_TIMER_MINUTES = 45` (opzione estesa), `HANDS_FREE_AUDIO_TIMER_MINUTES = 45` (minimo automatico per lettura vocale TTS in Modalità Mani Libere), `MARATHON_TIMER_MINUTES = 60`.
  - **Motore di Valutazione, Randomizer e Indice di Preparazione (`examEvaluator.ts`, `fairRandomizer.ts`, `analytics.ts`, `database.ts`, `db/index.ts`, `QuizContext.tsx`)**:
    - Estesi `ExamSession` e `SubjectBreakdownEntry` con campi opzionali retrocompatibili (`examOutcome: 'passed' | 'oral_check' | 'failed'`, `scorePoints`, `maxPoints`, `rawPoints`, `rawMaxPoints`, `pointWeight`, `pointsEarned`, `pointsLost`).
    - Applicata la valutazione pesata in centesimi (`/100 pt`) esclusivamente alle schede bilanciate sulle 9 materie (**Esame Ufficiale 30**, **Tutor Standard 30**, **Maratona 60** normalizzata da 200 a `/100`), mantenendo conteggio risposte e accuratezza `%` su **Tutor Flash 10**, **Tutor Continuo**, **Studio Singola Materia** e **Quaderno Errori**.
    - Aggiunto spareggio secondario per peso (`4 > 3 > 2`) a parità di errori attivi in `generateFlashTutorQuestions`.
    - Aggiornato `calculateReadinessScore` ponderando l'accuratezza sui quiz visti (`35%`) per i pesi `4/3/2` pt sugli ID ufficiali `1001..9045` (fallback `1` su ID sintetici `< 1000`) e assegnando peso `0.5` alle simulazioni chiuse in fascia `'oral_check'`.
    - Garantita piena retrocompatibilità tramite `resolveSessionOutcome(session)` per tutte le sessioni storiche salvate in Dexie o su Google Drive prima della `v1.12.0`.
  - **Interfaccia Utente e Timer Differenziato (`ExamScreen.tsx`, `DriveModeScreen.tsx`, `DriveLauncher.tsx`, `DriveDebriefing.tsx`, `HomeScreen.tsx`, `StatsScreen.tsx`, `TopicsScreen.tsx`, `SettingsModal.tsx`)**:
    - Esito debriefing a 3 fasce cromatiche e testuali (`IDONEO` smeraldo, `IDONEO CON VERIFICA ORALE` ambra con azione rapida *"Prepara Verifica Orale"*, `NON IDONEO` rosa), punteggio primario `/100 pt` e dettaglio punti persi per materia (`-4 pt`, `-3 pt`, `-2 pt`).
    - Selettore `Durata Timer Esame Scritto` (`30 min Ufficiale AeCI` / `45 min Esteso`) in `SettingsModal.tsx` (sezione Aspetto) e aggiornamento scheda normativa nella sezione About; `DriveModeScreen.tsx` garantisce automaticamente almeno `45` minuti per l'esame audio a 30 quiz e valuta correttamente sul punteggio `/100` anche Maratona (60) e Tutor (30) avviati a mani libere.
    - Badge informativi passivi del peso materia (`4 pt`, `3 pt`, `2 pt`) in `TopicsScreen.tsx` e `StatsScreen.tsx`, contatore `{oralCheckCount} orale` e badge storico a 3 fasce.
  - **Test Unitari & BVA (`fairRandomizer.test.ts`, `examEvaluator.test.ts`, `analytics.test.ts`, `SettingsModal.test.ts`)**:
    - Aggiunti `RAND-10..11`, `EVAL-17..20`, `STAT-07..08` e test toggle `#exam-timer-btn-30`/`#exam-timer-btn-45` (totale **482 test** su **58 suite** tutti verdi al 100% senza alterare asserzioni preesistenti).

- **Scelte architetturali & Rationale**:
  - **Applicazione Selettiva del Punteggio `/100` (Zero Distorsioni Didattiche)**: Applicare i pesi in centesimi a sessioni mono-materia (es. 20 quiz di Pronto Soccorso tutti da `2 pt`) o micro-blocchi Flash da 10 domande avrebbe prodotto punteggi in centesimi privi di significato regolamentare. Confinare il `/100` alle sole schede bilanciate sulle 9 materie (30 e 60 quiz) riproduce fedelmente l'esame AeCI preservando metriche intuitive nello studio quotidiano.
  - **Isolamento in Modulo Foglia `aeciRegulation.ts`**: Separare costanti e funzioni pure di peso dal modulo `fairRandomizer.ts` evita rotture nei test componenti che effettuano mock parziali di `fairRandomizer` senza `importOriginal`.
  - **Timer Differenziato Scritto (`30 min`) vs Audio (`45 min`)**: L'ascolto completo tramite sintesi vocale neurale di 30 domande e 90 opzioni richiede fisiologicamente ~12–15 minuti di solo parlato; mantenere `45` minuti minimi in Modalità Mani Libere evita penalizzazioni artificiali dovute alla durata dell'audio rispettando i `30` minuti ufficiali nella prova scritta a schermo.

- **Impatto sul Desiderata**:
  - Piena conformità normativa del simulatore d'esame, del debriefing e delle statistiche al Regolamento Tecnico-Operativo-Didattico Volo Libero AeCI vigente, con zero regressioni sullo storico esistente dell'allievo.
