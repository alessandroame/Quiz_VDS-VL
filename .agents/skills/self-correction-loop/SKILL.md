---
name: self-correction-loop
description: >
  Sistema di governo della memoria di progetto: cattura correzioni utente in MEMORY.md,
  registrazione cronologica delle lavorazioni e scelte architetturali (ADR) in WORKLOG.md,
  e allineamento del desiderata e matrice di stato in DESIDERATA.md.
  Attiva questa skill quando: l'utente corregge un comportamento, al termine di OGNI lavorazione per registrare cosa fatto e scelte prese,
  quando l'utente dice 'ricordati questo', 'memorizza', 'aggiorna memoria', 'cosa abbiamo fatto', o all'inizio di un task per consultare il desiderata.
version: 1.3.0
language: it-IT
---

# Triade di Conoscenza: Memory, Desiderata & Worklog

Questa skill assicura la continuità cognitiva del progetto separando con chiarezza le responsabilità:
1. **[DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md)**: La visione di prodotto, i requisiti intoccabili e la matrice di stato delle feature.
2. **[MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md)**: I vincoli tecnici consolidati, le regole AeCI e le correzioni/lezioni apprese (compatto e immutabile).
3. **[WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md)**: Il diario cronologico delle lavorazioni, scelte architetturali e motivazioni (ADR).

---

## 1. Principi Fondamentali

1. **Continuità Cognitiva Inter-Agente**:  
   Ogni sessione o agente può ripartire da zero contesto: la triade di documentazione è il ponte di conoscenza. Un nuovo agente deve poter leggere `DESIDERATA.md` e `MEMORY.md` in 30 secondi e conoscere subito lo stato dell'arte, il perché delle scelte fatte e cosa si vuole realizzare.
2. **Tracciamento Sistematico a Fine Lavorazione**:  
   Nessun task si chiude senza aver registrato in `WORKLOG.md` cosa si è fatto, le scelte tecniche/architetturali adottate (con rationale e trade-off) e l'impatto sul desiderata.
3. **Generalizzare le Correzioni**:  
   Non memorizzare correzioni iper-specifiche in `MEMORY.md` ("riga 24 errata"), ma estrarre la regola generale riutilizzabile.
4. **Consultazione Preventiva (Pre-Flight)**:  
   Prima di pianificare o implementare modifiche, consultare `DESIDERATA.md`, `MEMORY.md` e le voci recenti di `WORKLOG.md`.

---

## 2. Flusso di Fine Lavorazione (Task Logging su WORKLOG.md)

Al completamento di ciascun blocco di lavoro o feature:

```
1. RECAP       -> Sintetizzare cosa è stato fatto (file creati/modificati, feature implementate o refactoring).
2. RATIONALE   -> Esplicitare le scelte architetturali/tecniche prese (perché questa soluzione e quali alternative sono state scartate).
3. DESIDERATA  -> Verificare se la matrice di stato in DESIDERATA.md va aggiornata (da 🟡 in lavorazione a 🟢 completato).
4. APPEND      -> Aggiungere la voce in cima al registro cronologico in WORKLOG.md.
```

### Formato Standard della Voce nel Registro (`WORKLOG.md`):

```markdown
### [YYYY-MM-DD] - <Titolo della Lavorazione>
- **Cosa abbiamo fatto**: <Elenco sintetico, chiaro e verificabile delle modifiche apportate e componenti impattati>
- **Scelte architetturali & Rationale**: <Decisioni tecniche, librerie, pattern, trade-off valutati e motivo della scelta>
- **Impatto sul Desiderata**: <Come questo intervento contribuisce al desiderata e indicazioni per il prossimo agente>
```

---

## 3. Flusso di Correzione Utente (Self-Correction su `MEMORY.md`)

```
1. DETECT      -> L'utente corregge un comportamento, un dato dei quiz o un approccio UI/UX.
2. ACKNOWLEDGE -> Riconoscere l'errore in modo sintetico e diretto (senza scuse prolisse o compiacimento).
3. GENERALIZE  -> Astrarre la causa radice in una regola di progetto riutilizzabile.
4. STORE       -> Aggiornare MEMORY.md nella sezione pertinente (1-5 o regole di dominio).
5. CONFIRM     -> Notificare all'utente l'avvenuta memorizzazione della regola.
```


