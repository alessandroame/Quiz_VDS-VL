---
name: vds-quiz-extractor
description: Estrazione, normalizzazione e validazione di integrità dei 504 quiz VDS-VL AeCI da file PDF a schema JSON tipizzato.
version: 1.0.0
language: it-IT
---

# Profilo Operativo: VDS Quiz Extractor
Questa skill guida l'estrazione dati ad alta fedeltà dal documento ufficiale AeCI `quiz_VDS-VL_2017.pdf`.

## Regole di Estrazione
1. **Layout a 2 Colonne**:
   - Dividere ciascuna delle pagine 1-49 verticalmente a metà (X = 297.5 pt).
   - Elaborare prima la colonna sinistra, poi la destra.
   - Gestire le domande che iniziano in fondo a una colonna e continuano in cima alla successiva.
2. **Normalizzazione Testuale**:
   - Ricongiungere le parole spezzate con trattino a fine riga (es. `del-taplano` -> `deltaplano`, `auto-rizzazioni` -> `autorizzazioni`).
   - Sostituire le virgolette e apostrofi non standard con apostrofi corretti UTF-8 (`’` -> `'`).
   - Mantenere le lettere accentate italiane corrette (`à`, `è`, `é`, `ì`, `ò`, `ù`).
3. **Mappatura Risposte Esatte**:
   - Estrarre le risposte dalle pagine 50-51 (`X.YYY - Z`, dove X.YYY corrisponde all'ID domanda e Z = 1, 2, 3).
   - Nessun quiz deve rimanere senza soluzione associata (504/504).
4. **Struttura Schematica Output**:
```json
{
  "id": 1001,
  "subjectId": 1,
  "subjectName": "Normativa e Legislazione",
  "question": "Chi può praticare autonomamente il volo libero?",
  "options": [
    "Chiunque può praticare quest'attività sportiva purché abbia frequentato un apposito corso.",
    "Chiunque, munito dei requisiti richiesti dalle norme in vigore (Attestato in corso di validità e copertura assicurativa RCT).",
    "Chiunque può praticare quest'attività purché abbia superato un esame Ae.C.I.."
  ],
  "correctAnswer": 2,
  "explanation": {
    "rule": "D.P.R. 133/2010 art. 11 e 21: attestato valido e polizza RCT sono obbligatori per volare legalmente.",
    "trap": "Il solo superamento dell'esame o la frequenza del corso non abilitano al volo autonomo senza attestato emesso e assicurazione attiva."
  }
}
```
5. **Criteri di Validazione**:
   - Esattamente 504 quiz estratti.
   - Per ciascun quiz: 3 opzioni non vuote, `correctAnswer` compreso tra 1 e 3.
