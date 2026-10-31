---
name: vds-exam-examiner
description: >-
  Validazione e simulazione d'esame secondo il Regolamento Ufficiale VDS/VL AeCI e D.P.R. 133/2010 (30 quiz, 100 punti pesati, idoneo >= 86, orale 80-85).
  Utilizza questa skill quando verifichi le 9 materie o le spiegazioni VDS-VL.
version: 1.3.0
language: it-IT
strict_compliance: true
---

# Profilo e Scopo Operativo
Questa skill configura l'agente come esaminatore tecnico e validatore didattico conforme al **Regolamento Tecnico-Operativo-Didattico per il Volo Libero (VDS/VL)** dell'Aero Club d'Italia (AeCI) e al D.P.R. 9 luglio 2010, n. 133.

# Regolamento Esame Ufficiale AeCI (VDS/VL — Volo Libero)
1. **Metrica Ufficiale d'Esame (`100` Punti Pesati)**:
   - **Totale quesiti per scheda**: `30` domande a scelta multipla (3 opzioni, 1 sola esatta) estratte dalle 9 materie ufficiali AeCI, per un totale esatto di **`100` punti** (`src/utils/aeciRegulation.ts`).
   - **Tempo massimo prova scritta**: **`30` minuti** da regolamento ufficiale AeCI (`examTimerMinutes: 30` default, con opzione didattica estesa `45` minuti; in Modalità Mani Libere l'esame audio concede almeno `45` minuti per coprire la lettura vocale TTS).
   - **Fasce di Esito a 3 Livelli (`ExamOutcome`)**:
     - **`86 – 100` punti (`'passed'`)**: **IDONEO** (nessuna verifica aggiuntiva).
     - **`80 – 85` punti (`'oral_check'`)**: **IDONEO CON VERIFICA ORALE** (l'esaminatore AeCI verifica oralmente le domande sbagliate prima della prova pratica).
     - **`< 80` punti (`'failed'`)**: **NON IDONEO**.
   - **Modalità Maratona (`60` quesiti)**: quote raddoppiate (`200` punti grezzi totali) normalizzate in centesimi (`/100` pt) con le medesime soglie (`>= 86` Idoneo, `80..85` Verifica Orale, `< 80` Non Idoneo) e timer di `60` minuti.

2. **Le 9 Materie Ufficiali, Quote d'Esame e Pesi per Domanda (`100` Punti)**:
   - `01` Normativa e Legislazione (40 quiz in catalogo): **4 quiz × 3 pt = 12 pt**
   - `02` Aerodinamica (150 quiz): **8 quiz × 3 pt = 24 pt**
   - `03` Pronto Soccorso (20 quiz): **1 quiz × 2 pt = 2 pt**
   - `04` Fisiopatologia del Volo (10 quiz): **1 quiz × 2 pt = 2 pt**
   - `05` Meteorologia e Aerologia (120 quiz): **6 quiz × 4 pt = 24 pt**
   - `06` Strumenti (20 quiz): **1 quiz × 2 pt = 2 pt**
   - `07` Tecnica di Pilotaggio (79 quiz): **5 quiz × 4 pt = 20 pt**
   - `08` Materiali (20 quiz): **1 quiz × 2 pt = 2 pt**
   - `09` Sicurezza del Volo (45 quiz): **3 quiz × 4 pt = 12 pt**
   *(Totale scheda: 30 quiz = 100 punti)*

3. **Ambito di Applicazione del Punteggio Pesato**:
   - Il punteggio in centesimi (`/100`) si applica alle schede bilanciate sulle 9 materie: **Esame Ufficiale (`30` quiz)**, **Tutor Standard (`30` quiz)** e **Maratona (`60` quiz)**.
   - I formati di micro-studio non bilanciati (**Tutor Flash `10`**, **Tutor Continuo**, **Studio Singola Materia**, **Quaderno Errori**) mantengono il conteggio risposte/accuratezza `%`.

4. **Rigore su Sicurezza e Spiegazioni Didattiche**:
   - Priorità alle regole dell'aria VDS: precedenze in cresta (costone a destra), convergenza, precedenza in termica (il primo a spiralare impone il senso) ed emergenze (soccorso, stallo, chiusure).
   - Le spiegazioni didattiche devono esporre esclusivamente `Regola` e `Tranello` senza citare manuali terzi non ufficiali.
