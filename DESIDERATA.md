# 🧭 Desiderata di Progetto: VDS-VL Quiz Master 🛩️

Questo documento rappresenta la **bussola strategica e funzionale** del progetto. Qualsiasi agente AI o sviluppatore che approccia questa codebase deve leggere questo file per comprendere all'istante l'identità del software, i requisiti non negoziabili, lo stato attuale dei lavori e i prossimi obiettivi.

---

## 1. Visione del Prodotto

**VDS-VL Quiz Master** è una Progressive Web App (PWA) moderna, ad alte prestazioni, 100% offline-first e con interfaccia ergonomica in stile avionico (*cockpit*).  
È progettata per gli allievi piloti di **Volo Libero (Parapendio e Deltaplano)** che preparano l'esame teorico per il conseguimento dell'attestato VDS/VL (Volo da Diporto o Sportivo) secondo le norme vigenti dell'Aero Club d'Italia (AeCI) e del D.P.R. 133/2010.

### Principi Filosofici
1. **Zero Distrazioni, Cockpit Style**: L'interfaccia deve richiamare la strumentazione avionica: contrasto elevatissimo, leggibilità perfetta sotto la luce solare diretta sul campo di volo o in decollo, microcopy secco e telegrafico, zero fronzoli grafici non funzionali.
2. **Offline-First Assoluto & Zero Backend**: L'applicazione non dispone di alcun server o database remoto proprietario. Funziona al 100% offline tramite Service Worker. I dati utente risiedono esclusivamente nel browser (IndexedDB via Dexie.js).
3. **Privacy & Sovranità dei Dati**: Nessun tracciamento o profilazione. Il salvataggio cloud è opzionale, gestito direttamente dall'utente verso la propria cartella privata Google Drive (`appDataFolder`) o tramite file JSON esportabili.
4. **Apprendimento Deterministico & Anti-Frustrazione**: Risoluzione del problema statistico del "collezionista di figurine" tramite il *Fair Coverage Randomizer*, e consolidamento degli errori tramite ripetizione spaziata (Leitner).

---

## 2. Requisiti Funzionali Core (Il Desiderata)

### A. Database Ufficiale dei Quiz (504 quesiti AeCI)
- Catalogo completo e immutabile dei 504 quiz AeCI (edizione 2017) suddivisi nelle 9 materie canoniche.
- Ogni domanda ha esattamente 3 opzioni di risposta (1, 2, 3) con una sola risposta esatta verificata sulle tabelle ufficiali.
- Spiegazioni didattiche essenziali focalizzate solo su:
  - **Regola**: Principio fisico, aerodinamico o norma di legge.
  - **Tranello**: Il bias cognitivo o la trappola lessicale tipica della domanda.

### B. Modalità di Utilizzo

1. **Simulazione Esame Ufficiale (Conforme AeCI)**:
   - 30 quesiti estratti rispettando fedelmente le quote per materia:
     * *Aerodinamica*: 9 quiz
     * *Meteorologia*: 8 quiz
     * *Tecnica di Pilotaggio*: 5 quiz
     * *Normativa e Legislazione*: 2 quiz
     * *Sicurezza del Volo*: 2 quiz
     * *Primo Soccorso*: 1 quiz
     * *Fisiopatologia del Volo*: 1 quiz
     * *Strumenti di Volo*: 1 quiz
     * *Materiali e Manutenzione*: 1 quiz
   - Timer countdown di 45 minuti con avvisi visivi.
   - Idoneità: **Massimo 3 errori** ammessi (minimo 27/30). 4 o più errori = **NON IDONEO**.
   - Griglia di navigazione interattiva a 30 slot per visualizzare quesiti risposti, da rispondere e contrassegnati con bandierina (`⚑ Rivedi`).
   - Schermata finale di Debriefing con esito secco (`IDONEO` / `NON IDONEO`), tempo impiegato e analisi errori.

2. **Studio per Materie**:
   - Filtro immediato per ciascuna delle 9 materie.
   - Feedback didattico istantaneo (`Esatta` / `Errata` + spiegazione Regola/Tranello).

3. **Quaderno Errori (Spaced Repetition)**:
   - Raccolta automatica di qualsiasi domanda errata durante esami o sessioni di studio.
   - Logica Leitner rigida: una domanda esce dal quaderno solo dopo **2 risposte corrette consecutive** (`consecutiveCorrect >= 2`).

4. **Archivio & Ricerca**:
   - Esplorazione dell'intero database con ricerca full-text istantanea.
   - Possibilità di aggiungere domande ai **Preferiti** e inserire **Note personali** persistenti.

5. **Statistiche & Analytics**:
   - Indice di prontezza complessivo per l'esame.
   - Radar di rendimento sulle 9 materie (individuazione immediata dei punti deboli).
   - Storico temporale delle sessioni d'esame e grafico di tendenza.
   - Elenco dei quiz più sbagliati (Top 10 ostacoli).

6. **Audio & Feedback Sonoro Avionico**:
   - Suoni cockpit di conferma/allerta opzionali.
   - Sintesi vocale neurale italiana (voci Giuseppe/Elsa) con fonetica aeronautica ICAO ed estrema concisione (pronuncia del solo testo della domanda, omettendo numero e materia per azzerare i preamboli verbali).
   - Quick Speech Menu sempre accessibile nell'header: controllo istantaneo a 1 clic per voce istruttore (Giuseppe/Elsa), velocità di riproduzione, lettura automatica e muting senza interruzioni o modali pesanti.

7. **Modalità Alla Guida (Truck & Cockpit Drive Mode)**:
   - Vista a tutto schermo con viewport bloccato (`100dvh`) e zero-scroll.
   - Tre macro-fasce tattili ad altissima leggibilità e contrasto elevato (Fitts's Law estrema).
   - Screen Wake Lock API integrato per prevenire lo spegnimento dello schermo su supporto/cruscotto.
   - Pilota Automatico ("Radio Quiz") continuo per studio e ripasso a mani libere senza tocco fisico.
   - Comandi vocali in lingua italiana tramite Web Speech Recognition ("Uno", "Due", "Tre", "Avanti", "Ripeti", "Pausa").

8. **Impostazioni Modulari per Argomenti (Zero-Scroll Settings)**:
   - Modale impostazioni suddiviso rigorosamente a schede tematiche (Voce, Guida, Aspetto, Cloud/Backup, Dati & Reset).
   - Eliminazione totale dello scrolling verticale continuo su dispositivi mobili e desktop.

---

## 3. Vincoli Architetturali e Tecnologici

| Aspetto | Scelta Obbligatoria | Motivazione |
| :--- | :--- | :--- |
| **Piattaforma** | PWA (Progressive Web App) | Installabile su iOS, Android, macOS e Windows senza store di terze parti. |
| **Build Tool & Framework** | Vite + React 19 + TypeScript | Velocità estrema di build, HMR istantaneo, type safety rigorosa (`strict: true`). |
| **Styling** | Tailwind CSS | Palette cockpit personalizzata, contrasto elevato, zero runtime CSS overhead. |
| **Persistenza (SSOT)** | Dexie.js (IndexedDB) | Storage asincrono, strutturato, indicizzato e reattivo; nessun limite dei 5MB di LocalStorage. |
| **Randomizzazione** | Fair Coverage Algorithm | Assegnazione a bucket (`times_seen == 0` prima di tutto) per evitare il coupon collector problem. |
| **Testing** | Vitest + fake-indexeddb | Suite veloce (<500ms), SRP puro per funzioni di calcolo, BVA, zero dipendenza da browser reale. |

---

## 4. Matrice di Stato del Progetto

| Modulo / Requisito | Stato | Note per il Prossimo Agente |
| :--- | :---: | :--- |
| Dataset 504 Quiz AeCI | 🟢 Completato | File statici in `src/data/questions.json` e `public/data/questions.json`. |
| Fair Coverage Randomizer | 🟢 Completato | Logica in `src/services/randomizer.ts` e `src/utils/fairRandomizer.ts`. |
| Database Dexie (IndexedDB) | 🟢 Completato | Schema in `src/db/index.ts`, tipi in `src/types/database.ts`. |
| Simulatore Esame Ufficiale | 🟢 Completato | 30 quiz, timer 45 min, griglia 30 slot, evaluator in `src/services/examEvaluator.ts`. |
| Modalità Materie | 🟢 Completato | Filtro 9 materie con spiegazioni Regola + Tranello. |
| Quaderno Errori Leitner | 🟢 Completato | Uscita vincolata a 2 risposte esatte consecutive. |
| Archivio & Ricerca Full-Text | 🟢 Completato | Ricerca istantanea, preferiti e note personali salvate in Dexie. |
| Dashboard Statistiche | 🟢 Completato | Radar materie, prontezza esame e storico sessioni. |
| Temi Cockpit Dark & Hangar Light | 🟢 Completato | Gestione contrasto, icone responsive e switch istantaneo. |
| Suite Vitest (Unit & BVA) | 🟢 Completato | 65 test attivi, soglie limite verificate, simulazione Monte Carlo. |
| Supporto Audio Avionico | 🟢 Completato | Sintesi vocale, feedback sonoro cockpit Web Audio API e fonetica ICAO integrata. |
| Google Drive Cloud Sync | 🟢 Completato | Integrazione GIS con `appDataFolder` privata e fallback JSON export/import. |
| Modalità Alla Guida | 🟢 Completato | Layout zero-scroll, Screen Wake Lock, Pilota Auto Radio Quiz e Speech Recognition. |
| Quick Speech Menu (1-Click) | 🟢 Completato | Flyout compatto in Navbar per controllo vocale rapido senza navigazione. |
| Impostazioni a Schede Tematiche | 🟢 Completato | Segmented tabs per argomenti con eliminazione dello scrolling verticale. |


---

## 5. Quick-Start Guide per un Nuovo Agente AI 🤖

Quando entri in questo repository per una nuova lavorazione:
1. **Leggi questo file ([DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md))**: Per comprendere lo scopo dell'app, i requisiti intoccabili e dove si colloca il task richiesto.
2. **Leggi [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md)**: Per acquisire i vincoli tecnici fissi, le regole normative AeCI e le soglie BVA.
3. **Consulta [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md)**: Per visualizzare le ultime scelte architetturali prese e non ripetere tentativi già scartati.
4. **Esegui i test unitari**: `npm run test:unit` per assicurarti che lo stato di partenza sia 100% verde prima di modificare codice.
5. **Al termine del task**: Registra tassativamente in [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md) cosa hai fatto, le scelte prese e aggiorna la matrice di questo file se hai completato nuovi requisiti.
